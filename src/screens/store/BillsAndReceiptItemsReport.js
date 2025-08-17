/* eslint-disable react-native/no-inline-styles */
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import Appbar from '../../components/Appbar';
import {Provider} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import DataTable from '../../components/DataTable';
import {Grid, Col, Row} from 'react-native-easy-grid';
import colors from '../../themes/colors';

// GraphQL
import {listSaleTransactions, listSales} from '../../graphql/queries';
import {generateClient} from 'aws-amplify/api';
import Cards from '../../components/Cards';
const client = generateClient();

const BillsAndReceiptItemsReport = ({navigation, route}) => {
  const {store} = route.params;

  // State for transactions
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for filtering
  const [filterPeriod, setFilterPeriod] = useState('today');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('start');
  const [startDate, setStartDate] = useState(moment().startOf('day').toDate());
  const [endDate, setEndDate] = useState(moment().endOf('day').toDate());

  // State for item reports
  const [itemReports, setItemReports] = useState({});

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    filterTransactionsByDate();
  }, [filterTransactionsByDate, transactions]); // Only run when transactions or viewMode changes

  // Fetch all transactions for the store
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch transactions
      const transactionsResult = await client.graphql({
        query: listSaleTransactions,
        variables: {
          filter: {
            storeID: {eq: store.id},
          },
        },
      });

      // Fetch sales data
      const salesResult = await client.graphql({
        query: listSales,
        variables: {
          filter: {
            // We can filter sales by storeID if needed
            // Alternatively, we can fetch all and filter on the client side
          },
          limit: 1000, // Adjust limit as needed
        },
      });

      // Get sales data
      const salesData = salesResult.data.listSales.items;
      console.log('Fetched sales data:', salesData.length, 'items');

      // Sort transactions by creation date (newest first)
      const sortedTransactions =
        transactionsResult.data.listSaleTransactions.items.sort(
          (a, b) =>
            moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf(),
        );

      // Add sales data to each transaction
      const transactionsWithSales = sortedTransactions.map(transaction => {
        // Find sales related to this transaction
        const transactionSales = salesData.filter(
          sale => sale.transactionID === transaction.id,
        );

        // Add sales to the transaction
        return {
          ...transaction,
          sales: transactionSales,
        };
      });

      setTransactions(transactionsWithSales);
      generateReports(transactionsWithSales);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [store.id]);

  // Generate reports from transaction data
  const generateReports = transactionData => {
    console.log(
      'Generating item reports with',
      transactionData.length,
      'transactions',
    );
    // Generate item reports

    const itemData = {};

    transactionData.forEach(transaction => {
      // First check for sales data that we fetched
      if (
        transaction.sales &&
        Array.isArray(transaction.sales) &&
        transaction.sales.length > 0
      ) {
        console.log(
          `Processing ${transaction.sales.length} sales for transaction ${transaction.id}`,
        );
        // Process sales data - this comes directly from the Sale schema
        transaction.sales.forEach(sale => {
          const itemId = sale.productID;
          const itemName = sale.productName || 'Unknown';
          const quantity = sale.quantity || 1;
          const price = sale.price || 0;

          if (!itemData[itemId]) {
            itemData[itemId] = {
              id: itemId,
              name: itemName,
              totalSold: 0,
              totalRevenue: 0,
            };
          }

          itemData[itemId].totalSold += quantity;
          itemData[itemId].totalRevenue += price * quantity;
        });
      }
      // Fall back to items data if sales is not available
      else if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach(item => {
          const itemId =
            typeof item === 'object' ? item.id || item.productId : item;
          const itemName =
            typeof item === 'object'
              ? item.name || item.productName
              : item.productName;
          const quantity = typeof item === 'object' ? item.quantity || 1 : 1;
          const price = typeof item === 'object' ? item.price || 0 : 0;

          if (!itemData[itemId]) {
            itemData[itemId] = {
              id: itemId,
              name: itemName,
              totalSold: 0,
              totalRevenue: 0,
            };
          }

          itemData[itemId].totalSold += quantity;
          itemData[itemId].totalRevenue += price * quantity;
        });
      }
    });

    setItemReports(itemData);
  };

  // Filter transactions based on date range
  const filterTransactionsByDate = useCallback(
    async period => {
      // Use the passed period or fall back to the state
      const currentFilterPeriod = period || filterPeriod;
      let start, end;

      switch (currentFilterPeriod) {
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

      const filtered = transactions.filter(transaction => {
        const transactionDate = moment(transaction.createdAt);
        return transactionDate.isBetween(start, end, null, '[]'); // inclusive range
      });

      setFilteredTransactions(filtered);

      // Regenerate reports with filtered transactions
      generateReports(filtered);
    },
    [filterPeriod, startDate, endDate, transactions],
  );

  // Handle date picker changes
  const onDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setDatePickerVisible(false);
      return;
    }

    if (selectedDate) {
      if (dateType === 'start') {
        setStartDate(moment(selectedDate).startOf('day').toDate());
      } else {
        setEndDate(moment(selectedDate).endOf('day').toDate());
      }
    }

    setDatePickerVisible(false);
    setFilterPeriod('custom');
    // Apply filter after date change
    setTimeout(() => filterTransactionsByDate('custom'), 100);
  };

  // Show date picker
  const showDatePicker = type => {
    setDateType(type);
    setDatePickerVisible(true);
  };

  // Print transaction receipt

  // Calculate summary statistics
  const calculateSummary = () => {
    let totalAmount = 0;
    let totalTransactions = filteredTransactions.length;

    filteredTransactions.forEach(transaction => {
      totalAmount += transaction.total || 0;
    });

    return {
      totalAmount,
      totalTransactions,
      averageTransaction:
        totalTransactions > 0 ? totalAmount / totalTransactions : 0,
    };
  };

  // Render custom date range selector
  const renderCustomDateRange = () =>
    filterPeriod === 'custom' && (
      <View style={styles.dateRangeContainer}>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => showDatePicker('start')}>
          <Text style={styles.datePickerLabel}>From:</Text>
          <Text style={styles.datePickerText}>
            {moment(startDate).format('MMM DD, YYYY')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.dateRangeSeparator}>-</Text>

        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => showDatePicker('end')}>
          <Text style={styles.datePickerLabel}>To:</Text>
          <Text style={styles.datePickerText}>
            {moment(endDate).format('MMM DD, YYYY')}
          </Text>
        </TouchableOpacity>
      </View>
    );

  // Render summary statistics
  const renderSummary = () => {
    const summary = calculateSummary();

    return (
      <Cards>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}>
          <Text style={styles.summaryTitle}>Sales Overview</Text>
          <View style={styles.periodFilter}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                filterPeriod === 'today' && styles.activePeriod,
              ]}
              onPress={() => {
                setFilterPeriod('today');
                filterTransactionsByDate('today');
              }}>
              <Text
                style={[
                  styles.periodText,
                  filterPeriod === 'today' && styles.activePeriodText,
                ]}>
                Today
              </Text>
            </TouchableOpacity>
            {/* <TouchableOpacity
              style={[
                styles.periodButton,
                filterPeriod === 'yesterday' && styles.activePeriod,
              ]}
              onPress={() => setFilterPeriod('yesterday')}>
              <Text
                style={[
                  styles.periodText,
                  filterPeriod === 'yesterday' && styles.activePeriodText,
                ]}>
                Yesterday
              </Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={[
                styles.periodButton,
                filterPeriod === 'thisWeek' && styles.activePeriod,
              ]}
              onPress={() => {
                setFilterPeriod('thisWeek');
                filterTransactionsByDate('thisWeek');
              }}>
              <Text
                style={[
                  styles.periodText,
                  filterPeriod === 'thisWeek' && styles.activePeriodText,
                ]}>
                This Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                filterPeriod === 'thisMonth' && styles.activePeriod,
              ]}
              onPress={() => {
                setFilterPeriod('thisMonth');
                filterTransactionsByDate('thisMonth');
              }}>
              <Text
                style={[
                  styles.periodText,
                  filterPeriod === 'thisMonth' && styles.activePeriodText,
                ]}>
                This Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                filterPeriod === 'custom' && styles.activePeriod,
              ]}
              onPress={() => {
                setFilterPeriod('custom');
                filterTransactionsByDate('custom');
              }}>
              <Text
                style={[
                  styles.periodText,
                  filterPeriod === 'custom' && styles.activePeriodText,
                ]}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.totalTransactions}</Text>
            <Text style={styles.summaryLabel}>Total Bills</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {formatMoney(summary.totalAmount, {symbol: '₱', precision: 2})}
            </Text>
            <Text style={styles.summaryLabel}>Total Sales</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {formatMoney(summary.averageTransaction, {
                symbol: '₱',
                precision: 2,
              })}
            </Text>
            <Text style={styles.summaryLabel}>Avg. Bill</Text>
          </View>
        </View>
      </Cards>
    );
  };

  // Render item report
  const renderItemReport = () => {
    const itemList = Object.values(itemReports).sort(
      (a, b) => b.totalSold - a.totalSold,
    );

    return (
      <DataTable
        total={itemList.reduce((sum, item) => sum + item.totalRevenue, 0)}
        headerTitles={[
          'Product Name',
          'Quantity Sold',
          'Total Revenue',
          'Avg. Price',
        ]}
        alignment="left">
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{marginTop: 20}}
          />
        ) : itemList.length > 0 ? (
          <FlatList
            keyExtractor={item => item.id}
            data={itemList}
            style={{marginTop: 10, borderRadius: 5}}
            renderItem={({item}) => (
              <Grid>
                <Row style={{height: 30, backgroundColor: colors.white}}>
                  <Col style={[styles.colStyle, {alignItems: 'center'}]}>
                    <Text style={styles.textColor}>{item.name}</Text>
                  </Col>
                  <Col style={[styles.colStyle]}>
                    <Text style={styles.textColor}>{item.totalSold}</Text>
                  </Col>
                  <Col style={[styles.colStyle, {alignItems: 'center'}]}>
                    <Text style={styles.textColor}>
                      {formatMoney(item.totalRevenue, {
                        symbol: '₱',
                        precision: 2,
                      })}
                    </Text>
                  </Col>
                  <Col style={[styles.colStyle, {alignItems: 'center'}]}>
                    <Text style={styles.textColor}>
                      {formatMoney(
                        item.totalSold > 0
                          ? item.totalRevenue / item.totalSold
                          : 0,
                        {symbol: '₱', precision: 2},
                      )}
                    </Text>
                  </Col>
                </Row>
              </Grid>
            )}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No product data available</Text>
          </View>
        )}
      </DataTable>
    );
  };

  // Main render
  return (
    <Provider>
      <View style={styles.container}>
        <Appbar
          title="Items Report"
          onBack={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity onPress={fetchTransactions}>
              <MaterialIcons name="refresh" size={24} color={colors.white} />
            </TouchableOpacity>
          }
        />

        {renderSummary()}
        {/* Filters and Date Range */}
        {/* {renderFilterButtons()} */}
        {renderCustomDateRange()}

        {/* Summary Statistics */}

        {/* Main Content */}
        <View style={styles.contentContainer}>{renderItemReport()}</View>

        {/* Date picker */}
        {datePickerVisible && (
          <DateTimePicker
            value={dateType === 'start' ? startDate : endDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    marginTop: 10,
    flex: 1,
    paddingHorizontal: 10,
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
    marginTop: 10,
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
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
    marginHorizontal: 10,
    marginVertical: 10,
  },
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginVertical: 10,
  },
  modeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  activeModeButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.charcoalGrey,
  },
  activeModeButtonText: {
    color: colors.white,
  },
  colStyle: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.charcoalGrey,
  },
  textColor: {
    fontSize: 12,
    color: colors.black,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: colors.accent,
    padding: 5,
    borderRadius: 5,
    marginHorizontal: 2,
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
    maxHeight: '80%',
  },
  modalContent: {
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  printButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  printButtonText: {
    color: colors.white,
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '500',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  receiptText: {
    fontSize: 12,
    color: colors.charcoalGrey,
    marginBottom: 2,
  },
  itemsContainer: {
    marginBottom: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
    marginBottom: 5,
  },
  itemHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.charcoalGrey,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightGrey,
  },
  itemText: {
    fontSize: 12,
    color: colors.black,
  },
  noItemsText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.charcoalGrey,
    paddingVertical: 10,
  },
  totalContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.charcoalGrey,
  },
  totalValue: {
    fontSize: 14,
    color: colors.black,
  },
  voidedContainer: {
    backgroundColor: '#ffeeee',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  voidedText: {
    color: colors.red,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 15,
    borderColor: colors.accent,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: colors.charcoalGrey,
    fontSize: 14,
  },
  // Filter card styles
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    marginBottom: 12,
  },
  periodFilter: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 2,
    justifyContent: 'center',
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  activePeriod: {
    backgroundColor: colors.primary,
  },
  periodText: {
    color: colors.textDark,
    fontSize: 14,
  },
  activePeriodText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default BillsAndReceiptItemsReport;
