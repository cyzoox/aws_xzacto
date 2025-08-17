import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Searchbar,
  Avatar,
  Chip,
} from 'react-native-paper';
import Appbar from '../../components/Appbar';
import {colors} from '../../constants/theme';
import {generateClient} from 'aws-amplify/api';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {formatCurrency} from '../../utils/formatters';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import GraphQL queries/mutations
import {listCustomers} from '../../graphql/queries';

const client = generateClient();

const CreditScreen = ({navigation, route}) => {
  const store = route.params.store;
  // State variables
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCredit, setTotalCredit] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [staffData, setStaffData] = useState(null);
  const [sortOrder, setSortOrder] = useState('balanceDesc'); // 'balanceAsc', 'balanceDesc', 'nameAsc', 'nameDesc'

  // Load staff data from AsyncStorage
  useEffect(() => {
    const loadStaffData = async () => {
      try {
        const staffDataStr = await AsyncStorage.getItem('staffData');
        if (staffDataStr) {
          setStaffData(JSON.parse(staffDataStr));
        }
      } catch (error) {
        console.error('Error loading staff data:', error);
      }
    };

    loadStaffData();
  }, []);

  // Fetch customers with credit
  useEffect(() => {
    fetchCustomersWithCredit();
  }, [fetchCustomersWithCredit, store]);

  // No need to fetch transactions in this component anymore

  // Calculate totals whenever customers list changes
  useEffect(() => {
    calculateTotals();
  }, [calculateTotals, customers]);

  const fetchCustomersWithCredit = useCallback(async () => {
    try {
      setLoading(true);

      // First fetch all customers for the store
      const result = await client.graphql({
        query: listCustomers,
        variables: {
          filter: {
            storeId: {eq: store.id},
          },
        },
      });

      if (result.data.listCustomers.items) {
        // Sort customers by default (highest balance first)
        const sortedCustomers = [...result.data.listCustomers.items].sort(
          (a, b) => (b.creditBalance || 0) - (a.creditBalance || 0),
        );
        setCustomers(sortedCustomers);
      }
    } catch (error) {
      console.error('Error fetching customers with credit:', error);
      Alert.alert('Error', 'Failed to load customer credit data');
    } finally {
      setLoading(false);
    }
  }, [store.id]);

  const calculateTotals = useCallback(() => {
    let creditTotal = 0;
    let balanceTotal = 0;

    customers.forEach(customer => {
      creditTotal += customer.creditLimit || 0;
      balanceTotal += customer.creditBalance || 0;
    });

    setTotalCredit(creditTotal);
    setTotalBalance(balanceTotal);
  }, [customers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomersWithCredit();
    setRefreshing(false);
  };

  const handleSelectCustomer = customer => {
    // Navigate to the CreditTransactionsScreen instead
    navigation.navigate('CreditTransactionsScreen', {
      customer,
      store,
    });
  };

  const handlePayment = customer => {
    // Navigate to payment screen
    navigation.navigate('CreditPaymentScreen', {
      customer,
      store,
      onPaymentComplete: () => {
        // Refresh customer list after payment
        fetchCustomersWithCredit();
      },
    });
  };

  const handleSortCustomers = order => {
    setSortOrder(order);
    let sortedList = [...customers];

    switch (order) {
      case 'balanceDesc':
        sortedList.sort(
          (a, b) => (b.creditBalance || 0) - (a.creditBalance || 0),
        );
        break;
      case 'balanceAsc':
        sortedList.sort(
          (a, b) => (a.creditBalance || 0) - (b.creditBalance || 0),
        );
        break;
      case 'nameAsc':
        sortedList.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        sortedList.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    setCustomers(sortedList);
  };

  const filteredCustomers = customers.filter(
    customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Format date for display
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get transaction type display info (color and icon)
  const getTransactionTypeInfo = type => {
    switch (type) {
      case 'SALE':
        return {color: colors.primary, icon: 'cart-outline'};
      case 'PAYMENT':
        return {color: 'green', icon: 'cash-multiple'};
      case 'REFUND':
        return {color: 'orange', icon: 'cash-refund'};
      case 'VOID':
        return {color: 'red', icon: 'cancel'};
      default:
        return {color: 'grey', icon: 'help-circle-outline'};
    }
  };

  const renderCustomerItem = ({item}) => (
    <Card style={styles.customerCard}>
      <Card.Content>
        <View style={styles.customerHeader}>
          <Avatar.Text
            size={40}
            label={item.name.substring(0, 2).toUpperCase()}
            style={{backgroundColor: colors.primary}}
            color="white"
          />
          <View style={styles.customerInfo}>
            <Title style={styles.customerName}>{item.name}</Title>
            {item.phone && (
              <Paragraph style={styles.customerDetail}>{item.phone}</Paragraph>
            )}
          </View>
          <View style={styles.creditBadge}>
            <Text style={styles.creditAmount}>
              {formatCurrency(item.creditBalance || 0)}
            </Text>
            <Text style={styles.creditLabel}>Balance</Text>
          </View>
        </View>

        <View style={styles.customerActions}>
          <Button
            mode="text"
            onPress={() => handleSelectCustomer(item)}
            icon="history">
            History
          </Button>
          <Button
            mode="text"
            onPress={() => handlePayment(item)}
            icon="cash-plus">
            Payment
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="account-cash" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No customers with credit found</Text>
      <Button
        mode="contained"
        onPress={handleRefresh}
        style={styles.retryButton}>
        Refresh
      </Button>
    </View>
  );

  const renderCustomerList = () => {
    if (loading && !refreshing && customers.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Loading customer credit data...
          </Text>
        </View>
      );
    }

    if (filteredCustomers.length === 0) {
      return renderEmptyList();
    }

    return (
      <>
        <View style={styles.summaryContainer}>
          <Card
            style={[styles.summaryBox, {backgroundColor: colors.secondary}]}>
            <Card.Content style={styles.summaryBoxContent}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={28}
                color="white"
              />
              <Text style={styles.summaryBoxLabel}>Total Credit</Text>
              <Title style={styles.summaryBoxValue}>
                {formatCurrency(totalCredit)}
              </Title>
            </Card.Content>
          </Card>

          <Card
            style={[styles.summaryBox, {backgroundColor: colors.secondary}]}>
            <Card.Content style={styles.summaryBoxContent}>
              <MaterialCommunityIcons
                name="cash-remove"
                size={28}
                color="white"
              />
              <Text style={styles.summaryBoxLabel}>Outstanding</Text>
              <Title style={styles.summaryBoxValue}>
                {formatCurrency(totalBalance)}
              </Title>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sortScroll}>
            <Chip
              selected={sortOrder === 'balanceDesc'}
              onPress={() => handleSortCustomers('balanceDesc')}
              style={styles.sortChip}>
              Highest Balance
            </Chip>
            <Chip
              selected={sortOrder === 'balanceAsc'}
              onPress={() => handleSortCustomers('balanceAsc')}
              style={styles.sortChip}>
              Lowest Balance
            </Chip>
            <Chip
              selected={sortOrder === 'nameAsc'}
              onPress={() => handleSortCustomers('nameAsc')}
              style={styles.sortChip}>
              Name (A-Z)
            </Chip>
            <Chip
              selected={sortOrder === 'nameDesc'}
              onPress={() => handleSortCustomers('nameDesc')}
              style={styles.sortChip}>
              Name (Z-A)
            </Chip>
          </ScrollView>
        </View>

        <FlatList
          data={filteredCustomers}
          keyExtractor={item => item.id}
          renderItem={renderCustomerItem}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={styles.content}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar
        title="Customer Credits"
        subtitle={store.name}
        onBack={() => navigation.goBack()}
      />

      <Searchbar
        placeholder="Search customers..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCustomerList()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
    marginBottom: 80,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 2,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    elevation: 3,
  },
  summaryBoxContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  summaryBoxLabel: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  summaryBoxValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  customerCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: 'white',
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  customerDetail: {
    fontSize: 14,
    color: '#666',
  },
  creditBadge: {
    alignItems: 'flex-end',
  },
  creditAmount: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primary,
  },
  creditLabel: {
    fontSize: 12,
    color: '#666',
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },

  paymentButtonFull: {
    marginTop: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#666',
  },
  sortScroll: {
    flexGrow: 0,
  },
  sortChip: {
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
  customerDetailCard: {
    marginBottom: 16,
    elevation: 2,
  },
  divider: {
    marginVertical: 16,
  },
  creditDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  creditDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  creditDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  creditDetailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  transactionsCard: {
    marginBottom: 16,
  },
  transactionTypeCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    marginRight: 4,
  },
});

export default CreditScreen;
