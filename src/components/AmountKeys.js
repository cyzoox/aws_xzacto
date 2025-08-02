import React, {useState, useEffect} from 'react';
import {Text, StyleSheet, View, TouchableOpacity, Alert} from 'react-native';
import {FlatGrid} from 'react-native-super-grid';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import {Card, Overlay, Input, Button} from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrinterService from '../services/PrinterService';

import {TextInput} from 'react-native-paper';
import AlertwithChild from './AlertwithChild';
import colors from '../themes/colors';
import Spacer from './Spacer';

import {generateClient} from 'aws-amplify/api';
const client = generateClient();
import {
  createDiscount,
  createSaleTransaction,
  createSale,
  updateProduct,
  deleteCartItem,
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
}) => {
  // Add state for cart to fix cart.length check during checkout
  const [cart, setCart] = useState([]);

  const [items, setItems] = useState([
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

  const [received, setCash] = useState(0);
  const [custom, setCustom] = useState(false);
  const [custom_cash, setCustomeCash] = useState(0);
  const [visible, setVisible] = useState(false);
  // const [cart, setCart] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoPrint, setAutoPrint] = useState(true);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [storeInfo, setStoreInfo] = useState({
    name: 'Store Name',
    address: 'Store Address',
    phone: 'Phone Number',
  });

  useEffect(() => {
    // Fetch cart items only when staff data is available
    if (staff && staff.id && staff.store_id) {
      console.log(
        `Initializing checkout for ${staff.name} at store ${staff.store_id}`,
      );
      fetchCart();
    } else {
      console.log('Missing staff data for cart fetch');
    }

    // Always check printer settings
    checkPrinterSettings();
  }, [staff]);

  // Check if printer is connected and load printer settings
  const checkPrinterSettings = async () => {
    try {
      // Load printer settings from AsyncStorage
      const printerSettingsStr = await AsyncStorage.getItem('printerSettings');
      if (printerSettingsStr) {
        const printerSettings = JSON.parse(printerSettingsStr);
        setAutoPrint(printerSettings.autoPrint !== false);

        if (printerSettings.storeInfo) {
          setStoreInfo(printerSettings.storeInfo);
        }
      }

      // Check if printer is connected
      const permissionGranted =
        await PrinterService.requestBluetoothPermission();
      if (permissionGranted) {
        const deviceAddress = await PrinterService.isBluetoothDeviceConnected();
        setPrinterConnected(!!deviceAddress);
      }
    } catch (error) {
      console.error('Error checking printer settings:', error);
    }
  };

  const fetchCart = async () => {
    try {
      if (!staff || !staff.id || !staff.store_id) {
        console.log('Missing staff data');
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
      console.log('Fetched cart items:', cartItems);
      setCart(cartItems);
    } catch (err) {
      console.log('Error fetching cart items:', err.message);
    }
  };

  const getCashReceived = cash => {
    if (cash === 'Clear') {
      setCustomeCash(0);
    } else if (cash === 'Custom') {
      setCustom(true);
    } else {
      setCustomeCash(custom_cash + cash);
      // Update change calculation whenever cash amount changes
      Change(calculateChange());
    }

    // Calculate change after cash amount is set
    Change(calculateChange());
  };

  const onProceed = () => {
    checkout();
  };

  const calculateTotal = () => {
    let total = 0;
    cart.forEach(item => {
      // Calculate the full unit price including variants and addons
      let itemUnitPrice = calculateItemUnitPrice(item);

      // Multiply by quantity to get the total price for this item
      total += item.quantity * itemUnitPrice;
    });

    // Apply discount if any
    if (discount > 0) {
      total = total * (1 - discount / 100);
    }

    return total;
  };

  // Helper function to calculate the unit price for an item including variants and addons
  const calculateItemUnitPrice = item => {
    let itemPrice = 0;
    let hasVariant = false;

    // Check if variant exists and use variant price instead of base price
    if (item.variantData) {
      try {
        const variantInfo = JSON.parse(item.variantData);
        if (variantInfo && variantInfo.price) {
          // If variant exists, use ONLY the variant price (not base + variant)
          itemPrice = parseFloat(variantInfo.price);
          hasVariant = true;
        }
      } catch (e) {
        console.error('Error parsing variantData', e);
      }
    }

    // If no variant, use the base price
    if (!hasVariant) {
      itemPrice = item.sprice;
    }

    // Add addon prices if present
    if (item.addonData) {
      try {
        const addonInfo = JSON.parse(item.addonData);
        if (Array.isArray(addonInfo)) {
          addonInfo.forEach(addon => {
            if (addon.price) {
              itemPrice += parseFloat(addon.price);
            }
          });
        } else if (addonInfo && addonInfo.price) {
          itemPrice += parseFloat(addonInfo.price);
        }
      } catch (e) {
        console.error('Error parsing addonData', e);
      }
    }

    return itemPrice;
  };

  const calculateTotalBeforeDiscount = () => {
    let total = 0;
    cart.forEach(item => {
      // Use the same helper function to calculate the unit price
      let itemUnitPrice = calculateItemUnitPrice(item);

      // Multiply by quantity to get the total price for this item
      total += item.quantity * itemUnitPrice;
    });
    return total;
  };

  const calculateTotalItems = () => {
    let total = 0;
    cart.forEach(item => {
      total += item.quantity;
    });
    return total;
  };

  const calculateTotalProfit = () => {
    let total = 0;
    cart.forEach(item => {
      total += (item.sprice - item.oprice) * item.quantity;
    });
    return total;
  };

  const calculateChange = () => {
    cashReceive(custom_cash);
    return custom_cash - calculateTotal();
  };

  const onSaveCustomCash = () => {
    getCashReceived('Custom');
    setCustom(false);
    // Ensure change is calculated after custom cash is set
    Change(calculateChange());
  };

  const checkout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add items before checkout.');
      return;
    }

    if (custom_cash < calculateTotal()) {
      alert(
        'Cash received is less than the total amount. Please enter a valid amount.',
      );
      return;
    }

    if (isProcessing) {
      return; // Prevent multiple checkout attempts
    }

    setIsProcessing(true);
    setVisible(true);

    try {
      console.log('Starting checkout process...');

      // Map cart items to item IDs for transaction
      const itemIds = cart.map(item => item.productId);
      console.log('Staff data:', staff);

      // Extract ownerId from store if available
      let ownerId = null;
      // Try to get ownerId from staff directly first
      if (staff.ownerId) {
        ownerId = staff.ownerId;
      }
      // If not available, try to get it from the stores property if it exists
      else if (
        staff.stores &&
        staff.stores.items &&
        staff.stores.items.length > 0
      ) {
        const storeItem = staff.stores.items[0];
        if (storeItem.store && storeItem.store.ownerId) {
          ownerId = storeItem.store.ownerId;
        }
      }

      console.log('Extracted ownerId:', ownerId);

      // 1. Create SaleTransaction - only include fields defined in the schema
      const transactionInput = {
        items: itemIds,
        total: calculateTotal(),
        staffID: staff.id,
        staffName: staff.name,
        storeID: staff.store_id,
        ownerId: ownerId, // Use the extracted ownerId
        status: 'Completed',
        payment_status: 'Paid',
        cash_received: custom_cash,
        change: calculateChange(),
        discount: discount > 0 ? discount : null,
        notes:
          discount > 0
            ? `Discount applied: ${discount}% - ${
                discountName || 'Regular Discount'
              }`
            : '',
      };

      // Add optional customerID if available
      if (staff.customerId) {
        transactionInput.customerID = staff.customerId;
      }

      console.log('Transaction input:', transactionInput);

      const saleTransactionResponse = await client.graphql({
        query: createSaleTransaction,
        variables: {
          input: transactionInput,
        },
      });

      const transactionId =
        saleTransactionResponse.data.createSaleTransaction.id;
      console.log('SaleTransaction created:', transactionId);

      // 2. Process each cart item - First validate all stocks in parallel
      const deletePromises = [];
      const productPromises = [];

      // Step 1: First fetch all products in parallel to validate stock
      for (const item of cart) {
        productPromises.push(
          client
            .graphql({
              query: getProduct,
              variables: {id: item.productId},
            })
            .then(response => ({
              item,
              product: response.data.getProduct,
            })),
        );
      }

      // Wait for all product validations at once
      const productResults = await Promise.all(productPromises);

      // Step 2: Validate all stocks before proceeding
      for (const result of productResults) {
        const {item, product} = result;
        if (!product) {
          console.error(`Product not found: ${item.productId}`);
          throw new Error(`Product not found: ${item.name}`);
        }

        const currentStock = product.stock || 0;
        if (currentStock < item.quantity) {
          setIsProcessing(false); // Reset processing state
          setVisible(false); // Hide loading modal
          alert(
            `Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`,
          );
          throw new Error(`Insufficient stock for product: ${item.name}`);
        }
      }

      // Successfully validated all stock - proceed with processing

      // Prepare parallel operations for sales creation and stock updates
      const salesPromises = [];
      const stockUpdatePromises = [];

      // Map of productId to item for stock updates later
      const productMap = {};
      productResults.forEach(result => {
        productMap[result.item.productId] = {
          product: result.product,
          item: result.item,
        };
      });

      // Process each cart item in parallel batches
      for (const item of cart) {
        try {
          // Calculate item price including variants and addons
          let itemPrice = item.sprice;
          let itemVariantData = null;
          let itemAddonData = null;

          // Process variant data if present
          if (item.variantData) {
            try {
              itemVariantData = item.variantData; // Pass through as is (already AWSJSON)
              const variantInfo = JSON.parse(item.variantData);
              if (variantInfo && variantInfo.price) {
                itemPrice += parseFloat(variantInfo.price);
              }
            } catch (e) {
              console.error('Error parsing variantData', e);
            }
          }

          // Process addon data if present
          if (item.addonData) {
            try {
              itemAddonData = item.addonData; // Pass through as is (already AWSJSON)
              const addonInfo = JSON.parse(item.addonData);
              if (Array.isArray(addonInfo)) {
                addonInfo.forEach(addon => {
                  if (addon.price) {
                    itemPrice += parseFloat(addon.price);
                  }
                });
              } else if (addonInfo && addonInfo.price) {
                itemPrice += parseFloat(addonInfo.price);
              }
            } catch (e) {
              console.error('Error parsing addonData', e);
            }
          }

          // Queue Sale creation (will run in parallel)
          salesPromises.push(
            client.graphql({
              query: createSale,
              variables: {
                input: {
                  productID: item.productId,
                  productName: item.name,
                  transactionID: transactionId,
                  price: itemPrice, // Base price with variants and addons
                  quantity: item.quantity,
                  discount:
                    discount > 0
                      ? (discount / 100) * itemPrice * item.quantity
                      : null,
                  variantData: itemVariantData,
                  addonData: itemAddonData,
                  // Include ownerId from transaction
                  ownerId: ownerId,
                },
              },
            }),
          );

          // Prepare stock update (will run after sales creation)
          const productInfo = productMap[item.productId];
          const updatedStock = productInfo.product.stock - item.quantity;

          // Queue product stock update
          stockUpdatePromises.push(
            client
              .graphql({
                query: updateProduct,
                variables: {
                  input: {
                    id: item.productId,
                    stock: updatedStock,
                  },
                },
              })
              .then(() => console.log('Stock updated for', item.name)),
          );

          // Queue cart item deletion
          deletePromises.push(
            client.graphql({
              query: deleteCartItem,
              variables: {
                input: {
                  id: item.id,
                },
              },
            }),
          );
        } catch (e) {
          console.error('Error preparing item operations:', e);
        }
      }

      // Execute all sales creations in parallel
      console.log('Creating sales records...');
      await Promise.all(salesPromises);

      // Execute all stock updates in parallel
      console.log('Updating product stocks...');
      await Promise.all(stockUpdatePromises);

      // Set local cart to empty first for perceived speed and better UX
      setCart([]);
      setCustomeCash(0);

      // Process cart deletions in background without waiting
      console.log('Deleting cart items...');
      Promise.allSettled(deletePromises)
        .then(results => {
          const successful = results.filter(
            r => r.status === 'fulfilled',
          ).length;
          console.log(
            `Completed ${successful}/${deletePromises.length} cart item deletions`,
          );
        })
        .catch(error => {
          console.error('Error in batch cart deletion:', error);
        });

      // Don't wait for cart deletions to complete - we'll refresh on navigation
      console.log(
        `Queued ${deletePromises.length} cart item deletions in background`,
      );

      // Start discount creation in parallel with a separate promise
      let discountPromise = Promise.resolve();
      if (discount > 0) {
        console.log('Creating discount record...');
        discountPromise = client
          .graphql({
            query: createDiscount,
            variables: {
              input: {
                total: (discount / 100) * calculateTotalBeforeDiscount(),
                name: discountName || 'Regular Discount',
                transactionId: transactionId,
                ownerId: ownerId, // Use ownerId instead of storeId to match schema
              },
            },
          })
          .then(response => {
            console.log('Discount created:', response.data.createDiscount.id);
          })
          .catch(error => {
            console.error('Error creating discount:', error);
          });
      }

      // Start printer process in parallel - capture the cart data now
      // so we don't need to wait for printing later
      let printData = null;
      if (autoPrint && printerConnected) {
        // Prepare print data upfront, which is cheaper than waiting
        console.log('Preparing receipt data...');

        // Format cart items for printer
        const cartItemsForPrinter = cart.map(item => {
          // Parse variant and addon data
          let parsedVariantData = null;
          let parsedAddonData = null;

          if (item.variantData) {
            try {
              parsedVariantData = JSON.parse(item.variantData);
            } catch (e) {
              console.error('Error parsing variant data', e);
            }
          }

          if (item.addonData) {
            try {
              parsedAddonData = JSON.parse(item.addonData);
            } catch (e) {
              console.error('Error parsing addon data', e);
            }
          }

          return {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            sprice: item.sprice,
            parsedVariantData,
            parsedAddonData,
          };
        });

        printData = {
          transaction: {
            id: transactionId,
            date: new Date(),
            cashierName: staff.name,
            discount: discount,
            totalAmount: calculateTotal(),
          },
          cartItems: cartItemsForPrinter,
          payments: [{method: 'Cash', amount: custom_cash}],
          change: calculateChange(),
        };
      }

      // Success - close modal immediately for better UX
      setVisible(false);
      setIsProcessing(false);

      // Wait for discount creation to complete (but don't delay navigation)
      await discountPromise;

      // Print receipt if data was prepared
      if (printData) {
        // Do printing in the background after showing success to the user
        setTimeout(() => {
          console.log('Printing receipt in background...');
          PrinterService.printReceipt(
            printData.transaction,
            printData.cartItems,
            storeInfo,
            printData.payments,
            printData.change,
          ).catch(printError => {
            console.error('Error printing receipt:', printError);
          });
        }, 100);
      }

      // Show success message and properly reset navigation stack
      Alert.alert('Success', 'Transaction completed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Use reset instead of navigate to completely clear the stack
            // This prevents going back to stale checkout screens
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
      alert('Error during checkout: ' + err.message);
      setVisible(false);
      setIsProcessing(false);
    }
  };

  return (
    <View>
      <AlertwithChild
        visible={visible}
        onCancel={() => setVisible(false)}
        onProceed={() => onProceed()}
        title="Confirm Payment"
        confirmTitle="CHECKOUT"
        overlayStyle={styles.modalContainer}>
        <View style={styles.summaryContainer}>
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
        onProceed={() => onSaveCustomCash()}
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
          <Text style={styles.displayLabel}>CHANGE</Text>
          <Text style={[styles.displayValue, styles.changeText]}>
            {formatMoney(custom_cash <= 0 ? 0 : calculateChange(), {
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
        renderItem={({item, index}) => {
          const isNumber = typeof item.name === 'number';
          const isCustom = item.name === 'Custom';
          const isLastRow = index >= items.length;

          if (isCustom) {
            return (
              <TouchableOpacity
                style={[
                  styles.itemContainer,
                  {
                    backgroundColor: '#e3f2fd',
                    width: '100%',
                    height: 70,
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
                onPress={() => getCashReceived(item.name)}>
                <Text
                  style={[styles.itemName, {color: '#1976d2', fontSize: 18}]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              style={[
                styles.itemContainer,
                {
                  backgroundColor: item.name === 'Clear' ? '#ffebee' : '#fff',
                  width: '100%',
                  height: 70,
                },
              ]}
              onPress={() => getCashReceived(item.name)}>
              <Text
                style={[
                  styles.itemName,
                  {
                    color: item.name === 'Clear' ? '#c62828' : colors.black,
                    fontSize: isNumber ? 24 : 18,
                  },
                ]}>
                {typeof item.name === 'number' ? '₱' + item.name : item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Spacer>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            marginBottom: 20,
          }}>
          {custom_cash < calculateTotal() ? (
            <Button
              titleStyle={{color: colors.black}}
              buttonStyle={{
                paddingVertical: 15,
                paddingHorizontal: 20,
                borderColor: colors.coverDark,
                borderWidth: 1,
                borderRadius: 10,
              }}
              type="outline"
              title="Pay using Cash"
              onPress={() => {}}
            />
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setVisible(true)}>
              <Text style={styles.actionButtonText}>Pay using Cash</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: colors.accent}]}
            onPress={() => {}}>
            <Text style={styles.actionButtonText}>EPay / Card</Text>
          </TouchableOpacity>
        </View>
      </Spacer>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  customAmountContainer: {
    width: '100%',
    padding: 10,
  },
  summaryContainer: {
    width: '100%',
    padding: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.black,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 10,
  },
  changeLabel: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
  changeValue: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  text: {
    fontSize: 30,
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flex: 1,
  },
  itemName: {
    color: colors.black,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  board: {
    backgroundColor: '#f8f9fa',
    flex: 1,
    borderRadius: 15,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  displayContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,

    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: '100%',
  },
  displayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    width: '100%',
  },
  displayLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.statusBarCoverDark,
    flex: 1,
    letterSpacing: 1,
  },
  displayValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.statusBarCoverDark,
    textAlign: 'right',
    minWidth: 180,
    marginLeft: 15,
  },
  itemValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
  },
  changeText: {
    color: colors.red,
  },
  amountDisplay: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  amountText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'right',
  },
  labelText: {
    fontSize: 14,
    color: colors.accent,
    marginBottom: 5,
  },
  customInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: 15,
  },
  actionButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    marginVertical: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridContainer: {
    flex: 1,
    paddingVertical: 10,
  },
});

export default AmountKeys;
