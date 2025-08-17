import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {generateClient} from 'aws-amplify/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ionicons, MaterialIcons} from 'react-native-vector-icons';

// Custom components
import AppHeader from '../components/AppHeader';
import Spacer from '../components/Spacer';
import colors from '../themes/colors';

// GraphQL operations
import {listExpenses} from '../graphql/queries';
import {
  createExpense,
  deleteExpense,
  updateExpense,
} from '../graphql/mutations';

// Format money utility
import formatMoney from 'accounting-js/lib/formatMoney.js';

const client = generateClient();

// Predefined expense categories
const EXPENSE_CATEGORIES = [
  'Utilities',
  'Supplies',
  'Salary',
  'Rent',
  'Maintenance',
  'Inventory',
  'Marketing',
  'Other',
];

const ExpensesScreen = ({navigation, route}) => {
  // Get staffData from route params or from storage
  const [staffData, setStaffData] = useState(route.params?.staffData || null);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);

  // Load staff data if not provided via route params
  useEffect(() => {
    const getStaffData = async () => {
      if (!staffData) {
        try {
          await loadStaffData();
        } catch (error) {
          console.error('Error loading staff data:', error);
          Alert.alert(
            'Error',
            'Could not load staff data. Please log in again.',
          );
          navigation.navigate('RoleSelection');
        }
      }
    };

    getStaffData();
  }, [staffData, navigation]);

  // Load staff data from storage
  const loadStaffData = async () => {
    try {
      const staffDataString = await AsyncStorage.getItem('staffData');
      if (staffDataString) {
        const parsedStaffData = JSON.parse(staffDataString);
        setStaffData(parsedStaffData);
        return parsedStaffData;
      }
      return null;
    } catch (error) {
      console.error('Error loading staff data from storage:', error);
      throw error;
    }
  };

  // Load expenses whenever staffData changes
  useEffect(() => {
    if (staffData && staffData.store_id) {
      fetchExpenses();
    }
  }, [staffData, fetchExpenses]);

  // Filter expenses when search query or category filter changes
  useEffect(() => {
    if (expenses.length > 0) {
      applyFilters();
    }
  }, [expenses, searchQuery, categoryFilter, applyFilters]);

  // Apply filters to expenses
  const applyFilters = useCallback(() => {
    let filtered = [...expenses];

    // Apply search query filter
    if (searchQuery) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(
        expense => expense.category === categoryFilter,
      );
    }

    setFilteredExpenses(filtered);
  }, [expenses, searchQuery, categoryFilter]);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExpenses();
    setRefreshing(false);
  }, [fetchExpenses]);

  // Fetch expenses from the database
  const fetchExpenses = useCallback(async () => {
    if (!staffData || !staffData.store_id) {
      console.log('No staff data or store ID available');
      return;
    }

    setLoading(true);
    try {
      const result = await client.graphql({
        query: listExpenses,
        variables: {
          filter: {
            storeID: {eq: staffData.store_id},
          },
        },
      });

      const expenseItems = result.data.listExpenses.items;
      console.log('Fetched expenses:', expenseItems);
      setExpenses(expenseItems);
      setFilteredExpenses(expenseItems);
    } catch (error) {
      console.error('Error fetching expenses', error);
      Alert.alert('Error', 'Failed to fetch expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [staffData]);

  const handleAddExpense = async () => {
    if (!description || !amount) {
      Alert.alert('Error', 'Please enter both description and amount');
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!staffData) {
      Alert.alert('Error', 'Staff data not available. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      // Extract ownerId from staff data or associated store with fallbacks
      let ownerId = null;

      // Debugging staff data structure
      console.log('Staff data structure:', JSON.stringify(staffData, null, 2));

      // Option 1: Direct ownerId field
      if (staffData.ownerId) {
        console.log('Using direct ownerId from staff');
        ownerId = staffData.ownerId;
      }
      // Option 2: Get from stores collection
      else if (
        staffData.stores &&
        staffData.stores.items &&
        staffData.stores.items.length > 0
      ) {
        console.log('Examining stores collection');
        const storeItem = staffData.stores.items[0];
        if (storeItem.store && storeItem.store.ownerId) {
          console.log('Found ownerId in store data');
          ownerId = storeItem.store.ownerId;
        }
      }
      // Option 3: Get from store object directly
      else if (staffData.store && staffData.store.ownerId) {
        console.log('Using ownerId from direct store reference');
        ownerId = staffData.store.ownerId;
      }
      // Option 4: Use staffData.id as last resort
      else {
        console.log('Using staff ID as fallback ownerId');
        ownerId = staffData.id;
      }

      console.log('Using ownerId for expense:', ownerId);

      // Updated to match schema field names exactly
      const input = {
        name: description, // Schema uses 'name' not 'description'
        amount: parseFloat(amount),
        category,
        staffId: staffData.id, // Case matters: staffId not staffID
        staffName: staffData.name,
        storeId: staffData.store_id, // Case matters: storeId not storeID
        ownerId: ownerId,
        date: new Date().toISOString(),
        notes: '', // Optional notes field
      };

      const result = await client.graphql({
        query: createExpense,
        variables: {input},
      });

      console.log('Expense created:', result.data.createExpense);

      // Reset form and refresh list
      setModalVisible(false);
      setDescription('');
      setAmount('');
      setCategory('Other');
      fetchExpenses();

      Alert.alert('Success', 'Expense added successfully');
    } catch (error) {
      console.error('Error adding expense', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = async () => {
    if (!currentExpense) {
      return;
    }

    if (!description || !amount) {
      Alert.alert('Error', 'Please enter both description and amount');
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Extract or reuse ownerId with fallbacks
      let ownerId = currentExpense.ownerId;

      // If current expense doesn't have ownerId, extract from staff data
      if (!ownerId && staffData) {
        console.log('Current expense missing ownerId, extracting from staff');

        // Option 1: Direct ownerId field
        if (staffData.ownerId) {
          ownerId = staffData.ownerId;
        }
        // Option 2: Get from stores collection
        else if (
          staffData.stores &&
          staffData.stores.items &&
          staffData.stores.items.length > 0
        ) {
          const storeItem = staffData.stores.items[0];
          if (storeItem.store && storeItem.store.ownerId) {
            ownerId = storeItem.store.ownerId;
          }
        }
        // Option 3: Get from store object directly
        else if (staffData.store && staffData.store.ownerId) {
          ownerId = staffData.store.ownerId;
        }
        // Option 4: Use staffData.id as last resort
        else {
          ownerId = staffData.id;
        }
      }

      console.log('Using ownerId for expense update:', ownerId);

      const input = {
        id: currentExpense.id,
        name: description, // Schema uses 'name' not 'description'
        amount: parseFloat(amount),
        category,
        // Use extracted or original ownerId
        ownerId: ownerId,
        storeId: currentExpense.storeId,
        // Only update fields we want to change
        _version: currentExpense._version,
      };

      const result = await client.graphql({
        query: updateExpense,
        variables: {input},
      });

      console.log('Expense updated:', result.data.updateExpense);

      // Reset form and refresh list
      setModalVisible(false);
      setIsEditMode(false);
      setCurrentExpense(null);
      setDescription('');
      setAmount('');
      setCategory('Other');
      fetchExpenses();

      Alert.alert('Success', 'Expense updated successfully');
    } catch (error) {
      console.error('Error updating expense', error);
      Alert.alert('Error', 'Failed to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async expense => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this expense?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const input = {
                id: expense.id,
                _version: expense._version,
              };

              await client.graphql({
                query: deleteExpense,
                variables: {input},
              });

              fetchExpenses();
              Alert.alert('Success', 'Expense deleted successfully');
            } catch (error) {
              console.error('Error deleting expense', error);
              Alert.alert(
                'Error',
                'Failed to delete expense. Please try again.',
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const openAddExpenseModal = () => {
    setIsEditMode(false);
    setCurrentExpense(null);
    setDescription('');
    setAmount('');
    setCategory('Other');
    setModalVisible(true);
  };

  const openEditExpenseModal = expense => {
    setIsEditMode(true);
    setCurrentExpense(expense);
    setDescription(expense.name); // Schema uses 'name' not 'description'
    setAmount(expense.amount.toString());
    setCategory(expense.category || 'Other');
    setModalVisible(true);
  };

  // Function to render expense item
  const renderExpenseItem = ({item}) => {
    const date = new Date(item.date || item.createdAt);
    const formattedDate = date.toLocaleDateString();

    return (
      <TouchableOpacity
        style={styles.expenseItem}
        onPress={() => openEditExpenseModal(item)}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseTitle}>{item.name}</Text>
          <View style={styles.expenseActions}>
            <TouchableOpacity onPress={() => handleDeleteExpense(item)}>
              <MaterialIcons name="delete" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.expenseDetails}>
          <View style={styles.expenseMetadata}>
            <View
              style={[
                styles.categoryBadge,
                {backgroundColor: getCategoryColor(item.category)},
              ]}>
              <Text style={styles.categoryText}>
                {item.category || 'Other'}
              </Text>
            </View>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <Text style={styles.amountText}>
            {formatMoney(item.amount, {symbol: '₱', precision: 2})}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Function to get color based on category
  const getCategoryColor = category => {
    const colors = {
      Utilities: '#4CAF50',
      Supplies: '#2196F3',
      Salary: '#9C27B0',
      Rent: '#F44336',
      Maintenance: '#FF9800',
      Inventory: '#607D8B',
      Marketing: '#E91E63',
      Other: '#9E9E9E',
    };

    return colors[category] || colors.Other;
  };

  // Render category picker
  const renderCategoryPicker = () => (
    <View style={styles.categoryPickerContainer}>
      {EXPENSE_CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.categoryOption,
            {backgroundColor: getCategoryColor(cat)},
          ]}
          onPress={() => {
            setCategory(cat);
            setShowCategoryPicker(false);
          }}>
          <Text style={styles.categoryOptionText}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        centerText="Expenses"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={openAddExpenseModal}>
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={colors.white}
            />
          </TouchableOpacity>
        }
      />

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.grey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterOptions(!showFilterOptions)}>
          <Ionicons
            name={showFilterOptions ? 'filter' : 'filter-outline'}
            size={20}
            color={categoryFilter ? colors.accent : colors.grey}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Options */}
      {showFilterOptions && (
        <View style={styles.filterOptions}>
          <Text style={styles.filterTitle}>Filter by Category:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !categoryFilter && styles.activeFilterChip,
              ]}
              onPress={() => setCategoryFilter('')}>
              <Text
                style={[
                  styles.filterChipText,
                  !categoryFilter && styles.activeFilterChipText,
                ]}>
                All
              </Text>
            </TouchableOpacity>
            {EXPENSE_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  categoryFilter === cat && styles.activeFilterChip,
                  {borderColor: getCategoryColor(cat)},
                ]}
                onPress={() => setCategoryFilter(cat)}>
                <View
                  style={[
                    styles.categoryDot,
                    {backgroundColor: getCategoryColor(cat)},
                  ]}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    categoryFilter === cat && styles.activeFilterChipText,
                  ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Expenses List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loaderText}>Loading expenses...</Text>
        </View>
      ) : filteredExpenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="receipt-long"
            size={64}
            color={colors.lightGrey}
          />
          <Text style={styles.emptyText}>No expenses found</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={openAddExpenseModal}>
            <Text style={styles.addButtonText}>Add an Expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={item => item.id}
          renderItem={renderExpenseItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Add/Edit Expense Modal */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Expense' : 'Add New Expense'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.darkGrey} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter expense description"
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
                <View
                  style={[
                    styles.selectedCategory,
                    {backgroundColor: getCategoryColor(category)},
                  ]}>
                  <Text style={styles.selectedCategoryText}>{category}</Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.darkGrey}
                />
              </TouchableOpacity>

              {showCategoryPicker && renderCategoryPicker()}

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={isEditMode ? handleEditExpense : handleAddExpense}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Update Expense' : 'Add Expense'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddExpenseModal}>
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
    marginBottom: 8,
    elevation: 2,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  filterButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  filterOptions: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.darkGrey,
    marginBottom: 8,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterChip: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.darkGrey,
  },
  activeFilterChipText: {
    color: colors.white,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  listContent: {
    padding: 16,
  },
  expenseItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGrey,
    flex: 1,
  },
  expenseActions: {
    flexDirection: 'row',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseMetadata: {
    flexDirection: 'column',
  },
  categoryBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: colors.darkGrey,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loaderText: {
    marginTop: 8,
    color: colors.darkGrey,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGrey,
    marginVertical: 16,
  },
  addButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '85%',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingBottom: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGrey,
  },
  formContainer: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkGrey,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  selectedCategory: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  selectedCategoryText: {
    color: colors.white,
    fontWeight: '500',
  },
  categoryPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    margin: 4,
  },
  categoryOptionText: {
    color: colors.white,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: colors.lightGrey,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExpensesScreen;
