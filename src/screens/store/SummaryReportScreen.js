import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Button, Divider, Modal, Portal, Provider } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import Appbar from '../../components/Appbar';
import colors from '../../themes/colors';

// GraphQL
import { listSaleTransactions, listExpenses, listCategories } from '../../graphql/queries';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

const SummaryReportScreen = ({ navigation, route }) => {
  const { store } = route.params;
  
  // State for data
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  const [discounts, setDiscounts] = useState([]);
  
  // State for date filtering
  const [dateRange, setDateRange] = useState('today'); // 'today', 'yesterday', 'thisWeek', 'thisMonth', 'custom'
  const [startDate, setStartDate] = useState(moment().startOf('day').toDate());
  const [endDate, setEndDate] = useState(moment().endOf('day').toDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'
  
  // State for summary statistics
  const [summaryStats, setSummaryStats] = useState({
    totalNetSales: 0,
    totalExpenses: 0,
    totalSales: 0,
    netProfit: 0,
    totalItems: 0,
    totalTransactions: 0,
    totalVoided: 0,
    totalDiscounts: 0
  });
  
  const [isNetProfitHidden, setIsNetProfitHidden] = useState(true);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Fetch data on initial load and when date range changes
  useEffect(() => {
    fetchReportData();
  }, [dateRange, startDate, endDate]);
  
  // Main function to fetch all report data
  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Get date range based on selected filter
      const { start, end } = getDateRangeForFilter();
      
      // Fetch transactions
      const transactionsResult = await client.graphql({
        query: listSaleTransactions,
        variables: {
          filter: {
            storeID: { eq: store.id },
            createdAt: { between: [start.toISOString(), end.toISOString()] }
          }
        }
      });
      
      const transactionItems = transactionsResult.data.listSaleTransactions.items;
      setTransactions(transactionItems);
      
      // Fetch all expenses for this store and filter by date in memory
      const expensesResult = await client.graphql({
        query: listExpenses,
        variables: {
          filter: {
            storeId: { eq: store.id } // Note: in Expense model it's storeId not storeID
          }
        }
      });
      
      // Manual date filtering for expenses since they use 'date' field instead of createdAt
      const allExpenseItems = expensesResult.data.listExpenses.items;
      const filteredExpenseItems = allExpenseItems.filter(expense => {
        const expenseDate = moment(expense.date);
        return expenseDate.isBetween(start, end, null, '[]'); // inclusive range
      });
      
      setExpenses(filteredExpenseItems);
      
      // Fetch categories
      const categoriesResult = await client.graphql({
        query: listCategories,
        variables: {
          filter: {
            storeId: { eq: store.id } // Changed from storeID to storeId to match schema
          }
        }
      });
      
      const categoryItems = categoriesResult.data.listCategories.items;
      setCategories(categoryItems);
      
      // Process data for report
      processReportData(transactionItems, filteredExpenseItems, categoryItems);
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      Alert.alert('Error', 'Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Process transaction and expense data
  const processReportData = (transactions, expenses, categories) => {
    // Initialize counters
    let totalSales = 0;
    let totalItems = 0;
    let totalDiscounts = 0;
    let transactionCount = 0;
    let voidedCount = 0;
    
    // Initialize category sales tracker
    const categorySales = {};
    categories.forEach(category => {
      categorySales[category.id] = {
        name: category.name,
        quantity: 0,
        sales: 0
      };
    });
    
    // Initialize payment methods tracker
    const paymentTypes = {};
    
    // Initialize discounts array
    const discountsList = [];
    
    // Process transactions
    transactions.forEach(transaction => {
      // Count transactions
      if (transaction.status === 'Completed') {
        transactionCount++;
        totalSales += transaction.total || 0;
        
        // Track payment methods
        const paymentMethod = transaction.payment_status || 'Cash';
        if (!paymentTypes[paymentMethod]) {
          paymentTypes[paymentMethod] = 0;
        }
        paymentTypes[paymentMethod] += transaction.total || 0;
        
        // Track items if available
        if (transaction.items && Array.isArray(transaction.items)) {
          totalItems += transaction.items.length;
          
          // Track items by category (simplified approach - actual would need Sales records with category info)
          transaction.items.forEach(item => {
            // This is a simplified approach. In a real app, you'd get the product's category
            // and increment that specific category's count and sales
            const defaultCategoryId = categories.length > 0 ? categories[0].id : 'uncategorized';
            if (categorySales[defaultCategoryId]) {
              categorySales[defaultCategoryId].quantity += 1;
              categorySales[defaultCategoryId].sales += transaction.total / transaction.items.length; // Simple average
            }
          });
        }
        
        // Track discounts
        if (transaction.discount && transaction.discount > 0) {
          totalDiscounts += transaction.discount;
          discountsList.push({
            name: transaction.notes?.includes('Discount applied:') 
              ? transaction.notes.split('Discount applied:')[1]?.trim() || 'Regular Discount' 
              : 'Regular Discount',
            receipt: transaction.id.substring(0, 8),
            amount: transaction.discount
          });
        }
      } else if (transaction.status === 'Voided') {
        voidedCount++;
      }
    });
    
    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    
    // Calculate net profit
    const netProfit = totalSales - totalExpenses;
    
    // Update state with processed data
    setSalesByCategory(categorySales);
    setPaymentMethods(paymentTypes);
    setDiscounts(discountsList);
    
    // Update summary statistics
    setSummaryStats({
      totalNetSales: totalSales,
      totalExpenses: totalExpenses,
      totalSales: totalSales, // Same as netSales for simplicity, could be different if you account for returns/refunds
      netProfit: netProfit,
      totalItems: totalItems,
      totalTransactions: transactionCount,
      totalVoided: voidedCount,
      totalDiscounts: totalDiscounts
    });
  };
  
  // Helper function to get date range based on filter
  const getDateRangeForFilter = () => {
    let start, end;
    
    switch (dateRange) {
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
    
    return { start, end };
  };
  
  // Get formatted date range string for display
  const getDateRangeString = () => {
    switch (dateRange) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'thisWeek':
        return 'This Week';
      case 'thisMonth':
        return 'This Month';
      case 'custom':
        return `${moment(startDate).format('MMM DD, YYYY')} - ${moment(endDate).format('MMM DD, YYYY')}`;
      default:
        return 'Today';
    }
  };
  
  // Handle date picker
  const showDatePickerModal = (mode) => {
    setDatePickerMode(mode);
    setDatePickerVisible(true);
  };
  
  const onDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setDatePickerVisible(false);
      return;
    }
    
    if (selectedDate) {
      if (datePickerMode === 'start') {
        setStartDate(moment(selectedDate).startOf('day').toDate());
      } else {
        setEndDate(moment(selectedDate).endOf('day').toDate());
      }
      setDateRange('custom');
    }
    
    setDatePickerVisible(false);
  };
  
  // Render date range selector modal
  const renderDateRangeModal = () => (
    <Portal>
      <Modal
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Date Range</Text>
          
          <TouchableOpacity 
            style={[styles.dateRangeButton, dateRange === 'today' && styles.activeDateRange]}
            onPress={() => {
              setDateRange('today');
              setShowDatePicker(false);
            }}
          >
            <Text style={[styles.dateRangeText, dateRange === 'today' && styles.activeDateRangeText]}>Today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.dateRangeButton, dateRange === 'yesterday' && styles.activeDateRange]}
            onPress={() => {
              setDateRange('yesterday');
              setShowDatePicker(false);
            }}
          >
            <Text style={[styles.dateRangeText, dateRange === 'yesterday' && styles.activeDateRangeText]}>Yesterday</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.dateRangeButton, dateRange === 'thisWeek' && styles.activeDateRange]}
            onPress={() => {
              setDateRange('thisWeek');
              setShowDatePicker(false);
            }}
          >
            <Text style={[styles.dateRangeText, dateRange === 'thisWeek' && styles.activeDateRangeText]}>This Week</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.dateRangeButton, dateRange === 'thisMonth' && styles.activeDateRange]}
            onPress={() => {
              setDateRange('thisMonth');
              setShowDatePicker(false);
            }}
          >
            <Text style={[styles.dateRangeText, dateRange === 'thisMonth' && styles.activeDateRangeText]}>This Month</Text>
          </TouchableOpacity>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.customDateTitle}>Custom Date Range</Text>
          
          <View style={styles.customDateContainer}>
            <TouchableOpacity 
              style={styles.customDateButton}
              onPress={() => {
                setShowDatePicker(false);
                showDatePickerModal('start');
              }}
            >
              <Text style={styles.customDateLabel}>From</Text>
              <Text style={styles.customDateValue}>{moment(startDate).format('MMM DD, YYYY')}</Text>
            </TouchableOpacity>
            
            <Text style={styles.dateRangeSeparator}>-</Text>
            
            <TouchableOpacity 
              style={styles.customDateButton}
              onPress={() => {
                setShowDatePicker(false);
                showDatePickerModal('end');
              }}
            >
              <Text style={styles.customDateLabel}>To</Text>
              <Text style={styles.customDateValue}>{moment(endDate).format('MMM DD, YYYY')}</Text>
            </TouchableOpacity>
          </View>
          
          <Button 
            mode="contained" 
            onPress={() => {
              setDateRange('custom');
              setShowDatePicker(false);
            }}
            style={styles.applyButton}
            disabled={moment(endDate).isBefore(moment(startDate))}
          >
            Apply Custom Range
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar
          title="Summary Report"
          onBack={() => navigation.goBack()}
        />

        {/* Date Selector */}
        <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color="#333" style={styles.calendarIcon} />
          <Text style={styles.dateText}>{getDateRangeString()}</Text>
        </TouchableOpacity>
        
        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading report data...</Text>
          </View>
        )}

      {/* Report Content */}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportHeaderText}>Summary Report</Text>
          <Text style={styles.reportHeaderDate}>{getDateRangeString()}</Text>
        </View>

        {/* Sales and Expenses Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SALES AND EXPENSES SUMMARY</Text>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Net Sales</Text>
            <Text style={styles.rowValue}>₱0.00</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Expenses</Text>
            <Text style={styles.rowValue}>{formatMoney(summaryStats.totalExpenses, { symbol: '₱', precision: 2 })}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Sales</Text>
            <Text style={styles.rowValue}>{formatMoney(summaryStats.totalSales, { symbol: '₱', precision: 2 })}</Text>
          </View>
        </View>

        {/* Net Profit Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NET PROFIT</Text>
          
          {isNetProfitHidden ? (
            <TouchableOpacity 
              style={styles.hiddenContent} 
              onPress={() => setIsNetProfitHidden(false)}
            >
              <Text style={styles.hiddenText}>---Report hidden---</Text>
              <Text style={styles.hiddenSubtext}>—Tap to unhide—</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Net Profit</Text>
              <Text style={[styles.rowValue, styles.profitValue]}>
                {formatMoney(summaryStats.netProfit, { symbol: '₱', precision: 2 })}
              </Text>
            </View>
          )}
        </View>

        {/* Sales Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SALES CATEGORIES</Text>
          
          <View style={styles.tableHeader}>
            <Text style={styles.categoryColumn}>Categories</Text>
            <Text style={styles.quantityColumn}>Quantity</Text>
            <Text style={styles.salesColumn}>Net Sales</Text>
          </View>
          
          {Object.values(salesByCategory).map((category, index) => (
            <View key={index} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryQuantity}>{category.quantity}</Text>
              <Text style={styles.categorySales}>
                {formatMoney(category.sales, { symbol: '₱', precision: 2 })}
              </Text>
            </View>
          ))}
          
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.rowLabel}>Total Net Sales</Text>
            <Text style={styles.rowValue}>{formatMoney(summaryStats.totalNetSales, { symbol: '₱', precision: 2 })}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
          
          <View style={styles.tableHeader}>
            <Text style={styles.categoryColumn}>Payment Type</Text>
            <Text style={styles.salesColumn}>Amount</Text>
          </View>
          
          {Object.entries(paymentMethods).map(([method, amount], index) => (
            <View key={index} style={styles.paymentRow}>
              <Text style={styles.paymentMethod}>{method}</Text>
              <Text style={styles.paymentAmount}>
                {formatMoney(amount, { symbol: '₱', precision: 2 })}
              </Text>
            </View>
          ))}
          
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.rowLabel}>Total Payments</Text>
            <Text style={styles.rowValue}>{formatMoney(summaryStats.totalNetSales, { symbol: '₱', precision: 2 })}</Text>
          </View>
        </View>

        {/* Sales Discounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SALES DISCOUNTS</Text>
          
          <View style={styles.tableHeader}>
            <Text style={styles.discountNameColumn}>Discount Name</Text>
            <Text style={styles.receiptColumn}>Receipt No.</Text>
            <Text style={styles.amountColumn}>Amount</Text>
          </View>
          
          {discounts.map((discount, index) => (
            <View key={index} style={styles.discountRow}>
              <Text style={styles.discountName}>{discount.name}</Text>
              <Text style={styles.discountReceipt}>{discount.receipt}</Text>
              <Text style={styles.discountAmount}>
                {formatMoney(discount.amount, { symbol: '₱', precision: 2 })}
              </Text>
            </View>
          ))}
          
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.rowLabel}>Total Discount</Text>
            <Text style={styles.rowValue}>{formatMoney(summaryStats.totalDiscounts, { symbol: '₱', precision: 2 })}</Text>
          </View>
        </View>

        {/* Delivery Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DELIVERY SUMMARY</Text>
          
          <View style={styles.tableHeader}>
            <Text style={styles.deliveryNoColumn}>Expense ID</Text>
            <Text style={styles.supplierColumn}>Description</Text>
            <Text style={styles.amountColumn}>Amount</Text>
          </View>
          
          {expenses.map((expense, index) => (
            <View key={index} style={styles.expenseRow}>
              <Text style={styles.expenseId}>{expense.id.substring(0, 8)}</Text>
              <Text style={styles.expenseDescription}>{expense.description || 'No description'}</Text>
              <Text style={styles.expenseAmount}>
                {formatMoney(expense.amount || 0, { symbol: '₱', precision: 2 })}
              </Text>
            </View>
          ))}
          
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.rowLabel}>Total Expenses</Text>
            <Text style={styles.rowValue}>{formatMoney(summaryStats.totalExpenses, { symbol: '₱', precision: 2 })}</Text>
          </View>
        </View>

        {/* Transactions Summary */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>No. of Transaction</Text>
            <Text style={styles.rowValue}>{summaryStats.totalTransactions}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>No. of Voided</Text>
            <Text style={styles.rowValue}>{summaryStats.totalVoided}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Items Sold</Text>
            <Text style={styles.rowValue}>{summaryStats.totalItems}</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Date picker */}
      {datePickerVisible && (
        <DateTimePicker
          value={datePickerMode === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      
      {/* Date range modal */}
      {renderDateRangeModal()}
    </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  calendarIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  reportHeader: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  reportHeaderDate: {
    fontSize: 16,
    color: '#555',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 5,
  },
  rowLabel: {
    fontSize: 14,
    color: '#333',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  profitValue: {
    color: colors.primary,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
  },
  categoryColumn: {
    flex: 2,
    fontSize: 14,
    color: '#666',
  },
  quantityColumn: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  salesColumn: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  discountNameColumn: {
    flex: 2,
    fontSize: 14,
    color: '#666',
  },
  receiptColumn: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  amountColumn: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  deliveryNoColumn: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  supplierColumn: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  hiddenContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  hiddenText: {
    color: '#f44336',
    fontSize: 14,
    fontStyle: 'italic',
  },
  hiddenSubtext: {
    color: '#757575',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Category row styles
  categoryRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  categoryName: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  categoryQuantity: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  categorySales: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  // Payment row styles
  paymentRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  paymentMethod: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  paymentAmount: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  // Discount row styles
  discountRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  discountName: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  discountReceipt: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  discountAmount: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  // Expense row styles
  expenseRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  expenseId: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  expenseDescription: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  expenseAmount: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  // Loading styles
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  // Modal styles
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    padding: 20,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  dateRangeButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  activeDateRange: {
    backgroundColor: colors.primary,
  },
  dateRangeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activeDateRangeText: {
    color: 'white',
  },
  divider: {
    marginVertical: 15,
  },
  customDateTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  customDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  customDateButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
  },
  customDateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  customDateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dateRangeSeparator: {
    marginHorizontal: 10,
    fontSize: 18,
    color: '#666',
  },
  applyButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
  },
});

export default SummaryReportScreen;
