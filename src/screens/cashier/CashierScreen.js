import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from "react-native-modal";
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import List from "../../components/List";
import Spacer from "../../components/Spacer";
import colors from "../../themes/colors";
import AppHeader from "../../components/AppHeader";
import formatMoney from 'accounting-js/lib/formatMoney.js';
import ProductsCashier from "../../components/ProductsCashier";
import { listCartItems } from "../../graphql/queries";
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

const CashierScreen = ({ navigation, route }) => {
  const { staffData } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [orientation, setOrientation] = useState("portrait");
  const [cart, setCart] = useState([]);
  const [selected, setSelected] = useState(0);
  const [discount_name, setDiscountName] = useState('');
  const [discountVisible, setDiscountVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              // Clear all session data
              await AsyncStorage.removeItem('staffData');
              await AsyncStorage.removeItem('staffSession');
              await AsyncStorage.removeItem('@store');
              await AsyncStorage.removeItem('@currency');
              
              // Navigate to role selection screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'RoleSelection' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const onClickPay = () => {
    setModalVisible(false);
    navigation.navigate('Checkout');
  };

  const fetchList = async () => {
    console.log(`Fetching cart items for store ${staffData.store_id}, cashier ${staffData.id}`);
    try {
      // Add a controller to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const result = await client.graphql({
        query: listCartItems,
        variables: { 
          filter: { 
            storeId: { eq: staffData.store_id },
            cashierId: { eq: staffData.id }
          },
          limit: 100 // Make sure we get all items
        },
        abortSignal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const cartItems = result.data.listCartItems.items;
      console.log(`Found ${cartItems.length} cart items in database`);
      setCart(cartItems);
    } catch (err) {
      console.log('Error fetching cart items:', err.message);
      // Don't clear cart on error - keep previous state
    }
  };

  useEffect(() => {
    const handleOrientationChange = () => {
      const { height, width } = Dimensions.get("window");
      setOrientation(height >= width ? "portrait" : "landscape");
    };

    const subscription = Dimensions.addEventListener("change", handleOrientationChange);

    handleOrientationChange();
    fetchList();

    const unsubscribe = navigation.addListener('focus', () => {
      console.log('CashierScreen focused - refreshing cart');
      fetchList();
    });

    return () => {
      subscription.remove();
      unsubscribe();
    };
  }, [staffData.store_id]);

  useEffect(() => {
    if (route.params?.refreshCart) {
      console.log('Refreshing cart due to refreshCart flag, timestamp:', route.params?.timestamp);
      // Immediately show empty cart for better perceived performance
      setCart([]);
      
      // Add a small delay to ensure database operations complete
      setTimeout(() => {
        fetchList();
      }, 500);
    }
  }, [route.params?.refreshCart, route.params?.timestamp]);

  const calculateTotal = () => cart.reduce((total, item) => total + item.quantity * item.sprice, 0);
  const calculateQty = () => cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <View style={{ flex: 1 }}>
      <AppHeader 
        centerText="Home"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <EvilIcons name={'navicon'} size={35} color={colors.white} />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name={'log-out-outline'} size={24} color={colors.white} />
          </TouchableOpacity>
        }
      />
      <ProductsCashier 
        route={route} 
        cart={cart}
        setCart={setCart}
        onCartUpdate={fetchList}
      />
      <View style={styles.bottomView}>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>
            Subtotal {formatMoney(calculateTotal(), { symbol: '₱', precision: 2 })}
          </Text>
          <Text style={styles.checkoutText}>
            Qty {formatMoney(calculateQty(), { symbol: '', precision: 2 })}
          </Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationIn="slideInUp"
        animationInTiming={800}
        animationOutTiming={500}
        useNativeDriver={true}
        onBackButtonPress={() => setModalVisible(false)}
        backdropOpacity={0.1}
        isVisible={modalVisible}
        style={[
          styles.modalView,
          {
            height: orientation === "portrait" ? "50%" : "100%",
            width: orientation === "portrait" ? "100%" : "50%",
            alignSelf: orientation === "portrait" ? "center" : "flex-start",
          },
        ]}
      >
        <View style={styles.containerStyle}>
          <View style={styles.content}>
            <List
              navigation={navigation}
              discount_visible={setDiscountVisible}
              discount={selected}
              discount_name={discount_name}
              staff={staffData}
              cart={cart}
              setCart={setCart}
              onCartUpdate={fetchList}
              onDismiss={() => setModalVisible(false)}
            />
            <Spacer>
              <View style={styles.payButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.payButton,
                    { backgroundColor: cart.length === 0 ? colors.charcoalGrey : colors.accent },
                  ]}
                  onPress={() => cart.length !== 0 && onClickPay()}
                >
                  <Text style={styles.payButtonText}>P A Y</Text>
                </TouchableOpacity>
              </View>
            </Spacer>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalView: {
    justifyContent: "flex-end",
    margin: 0,
  },
  containerStyle: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    justifyContent: "center",
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bottomView: {
    flex: 1,
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    borderRadius: 20,
  },
  checkoutBtn: {
    backgroundColor: colors.accent,
    width: '80%',
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    borderRadius: 30,
    shadowColor: '#EBECF0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 1,
  },
  checkoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  payButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
  },
  payButton: {
    marginRight: 2,
    borderRadius: 15,
    paddingVertical: 10,
  },
  payButtonText: {
    textAlign: "center",
  },
});

export default CashierScreen;
