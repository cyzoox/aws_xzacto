import React, {useEffect, useState} from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  TouchableHighlight,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import colors from '../../themes/colors';
import {ListItem, Card, Overlay} from 'react-native-elements';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import moment from 'moment';
import {useFocusEffect} from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import AlertwithChild from '../../components/AlertwithChild';
import SearchInput, {createFilter} from 'react-native-search-filter';
import {getSaleTransaction, getProduct, listSales} from '../../graphql/queries';
import {updateSaleTransaction, updateProduct, updateSale} from '../../graphql/mutations';
import {generateClient} from 'aws-amplify/api';
const client = generateClient();

const TransactionDetailsScreen = ({navigation, route}) => {
  const {transactions, staffData} = route.params;
  const [reason, setReason] = useState('');
  const [alerts, alertVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  
  useEffect(() => {
    fetchTransactionDetails();
  }, []);

  const fetchTransactionDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch the full transaction details
      const result = await client.graphql({
        query: getSaleTransaction,
        variables: {
          id: transactions.id,
        },
      });
      
      const transactionData = result.data.getSaleTransaction;
      setTransactionDetails(transactionData);
      
      // Fetch sales for this transaction
      const salesResult = await fetchSaleItems(transactions.id);
      
      // If no sale items found (old transaction format), fallback to product items from transaction
      if (salesResult.length === 0 && transactionData?.items && Array.isArray(transactionData.items)) {
        console.log("No sale records found. Using legacy transaction items format.");
        await fetchProductDetails(transactionData.items);
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      Alert.alert('Error', 'Failed to load transaction details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSaleItems = async (transactionId) => {
    try {
      // Query sales records associated with this transaction
      const result = await client.graphql({
        query: listSales,
        variables: {
          filter: {
            transactionID: { eq: transactionId },
          },
        },
      });
      
      const sales = result.data.listSales.items;
      
      if (sales && sales.length > 0) {
        // For each sale, fetch the associated product to get the name
        const salesWithProductDetails = await Promise.all(
          sales.map(async (sale) => {
            try {
              const productResult = await client.graphql({
                query: getProduct,
                variables: {
                  id: sale.productID,
                },
              });
              
              const product = productResult.data.getProduct;
              return {
                ...sale,
                productName: product?.name || 'Unknown Product',
              };
            } catch (error) {
              console.error(`Error fetching product ${sale.productID}:`, error);
              return {
                ...sale,
                productName: 'Unknown Product',
              };
            }
          })
        );
        
        setSaleItems(salesWithProductDetails);
        return salesWithProductDetails;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching sale items:', error);
      Alert.alert('Error', 'Failed to load sale items');
      return [];
    }
  };

  const fetchProductDetails = async (productIds) => {
    try {
      const productDetails = [];
      
      // Fetch details for each product ID in the transaction
      for (const productId of productIds) {
        const result = await client.graphql({
          query: getProduct,
          variables: {
            id: productId,
          },
        });
        
        const product = result.data.getProduct;
        if (product) {
          // For legacy transactions, we'll assume quantity of 1 for each product
          productDetails.push({
            id: product.id,
            productID: product.id,
            productName: product.name,
            price: product.sprice,
            quantity: 1,
            total: product.sprice,
            status: 'Completed',
          });
        }
      }
      
      setSaleItems(productDetails);
      return productDetails;
    } catch (error) {
      console.error('Error fetching product details:', error);
      Alert.alert('Error', 'Failed to load product details');
      return [];
    }
  };

  const onCancelAlert = () => {
    alertVisible(false);
    setSelectedItem(null);
  };

  const handleVoidItem = async () => {
    if (!selectedItem) return;
    
    if (!reason.trim()) {
      setError('Please provide a reason for voiding this item');
      return;
    }
    
    if (code !== staffData?.password) {
      setError('Invalid PIN code');
      return;
    }
    
    setIsLoading(true);
    try {
      // Update the sale status to voided
      await client.graphql({
        query: updateSale,
        variables: {
          input: {
            id: selectedItem.id,
            status: 'Voided',
            void_reason: reason,
          },
        },
      });
      
      // Try to restore product stock
      try {
        // Get current product stock
        const productResult = await client.graphql({
          query: getProduct,
          variables: {
            id: selectedItem.productID,
          },
        });
        
        const product = productResult.data.getProduct;
        
        if (product) {
          // Update product stock
          await client.graphql({
            query: updateProduct,
            variables: {
              input: {
                id: selectedItem.productID,
                stock: product.stock + selectedItem.quantity,
              },
            },
          });
        }
      } catch (stockError) {
        console.error('Error restoring stock:', stockError);
      }
      
      // Check if all sales are now voided
      const updatedSales = saleItems.map(item => 
        item.id === selectedItem.id ? {...item, status: 'Voided'} : item
      );
      
      const allVoided = updatedSales.every(item => item.status === 'Voided');
      
      // Update transaction status if all items are voided
      if (allVoided) {
        await client.graphql({
          query: updateSaleTransaction,
          variables: {
            input: {
              id: transactions.id,
              status: 'Voided',
              notes: `Transaction voided. Reason: ${reason}`,
            },
          },
        });
      } else {
        // Update transaction notes to indicate partial void
        const currentNotes = transactionDetails.notes || '';
        const voidNote = `Item voided: ${selectedItem.productName}. Reason: ${reason}`;
        const updatedNotes = currentNotes ? `${currentNotes}; ${voidNote}` : voidNote;
        
        await client.graphql({
          query: updateSaleTransaction,
          variables: {
            input: {
              id: transactions.id,
              notes: updatedNotes,
            },
          },
        });
      }
      
      // Reset state
      setReason('');
      setCode('');
      setPinVisible(false);
      alertVisible(false);
      setSelectedItem(null);
      
      Alert.alert('Success', 'Item has been voided');
      
      // Refresh transaction details
      await fetchTransactionDetails();
    } catch (error) {
      console.error('Error voiding item:', error);
      setError('Failed to void item. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({item}) => {
    // Parse variant and addon data if available
    let variantInfo = null;
    let addonInfo = [];
    
    if (item.variantData) {
      try {
        variantInfo = JSON.parse(item.variantData);
      } catch (e) {
        console.error("Error parsing variant data:", e);
      }
    }
    
    if (item.addonData) {
      try {
        const parsed = JSON.parse(item.addonData);
        addonInfo = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.error("Error parsing addon data:", e);
      }
    }
    
    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemDetails}>
          <View style={styles.itemTextContainer}>
            <Text style={styles.quantityText}>{item.quantity}</Text>
          </View>
          <View style={styles.itemTextContainer}>
            <Text style={styles.productNameText}>
              {item.productName || 'Unknown Product'}
            </Text>
            {/* Display base price */}
            <Text style={styles.priceText}>
              @ {formatMoney(item.price, {symbol: '₱', precision: 2})}
            </Text>
            
            {/* Display variant if available */}
            {variantInfo && (
              <Text style={styles.variantText}>
                Variant: {variantInfo.name || 'Unknown'}
                {variantInfo.price ? ` (+${formatMoney(variantInfo.price, {symbol: '₱', precision: 2})})` : ''}
              </Text>
            )}
            
            {/* Display addons if available */}
            {addonInfo.length > 0 && (
              <View style={styles.addonContainer}>
                <Text style={styles.addonHeader}>Add-ons:</Text>
                {addonInfo.map((addon, index) => (
                  <Text key={index} style={styles.addonText}>
                    • {addon.name || 'Unknown addon'}
                    {addon.price ? ` (+${formatMoney(addon.price, {symbol: '₱', precision: 2})})` : ''}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>
        <Text style={styles.itemPrice}>
          {formatMoney(item.total, {
            symbol: '₱',
            precision: 2,
          })}
        </Text>
        {item.status !== 'Voided' && (
          <TouchableOpacity
            onPress={() => {
              setSelectedItem(item);
              alertVisible(true);
            }}
            style={styles.voidButton}>
            <Text style={styles.voidButtonText}>Void</Text>
          </TouchableOpacity>
        )}
        {item.status === 'Voided' && (
          <View style={styles.voidedIndicator}>
            <Text style={styles.voidedText}>Voided</Text>
          </View>
        )}
      </View>
    );
  };

  const calculateTotal = () => {
    let total = 0;
    saleItems.forEach(item => {
      if (item.status !== 'Voided') {
        total += parseFloat(item.total);
      }
    });
    return total;
  };

  const printReceipt = () => {
    // Implement the print receipt functionality here
    console.log('Print receipt');
    Alert.alert('Print', 'Printing receipt...');
  };

  const renderHeader = () => (
    <View>
      <AppHeader
        centerText="Transaction Details"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <EvilIcons name={'arrow-left'} size={35} color={colors.white} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={printReceipt}>
            <AntDesign name={'printer'} size={25} color={colors.white} />
          </TouchableOpacity>
        }
      />
      <View style={styles.transactionDetails}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionText}>
            Date: {moment(transactions.createdAt).format('MMM DD, YYYY hh:mm A')}
          </Text>
          <Text style={styles.transactionText}>
            Receipt #: {transactions.id.substring(0, 8)}
          </Text>
          <Text style={styles.transactionText}>
            Status: <Text style={{color: transactions.status === 'Completed' ? colors.green : colors.red}}>
              {transactions.status || 'Completed'}
            </Text>
          </Text>
          <Text style={styles.transactionText}>
            Payment Method: {transactions.payment_status || 'Cash'}
          </Text>
          {transactions.notes && (
            <Text style={styles.transactionText}>
              Notes: {transactions.notes}
            </Text>
          )}
        </View>
      </View>
      <ListItem bottomDivider>
        <ListItem.Content style={styles.listItemContent}>
          <View style={styles.listItemTextContainer}>
            <Text style={[styles.listItemText, styles.qtyHeader]}>Qty</Text>
            <Text style={[styles.listItemText, styles.productHeader]}>Product</Text>
          </View>
          <Text style={[styles.listItemText, styles.totalHeader]}>Total</Text>
          <Text style={[styles.listItemText, styles.actionHeader]}>Action</Text>
        </ListItem.Content>
      </ListItem>
    </View>
  );

  const renderFooter = () => (
    <View>
      <ListItem>
        <ListItem.Content style={styles.listItemContent}>
          <Text style={styles.subtotalLabel}>Sub Total</Text>
          <Text></Text>
          <Text style={styles.subTotalText}>
            {formatMoney(calculateTotal(), {symbol: '₱', precision: 2})}
          </Text>
        </ListItem.Content>
      </ListItem>
      <ListItem style={styles.listItem}>
        <ListItem.Content style={styles.listItemContent}>
          <Text style={styles.discountText}>Discount</Text>
          <Text></Text>
          <Text style={styles.discountText}>
            -{formatMoney(transactionDetails?.discount || 0, {symbol: '₱', precision: 2})}
          </Text>
        </ListItem.Content>
      </ListItem>
      <ListItem style={styles.listItem}>
        <ListItem.Content style={styles.listItemContent}>
          <Text style={styles.totalText}>Total</Text>
          <Text></Text>
          <Text style={styles.totalText}>
            {formatMoney(transactionDetails?.total || calculateTotal(), {
              symbol: '₱',
              precision: 2,
            })}
          </Text>
        </ListItem.Content>
      </ListItem>
      <ListItem style={styles.listItem}>
        <ListItem.Content style={styles.listItemContent}>
          <Text style={styles.paymentLabel}>Amount Received</Text>
          <Text></Text>
          <Text style={styles.paymentText}>
            {formatMoney(transactionDetails?.cash_received || 0, {
              symbol: '₱',
              precision: 2,
            })}
          </Text>
        </ListItem.Content>
      </ListItem>
      <ListItem style={styles.listItem}>
        <ListItem.Content style={styles.listItemContent}>
          <Text style={styles.changeLabel}>Change</Text>
          <Text></Text>
          <Text style={styles.changeText}>
            {formatMoney(transactionDetails?.change || 0, {
              symbol: '₱', 
              precision: 2
            })}
          </Text>
        </ListItem.Content>
      </ListItem>
    </View>
  );

  // Render void item confirmation modal
  const renderVoidItemAlert = () => (
    <AlertwithChild
      visible={alerts}
      onCancel={onCancelAlert}
      onProceed={() => setPinVisible(true)}
      title="Void Item"
      message="Are you sure you want to void this item?"
      cancelText="Cancel"
      proceedText="Continue">
      <View style={styles.voidReasonContainer}>
        <Text style={styles.voidReasonLabel}>Reason for Void:</Text>
        <View style={styles.reasonInputContainer}>
          <TextInput
            placeholder="Enter reason"
            value={reason}
            onChangeText={setReason}
            style={styles.reasonInput}
          />
        </View>
      </View>
    </AlertwithChild>
  );

  // Render PIN confirmation modal
  const renderPinConfirmation = () => (
    <Overlay
      isVisible={pinVisible}
      onBackdropPress={() => setPinVisible(false)}
      overlayStyle={styles.overlay}>
      <View style={styles.pinContainer}>
        <Text style={styles.pinTitle}>Enter PIN</Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TextInput
          placeholder="Enter PIN"
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
          secureTextEntry
          style={styles.pinInput}
        />
        <View style={styles.pinButtonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setPinVisible(false);
              setError('');
              setCode('');
            }}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleVoidItem}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Overlay>
  );

  if (isLoading && saleItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading transaction details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={saleItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found for this transaction</Text>
          </View>
        }
      />
      
      {/* Void Item Alert */}
      {renderVoidItemAlert()}
      
      {/* PIN Confirmation */}
      {renderPinConfirmation()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.charcoalGrey,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionText: {
    fontSize: 14,
    color: colors.charcoalGrey,
    marginBottom: 5,
    fontWeight: '500',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  itemDetails: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTextContainer: {
    marginRight: 15,
  },
  quantityText: {
    fontSize: 14,
    color: colors.black,
    fontWeight: 'bold',
  },
  productNameText: {
    fontSize: 14,
    color: colors.black,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 12,
    color: colors.charcoalGrey,
  },
  itemPrice: {
    flex: 1,
    fontSize: 14,
    color: colors.black,
    fontWeight: '500',
    textAlign: 'right',
    marginRight: 15,
  },
  voidButton: {
    backgroundColor: colors.red,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  voidButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  voidedIndicator: {
    backgroundColor: colors.lightGrey,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  voidedText: {
    color: colors.charcoalGrey,
    fontSize: 12,
    fontWeight: '500',
  },
  variantText: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 2,
    fontStyle: 'italic',
  },
  addonContainer: {
    marginTop: 2,
  },
  addonHeader: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  addonText: {
    fontSize: 11,
    color: colors.charcoalGrey,
    marginLeft: 5,
  },
  listItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemTextContainer: {
    flex: 2,
    flexDirection: 'row',
  },
  listItemText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.charcoalGrey,
  },
  qtyHeader: {
    marginRight: 15,
    width: 30,
  },
  productHeader: {
    flex: 1,
  },
  totalHeader: {
    flex: 1,
    textAlign: 'right',
  },
  actionHeader: {
    width: 60,
    textAlign: 'center',
  },
  subtotalLabel: {
    fontSize: 14,
    color: colors.charcoalGrey,
  },
  subTotalText: {
    fontSize: 14,
    color: colors.black,
    fontWeight: '500',
  },
  discountText: {
    fontSize: 14,
    color: colors.accent,
  },
  totalText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  paymentLabel: {
    fontSize: 14,
    color: colors.charcoalGrey,
  },
  paymentText: {
    fontSize: 14,
    color: colors.green,
    fontWeight: '500',
  },
  changeLabel: {
    fontSize: 14,
    color: colors.charcoalGrey,
  },
  changeText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.charcoalGrey,
  },
  voidReasonContainer: {
    marginTop: 10,
    marginBottom: 15,
  },
  voidReasonLabel: {
    fontSize: 14,
    color: colors.charcoalGrey,
    marginBottom: 5,
  },
  reasonInputContainer: {
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 5,
    backgroundColor: colors.white,
  },
  reasonInput: {
    padding: 10,
    fontSize: 14,
  },
  overlay: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
  },
  pinContainer: {
    alignItems: 'center',
  },
  pinTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 15,
  },
  errorText: {
    color: colors.red,
    marginBottom: 10,
    textAlign: 'center',
  },
  pinInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  pinButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: colors.lightGrey,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: colors.charcoalGrey,
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: colors.accent,
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  confirmButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default TransactionDetailsScreen;
