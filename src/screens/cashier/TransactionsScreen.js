import React, { useEffect, useState } from "react";
import { Text, StyleSheet, View, TouchableOpacity, FlatList, Dimensions, ScrollView, Alert, ActivityIndicator } from "react-native";
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import AppHeader from "../../components/AppHeader";
import colors from "../../themes/colors";
import moment from 'moment';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import DataTable from "../../components/DataTable";
import { Grid, Col, Row } from 'react-native-easy-grid';
import { TextInput, Button, Modal, Portal, Provider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const { width, height } = Dimensions.get('window');

import { listSaleTransactions, getSale, getProduct } from "../../graphql/queries";
import { updateSaleTransaction, updateProduct } from "../../graphql/mutations";
import { generateClient } from 'aws-amplify/api';
import { theme } from "../../constants";
const client = generateClient();

const TransactionScreen = ({ navigation, route }) => {
  const { staffData } = route.params;
  
  // State for transactions
  const [transactions, setTransactions] = useState([]);
  const [completedTransactions, setCompletedTransactions] = useState([]);
  const [voidedTransactions, setVoidedTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // State for UI controls
  const [selected, setSelected] = useState(0); // Tab selector (Completed/Voided)
  const [filterPeriod, setFilterPeriod] = useState('today');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('start'); // 'start' or 'end'
  const [startDate, setStartDate] = useState(moment().startOf('day').toDate());
  const [endDate, setEndDate] = useState(moment().endOf('day').toDate());
  
  // State for void transaction modal
  const [voidModalVisible, setVoidModalVisible] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [voidError, setVoidError] = useState('');

  // Fetch transactions on initial load
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions when filter period or dates change
  useEffect(() => {
    filterTransactionsByDate();
  }, [filterPeriod, startDate, endDate, transactions, selected]);

  // Main function to fetch transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const result = await client.graphql({
        query: listSaleTransactions,
        variables: {
          filter: {
            storeID: { eq: staffData.store_id },
          },
        },
      });

      const resultList = result.data.listSaleTransactions.items;
      
      // Sort transactions by creation date (newest first)
      const sortedTransactions = resultList.sort((a, b) => 
        moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf()
      );
      
      setTransactions(sortedTransactions);

      // Filter transactions
      const completed = sortedTransactions.filter(
        transaction => transaction.status === 'Completed'
      );
      const voided = sortedTransactions.filter(
        transaction => transaction.status === 'Voided'
      );

      // Set filtered lists in state
      setCompletedTransactions(completed);
      setVoidedTransactions(voided);
      
      // Initial filtering
      filterTransactionsByDate();
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to filter transactions based on selected date period
  const filterTransactionsByDate = () => {
    const transactionsToFilter = selected === 0 ? completedTransactions : voidedTransactions;
    let filtered = [];
    let start, end;

    switch (filterPeriod) {
      case 'today':
        start = moment().startOf('day');
        end = moment().endOf('day');
        break;
      case 'yesterday':
        start = moment().subtract(1, 'days').startOf('day');
        end = moment().subtract(1, 'days').endOf('day');
        break;
      case 'thisWeek':
        start = moment().startOf('week');
        end = moment().endOf('week');
        break;
      case 'thisMonth':
        start = moment().startOf('month');
        end = moment().endOf('month');
        break;
      case 'custom':
        start = moment(startDate);
        end = moment(endDate);
        break;
      default:
        start = moment().startOf('day');
        end = moment().endOf('day');
    }

    filtered = transactionsToFilter.filter(transaction => {
      const transactionDate = moment(transaction.createdAt);
      return transactionDate.isBetween(start, end, null, '[]'); // inclusive range
    });

    setFilteredTransactions(filtered);
  };

  // Handler for date picker
  const onDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setDatePickerVisible(false);
      return;
    }
    
    if (selectedDate) {
      if (dateType === 'start') {
        // If selecting start date, set it to beginning of day
        setStartDate(moment(selectedDate).startOf('day').toDate());
      } else {
        // If selecting end date, set it to end of day
        setEndDate(moment(selectedDate).endOf('day').toDate());
      }
    }
    
    setDatePickerVisible(false);
    setFilterPeriod('custom');
  };

  // Show date picker for start or end date
  const showDatePicker = (type) => {
    setDateType(type);
    setDatePickerVisible(true);
  };

  // Handle void transaction
  const voidTransaction = async () => {
    if (!voidReason.trim()) {
      setVoidError('Please enter a reason for voiding this transaction');
      return;
    }

    if (pinCode !== staffData.password) {
      setVoidError('Invalid PIN code');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Get the transaction's related sales to restore stock
      const salesResponse = await client.graphql({
        query: listSaleTransactions,
        variables: {
          filter: {
            id: { eq: selectedTransaction.id }
          }
        }
      });
      
      const transaction = salesResponse.data.listSaleTransactions.items[0];
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // 2. Update the transaction status to Voided
      await client.graphql({
        query: updateSaleTransaction,
        variables: {
          input: {
            id: selectedTransaction.id,
            status: 'Voided',
            notes: `Voided: ${voidReason}`,
          }
        }
      });
      
      // 3. Restore product stock for each item in the transaction
      // This requires additional API calls to get the sales items
      // For each product ID in the transaction items array
      for (const productId of transaction.items) {
        try {
          // Get the product
          const productResponse = await client.graphql({
            query: getProduct,
            variables: { id: productId }
          });
          
          const product = productResponse.data.getProduct;
          
          if (product) {
            // Determine quantity sold in this transaction for this product
            // This would need to be fetched from your Sale records
            // For now we're assuming 1 as a placeholder
            const quantitySold = 1;
            
            // Update the product stock
            await client.graphql({
              query: updateProduct,
              variables: {
                input: {
                  id: productId,
                  stock: product.stock + quantitySold
                }
              }
            });
          }
        } catch (error) {
          console.error(`Error restoring stock for product ${productId}:`, error);
        }
      }
      
      // 4. Refresh the transactions list
      fetchTransactions();
      
      // 5. Reset state and close modal
      setVoidModalVisible(false);
      setVoidReason('');
      setPinCode('');
      setVoidError('');
      setSelectedTransaction(null);
      
      Alert.alert('Success', 'Transaction has been voided');
      
    } catch (error) {
      console.error('Error voiding transaction:', error);
      setVoidError('Failed to void transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals for the displayed transactions
  const calculateTotals = () => {
    let totalAmount = 0;
    let totalTransactions = filteredTransactions.length;

    filteredTransactions.forEach(transaction => {
      totalAmount += transaction.total || 0;
    });

    return {
      totalAmount,
      totalTransactions
    };
  };

  // Render table for completed transactions
  const renderCompletedTable = () => (
    <DataTable
      total={calculateTotals().totalAmount}
      headerTitles={[
        'Time',
        'Date',
        'Type',
        'Receipt',
        'Discount',
        'Amount',
        'Action',
        'View',
      ]}
      alignment="center">
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        filteredTransactions.length > 0 ? (
          <FlatList
            keyExtractor={(item) => item.id}
            data={filteredTransactions}
            style={{ marginTop: 10, borderRadius: 5 }}
            renderItem={renderCompletedItem}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No transactions found</Text>
          </View>
        )
      )}
    </DataTable>
  );

  // Render table for voided transactions
  const renderVoidedTable = () => (
    <DataTable
      total={calculateTotals().totalAmount}
      headerTitles={[
        'Time',
        'Date',
        'Type',
        'Receipt',
        'Reason',
        'Discount',
        'Amount',
        'View',
      ]}
      alignment="center">
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        filteredTransactions.length > 0 ? (
          <FlatList
            keyExtractor={(item) => item.id}
            data={filteredTransactions}
            style={{ marginTop: 10, borderRadius: 5 }}
            renderItem={renderVoidedItem}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No voided transactions found</Text>
          </View>
        )
      )}
    </DataTable>
  );

  // Render completed transaction item
  const renderCompletedItem = ({ item }) => (
    <Grid>
      <Row style={{ height: 30, backgroundColor: colors.white }}>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>
            {moment(item.createdAt).format('hh:mm A')}
          </Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>
            {moment(item.createdAt).format('DD MMM YYYY')}
          </Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>{item.payment_status || 'Cash'}</Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>{item.id.substring(0, 8)}</Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>
            {formatMoney(item.discount || 0, { symbol: '₱', precision: 2 })}
          </Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>
            {formatMoney(item.total, { symbol: '₱', precision: 2 })}
          </Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <TouchableOpacity
            style={styles.voidStyle}
            onPress={() => {
              setSelectedTransaction(item);
              setVoidModalVisible(true);
            }}>
            <Text style={{ color: colors.white, fontSize: 11 }}>VOID</Text>
          </TouchableOpacity>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <TouchableOpacity
            style={styles.viewStyle}
            onPress={() =>
              navigation.navigate('TransactionDetails', {
                transactions: item,
                staffData: staffData
              })
            }>
            <Text style={{ color: colors.white, fontSize: 11 }}>View</Text>
          </TouchableOpacity>
        </Col>
      </Row>
    </Grid>
  );

  // Render voided transaction item
  const renderVoidedItem = ({ item }) => (
    <Grid>
      <Row style={{ height: 30, backgroundColor: colors.white }}>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>
            {moment(item.createdAt).format('hh:mm A')}
          </Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>
            {moment(item.createdAt).format('DD MMM YYYY')}
          </Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>{item.payment_status || 'Cash'}</Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>{item.id.substring(0, 8)}</Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>{item.notes || 'N/A'}</Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>
            {formatMoney(item.discount || 0, { symbol: '₱', precision: 2 })}
          </Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <Text style={styles.textColor}>
            {formatMoney(item.total, { symbol: '₱', precision: 2 })}
          </Text>
        </Col>
        <Col style={[styles.ColStyle, { alignItems: 'center' }]}>
          <TouchableOpacity
            style={styles.viewStyle}
            onPress={() =>
              navigation.navigate('TransactionDetails', {
                transactions: item,
                staffData: staffData
              })
            }>
            <Text style={{ color: colors.white, fontSize: 11 }}>View</Text>
          </TouchableOpacity>
        </Col>
      </Row>
    </Grid>
  );

  // Render filter buttons
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterButton, filterPeriod === 'today' && styles.filterButtonActive]}
          onPress={() => setFilterPeriod('today')}>
          <Text style={[styles.filterButtonText, filterPeriod === 'today' && styles.filterButtonTextActive]}>Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filterPeriod === 'yesterday' && styles.filterButtonActive]}
          onPress={() => setFilterPeriod('yesterday')}>
          <Text style={[styles.filterButtonText, filterPeriod === 'yesterday' && styles.filterButtonTextActive]}>Yesterday</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filterPeriod === 'thisWeek' && styles.filterButtonActive]}
          onPress={() => setFilterPeriod('thisWeek')}>
          <Text style={[styles.filterButtonText, filterPeriod === 'thisWeek' && styles.filterButtonTextActive]}>This Week</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filterPeriod === 'thisMonth' && styles.filterButtonActive]}
          onPress={() => setFilterPeriod('thisMonth')}>
          <Text style={[styles.filterButtonText, filterPeriod === 'thisMonth' && styles.filterButtonTextActive]}>This Month</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, filterPeriod === 'custom' && styles.filterButtonActive]}
          onPress={() => setFilterPeriod('custom')}>
          <Text style={[styles.filterButtonText, filterPeriod === 'custom' && styles.filterButtonTextActive]}>Custom</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Render custom date range selector
  const renderCustomDateRange = () => (
    filterPeriod === 'custom' && (
      <View style={styles.dateRangeContainer}>
        <TouchableOpacity 
          style={styles.datePickerButton} 
          onPress={() => showDatePicker('start')}
        >
          <Text style={styles.datePickerLabel}>From:</Text>
          <Text style={styles.datePickerText}>
            {moment(startDate).format('MMM DD, YYYY')}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.dateRangeSeparator}>-</Text>
        
        <TouchableOpacity 
          style={styles.datePickerButton} 
          onPress={() => showDatePicker('end')}
        >
          <Text style={styles.datePickerLabel}>To:</Text>
          <Text style={styles.datePickerText}>
            {moment(endDate).format('MMM DD, YYYY')}
          </Text>
        </TouchableOpacity>
      </View>
    )
  );

  // Render transaction summary
  const renderTransactionSummary = () => {
    const { totalAmount, totalTransactions } = calculateTotals();
    
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>{totalTransactions}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Sales</Text>
          <Text style={styles.summaryValue}>{formatMoney(totalAmount, { symbol: '₱', precision: 2 })}</Text>
        </View>
      </View>
    );
  };

  // Main render function
  return (
    <Provider>
      <View style={{ flex: 1 }}>
        <AppHeader
          centerText="Transactions"
          leftComponent={
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <EvilIcons name={'arrow-left'} size={35} color={colors.white} />
            </TouchableOpacity>
          }
          rightComponent={
            <TouchableOpacity onPress={fetchTransactions}>
              <MaterialIcons name={'refresh'} size={26} color={colors.white} />
            </TouchableOpacity>
          }
        />
        
        {renderFilterButtons()}
        {renderCustomDateRange()}
        {renderTransactionSummary()}
        
        <SegmentedControl
          style={styles.segmentedControl}
          values={['Completed', 'Voided']}
          selectedIndex={selected}
          onChange={event => {
            setSelected(event.nativeEvent.selectedSegmentIndex);
          }}
        />
        
        {/* Main content - render different tables based on selected tab */}
        <View style={{ flex: 1 }}>
          {selected === 0 ? renderCompletedTable() : renderVoidedTable()}
        </View>
        
        {/* Date picker modal */}
        {datePickerVisible && (
          <DateTimePicker
            value={dateType === 'start' ? startDate : endDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
        
        {/* Void transaction modal */}
        <Portal>
          <Modal
            visible={voidModalVisible}
            onDismiss={() => {
              setVoidModalVisible(false);
              setVoidReason('');
              setPinCode('');
              setVoidError('');
            }}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Void Transaction</Text>
              
              {voidError ? <Text style={styles.errorText}>{voidError}</Text> : null}
              
              <TextInput
                label="Reason for Voiding"
                value={voidReason}
                onChangeText={setVoidReason}
                style={styles.input}
                mode="outlined"
              />
              
              <TextInput
                label="Enter PIN to Confirm"
                value={pinCode}
                onChangeText={setPinCode}
                style={styles.input}
                secureTextEntry
                keyboardType="numeric"
                mode="outlined"
              />
              
              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setVoidModalVisible(false);
                    setVoidReason('');
                    setPinCode('');
                    setVoidError('');
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                
                <Button
                  mode="contained"
                  onPress={voidTransaction}
                  style={styles.confirmButton}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Confirm Void
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 30,
  },
  textColor: {
    fontSize: 12,
    color: colors.black,
    fontWeight: '600',
    textAlign: 'center',
  },
  ColStyle: {
    width: windowWidth < 375
      ? windowWidth / 4 - 5
      : windowWidth < 414
        ? windowWidth / 4.2 - 3
        : windowWidth / 4.5 - 2,
    justifyContent: 'center',
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.charcoalGrey,
  },
  voidStyle: {
    marginTop: 3,
    backgroundColor: colors.red,
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 10,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewStyle: {
    marginTop: 3,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 10,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterContainer: {
    marginHorizontal: 10,
    marginVertical: 8,
  },
  filterButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    color: colors.charcoalGrey,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  datePickerButton: {
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  datePickerLabel: {
    color: colors.charcoalGrey,
    marginRight: 5,
    fontWeight: '500',
  },
  datePickerText: {
    color: colors.black,
    fontWeight: '600',
  },
  dateRangeSeparator: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.charcoalGrey,
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  segmentedControl: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: colors.boldGrey,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: colors.charcoalGrey,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.primary,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    borderColor: colors.accent,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.accent,
  },
  errorText: {
    color: colors.red,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default TransactionScreen;