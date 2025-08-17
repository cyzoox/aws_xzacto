/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState, useCallback} from 'react';
import {
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import {StyleSheet, View, Text, Switch} from 'react-native';
import colors from '../themes/colors';
import {Button, Input, Overlay} from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextInput} from 'react-native-paper';
import Alert from './Alert';
import {generateClient} from 'aws-amplify/api';
const client = generateClient();
import {listCartItems} from '../graphql/queries';
import {updateCartItem, deleteCartItem} from '../graphql/mutations';
import {calculateFinalPrice} from '../utils/priceCalculations';

export default function List({
  navigation,
  clearAll,
  archive,
  screen,
  toggleScanner,
  discount_visible,
  discount,
  autoPrint_visible,
  staff,
  onDismiss,
}) {
  const [edit, toggleEdit] = useState(false);
  const [newQty, setNewQty] = useState('');
  const [RMap, setRowMap] = useState({});
  const [RKey, setRowKey] = useState('');
  const [dList, setDList] = useState({});
  const [deletes, toggleDelete] = useState(false);
  const [customQty, setCustomQtyVisible] = useState(false);
  const [data, setData] = useState([]);
  const [alerts, alertVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(true);
  const [printSettingsVisible, setPrintSettingsVisible] = useState(false);
  const closeRow = (rowMap, rowKey) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow();
    }
  };

  const deleteRow = () => {
    closeRow(RMap, RKey);

    // deleteList(dList);

    toggleDelete(false);
    setDList({});
    setRowMap([]);
    setRowKey('');
  };

  useEffect(() => {
    fetchList();
    loadPrinterSettings();
  }, [staff, fetchList]);

  const loadPrinterSettings = async () => {
    try {
      const printerSettingsStr = await AsyncStorage.getItem('printerSettings');
      if (printerSettingsStr) {
        const printerSettings = JSON.parse(printerSettingsStr);
        setAutoPrintEnabled(printerSettings.autoPrint !== false);
      }
    } catch (error) {
      console.error('Error loading printer settings:', error);
    }
  };

  const savePrinterSettings = async () => {
    try {
      // Get existing settings first
      const printerSettingsStr = await AsyncStorage.getItem('printerSettings');
      const printerSettings = printerSettingsStr
        ? JSON.parse(printerSettingsStr)
        : {};

      // Update just the autoPrint setting
      printerSettings.autoPrint = autoPrintEnabled;

      // Save back to storage
      await AsyncStorage.setItem(
        'printerSettings',
        JSON.stringify(printerSettings),
      );
    } catch (error) {
      console.error('Error saving printer settings:', error);
    }
  };

  const fetchList = useCallback(async () => {
    try {
      const result = await client.graphql({
        query: listCartItems,
        variables: {
          filter: {
            storeId: {eq: staff.store_id},
            cashierId: {eq: staff.id},
          },
        },
      });

      // Get cart items and parse AWSJSON fields if they're available
      const cartItems = result.data.listCartItems.items.map(item => {
        // Create a new object to avoid modifying the original
        const enhancedItem = {...item};

        // Parse the AWSJSON variant and addon data fields if they exist
        if (item.variantData) {
          try {
            // Parse the variant data
            enhancedItem.parsedVariantData = JSON.parse(item.variantData);
          } catch (e) {
            console.log('Error parsing variant data:', e);
            enhancedItem.parsedVariantData = null;
          }
        } else {
          enhancedItem.parsedVariantData = null;
        }

        if (item.addonData) {
          try {
            // Parse the addon data
            enhancedItem.parsedAddonData = JSON.parse(item.addonData);
          } catch (e) {
            console.log('Error parsing addon data:', e);
            enhancedItem.parsedAddonData = null;
          }
        } else {
          enhancedItem.parsedAddonData = null;
        }

        // Handle legacy data format if needed
        if (!item.variantData && item.selectedVariantData) {
          try {
            enhancedItem.parsedVariantData = JSON.parse(
              item.selectedVariantData,
            );
          } catch (e) {
            console.log('Error parsing legacy variant data:', e);
          }
        }

        if (!item.addonData && item.selectedAddonData) {
          try {
            enhancedItem.parsedAddonData = JSON.parse(item.selectedAddonData);
          } catch (e) {
            console.log('Error parsing legacy addon data:', e);
          }
        }

        return enhancedItem;
      });

      console.log(
        'Processed cart items with variant/addon details:',
        cartItems,
      );
      setCart(cartItems);
    } catch (err) {
      console.log('Error fetching cart items:', err.message);
    }
  }, [staff.id, staff.store_id]);

  const incrementQuantity = async item => {
    try {
      // Increment the quantity
      const updatedQuantity = item.quantity + 1;

      await client.graphql({
        query: updateCartItem,
        variables: {
          input: {
            id: item.id,
            quantity: updatedQuantity,
          },
        },
      });

      console.log('Quantity incremented for item:', item.id);
      fetchList(); // Refresh the cart
    } catch (err) {
      console.log('Error incrementing quantity:', err.message);
      alert('Failed to update quantity. Please try again.');
    }
  };

  const decrementQuantity = async item => {
    try {
      if (item.quantity > 1) {
        // Decrement the quantity
        const updatedQuantity = item.quantity - 1;

        await client.graphql({
          query: updateCartItem,
          variables: {
            input: {
              id: item.id,
              quantity: updatedQuantity,
            },
          },
        });

        console.log('Quantity decremented for item:', item.id);
      } else {
        // If quantity reaches 0, delete the item
        await client.graphql({
          query: deleteCartItem,
          variables: {
            input: {
              id: item.id,
            },
          },
        });

        console.log('Item deleted from cart:', item.id);
      }

      fetchList(); // Refresh the cart
    } catch (err) {
      console.log('Error updating cart:', err.message);
      alert('Failed to update cart. Please try again.');
    }
  };

  // const onPressSave = () => {
  //   const foundObject = products.find(obj => obj._id === data._id);

  // if (foundObject) {
  //   if (foundObject.stock > newQty) {
  //     editListQty(data, parseFloat(newQty));
  //     setCustomQtyVisible(false);
  //   } else {
  //     alertVisible(true);
  //     return;
  //   }
  // }
  // products.map((x) => {

  //   if (x.pr_id === data.uid){
  //     if(newQty >= x.stock){
  //       alertVisible(true);
  //       return
  //     }else{
  //       editListQty(data, parseFloat(newQty))
  //       setCustomQtyVisible(false)
  //     }
  //     }
  // })
  // };

  const onEditQty = item => {
    setData(item);
    setCustomQtyVisible(true);
  };

  const calculateTotal = () => {
    let total = 0;
    cart.forEach(item => {
      total += item.sprice * item.quantity;
    });
    return total;
  };

  const renderRow = ({item}) => {
    return (
      <View style={styles.itemRow}>
        <View
          style={[styles.cellContainer, {flex: 2, alignItems: 'flex-start'}]}>
          <Text style={[styles.cellStyle, {fontSize: 14, marginBottom: 3}]}>
            {item.name}
          </Text>

          {/* Display variant if available */}
          {item.parsedVariantData && (
            <View style={styles.detailRow}>
              <Text style={styles.variantText}>
                {item.parsedVariantData.name}
                <Text style={styles.variantPrice}>
                  {' '}
                  (+₱{parseFloat(item.parsedVariantData.price).toFixed(2)})
                </Text>
              </Text>
            </View>
          )}

          {/* Display addon if available */}
          {item.parsedAddonData && (
            <View style={styles.detailRow}>
              <Text style={styles.addonText}>
                + {item.parsedAddonData.name}
                <Text style={styles.addonPrice}>
                  {' '}
                  (+₱{parseFloat(item.parsedAddonData.price).toFixed(2)})
                </Text>
              </Text>
            </View>
          )}

          {/* Legacy fallback */}
          {!item.parsedVariantData && !item.parsedAddonData && item.addon && (
            <View style={styles.detailRow}>
              <Text style={styles.addonText}>with {item.addon}</Text>
            </View>
          )}
        </View>
        <View style={[styles.cellContainer, {flex: 2.5}]}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {/*
              {
                data.item.quantity === 1 ?
                <TouchableOpacity style={[styles.stepBtn, {backgroundColor: colors.red}]} onPress={()=>  deleteList(data.item)}>
                  <Feather name={'trash'} size={18} color={colors.white} style={{padding: 5}}/>
                </TouchableOpacity> :
                <TouchableOpacity style={styles.stepBtn} onPress={()=> incrementListQty(1, data.item, 'decrement')}>
                  <Feather name={'minus'} size={18} color={colors.black} style={{padding: 5}}/>
                </TouchableOpacity>
              }
              */}
            {item.quantity === 1 ? (
              <TouchableOpacity
                style={[styles.stepBtn, {backgroundColor: colors.red}]}
                onPress={() => decrementQuantity(item)}>
                <Feather
                  name={'trash'}
                  size={15}
                  color={colors.white}
                  style={{padding: 5}}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => decrementQuantity(item)}>
                <Feather
                  name={'minus'}
                  size={15}
                  color={colors.white}
                  style={{padding: 5, fontWeight: '700'}}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => onEditQty(item)}>
              <Text style={styles.quantityText}>
                {Math.round(item.quantity * 100) / 100}
              </Text>
            </TouchableOpacity>

            <TouchableWithoutFeedback onPress={() => incrementQuantity(item)}>
              <View style={styles.stepBtn}>
                <Feather
                  name={'plus'}
                  size={15}
                  color={colors.white}
                  style={{padding: 5}}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
        <View style={styles.cellContainer}>
          <Text style={styles.cellStyle}>
            {formatMoney(item.quantity * item.sprice, {
              symbol: '₱',
              precision: 2,
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <Alert
        visible={alerts}
        onCancel={() => alertVisible(false)}
        onProceed={() => alertVisible(false)}
        title="Insufficient Stocks"
        content="Insufficient stocks can't proceed with your input."
        confirmTitle="OK"
      />
      <View style={{flex: 1, backgroundColor: '#FFFFFF'}}>
        <View style={styles.cellHeaderContainer}>
          <View style={{flexDirection: 'row', alignItems: 'center', flex: 3}}>
            {onDismiss && (
              <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
                <Feather name={'x'} size={20} color={colors.white} />
              </TouchableOpacity>
            )}
            <Text
              style={[
                styles.cellHeaderStyle,
                {marginLeft: onDismiss ? 10 : 0},
              ]}>
              Current Order
            </Text>
          </View>
          {screen !== 'Checkout' ? (
            <View style={{flexDirection: 'row'}}>
              <TouchableOpacity
                onPress={() => clearAll(true)}
                style={{
                  backgroundColor: colors.white,
                  justifyContent: 'center',
                  paddingHorizontal: 5,
                  borderRadius: 10,
                  borderColor: colors.accent,
                  borderWidth: 1,
                }}>
                <Text
                  style={{
                    textAlign: 'center',
                    color: colors.statusBarCoverDark,
                    fontSize: 14,
                    fontWeight: '400',
                  }}>
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => toggleScanner(true)}
                style={{
                  backgroundColor: colors.white,
                  justifyContent: 'center',
                  padding: 3,
                  borderRadius: 10,
                  marginLeft: 10,
                  // borderRadius: 10,
                  borderColor: colors.accent,
                  borderWidth: 1,
                }}>
                <MaterialCommunityIcons
                  name={'barcode-scan'}
                  size={15}
                  color={colors.statusBarCoverDark}
                  style={{padding: 5}}
                />
              </TouchableOpacity>
              {/* <TouchableOpacity onPress={()=> archive(true)} style={{backgroundColor:colors.white, justifyContent:'center', padding: 3, borderRadius: 10, marginLeft: 10,borderRadius: 10, borderColor: colors.accent, borderWidth: 1}}>
              <Feather name={'archive'} size={15} color={colors.statusBarCoverDark} style={{padding: 5}}/>
            </TouchableOpacity> */}
            </View>
          ) : (
            <View style={{flexDirection: 'row'}}>
              <TouchableOpacity
                onPress={() => toggleScanner(true)}
                style={{
                  backgroundColor: colors.white,
                  justifyContent: 'center',
                  padding: 3,
                  borderRadius: 10,
                  marginLeft: 10,
                  // borderRadius: 10,
                  borderColor: colors.accent,
                  borderWidth: 1,
                }}>
                <MaterialCommunityIcons
                  name={'barcode-scan'}
                  size={15}
                  color={colors.statusBarCoverDark}
                  style={{padding: 5}}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => discount_visible(true)}
                style={{
                  backgroundColor: colors.white,
                  justifyContent: 'center',
                  padding: 3,
                  borderRadius: 10,
                  marginLeft: 10,
                  // borderRadius: 10,
                  borderColor: colors.accent,
                  borderWidth: 1,
                }}>
                <Feather
                  name={'percent'}
                  size={15}
                  color={colors.statusBarCoverDark}
                  style={{padding: 5}}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPrintSettingsVisible(true)}
                style={{
                  backgroundColor: colors.white,
                  justifyContent: 'center',
                  padding: 3,
                  borderRadius: 10,
                  marginLeft: 10,
                  // borderRadius: 10,
                  borderColor: colors.accent,
                  borderWidth: 1,
                }}>
                <Feather
                  name={'printer'}
                  size={15}
                  color={colors.statusBarCoverDark}
                  style={{padding: 5}}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <FlatList
          data={cart}
          renderItem={renderRow}
          keyExtractor={item => item.id}
        />
        <View style={styles.cellFooterStyle}>
          <Text style={styles.footerTextStyle}>Subtotal</Text>
          <Text style={styles.footerTextStyle}>
            {formatMoney(calculateTotal(), {symbol: '₱', precision: 2})}
          </Text>
        </View>
        <View style={styles.cellFooterStyle}>
          <Text style={styles.footerTextStyle}>Discount</Text>
          <Text style={styles.footerTextStyle}>
            {formatMoney(calculateTotal() * (discount / 100), {
              symbol: '₱',
              precision: 2,
            })}
          </Text>
        </View>
        <View style={styles.cellFooterStyle}>
          <Text style={[styles.footerTextStyle, {fontWeight: '700'}]}>
            Total
          </Text>
          <Text style={[styles.footerTextStyle, {fontWeight: '700'}]}>
            {formatMoney(
              calculateTotal() - (calculateTotal() * discount) / 100,
              {symbol: '₱', precision: 2},
            )}
          </Text>
        </View>
        <Overlay
          overlayStyle={{
            width: '70%',
            borderRadius: 20,
            padding: 20,
            justifyContent: 'center',
          }}
          isVisible={customQty}
          onBackdropPress={setCustomQtyVisible}>
          <Text style={{textAlign: 'center', fontSize: 20, fontWeight: '600'}}>
            Quantity of{' '}
            <Text
              style={{fontSize: 20, fontWeight: '600', color: colors.accent}}>
              {data.name}
            </Text>{' '}
          </Text>
          <View
            style={{
              marginHorizontal: 20,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <TextInput
              mode="outlined"
              onChangeText={text => setNewQty(text)}
              defaultValue={`${data.quantity}`}
              keyboardType="decimal-pad"
              style={{
                textAlign: 'center',
                borderRadius: 10,
                width: 100,
                height: 40,
                margin: 20,
              }}
              theme={{
                colors: {primary: colors.accent, underlineColor: 'transparent'},
              }}
            />
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
            <Button
              buttonStyle={{
                backgroundColor: colors.red,
                borderRadius: 5,
                paddingHorizontal: 20,
              }}
              title="  Cancel  "
              onPress={() => setCustomQtyVisible(false)}
            />
            <Button
              buttonStyle={{
                backgroundColor: colors.primary,
                borderRadius: 5,
                paddingHorizontal: 20,
              }}
              title="    Save    "
              onPress={() => {}}
            />
          </View>
        </Overlay>
        <Overlay isVisible={deletes} onBackdropPress={toggleDelete}>
          <View style={{width: 200, padding: 10}}>
            <Text
              style={{
                textAlign: 'center',
                paddingTop: 5,
                paddingBottom: 15,
                fontSize: 16,
                fontWeight: 'bold',
              }}>
              Are you sure you want to delete this item?
            </Text>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Button title="   Save   " onPress={() => deleteRow()} />
              <Button title=" Cancel " onPress={() => {}} />
            </View>
          </View>
        </Overlay>
        <Overlay
          isVisible={printSettingsVisible}
          onBackdropPress={() => setPrintSettingsVisible(false)}
          overlayStyle={styles.printSettingsOverlay}>
          <View>
            <Text style={styles.printSettingsTitle}>Print Settings</Text>
            <View style={styles.printSettingRow}>
              <Text style={styles.printSettingLabel}>Auto-print receipts</Text>
              <Switch
                value={autoPrintEnabled}
                onValueChange={value => {
                  setAutoPrintEnabled(value);
                }}
                trackColor={{false: '#d1d1d1', true: colors.primary}}
                thumbColor={autoPrintEnabled ? colors.accent : '#f4f3f4'}
              />
            </View>
            <Text style={styles.printSettingInfo}>
              When enabled, receipts will automatically print after checkout
            </Text>
            <View style={styles.printButtonsContainer}>
              <Button
                title="Cancel"
                buttonStyle={styles.printCancelButton}
                onPress={() => setPrintSettingsVisible(false)}
              />
              <Button
                title="Save"
                buttonStyle={styles.printSaveButton}
                onPress={() => {
                  savePrinterSettings();
                  setPrintSettingsVisible(false);
                }}
              />
            </View>
          </View>
        </Overlay>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    color: colors.black,
    fontWeight: '500',
  },
  itemCode: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  cellHeaderStyle: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 10,
  },
  cellStyle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  footerTextStyle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.black,
  },
  cellHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 10,
  },
  cellContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  cellFooterStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginTop: 10,
  },
  stepBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  closeButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  printSettingsOverlay: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
  },
  printSettingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'center',
    marginBottom: 20,
  },
  printSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  printSettingLabel: {
    fontSize: 16,
    color: colors.black,
  },
  printSettingInfo: {
    fontSize: 14,
    color: colors.charcoalGrey,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  printButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  printCancelButton: {
    backgroundColor: colors.charcoalGrey,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  printSaveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
    marginHorizontal: 10,
  },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  addonText: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 4,
  },
  variantText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#444',
    marginTop: 2,
  },
  variantPrice: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '400',
  },
  addonPrice: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '400',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
});
