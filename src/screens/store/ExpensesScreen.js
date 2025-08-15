import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Modal,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  FAB,
  Title,
} from 'react-native-paper';
import Feather from 'react-native-vector-icons/Feather';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import SelectDropdown from 'react-native-select-dropdown';
import {generateClient} from 'aws-amplify/api';
import {getCurrentUser} from 'aws-amplify/auth';
import {Row, Col} from 'react-native-easy-grid';

import Appbar from '../../components/Appbar';
import DataTable from '../../components/DataTable';
import colors from '../../themes/colors';
import {createExpense} from '../../graphql/mutations';
import {listExpenses, getStore} from '../../graphql/queries';
import Cards from '../../components/Cards';

const client = generateClient();
const {width: screenWidth} = Dimensions.get('window');

const ExpensesScreen = ({navigation, route}) => {
  const {store: initialStore} = route.params || {};
  const [store, setStore] = useState(initialStore);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Filter states
  const [timeFilter, setTimeFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [allExpenses, setAllExpenses] = useState([]);

  // Form state
  const [description, setDescription] = useState('');
  const [other, setOthers] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const descriptions = [
    'Rental Expense',
    'Fuel Expense',
    'Salary',
    'Electic Bill',
    'Water Bill',
    'Internet / Telephone Bill',
    'Others please specify',
  ];

  const timeFilterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
  ];

  const staffFilterOptions = [
    { label: 'All Staff', value: 'all' },
    { label: 'Admin', value: 'admin' },
    { label: 'Cashier', value: 'cashier' }
  ];

  const fetchAllData = async () => {
    if (!initialStore?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const storeResult = await client.graphql({
        query: getStore,
        variables: {id: initialStore.id},
      });
      const currentStore = storeResult.data.getStore;
      setStore(currentStore);

      const expensesResult = await client.graphql({
        query: listExpenses,
        variables: {filter: {storeId: {eq: initialStore.id}}},
      });
      const fetchedExpenses = expensesResult.data.listExpenses.items || [];
      setAllExpenses(fetchedExpenses);
      setExpenses(fetchedExpenses);
      setFilteredExpenses(fetchedExpenses);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllData();
    });
    return unsubscribe;
  }, [navigation]);

  const handleSaveExpense = async () => {
    if (!description || !amount) {
      return;
    }
    setIsSaving(true);
    try {
      const {userId} = await getCurrentUser();
      const expenseName = description === 'Others please specify' ? other : description;

      const newExpense = {
        name: expenseName,
        storeId: store.id,
        category: description,
        staffName: 'Admin',
        staffId: userId,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        ownerId: userId,
      };

      await client.graphql({
        query: createExpense,
        variables: {input: newExpense},
      });

      // Reset form and close modal
      setDescription('');
      setOthers('');
      setAmount('');
      setModalVisible(false);
      fetchAllData(); // Refresh expenses list
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotal = () => {
    return filteredExpenses.reduce((total, item) => total + (item.amount || 0), 0);
  };

  const applyFilters = () => {
    let results = [...allExpenses];
    
    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      results = results.filter(item => {
        const expenseDate = new Date(item.date);
        
        switch(timeFilter) {
          case 'today':
            return expenseDate >= today;
          case 'week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
            return expenseDate >= weekStart;
          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return expenseDate >= monthStart;
          case 'year':
            const yearStart = new Date(now.getFullYear(), 0, 1);
            return expenseDate >= yearStart;
          default:
            return true;
        }
      });
    }
    
    // Apply staff filter
    if (staffFilter !== 'all') {
      results = results.filter(item => {
        if (staffFilter === 'admin') {
          return item.staffName?.toLowerCase().includes('admin');
        } else if (staffFilter === 'cashier') {
          return item.staffName?.toLowerCase().includes('cashier');
        }
        return true;
      });
    }
    
    setFilteredExpenses(results);
    setFilterModalVisible(false);
  };
  
  useEffect(() => {
    applyFilters();
  }, [timeFilter, staffFilter, allExpenses]);

  const renderItem = ({item}) => {
    const date = new Date(item.date);
    const formattedDate = `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
    
    return (
      <Row style={styles.tableRow}>
        <Col style={styles.descriptionCol}>
          <View>
            <Text style={styles.tableCellText}>{item.name}</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </Col>
        <Col style={styles.amountCol}>
          <Text style={styles.amountText}>
            {formatMoney(item.amount, {symbol: '₱', precision: 2})}
          </Text>
        </Col>
        <Col style={styles.staffCol}>
          <View style={styles.staffBadge}>
            <Text style={styles.staffText}>{item.staffName}</Text>
          </View>
        </Col>
      </Row>
    );
  };

  if (loading && !store) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar
        title={`Expenses`}
        subtitle={store?.name || ''}
        onBack={() => navigation.goBack()}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView2}>
            <Title style={styles.modalTitle}>Add New Expense</Title>
            <SelectDropdown
              data={descriptions}
              onSelect={selectedItem => setDescription(selectedItem)}
              defaultButtonText="Select expense type"
              buttonStyle={styles.dropdown}
              buttonTextStyle={styles.dropdownText}
              renderDropdownIcon={isOpened => (
                <Feather
                  name={isOpened ? 'chevron-up' : 'chevron-down'}
                  color={'#444'}
                  size={18}
                />
              )}
              dropdownIconPosition={'right'}
            />
            {description === 'Others please specify' && (
              <TextInput
                label="Specify Other Expense"
                value={other}
                onChangeText={setOthers}
                style={styles.input}
                mode="outlined"
              />
            )}
            <TextInput
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              style={styles.input}
              keyboardType="numeric"
              mode="outlined"
            />
            <View style={styles.modalButtonContainer}>
              <Button
                onPress={() => setModalVisible(false)}
                style={[styles.modalButton,{backgroundColor: colors.red}]}
                labelStyle={{color: colors.white}}
                mode="flat">
                Cancel
              </Button>
              <Button
                onPress={handleSaveExpense}
                style={[styles.modalButton,{backgroundColor: colors.secondary}]}
                mode="contained"
                loading={isSaving}
                disabled={isSaving}>
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Cards>
        <View style={styles.filtersContainer}>
          <View style={styles.modalView}>
            <Text style={styles.filterLabel}>Time Period:</Text>
            <SelectDropdown
              data={timeFilterOptions}
              onSelect={selectedItem => setTimeFilter(selectedItem.value)}
              defaultButtonText="Select time period"
              buttonStyle={styles.dropdown}
              buttonTextStyle={styles.dropdownText}
              defaultValue={timeFilterOptions.find(
                opt => opt.value === timeFilter,
              )}
              rowTextForSelection={item => item.label}
              buttonTextAfterSelection={selectedItem => selectedItem.label}
              renderDropdownIcon={isOpened => (
                <Feather
                  name={isOpened ? 'chevron-up' : 'chevron-down'}
                  color={'#444'}
                  size={18}
                />
              )}
              dropdownIconPosition={'right'}
            />
          </View>
          <View style={styles.modalView}>
            <Text style={styles.filterLabel}>Staff Role:</Text>
            <SelectDropdown
              data={staffFilterOptions}
              onSelect={selectedItem => setStaffFilter(selectedItem.value)}
              defaultButtonText="Select staff role"
              buttonStyle={styles.dropdown}
              buttonTextStyle={styles.dropdownText}
              defaultValue={staffFilterOptions.find(
                opt => opt.value === staffFilter,
              )}
              rowTextForSelection={item => item.label}
              buttonTextAfterSelection={selectedItem => selectedItem.label}
              renderDropdownIcon={isOpened => (
                <Feather
                  name={isOpened ? 'chevron-up' : 'chevron-down'}
                  color={'#444'}
                  size={18}
                />
              )}
              dropdownIconPosition={'right'}
            />
          </View>
          <View style={styles.modalView}>
           <View style={styles.modalButtonContainer}>
              <Button
                onPress={applyFilters}
                style={styles.modalButton}
                labelStyle={styles.modalButtonText}
                mode="contained">
                Apply Filters
              </Button>
           </View>
          </View>
        </View>
      </Cards>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading expenses...</Text>
          </View>
        ) : filteredExpenses.length > 0 ? (
          <>
            <DataTable
              headerTitles={['Description', 'Amount', 'Staff']}
              total={calculateTotal()}
              alignment="center"
              colStyle={[
                styles.descriptionCol,
                styles.amountCol,
                styles.staffCol,
              ]}>
              <FlatList
                data={filteredExpenses}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
              />
            </DataTable>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No expenses recorded yet.</Text>
          </View>
        )}
      </View>

      <FAB
        style={styles.fab}
        icon="plus"
        color="#fff"
        onPress={() => setModalVisible(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fd',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.primary,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 15,
    marginTop: 5,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 16,
    backgroundColor: colors.secondary,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderRadius: 30,
    marginBottom: 80,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '30%',
    justifyContent: 'center',
  },
  modalView2: {
    width: '30%',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  modalTitle: {
    marginBottom: 5,
    textAlign: 'center',
    color: colors.primary,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  dropdown: {
    width: '100%',
    height: 40,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',

    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  dropdownText: {
    color: '#333',
    textAlign: 'left',
    fontSize: 14,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    marginLeft: 10,
    minWidth: 100,
    backgroundColor: colors.secondary,
  },
  tableRow: {
    minHeight: 50,
    marginHorizontal: 5,
    marginVertical: 4,
    backgroundColor: 'white',
    borderRadius: 10,
    borderBottomWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: screenWidth - 10, // Adjust for horizontal margin
  },
  listContent: {
    paddingBottom: 15,
  },
  descriptionCol: {
    width: screenWidth * 0.5,
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  amountCol: {
    width: screenWidth * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffCol: {
    width: screenWidth * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  staffBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: 'center',
  },
  staffText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
    elevation: 1,
  },
  filterButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
    fontSize: 13,
  },
  activeFiltersContainer: {
    flex: 1,
    marginLeft: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#e6eeff',
  },
  filterIcon: {
    marginRight: 4,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',

    marginBottom: 5,
    color: colors.primary,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: colors.primary,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerTotal: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ExpensesScreen;
