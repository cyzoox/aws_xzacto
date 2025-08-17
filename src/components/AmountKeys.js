import React, {useState, useEffect, useCallback} from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {FlatGrid} from 'react-native-super-grid';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import {Card, Overlay, Input, Button} from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrinterService from '../services/PrinterService';
import {getPrinterSettings} from '../utils/printerUtils';

import {TextInput} from 'react-native-paper';
import AlertwithChild from './AlertwithChild';
import colors from '../themes/colors';

import {generateClient} from 'aws-amplify/api';
const client = generateClient();
import {
  createDiscount,
  createSaleTransaction,
  createSale,
  updateProduct,
  deleteCartItem,
  updateCustomer,
  createCreditTransaction,
} from '../graphql/mutations';
import {listCartItems, getProduct} from '../graphql/queries';

const AmountKeys = ({
  cashReceive,
  Change,
  discount,
  discountName,
  setCreditVisible,
  navigation,
  staff,
  customer,
}) => {
  const [cart, setCart] = useState([]);
  const [items] = useState([
    {name: 1000},
    {name: 500},
    {name: 200},
    {name: 100},
    {name: 50},
    {name: 20},
    {name: 10},
    {name: 5},
    {name: 'Clear'},
    {name: 'Custom'},
  ]);

  const [custom, setCustom] = useState(false);
  const [custom_cash, setCustomeCash] = useState(0);
  const [isCreditPayment, setIsCreditPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoPrint, setAutoPrint] = useState(true);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [visible, setVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const [storeInfo, setStoreInfo] = useState({
    name: 'Store Name',
    address: 'Store Address',
    phone: 'Phone Number',
  });

  useEffect(() => {
    if (staff && staff.id && staff.store_id) {
      fetchCart();
    }
    checkPrinterSettings();
  }, [staff, fetchCart]);

  useEffect(() => {
    cashReceive(custom_cash);
    Change(calculateChange());
  }, [custom_cash, cart, discount, calculateChange, cashReceive, Change]);

  const checkPrinterSettings = async () => {
    try {
      // Use the new printerUtils function to get settings
      const printerSettings = await getPrinterSettings();

      // Set auto-print setting (default to true if not specified)
      setAutoPrint(printerSettings.autoPrint !== false);

      // Set store info if available
      if (printerSettings.storeInfo) {
        setStoreInfo(printerSettings.storeInfo);
      }

      // Check Bluetooth permissions and printer connectivity
      const permissionGranted =
        await PrinterService.requestBluetoothPermission();
      if (permissionGranted) {
        const deviceConnection =
          await PrinterService.isBluetoothDeviceConnected();
        setPrinterConnected(!!deviceConnection);
      }
    } catch (error) {
      console.error('Error checking printer settings:', error);
    }
  };

  const fetchCart = useCallback(async () => {
    try {
      if (!staff || !staff.id || !staff.store_id) {
        return;
      }
      const result = await client.graphql({
        query: listCartItems,
        variables: {
          filter: {
            storeId: {eq: staff.store_id},
            cashierId: {eq: staff.id},
          },
        },
      });
      const cartItems = result.data.listCartItems.items;
      setCart(cartItems);
    } catch (err) {
      console.log('Error fetching cart items:', err.message);
    }
  }, [staff]);

  const getCashReceived = cash => {
    if (cash === 'Clear') {
      setCustomeCash(0);
    } else if (cash === 'Custom') {
      setCustom(true);
    } else {
      setCustomeCash(prev => prev + cash);
    }
  };

  const onProceed = () => {
    checkout();
  };

  const calculateTotal = useCallback(() => {
    let total = cart.reduce(
      (acc, item) => acc + item.quantity * calculateItemUnitPrice(item),
      0,
    );
    if (discount > 0) {
      total *= 1 - discount / 100;
    }
    return total;
  }, [cart, discount]);

  const calculateItemUnitPrice = item => {
    let itemPrice = 0;
    if (item.variantData) {
      try {
        const variantInfo = JSON.parse(item.variantData);
        if (variantInfo && variantInfo.price) {
          itemPrice = parseFloat(variantInfo.price) || 0;
        } else {
          itemPrice = parseFloat(item.sprice) || 0;
        }
      } catch (e) {
        console.error('Error parsing variantData', e);
        itemPrice = parseFloat(item.sprice) || 0; // fallback to base price
      }
    } else {
      itemPrice = parseFloat(item.sprice) || 0;
    }

    if (item.addonData) {
      try {
        const addonInfo = JSON.parse(item.addonData);
        if (Array.isArray(addonInfo)) {
          addonInfo.forEach(addon => {
            if (addon.price) {
              itemPrice += parseFloat(addon.price) || 0;
            }
          });
        }
      } catch (e) {
        console.error('Error parsing addonData', e);
      }
    }
    return itemPrice;
  };

  const calculateChange = useCallback(() => {
    const total = calculateTotal();
    return custom_cash - total;
  }, [custom_cash, calculateTotal]);

  const onSaveCustomCash = () => {
    setCustom(false);
  };

  const checkout = async () => {
    if (cart.length === 0) {
      Alert.alert('Cart is empty', 'Please add items to the cart first.');
      return;
    }
    if (!staff || !staff.id) {
      Alert.alert('Error', 'No staff assigned for this transaction.');
      return;
    }

    // Enhanced credit limit check for credit payment method
    if (paymentMethod === 'credit') {
      // First, check if a customer is selected
      if (!customer) {
        Alert.alert(
          'Credit Error',
          'Please select a customer to use credit payment.',
        );
        return;
      }

      // Check if customer has credit enabled
      if (!customer.allowCredit) {
        Alert.alert(
          'Credit Error',
          'This customer does not have credit privileges enabled.',
        );
        return;
      }

      const totalAmount = calculateTotal();
      // Check if transaction amount exceeds customer's credit limit
      if (totalAmount > customer.creditLimit) {
        Alert.alert(
          'Credit Limit Exceeded',
          `This transaction (₱${totalAmount.toFixed(
            2,
          )}) exceeds the customer's credit limit (₱${customer.creditLimit.toFixed(
            2,
          )}). Please use another payment method or reduce the purchase amount.`,
        );
        return;
      }
    }

    setIsProcessing(true);
    const totalAmount = calculateTotal();
    const transactionItems = cart.map(
      item =>
        `${item.name} (x${item.quantity}) - ${formatMoney(
          calculateItemUnitPrice(item),
          {symbol: '₱', format: '%s %v'},
        )}`,
    );

    const transactionInput = {
      items: transactionItems,
      total: totalAmount,
      paymentMethod: paymentMethod,
      staffID: staff.id,
      storeID: staff.store_id,
      customerID: customer ? customer.id : null,
      change: calculateChange(),
      status: 'Completed',
      payment_status: paymentMethod,
      discount: discount || 0,
      ownerId: staff.ownerId || null,
      cash_received: custom_cash,
      notes: '',
      // createdAt: new Date().toISOString(),
    };

    console.log('Transaction input:', transactionInput);

    try {
      const transactionResult = await client.graphql({
        query: createSaleTransaction,
        variables: {input: transactionInput},
      });
      const transactionId = transactionResult.data.createSaleTransaction.id;

      const creditPromises = [];
      if (paymentMethod === 'credit' && customer) {
        // 1. Calculate new credit balance by subtracting total from available credit limit
        const newCreditLimit = parseFloat(
          (customer.creditLimit - totalAmount).toFixed(2),
        );
        // Ensure we never go below zero (safety check)
        const finalCreditLimit = Math.max(0, newCreditLimit);

        console.log(
          `Credit update for customer ${customer.name}: ` +
            `Original limit: ₱${customer.creditLimit.toFixed(2)}, ` +
            `Purchase: ₱${totalAmount.toFixed(2)}, ` +
            `New limit: ₱${finalCreditLimit.toFixed(2)}`,
        );

        // Calculate updated credit balance by adding transaction amount to existing balance
        const updatedCreditBalance = parseFloat(
          (customer.creditBalance + totalAmount).toFixed(2),
        );
        // Update customer's credit limit and balance in the database
        creditPromises.push(
          client.graphql({
            query: updateCustomer,
            variables: {
              input: {
                id: customer.id,
                creditLimit: finalCreditLimit,
                creditBalance: updatedCreditBalance,
              },
            },
          }),
        );

        // 2. Create a Credit Transaction record for auditing
        const creditTransactionInput = {
          customerID: customer.id,
          amount: totalAmount,
          type: 'PURCHASE',
          transactionId: transactionId,
          remarks: `Credit update for transaction ${transactionId}. Remaining credit: ₱${finalCreditLimit.toFixed(
            2,
          )}`,
          addedBy: staff.name,
        };

        creditPromises.push(
          client.graphql({
            query: createCreditTransaction,
            variables: {input: creditTransactionInput},
          }),
        );
      }

      const salePromises = cart.map(item => {
        const unitPrice = calculateItemUnitPrice(item);
        const saleInput = {
          transactionID: transactionId,
          productID: item.productId,
          productName: item.name,
          quantity: item.quantity,
          price: unitPrice,
          total: unitPrice * item.quantity,
          status: 'COMPLETED',
        };
        return client.graphql({
          query: createSale,
          variables: {input: saleInput},
        });
      });

      if (discount > 0) {
        const discountInput = {
          name: 'Cart Discount',
          percentage: parseFloat(discount),
          transactionId: transactionId,
        };
        salePromises.push(
          client.graphql({
            query: createDiscount,
            variables: {input: discountInput},
          }),
        );
      }

      // OPTIMIZATION 1: Batch product queries to reduce round trips
      // First, get all products in a single operation using a batched query if possible
      const productIds = cart.map(item => item.productId);
      const productQueries = [];

      // Split into smaller batches for better performance (10 items per batch)
      const batchSize = 10;
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id =>
          client.graphql({query: getProduct, variables: {id}}),
        );
        productQueries.push(Promise.all(batchPromises));
      }

      // Wait for all product batches to resolve
      const productBatchResults = await Promise.all(productQueries);

      // Flatten results and create a map for quick lookups
      const productMap = {};
      productBatchResults.flat().forEach(result => {
        const product = result.data.getProduct;
        productMap[product.id] = product;
      });

      // OPTIMIZATION 2: Use the product map to update inventory without additional queries
      const inventoryUpdatePromises = cart
        .map(item => {
          const product = productMap[item.productId];
          if (!product) {
            console.error(`Product ${item.productId} not found in product map`);
            return Promise.resolve(); // Skip this item
          }

          const currentStock = product.stock;
          const newStock = currentStock - item.quantity;

          return client.graphql({
            query: updateProduct,
            variables: {
              input: {
                id: item.productId,
                stock: newStock,
              },
            },
          });
        })
        .filter(Boolean); // Remove any undefined promises

      // OPTIMIZATION 3: Process cart deletions in parallel batches
      const deletePromises = [];
      const cartItemIds = cart.map(item => item.id);

      // Process cart deletions in batches of 10
      for (let i = 0; i < cartItemIds.length; i += batchSize) {
        const batch = cartItemIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id =>
          client.graphql({query: deleteCartItem, variables: {input: {id}}}),
        );
        deletePromises.push(...batchPromises);
      }

      // OPTIMIZATION 4: Use a loading indicator to improve perceived performance
      setIsProcessing(true);

      // Execute all promises in parallel and await them
      await Promise.all([
        ...salePromises,
        ...inventoryUpdatePromises,
        ...deletePromises,
        ...creditPromises,
      ]);

      if (autoPrint && printerConnected) {
        const printData = {
          transaction: transactionResult.data.createSaleTransaction,
          cartItems: cart,
          payments: {cash: custom_cash, credit: 0},
          change: calculateChange(),
        };
        PrinterService.printReceipt(
          printData.transaction,
          printData.cartItems,
          storeInfo,
          printData.payments,
          printData.change,
        ).catch(printError => {
          console.error('Error printing receipt:', printError);
        });
      }

      setVisible(false);
      setIsProcessing(false);

      Alert.alert('Success', 'Transaction completed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'Home',
                  params: {
                    staffData: staff,
                    refreshCart: true,
                    timestamp: Date.now(),
                  },
                },
              ],
            });
          },
        },
      ]);
    } catch (err) {
      console.error('Error during checkout:', err);
      Alert.alert(
        'Error during checkout',
        err.message || 'An unknown error occurred.',
      );
      setIsProcessing(false);
      setVisible(false);
    }
  };

  return (
    <View style={{flex: 1}}>
      <AlertwithChild
        visible={visible}
        onCancel={() => setVisible(false)}
        onProceed={onProceed}
        title="Confirm Payment"
        confirmTitle="CHECKOUT"
        isProcessing={isProcessing}
        overlayStyle={styles.modalContainer}>
        <View style={styles.summaryContainer}>
          {isCreditPayment ? (
            <View style={styles.creditConfirmationContainer}>
              <Text style={styles.creditInfoText}>
                <Text style={{fontWeight: 'bold'}}>{customer?.name}</Text> will
                pay with credit.
              </Text>
              <View style={styles.creditDetailsRow}>
                <Text style={styles.creditLabel}>Available Credit:</Text>
                <Text style={styles.creditValue}>
                  ₱{formatMoney(customer?.creditLimit)}
                </Text>
              </View>
              <View style={styles.creditDetailsRow}>
                <Text style={styles.creditLabel}>Transaction Total:</Text>
                <Text style={[styles.creditValue, {color: colors.accent}]}>
                  - ₱{formatMoney(calculateTotal())}
                </Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.creditDetailsRow}>
                <Text style={styles.creditLabel}>Remaining Credit:</Text>
                <Text style={styles.creditValue}>
                  ₱{formatMoney(customer?.creditLimit - calculateTotal())}
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cash Received</Text>
                <Text style={styles.summaryValue}>
                  {formatMoney(custom_cash, {symbol: '₱', precision: 2})}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payable</Text>
                <Text style={styles.summaryValue}>
                  {formatMoney(calculateTotal(), {symbol: '₱', precision: 2})}
                </Text>
              </View>
              <View style={styles.changeContainer}>
                <Text style={styles.changeLabel}>Change</Text>
                <Text style={styles.changeValue}>
                  {formatMoney(calculateChange(), {symbol: '₱', precision: 2})}
                </Text>
              </View>
            </View>
          )}
          {printerConnected && (
            <View style={styles.printContainer}>
              <Text style={styles.printLabel}>
                Receipt will be printed automatically
              </Text>
            </View>
          )}
        </View>
      </AlertwithChild>

      <AlertwithChild
        visible={custom}
        onCancel={() => setCustom(false)}
        onProceed={onSaveCustomCash}
        title="Enter Custom Amount"
        confirmTitle="Save"
        overlayStyle={styles.modalContainer}>
        <View style={styles.customAmountContainer}>
          <Text style={styles.labelText}>Amount</Text>
          <TextInput
            mode="outlined"
            theme={{
              colors: {primary: colors.accent, underlineColor: 'transparent'},
            }}
            value={custom_cash.toString()}
            keyboardType="numeric"
            onChangeText={text => setCustomeCash(parseFloat(text) || 0)}
            style={styles.customInput}
            placeholder="Enter amount"
            autoFocus
          />
        </View>
      </AlertwithChild>

      <View style={styles.displayContainer}>
        <View style={styles.displayRow}>
          <Text style={styles.displayLabel}>CASH RECEIVED</Text>
          <Text style={styles.displayValue}>
            {formatMoney(custom_cash, {symbol: '₱', precision: 2})}
          </Text>
        </View>
        <View style={styles.displayRow}>
          <Text style={styles.displayLabel}>TOTAL</Text>
          <Text style={styles.displayValue}>
            {formatMoney(calculateTotal(), {symbol: '₱', precision: 2})}
          </Text>
        </View>
        <View style={styles.displayRow}>
          <Text style={[styles.displayLabel, {color: colors.accent}]}>
            CHANGE
          </Text>
          <Text style={[styles.displayValue, styles.changeText]}>
            {formatMoney(calculateChange() < 0 ? 0 : calculateChange(), {
              symbol: '₱',
              precision: 2,
            })}
          </Text>
        </View>
      </View>

      <FlatGrid
        itemDimension={95}
        showsVerticalScrollIndicator={false}
        data={items}
        spacing={8}
        staticDimension={320}
        maxDimension={400}
        fixed
        style={styles.gridContainer}
        renderItem={({item}) => {
          const isNumber = typeof item.name === 'number';
          const isCustom = item.name === 'Custom';

          if (isCustom) {
            return (
              <TouchableOpacity
                style={styles.customButton}
                onPress={() => getCashReceived(item.name)}>
                <Text style={styles.customButtonText}>{item.name}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              style={[
                styles.itemContainer,
                {backgroundColor: item.name === 'Clear' ? '#ffebee' : '#fff'},
              ]}
              onPress={() => getCashReceived(item.name)}>
              <Text
                style={[
                  styles.itemName,
                  {
                    color: item.name === 'Clear' ? colors.red : colors.black,
                    fontSize: isNumber ? 24 : 18,
                  },
                ]}>
                {typeof item.name === 'number' ? `₱${item.name}` : item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              opacity:
                custom_cash < calculateTotal() || cart.length === 0 ? 0.5 : 1,
              marginRight: 5,
            },
          ]}
          onPress={() => {
            setIsCreditPayment(false);
            setPaymentMethod('cash');
            setVisible(true);
          }}
          disabled={custom_cash < calculateTotal() || cart.length === 0}>
          <Text style={styles.actionButtonText}>Pay using Cash</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              opacity:
                !customer ||
                calculateTotal() > customer.creditLimit ||
                cart.length === 0
                  ? 0.5
                  : 1,
              backgroundColor: colors.accent,
              marginLeft: 5,
            },
          ]}
          onPress={() => {
            setIsCreditPayment(true);
            setPaymentMethod('credit');
            setVisible(true);
          }}
          disabled={
            !customer ||
            calculateTotal() > customer.creditLimit ||
            cart.length === 0
          }>
          <Text style={styles.actionButtonText}>Pay with Credit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 10,
    padding: 20,
  },
  summaryContainer: {
    padding: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  changeLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
  },
  changeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
  },
  creditConfirmationContainer: {
    padding: 10,
  },
  creditInfoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  creditDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  creditLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  creditValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  printContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  printLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  customAmountContainer: {
    padding: 10,
  },
  labelText: {
    fontSize: 16,
    marginBottom: 5,
    color: colors.textSecondary,
  },
  customInput: {
    backgroundColor: 'white',
  },
  displayContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 1,
  },
  displayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  displayLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  displayValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  changeText: {
    color: colors.accent,
    fontSize: 24,
  },
  gridContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  itemContainer: {
    justifyContent: 'center',
    borderRadius: 8,
    padding: 10,
    height: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  itemName: {
    fontWeight: '600',
    textAlign: 'center',
  },
  customButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 10,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  customButtonText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AmountKeys;
