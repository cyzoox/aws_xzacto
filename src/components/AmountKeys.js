import React,{useState,useEffect} from "react";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { FlatGrid } from 'react-native-super-grid';
import formatMoney from 'accounting-js/lib/formatMoney.js'
import { Card, Overlay, Input, Button } from "react-native-elements";

import { TextInput } from "react-native-paper";
import AlertwithChild from "./AlertwithChild";
import colors from "../themes/colors";
import Spacer from "./Spacer";

import { generateClient } from 'aws-amplify/api';
const client = generateClient();
import { createDiscount, createSaleTransaction, createSale, updateProduct, deleteCartItem } from "../graphql/mutations"; 
import { listCartItems, getProduct } from '../graphql/queries';


const AmountKeys = ({cashReceive, Change, discount, discountName, setCreditVisible, navigation, staff}) => {
    const [items, setItems] = useState([
        { name: 1000 },
        { name: 500 },
        { name: 200 },
        { name: 100 },
        { name: 50 },
        { name: 20 },
        { name: 10 },
        { name: 5 },
        { name: 'Clear' },
        { name: 'Custom' },
      ]);

      const [received, setCash] = useState(0);
      const [custom, setCustom] = useState(false);
      const [custom_cash, setCustomeCash] = useState(0);
      const [visible, setVisible]= useState(false);
      const [cart, setCart] = useState([]);
      const [isProcessing, setIsProcessing] = useState(false);


      useEffect(() => {
        fetchCart();
    }, []);
    
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
              storeId: { eq: staff.store_id },
              cashierId: { eq: staff.id }
            },
          },
        });
    
        const cartItems = result.data.listCartItems.items;
        console.log("Fetched cart items:", cartItems);
        setCart(cartItems);
      } catch (err) {
        console.log('Error fetching cart items:', err.message);
      }
    };

    const getCashReceived = (cash) => {
        if(cash === "Clear"){
          setCustomeCash(0)
        } else if(cash === "Custom"){
          setCustom(true)
        } else {
          setCustomeCash(custom_cash + cash)
          // Update change calculation whenever cash amount changes
          Change(calculateChange())
        }
        
        // Calculate change after cash amount is set
        Change(calculateChange())
    }

    const onProceed = () => {
      checkout();
    }

    const calculateTotal = () => {
      let total = 0;
      cart.forEach(item => {
        total += item.quantity * item.sprice;
      });
      
      // Apply discount if any
      if (discount > 0) {
        total = total * (1 - (discount / 100));
      }
      
      return total;
    }

    const calculateTotalBeforeDiscount = () => {
      let total = 0;
      cart.forEach(item => {
        total += item.quantity * item.sprice;
      });
      return total;
    }

    const calculateTotalItems = () => {
      let total = 0;
      cart.forEach(item => {
        total += item.quantity;
      });
      return total;
    }
    
    const calculateTotalProfit = () => {
      let total = 0;
      cart.forEach(item => {
        total += (item.sprice - item.oprice) * item.quantity;
      });
      return total;
    }

    const calculateChange = () => {
      cashReceive(custom_cash);
      return custom_cash - calculateTotal();
    }

    const onSaveCustomCash = () => {
      getCashReceived("Custom");
      setCustom(false);
      // Ensure change is calculated after custom cash is set
      Change(calculateChange());
    }

    const checkout = async () => {
      if (cart.length === 0) {
        alert('Cart is empty. Please add items before checkout.');
        return;
      }
      
      if (custom_cash < calculateTotal()) {
        alert('Cash received is less than the total amount. Please enter a valid amount.');
        return;
      }
      
      if (isProcessing) {
        return; // Prevent multiple checkout attempts
      }
      
      setIsProcessing(true);
      setVisible(true);
      
      try {
        console.log("Starting checkout process...");
        
        // Map cart items to item IDs for transaction
        const itemIds = cart.map(item => item.productId);
        
        // 1. Create SaleTransaction - only include fields defined in the schema
        const transactionInput = {
          items: itemIds,
          total: calculateTotal(),
          staffID: staff.id,
          staffName: staff.name,
          storeID: staff.store_id,
          status: 'Completed',
          payment_status: 'Paid',
          cash_received: custom_cash,
          change: calculateChange(),
          discount: discount > 0 ? discount : null,
          notes: discount > 0 ? `Discount applied: ${discount}% - ${discountName || 'Regular Discount'}` : '',
        };
        
        // Add optional customerID if available
        if (staff.customerId) {
          transactionInput.customerID = staff.customerId;
        }
        
        console.log("Transaction input:", transactionInput);
        
        const saleTransactionResponse = await client.graphql({
          query: createSaleTransaction,
          variables: {
            input: transactionInput,
          },
        });
        
        const transactionId = saleTransactionResponse.data.createSaleTransaction.id;
        console.log("SaleTransaction created:", transactionId);

        // 2. Process each cart item
        const deletePromises = [];
        
        for (const item of cart) {
          try {
            // First get the latest product data to ensure we have current stock levels
            const productResponse = await client.graphql({
              query: getProduct,
              variables: { id: item.productId },
            });
            
            const product = productResponse.data.getProduct;
            if (!product) {
              console.error(`Product not found: ${item.productId}`);
              continue;
            }
            
            // Verify stock availability
            const currentStock = product.stock || 0;
            if (currentStock < item.quantity) {
              alert(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`);
              throw new Error(`Insufficient stock for product: ${item.name}`);
            }
            
            // Create Sale record
            const saleResponse = await client.graphql({
              query: createSale,
              variables: {
                input: {
                  productID: item.productId,
                  productName: item.name,
                  transactionID: transactionId,
                  price: item.sprice,
                  quantity: item.quantity,
                  discount: discount > 0 ? (discount / 100) * item.sprice * item.quantity : null,
                  total: item.quantity * item.sprice * (discount > 0 ? (1 - discount / 100) : 1),
                  status: 'Completed',
                },
              },
            });
            console.log("Sale created:", saleResponse.data.createSale.id);

            // Update Product Stock
            const updatedStock = currentStock - item.quantity;
            await client.graphql({
              query: updateProduct,
              variables: {
                input: {
                  id: item.productId,
                  stock: updatedStock,
                },
              },
            });
            console.log("Product stock updated for:", item.name, "New stock:", updatedStock);
            
            // Queue the delete operation to be run after all processing is complete
            deletePromises.push(client.graphql({
              query: deleteCartItem,
              variables: {
                input: {
                  id: item.id,
                },
              },
            }));
            
          } catch (itemError) {
            console.error("Error processing item:", item.name, itemError);
            // Continue with other items even if one fails
          }
        }
        
        // Delete all cart items in parallel
        console.log("Deleting cart items...");
        await Promise.all(deletePromises);
        console.log(`Successfully deleted ${deletePromises.length} cart items`);
        
        // Also clear the local cart state
        setCart([]);

        // 3. Create Discount record if applicable
        if (discount > 0) {
          const discountResponse = await client.graphql({
            query: createDiscount,
            variables: {
              input: {
                total: discount/100 * calculateTotalBeforeDiscount(),
                name: discountName || 'Regular Discount',
                transactionId: transactionId,
                storeId: staff.store_id,
              },
            },
          });
          console.log("Discount created:", discountResponse.data.createDiscount.id);
        }
        
        // Success - close modal and navigate
        setVisible(false);
        setIsProcessing(false);
        setCustomeCash(0);
        
        // Show success message and navigate back to products screen
        alert('Transaction completed successfully!');
        
        // Navigate back to the CashierScreen (products screen)
        navigation.navigate('CashierScreen', { 
          staffData: staff,
          refreshCart: true, // Add a flag to refresh the cart on return
          timestamp: Date.now() // Add a timestamp to force refresh
        });
        
      } catch (err) {
        console.error('Error during checkout:', err);
        alert('Error during checkout: ' + err.message);
        setVisible(false);
        setIsProcessing(false);
      }
    };
    
    return(
      <View >
          <AlertwithChild 
            visible={visible} 
            onCancel={() => setVisible(false)} 
            onProceed={() => onProceed()} 
            title="Confirm Payment" 
            confirmTitle="CHECKOUT"
            overlayStyle={styles.modalContainer}
          >
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Cash Received</Text>
                <Text style={styles.summaryValue}>{formatMoney(custom_cash, { symbol: "₱", precision: 2 })}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payable</Text>
                <Text style={styles.summaryValue}>{formatMoney(calculateTotal(), { symbol: "₱", precision: 2 })}</Text>
              </View>
              <View style={styles.changeContainer}>
                <Text style={styles.changeLabel}>Change</Text>
                <Text style={styles.changeValue}>{formatMoney(calculateChange(), { symbol: "₱", precision: 2 })}</Text>
              </View>
            </View>
          </AlertwithChild>
        <AlertwithChild 
          visible={custom} 
          onCancel={() => setCustom(false)}  
          onProceed={() => onSaveCustomCash()}   
          title="Enter Custom Amount"
          confirmTitle="Save"
          overlayStyle={styles.modalContainer}
        >
          <View style={styles.customAmountContainer}>
            <Text style={styles.labelText}>Amount</Text>
            <TextInput 
              mode="outlined"
              theme={{colors: {primary: colors.accent, underlineColor: 'transparent'}}}
              value={custom_cash.toString()}
              keyboardType="numeric"
              onChangeText={(text) => setCustomeCash(parseFloat(text) || 0)}
              style={styles.customInput}
              placeholder="Enter amount"
            />
       </View>
     
        </AlertwithChild>
   
        <View style={styles.displayContainer}>
          <View style={styles.displayRow}>
            <Text style={styles.displayLabel}>CASH RECEIVED</Text>
            <Text style={styles.displayValue}>
              {formatMoney(custom_cash, { symbol: "₱", precision: 2 })}
            </Text>
          </View>
          <View style={styles.displayRow}>
            <Text style={styles.displayLabel}>TOTAL</Text>
            <Text style={styles.displayValue}>
              {formatMoney(calculateTotal(), { symbol: "₱", precision: 2 })}
            </Text>
          </View>
          <View style={styles.displayRow}>
            <Text style={styles.displayLabel}>CHANGE</Text>
            <Text style={[styles.displayValue, styles.changeText]}>
              {formatMoney(custom_cash <= 0 ? 0 : calculateChange(), { symbol: "₱", precision: 2 })}
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
        renderItem={({ item, index }) => {
          const isNumber = typeof item.name === 'number';
          const isCustom = item.name === 'Custom';
          const isLastRow = index >= items.length;
          
          if (isCustom) {
            return (
              <TouchableOpacity
                style={[styles.itemContainer, {
                  backgroundColor: '#e3f2fd',
                  width: '100%',
                  height: 70,
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center'  
                }]}
                onPress={() => getCashReceived(item.name)}
              >
                <Text style={[styles.itemName, { color: '#1976d2', fontSize: 18 }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }
          
          return (
            <TouchableOpacity
              style={[styles.itemContainer, {
                backgroundColor: item.name === 'Clear' ? '#ffebee' : '#fff',
                width: '100%',
                height: 70
              }]}
              onPress={() => getCashReceived(item.name)}
            >
              <Text style={[styles.itemName, {
                color: item.name === 'Clear' ? '#c62828' : colors.black,
                fontSize: isNumber ? 24 : 18
              }]}>
                {typeof item.name === 'number' ? '₱' + item.name : item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

<Spacer>
            <View style={{flexDirection:'row', justifyContent:'space-evenly', marginBottom: 20}}>
              {
                custom_cash < calculateTotal() ?
                <Button titleStyle={{color: colors.black}} buttonStyle={{paddingVertical: 15, paddingHorizontal: 20,borderColor: colors.coverDark, borderWidth: 1, borderRadius:10}} type="outline"  title="Pay using Cash"  onPress={()=>{}}/>:
                <TouchableOpacity style={styles.actionButton} onPress={() => setVisible(true)}>
                <Text style={styles.actionButtonText}>Pay using Cash</Text>
              </TouchableOpacity>
              }
     
          
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} onPress={() => {}}>
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
    maxWidth: 400
  },
  customAmountContainer: {
    width: '100%',
    padding: 10
  },
  summaryContainer: {
    width: '100%',
    padding: 15
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.black,
    fontWeight: '500'
  },
  summaryValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600'
  },
  changeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff3e0',
    borderRadius: 10
  },
  changeLabel: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600'
  },
  changeValue: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700'
  },
  text: {
    fontSize: 30
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
    flex: 1
  },
  itemName: {
    color: colors.black,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
    flexWrap: 'nowrap'
  },
  board: {
    backgroundColor: '#f8f9fa',
    flex: 1,
    borderRadius: 15,
    padding: 15,
    width: '100%',
    alignItems: 'center'
  },
  displayContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
  
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: '100%'
  },
  displayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    width: '100%'
  },
  displayLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.statusBarCoverDark,
    flex: 1,
    letterSpacing: 1
  },
  displayValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.statusBarCoverDark,
    textAlign: 'right',
    minWidth: 180,
    marginLeft: 15
  },
  changeText: {
    color: colors.red
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
    borderColor: '#e0e0e0'
  },
  amountText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'right'
  },
  labelText: {
    fontSize: 14,
    color: colors.accent,
    marginBottom: 5
  },
  customInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.accent,
    marginBottom: 15
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
    marginVertical: 5
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  gridContainer: {
    flex: 1,
    paddingVertical: 10
  }
});

export default AmountKeys;
