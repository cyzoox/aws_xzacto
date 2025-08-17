import React, {useEffect, useState, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {Picker} from '@react-native-picker/picker';
import colors from '../../themes/colors';
import moment from 'moment';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import {Card, Title, Paragraph, Button} from 'react-native-paper';
import {TextInput, Modal, Portal, Provider} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const {width, height} = Dimensions.get('window');

import {listSaleTransactions} from '../../graphql/queries';
import {updateSaleTransaction} from '../../graphql/mutations';
import {generateClient} from 'aws-amplify/api';
import Appbar from '../../components/Appbar';
const client = generateClient();

const TransactionScreen = ({navigation, route}) => {
  const {staffData} = route.params;

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

  useFocusEffect(
    React.useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions]),
  );

  useEffect(() => {
    filterTransactionsByDate();
  }, [
    filterPeriod,
    startDate,
    endDate,
    transactions,
    selected,
    filterTransactionsByDate,
  ]);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = generateClient();
      let resultList = [];

      if (staffData?.store_id) {
        const result = await client.graphql({
          query: listSaleTransactions,
          variables: {
            filter: {
              storeID: {eq: staffData.store_id},
            },
          },
        });
        resultList = result.data.listSaleTransactions.items;
      } else {
        const result = await client.graphql({
          query: listSaleTransactions,
        });
        resultList = result.data.listSaleTransactions.items;
      }

      // Filter out any null or malformed items to ensure data consistency
      const validTransactions = resultList.filter(
        item =>
          item &&
          item.id &&
          item.createdAt &&
          item.status &&
          typeof item.total !== 'undefined' &&
          item.total !== null,
      );

      const sortedTransactions = validTransactions.sort(
        (a, b) => moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf(),
      );

      setTransactions(sortedTransactions);

      const completed = sortedTransactions.filter(
        t => t.status === 'Completed',
      );
      const voided = sortedTransactions.filter(t => t.status === 'Voided');

      setCompletedTransactions(completed);
      setVoidedTransactions(voided);

      // Manually trigger filtering to ensure UI updates on initial load
      filterTransactionsByDate(completed, voided);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [staffData.store_id, filterTransactionsByDate]);

  const filterTransactionsByDate = useCallback(
    (completed = completedTransactions, voided = voidedTransactions) => {
      const transactionsToFilter = selected === 0 ? completed : voided;

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
        case 'this_week':
          start = moment().startOf('week');
          end = moment().endOf('week');
          break;
        case 'this_month':
          start = moment().startOf('month');
          end = moment().endOf('month');
          break;
        case 'last_6_months':
          start = moment().subtract(6, 'months').startOf('day');
          end = moment().endOf('day');
          break;
        case 'custom':
          start = moment(startDate);
          end = moment(endDate);
          break;
        default:
          start = moment().startOf('day');
          end = moment().endOf('day');
      }

      const filtered = transactionsToFilter.filter(transaction => {
        if (!transaction || !transaction.createdAt) {
          return false;
        }
        const transactionDate = moment(transaction.createdAt);
        return transactionDate.isBetween(start, end, null, '[]');
      });

      setFilteredTransactions(filtered);
    },
    [
      completedTransactions,
      voidedTransactions,
      endDate,
      filterPeriod,
      selected,
      startDate,
    ],
  );

  const onDateChange = (event, selectedDate) => {
    setDatePickerVisible(false);
    if (event.type === 'set' && selectedDate) {
      if (dateType === 'start') {
        setStartDate(moment(selectedDate).startOf('day').toDate());
      } else {
        setEndDate(moment(selectedDate).endOf('day').toDate());
      }
    }
  };

  const showDatePicker = type => {
    setDateType(type);
    setDatePickerVisible(true);
  };

  const openVoidModal = transaction => {
    setSelectedTransaction(transaction);
    setVoidModalVisible(true);
  };

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
      const client = generateClient();

      await client.graphql({
        query: updateSaleTransaction,
        variables: {
          input: {
            id: selectedTransaction.id,
            status: 'Voided',
            notes: `Voided: ${voidReason}`,
            ownerId: selectedTransaction.ownerId || staffData.ownerId || null,
          },
        },
      });

      fetchTransactions();

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

  const calculateTotals = () => {
    let totalAmount = 0;
    let totalTransactions = filteredTransactions.length;

    filteredTransactions.forEach(transaction => {
      totalAmount += transaction.total || 0;
    });

    return {
      totalAmount,
      totalTransactions,
    };
  };

  const renderCompletedItem = ({item}) => {
    if (!item) {
      return null;
    }
    const createdAt = moment(item.createdAt);
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardRow}>
            <Title style={styles.cardTitle}>#{item.id.substring(0, 8)}</Title>
            <Title style={styles.cardTotal}>
              {formatMoney(item.total, {symbol: '₱', precision: 2})}
            </Title>
          </View>
          <View style={styles.cardRow}>
            <Paragraph style={styles.cardSubtitle}>
              {createdAt.format('DD MMM YYYY, hh:mm A')}
            </Paragraph>
            <Paragraph style={styles.cardSubtitle}>
              {item.payment_status || 'Cash'}
            </Paragraph>
          </View>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="contained"
            onPress={() => openVoidModal(item)}
            style={styles.voidButton}
            labelStyle={styles.voidButtonText}>
            Void
          </Button>
          <Button
            mode="outlined"
            onPress={() =>
              navigation.navigate('TransactionsDetails', {
                transactions: item,
                staffData: staffData,
              })
            }>
            View
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  const renderVoidedItem = ({item}) => {
    if (!item) {
      return null;
    }
    const createdAt = moment(item.createdAt);
    return (
      <Card style={[styles.card, styles.voidedCard]}>
        <Card.Content>
          <View style={styles.cardRow}>
            <Title style={styles.cardTitle}>#{item.id.substring(0, 8)}</Title>
            <Title style={styles.cardTotal}>
              {formatMoney(item.total, {symbol: '₱', precision: 2})}
            </Title>
          </View>
          <View style={styles.cardRow}>
            <Paragraph style={styles.cardSubtitle}>
              {createdAt.format('DD MMM YYYY, hh:mm A')}
            </Paragraph>
            <Paragraph style={styles.cardSubtitle}>
              {item.payment_status || 'Cash'}
            </Paragraph>
          </View>
          <Paragraph style={styles.voidedReason}>
            Reason: {item.notes || 'N/A'}
          </Paragraph>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="outlined"
            onPress={() =>
              navigation.navigate('TransactionsDetails', {
                transactions: item,
                staffData: staffData,
              })
            }>
            View
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  const renderTransactionSummary = () => {
    const {totalAmount, totalTransactions} = calculateTotals();

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>{totalTransactions}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Sales</Text>
          <Text style={styles.summaryValue}>
            {formatMoney(totalAmount, {symbol: '₱', precision: 2})}
          </Text>
        </View>
      </View>
    );
  };

  const renderCustomDateRange = () => {
    return (
      <View style={styles.dateRangeContainer}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => showDatePicker('start')}>
          <Text style={styles.dateButtonText}>
            From: {moment(startDate).format('DD MMM YYYY')}
          </Text>
        </TouchableOpacity>
        <Text style={{marginHorizontal: 10}}>-</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => showDatePicker('end')}>
          <Text style={styles.dateButtonText}>
            To: {moment(endDate).format('DD MMM YYYY')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Provider>
      <View style={styles.mainContainer}>
        <Appbar title="Transactions" onBack={() => navigation.goBack()} />

        <View style={{paddingHorizontal: 16, paddingTop: 20, flex: 1}}>
          <SegmentedControl
            values={['Completed', 'Voided']}
            selectedIndex={selected}
            onChange={event =>
              setSelected(event.nativeEvent.selectedSegmentIndex)
            }
            style={{marginBottom: 16}}
          />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={filterPeriod}
              onValueChange={itemValue => setFilterPeriod(itemValue)}
              style={styles.picker}
              dropdownIconColor={colors.primary}>
              <Picker.Item label="Today" value="today" />
              <Picker.Item label="Yesterday" value="yesterday" />
              <Picker.Item label="This Week" value="this_week" />
              <Picker.Item label="This Month" value="this_month" />
              <Picker.Item label="Last 6 Months" value="last_6_months" />
              <Picker.Item label="Custom Range" value="custom" />
            </Picker>
          </View>

          {filterPeriod === 'custom' && renderCustomDateRange()}

          {renderTransactionSummary()}

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{marginTop: 20, flex: 1}}
            />
          ) : (
            <FlatList
              data={filteredTransactions}
              renderItem={
                selected === 0 ? renderCompletedItem : renderVoidedItem
              }
              keyExtractor={item => item.id}
              contentContainerStyle={{paddingBottom: 100}}
              ListEmptyComponent={() => (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No transactions found</Text>
                </View>
              )}
            />
          )}
        </View>

        {datePickerVisible && (
          <DateTimePicker
            value={dateType === 'start' ? startDate : endDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        <Portal>
          <Modal
            visible={voidModalVisible}
            onDismiss={() => {
              setVoidModalVisible(false);
              setVoidReason('');
              setPinCode('');
              setVoidError('');
            }}
            contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>Void Transaction</Text>

            <TextInput
              label="Reason"
              value={voidReason}
              onChangeText={setVoidReason}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Staff PIN"
              value={pinCode}
              onChangeText={setPinCode}
              mode="outlined"
              secureTextEntry
              keyboardType="numeric"
              style={styles.input}
            />

            {voidError ? (
              <Text style={styles.errorText}>{voidError}</Text>
            ) : null}

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={voidTransaction}
                style={styles.button}
                loading={isLoading}
                disabled={isLoading}>
                Confirm
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setVoidModalVisible(false);
                  setVoidReason('');
                  setPinCode('');
                  setVoidError('');
                }}
                style={styles.button}
                disabled={isLoading}>
                Cancel
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginVertical: 8,
    elevation: 3,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  voidedCard: {
    backgroundColor: '#fff1f0',
    borderColor: colors.red,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  voidButton: {
    backgroundColor: colors.error,
    marginRight: 8,
  },
  voidButtonText: {
    color: colors.white,
  },
  voidedReason: {
    marginTop: 10,
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.error,
  },
  pickerContainer: {
    marginBottom: 10,
    borderColor: colors.grey,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dateButton: {
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    flex: 1,
  },
  dateButtonText: {
    color: colors.charcoalGrey,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
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
  noDataContainer: {
    flex: 1,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  errorText: {
    color: colors.red,
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default TransactionScreen;
