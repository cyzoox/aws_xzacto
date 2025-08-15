import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Text,
  ScrollView,
} from 'react-native';
import * as Paper from 'react-native-paper';
import {generateClient} from 'aws-amplify/api';
import {getCurrentUser} from 'aws-amplify/auth';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import * as formatters from '../../utils/formatters';

import Appbar from '../../components/Appbar';

const client = generateClient();

const CreditTransactionsScreen = ({route, navigation}) => {
  const {customer, store} = route.params;
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [modalError, setModalError] = useState('');
  const [currentCustomer, setCurrentCustomer] = useState(customer);
  const [staffId, setStaffId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    if (customer && customer.id) {
      fetchInitialData();
    }
  }, [customer]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const {userId} = await getCurrentUser();
      setStaffId(userId);
      await fetchCustomerTransactions();
    } catch (err) {
      console.error('Error fetching initial data:', err);
      Alert.alert('Error', 'Could not load initial data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerTransactions = async () => {
    if (!customer || !customer.id) {
      Alert.alert('Error', 'Invalid customer data');
      return;
    }
    try {
      const result = await client.graphql({
        query: queries.listCreditTransactions,
        variables: {
          filter: {customerID: {eq: customer.id}},
        },
      });

      const items = result.data.listCreditTransactions.items || [];
      const sortedTransactions = items.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setTransactions(sortedTransactions);
      setFilteredTransactions(sortedTransactions);

      // Also update customer balance from the latest customer data if needed
      // For now, we assume the passed customer object is up-to-date after a payment.

    } catch (error) {
      console.error('Error fetching customer transactions:', error);
      Alert.alert('Error', 'Failed to load transaction history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTransactionTypeInfo = type => {
    switch (type) {
      case 'PAYMENT':
        return { icon: 'arrow-down', color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)' };
      case 'SALE':
        return { icon: 'arrow-up', color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' };
      case 'VOID':
        return { icon: 'x', color: '#6B7280', backgroundColor: 'rgba(107, 114, 128, 0.1)' };
      case 'REFUND':
        return { icon: 'corner-up-left', color: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.1)' };
      default:
        return { icon: 'info', color: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)' };
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomerTransactions();
  };

  const handleOpenModal = () => {
    setAmount('');
    setNotes('');
    setModalError('');
    setModalVisible(true);
  };

  const hideModal = () => setModalVisible(false);

  const handleRecordPayment = async () => {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      setModalError('Please enter a valid amount.');
      return;
    }
    if (paymentAmount > currentCustomer.creditBalance) {
      setModalError('Amount cannot exceed current balance.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    try {
      const newBalance = currentCustomer.creditBalance - paymentAmount;
      
      // Update customer balance
      await client.graphql({
        query: mutations.updateCustomer,
        variables: {input: {id: currentCustomer.id, creditBalance: newBalance}},
      });

      // Create the credit transaction record
      await client.graphql({
        query: mutations.createCreditTransaction,
        variables: {
          input: {
            customerID: currentCustomer.id,
            amount: paymentAmount,
            type: 'PAYMENT',
            remarks: notes || 'Credit payment',
            addedBy: staffId,
            storeId: store.id, // Ensure storeId is passed
          },
        },
      });

      // Update local state to reflect changes immediately
      setCurrentCustomer({...currentCustomer, creditBalance: newBalance});
      
      Alert.alert('Success', 'Payment recorded successfully!');
      hideModal();
      fetchCustomerTransactions(); // Refresh the list

    } catch (err) {
      console.error('Error recording payment:', err);
      Alert.alert('Error', 'Failed to record payment.');
    } finally {
      setModalLoading(false);
    }
  };

    // Filter transactions based on selected month
  useEffect(() => {
    if (transactions.length === 0) return;
    
    if (selectedMonth === 'all') {
      setFilteredTransactions(transactions);
      return;
    }
    
    const filtered = transactions.filter(item => {
      const date = new Date(item.createdAt);
      return date.getMonth() === parseInt(selectedMonth);
    });
    
    setFilteredTransactions(filtered);
  }, [selectedMonth, transactions]);

  const toggleFilter = () => setFilterVisible(!filterVisible);

  const monthOptions = [
    { label: 'All Transactions', value: 'all' },
    { label: 'January', value: '0' },
    { label: 'February', value: '1' },
    { label: 'March', value: '2' },
    { label: 'April', value: '3' },
    { label: 'May', value: '4' },
    { label: 'June', value: '5' },
    { label: 'July', value: '6' },
    { label: 'August', value: '7' },
    { label: 'September', value: '8' },
    { label: 'October', value: '9' },
    { label: 'November', value: '10' },
    { label: 'December', value: '11' },
  ];

  const renderMonthItem = ({item}) => (
    <TouchableOpacity
      style={[styles.monthOption, selectedMonth === item.value && styles.selectedMonthOption]}
      onPress={() => {
        setSelectedMonth(item.value);
        setFilterVisible(false);
      }}
    >
      <Text style={[styles.monthOptionText, selectedMonth === item.value && styles.selectedMonthText]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderTableRow = (item) => {
    const {color, icon, backgroundColor} = getTransactionTypeInfo(item.type);
    const isPayment = item.type === 'PAYMENT';

    return (
      <Paper.DataTable.Row key={item.id}>
        <Paper.DataTable.Cell>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            
            <Text style={styles.transactionType}>{item.type}</Text>
          </View>
        </Paper.DataTable.Cell>
        <Paper.DataTable.Cell>
          <Text style={styles.transactionDate}>{formatters.formatDate(item.createdAt)}</Text>
        </Paper.DataTable.Cell>
        <Paper.DataTable.Cell numeric>
          <Text style={[styles.transactionAmount, {color}]}>
            {isPayment ? '+' : '−'}{formatters.formatCurrency(item.amount)}
          </Text>
        </Paper.DataTable.Cell>
      </Paper.DataTable.Row>
    );
  };

  const TableHeader = () => (
    <View style={{marginBottom: 16}}>
      <View style={styles.customerCard}>
        <Text style={styles.customerName}>{currentCustomer.name}</Text>

        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatters.formatCurrency(currentCustomer.creditBalance)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleOpenModal}
          style={styles.paymentButton}>
          <Text style={styles.paymentButtonText}>Record a Payment</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionHeaderRow}>
        <Text style={styles.listTitle}>Transaction History</Text>

        <View style={styles.filterContainer}>
          <TouchableOpacity onPress={toggleFilter} style={styles.filterButton}>
            <Icon name="filter" size={18} color="#4F46E5" />
            <Text style={styles.filterButtonText}>
              {selectedMonth === 'all'
                ? 'All'
                : monthOptions.find(m => m.value === selectedMonth).label}
            </Text>
            <Icon
              name={filterVisible ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#4F46E5"
            />
          </TouchableOpacity>

          {filterVisible && (
            <View style={styles.monthDropdown}>
              <FlatList
                data={monthOptions}
                renderItem={renderMonthItem}
                keyExtractor={item => item.value}
                style={styles.monthList}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={styles.container}>
      <Appbar 
        title="Credit History" 
        subtitle={customer.name}
        onBack={() => navigation.goBack()}
      />
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4F46E5" />
        }
      >
        <TableHeader />
        
        <Paper.Surface style={styles.tableContainer}>
          <Paper.DataTable>
            <Paper.DataTable.Header style={styles.dataTableHeader}>
              <Paper.DataTable.Title style={{flex: 1.5}}>TYPE</Paper.DataTable.Title>
              <Paper.DataTable.Title>DATE</Paper.DataTable.Title>
              <Paper.DataTable.Title numeric>AMOUNT</Paper.DataTable.Title>
            </Paper.DataTable.Header>

            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(item => renderTableRow(item))
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="archive" size={40} color="#9CA3AF" />
                <Text style={styles.emptyText}>No transactions recorded yet.</Text>
              </View>
            )}
          </Paper.DataTable>
        </Paper.Surface>
      </ScrollView>

      <Paper.Portal>
        <Paper.Modal
          visible={isModalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={hideModal} style={styles.closeButton}>
              <Icon name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalLabel}>Amount</Text>
            <Paper.TextInput
              placeholder="Enter payment amount"
              value={amount}
              onChangeText={(text) => {
                setAmount(text.replace(/[^0-9]/g, ''));
                setModalError('');
              }}
              keyboardType="numeric"
              style={styles.modalInput}
              mode="outlined"
              outlineColor="#E5E7EB"
              activeOutlineColor="#4F46E5"
              left={<Paper.TextInput.Icon icon="cash" color="#4F46E5" />}
            />
            
            <Text style={styles.modalLabel}>Notes (optional)</Text>
            <Paper.TextInput
              placeholder="Add details about this payment"
              value={notes}
              onChangeText={setNotes}
              style={styles.modalInput}
              multiline
              numberOfLines={3}
              mode="outlined"
              outlineColor="#E5E7EB"
              activeOutlineColor="#4F46E5"
              left={<Paper.TextInput.Icon icon="text" color="#4F46E5" />}
            />

            {modalError ? (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={16} color="#EF4444" style={{marginRight: 8}} />
                <Text style={styles.errorText}>{modalError}</Text>
              </View>
            ) : null}

            <LinearGradient 
              colors={['#4F46E5', '#3730A3']} 
              start={{x: 0, y: 0}} 
              end={{x: 1, y: 0}} 
              style={styles.confirmButtonGradient}
            >
              <TouchableOpacity
                onPress={handleRecordPayment}
                style={styles.confirmButton}
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Payment</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>
            
            <TouchableOpacity onPress={hideModal} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Paper.Modal>
      </Paper.Portal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  loaderContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  scrollContainer: {flex: 1},
  scrollContentContainer: {paddingHorizontal: 16, paddingBottom: 100},
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    marginBottom: 24,
  },
  dataTableHeader: {
    backgroundColor: '#F3F4F6',
  },
  customerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  customerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },

  balanceRow: {
    marginBottom: 16,
  },

  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },

  balanceAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },

  paymentButton: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
  },

  // Filter styles
  transactionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  filterContainer: {
    position: 'relative',
    zIndex: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
    marginHorizontal: 6,
  },
  monthDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    width: 200,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  monthList: {
    maxHeight: 290,
  },
  monthOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  selectedMonthOption: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  monthOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedMonthText: {
    color: '#4F46E5',
    fontWeight: '600',
  },

  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginLeft: 4,
  },
  modalInput: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});

export default CreditTransactionsScreen;
