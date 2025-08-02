import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import Appbar from '../../components/Appbar';
import {
  TextInput,
  Button,
  Modal,
  Portal,
  Provider,
  SegmentedControl,
} from 'react-native-paper';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import DataTable from '../../components/DataTable';
import {Grid, Col, Row} from 'react-native-easy-grid';
import colors from '../../themes/colors';

// GraphQL
import {listSaleTransactions, getSaleTransaction} from '../../graphql/queries';
import {generateClient} from 'aws-amplify/api';
const client = generateClient();

const {width} = Dimensions.get('window');

const BillsAndReceipt = ({navigation, route}) => {
  const {store} = route.params;

  // State for transactions
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'cashier', 'item'

  // State for filtering
  const [filterPeriod, setFilterPeriod] = useState('today');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('start');
  const [startDate, setStartDate] = useState(moment().startOf('day').toDate());
  const [endDate, setEndDate] = useState(moment().endOf('day').toDate());

  // State for transaction details modal
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  // State for cashier reports
  const [cashierReports, setCashierReports] = useState({});

  // State for item reports
  const [itemReports, setItemReports] = useState({});

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    filterTransactionsByDate();
  }, [filterPeriod, startDate, endDate, transactions, viewMode]);

  // Fetch all transactions for the store
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const result = await client.graphql({
        query: listSaleTransactions,
        variables: {
          filter: {
            storeID: {eq: store.id},
          },
        },
      });

      // Sort transactions by creation date (newest first)
      const sortedTransactions = result.data.listSaleTransactions.items.sort(
        (a, b) => moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf(),
      );

      setTransactions(sortedTransactions);
      generateReports(sortedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate reports from transaction data
  const generateReports = transactionData => {
    // Generate cashier reports
    const cashierData = {};
    const itemData = {};

    transactionData.forEach(transaction => {
      // Process cashier data
      if (transaction.staffID) {
        if (!cashierData[transaction.staffID]) {
          cashierData[transaction.staffID] = {
            id: transaction.staffID,
            name: transaction.staffName || 'Unknown',
            salesCount: 0,
            totalSales: 0,
          };
        }

        cashierData[transaction.staffID].salesCount += 1;
        cashierData[transaction.staffID].totalSales += transaction.total || 0;
      }

      // Process item data
      if (transaction.items && Array.isArray(transaction.items)) {
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

    setCashierReports(cashierData);
    setItemReports(itemData);
  };

  // Filter transactions based on date range
  const filterTransactionsByDate = () => {
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

    const filtered = transactions.filter(transaction => {
      const transactionDate = moment(transaction.createdAt);
      return transactionDate.isBetween(start, end, null, '[]'); // inclusive range
    });

    setFilteredTransactions(filtered);
  };

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
  };

  // Show date picker
  const showDatePicker = type => {
    setDateType(type);
    setDatePickerVisible(true);
  };

  // Fetch transaction details
  const fetchTransactionDetails = async transactionId => {
    setIsLoading(true);
    try {
      const result = await client.graphql({
        query: getSaleTransaction,
        variables: {id: transactionId},
      });

      setTransactionDetails(result.data.getSaleTransaction);
      setDetailsModalVisible(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      Alert.alert('Error', 'Failed to load transaction details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Print transaction receipt
  const printReceipt = transaction => {
    // In a real app, this would interface with a printer
    // For this example, we'll just show an alert
    Alert.alert(
      'Print Receipt',
      `Printing receipt for transaction ${transaction.id.substring(0, 8)}`,
    );
  };

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

  // Render filter buttons
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === 'today' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterPeriod('today')}>
          <Text
            style={[
              styles.filterButtonText,
              filterPeriod === 'today' && styles.filterButtonTextActive,
            ]}>
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === 'yesterday' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterPeriod('yesterday')}>
          <Text
            style={[
              styles.filterButtonText,
              filterPeriod === 'yesterday' && styles.filterButtonTextActive,
            ]}>
            Yesterday
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === 'thisWeek' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterPeriod('thisWeek')}>
          <Text
            style={[
              styles.filterButtonText,
              filterPeriod === 'thisWeek' && styles.filterButtonTextActive,
            ]}>
            This Week
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === 'thisMonth' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterPeriod('thisMonth')}>
          <Text
            style={[
              styles.filterButtonText,
              filterPeriod === 'thisMonth' && styles.filterButtonTextActive,
            ]}>
            This Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterPeriod === 'custom' && styles.filterButtonActive,
          ]}
          onPress={() => setFilterPeriod('custom')}>
          <Text
            style={[
              styles.filterButtonText,
              filterPeriod === 'custom' && styles.filterButtonTextActive,
            ]}>
            Custom
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

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
    );
  };

  // Render view mode selector
  const renderViewModeSelector = () => (
    <View style={styles.viewModeContainer}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          viewMode === 'all' && styles.activeModeButton,
        ]}
        onPress={() => setViewMode('all')}>
        <Text
          style={[
            styles.modeButtonText,
            viewMode === 'all' && styles.activeModeButtonText,
          ]}>
          All Transactions
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          viewMode === 'cashier' && styles.activeModeButton,
        ]}
        onPress={() => setViewMode('cashier')}>
        <Text
          style={[
            styles.modeButtonText,
            viewMode === 'cashier' && styles.activeModeButtonText,
          ]}>
          Cashier Reports
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          viewMode === 'item' && styles.activeModeButton,
        ]}
        onPress={() => setViewMode('item')}>
        <Text
          style={[
            styles.modeButtonText,
            viewMode === 'item' && styles.activeModeButtonText,
          ]}>
          Item Reports
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render transaction table
  const renderTransactionTable = () => (
    <DataTable
      total={calculateSummary().totalAmount}
      headerTitles={[
        'Time',
        'Date',
        'Receipt #',
        'Cashier',
        'Amount',
        'Actions',
      ]}
      alignment="center">
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{marginTop: 20}}
        />
      ) : filteredTransactions.length > 0 ? (
        <FlatList
          keyExtractor={item => item.id}
          data={filteredTransactions}
          style={{marginTop: 10, borderRadius: 5}}
          renderItem={renderTransactionItem}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No transactions found</Text>
        </View>
      )}
    </DataTable>
  );

  // Render transaction item
  const renderTransactionItem = ({item}) => (
    <Grid>
      <Row style={{height: 30, backgroundColor: colors.white}}>
        <Col style={[styles.colStyle, {alignItems: 'center'}]}>
          <Text style={styles.textColor}>
            {moment(item.createdAt).format('hh:mm A')}
          </Text>
        </Col>
        <Col style={[styles.colStyle, {alignItems: 'center'}]}>
          <Text style={styles.textColor}>
            {moment(item.createdAt).format('DD MMM YYYY')}
          </Text>
        </Col>
        <Col style={[styles.colStyle, {alignItems: 'center'}]}>
          <Text style={styles.textColor}>{item.id.substring(0, 8)}</Text>
        </Col>
        <Col style={[styles.colStyle, {alignItems: 'center'}]}>
          <Text style={styles.textColor}>{item.staffName}</Text>
        </Col>
        <Col style={[styles.colStyle, {alignItems: 'center'}]}>
          <Text style={styles.textColor}>
            {formatMoney(item.total, {symbol: '₱', precision: 2})}
          </Text>
        </Col>
        <Col
          style={[
            styles.colStyle,
            {
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            },
          ]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => fetchTransactionDetails(item.id)}>
            <Ionicons name="eye-outline" size={16} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.primary}]}
            onPress={() => printReceipt(item)}>
            <Ionicons name="print-outline" size={16} color={colors.white} />
          </TouchableOpacity>
        </Col>
      </Row>
    </Grid>
  );

  // Render cashier report
  const renderCashierReport = () => {
    const cashierList = Object.values(cashierReports).sort(
      (a, b) => b.totalSales - a.totalSales,
    );

    return (
      <DataTable
        total={calculateSummary().totalAmount}
        headerTitles={[
          'Cashier Name',
          'Transactions',
          'Total Sales',
          'Average Sale',
        ]}
        alignment="center">
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{marginTop: 20}}
          />
        ) : cashierList.length > 0 ? (
          <FlatList
            keyExtractor={item => item.id}
            data={cashierList}
            style={{marginTop: 10, borderRadius: 5}}
            renderItem={({item}) => (
              <Grid>
                <Row style={{height: 30, backgroundColor: colors.white}}>
                  <Col
                    style={[styles.colStyle, {alignItems: 'center', flex: 2}]}>
                    <Text style={styles.textColor}>{item.name}</Text>
                  </Col>
                  <Col style={[styles.colStyle, {alignItems: 'center'}]}>
                    <Text style={styles.textColor}>{item.salesCount}</Text>
                  </Col>
                  <Col style={[styles.colStyle, {alignItems: 'center'}]}>
                    <Text style={styles.textColor}>
                      {formatMoney(item.totalSales, {
                        symbol: '₱',
                        precision: 2,
                      })}
                    </Text>
                  </Col>
                  <Col style={[styles.colStyle, {alignItems: 'center'}]}>
                    <Text style={styles.textColor}>
                      {formatMoney(
                        item.salesCount > 0
                          ? item.totalSales / item.salesCount
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
            <Text style={styles.noDataText}>No cashier data available</Text>
          </View>
        )}
      </DataTable>
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
        alignment="center">
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
                  <Col
                    style={[styles.colStyle, {alignItems: 'center', flex: 2}]}>
                    <Text style={styles.textColor}>{item.name}</Text>
                  </Col>
                  <Col style={[styles.colStyle, {alignItems: 'center'}]}>
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

  // Render transaction details modal
  const renderTransactionDetailsModal = () => (
    <Portal>
      <Modal
        visible={detailsModalVisible}
        onDismiss={() => {
          setDetailsModalVisible(false);
          setTransactionDetails(null);
        }}
        contentContainerStyle={styles.modalContainer}>
        {transactionDetails ? (
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity
                style={styles.printButton}
                onPress={() => printReceipt(transactionDetails)}>
                <Ionicons name="print-outline" size={20} color={colors.white} />
                <Text style={styles.printButtonText}>Print</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.receiptHeader}>
              <Text style={styles.storeName}>{store.name || 'Store Name'}</Text>
              <Text style={styles.receiptText}>
                Receipt #{transactionDetails.id.substring(0, 8)}
              </Text>
              <Text style={styles.receiptText}>
                {moment(transactionDetails.createdAt).format(
                  'DD MMM YYYY, hh:mm A',
                )}
              </Text>
              <Text style={styles.receiptText}>
                Cashier: {transactionDetails.staffName}
              </Text>
            </View>

            <View style={styles.itemsContainer}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemHeaderText, {flex: 3}]}>Item</Text>
                <Text
                  style={[
                    styles.itemHeaderText,
                    {flex: 1, textAlign: 'center'},
                  ]}>
                  Qty
                </Text>
                <Text
                  style={[
                    styles.itemHeaderText,
                    {flex: 1, textAlign: 'right'},
                  ]}>
                  Price
                </Text>
                <Text
                  style={[
                    styles.itemHeaderText,
                    {flex: 1, textAlign: 'right'},
                  ]}>
                  Total
                </Text>
              </View>

              {transactionDetails.items &&
              Array.isArray(transactionDetails.items) ? (
                transactionDetails.items.map((item, index) => {
                  // Use the updated model structure with productName field
                  const itemData =
                    typeof item === 'object'
                      ? item
                      : {
                          id: item,
                          name: item.productName,
                          quantity: 1,
                          price: 0,
                        };
                  return (
                    <View key={index} style={styles.itemRow}>
                      <Text style={[styles.itemText, {flex: 3}]}>
                        {itemData.name || itemData.productName}
                      </Text>
                      <Text
                        style={[
                          styles.itemText,
                          {flex: 1, textAlign: 'center'},
                        ]}>
                        {itemData.quantity || 1}
                      </Text>
                      <Text
                        style={[
                          styles.itemText,
                          {flex: 1, textAlign: 'right'},
                        ]}>
                        {formatMoney(itemData.price || 0, {
                          symbol: '₱',
                          precision: 2,
                        })}
                      </Text>
                      <Text
                        style={[
                          styles.itemText,
                          {flex: 1, textAlign: 'right'},
                        ]}>
                        {formatMoney(
                          (itemData.price || 0) * (itemData.quantity || 1),
                          {symbol: '₱', precision: 2},
                        )}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noItemsText}>No items found</Text>
              )}
            </View>

            <View style={styles.totalContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>
                  {formatMoney(
                    transactionDetails.subtotal ||
                      transactionDetails.total ||
                      0,
                    {symbol: '₱', precision: 2},
                  )}
                </Text>
              </View>

              {transactionDetails.discount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount:</Text>
                  <Text style={styles.totalValue}>
                    {formatMoney(transactionDetails.discount || 0, {
                      symbol: '₱',
                      precision: 2,
                    })}
                  </Text>
                </View>
              )}

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, {fontWeight: 'bold'}]}>
                  TOTAL:
                </Text>
                <Text style={[styles.totalValue, {fontWeight: 'bold'}]}>
                  {formatMoney(transactionDetails.total || 0, {
                    symbol: '₱',
                    precision: 2,
                  })}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Payment Method:</Text>
                <Text style={styles.totalValue}>
                  {transactionDetails.payment_status || 'Cash'}
                </Text>
              </View>

              {transactionDetails.status === 'Voided' && (
                <View style={styles.voidedContainer}>
                  <Text style={styles.voidedText}>
                    VOIDED: {transactionDetails.notes || 'No reason provided'}
                  </Text>
                </View>
              )}
            </View>

            <Button
              mode="outlined"
              onPress={() => {
                setDetailsModalVisible(false);
                setTransactionDetails(null);
              }}
              style={styles.closeButton}>
              Close
            </Button>
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Loading transaction details...
            </Text>
          </View>
        )}
      </Modal>
    </Portal>
  );

  // Main render
  return (
    <Provider>
      <View style={styles.container}>
        <Appbar
          title="Bills & Receipts"
          onBack={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity onPress={fetchTransactions}>
              <MaterialIcons name="refresh" size={24} color={colors.white} />
            </TouchableOpacity>
          }
        />

        {/* View Mode Selector */}
        {renderViewModeSelector()}

        {/* Filters and Date Range */}
        {renderFilterButtons()}
        {renderCustomDateRange()}

        {/* Summary Statistics */}
        {renderSummary()}

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {viewMode === 'all' && renderTransactionTable()}
          {viewMode === 'cashier' && renderCashierReport()}
          {viewMode === 'item' && renderItemReport()}
        </View>

        {/* Transaction Details Modal */}
        {renderTransactionDetailsModal()}

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
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
});

export default BillsAndReceipt;
