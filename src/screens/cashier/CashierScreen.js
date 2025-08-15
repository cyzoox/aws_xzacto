import React, {useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import List from '../../components/List';
import Spacer from '../../components/Spacer';
import colors from '../../themes/colors';
import AppHeader from '../../components/AppHeader';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import ProductsCashier from '../../components/ProductsCashier';
import {listCartItems} from '../../graphql/queries';
import {generateClient} from 'aws-amplify/api';
import Appbar from '../../components/Appbar';

const client = generateClient();

const CashierScreen = ({navigation, route}) => {
  const {staffData} = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [cart, setCart] = useState([]);
  const [selected, setSelected] = useState(0);
  const [discount_name, setDiscountName] = useState('');
  const [discountVisible, setDiscountVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
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
                routes: [{name: 'RoleSelection'}],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const onClickPay = () => {
    setModalVisible(false);
    navigation.navigate('Checkout');
  };

  const fetchList = async () => {
    console.log(
      `Fetching cart items for store ${staffData.store_id}, cashier ${staffData.id}`,
    );
    try {
      // Add a controller to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const result = await client.graphql({
        query: listCartItems,
        variables: {
          filter: {
            storeId: {eq: staffData.store_id},
            cashierId: {eq: staffData.id},
          },
          limit: 100, // Make sure we get all items
        },
        abortSignal: controller.signal,
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
      const {height, width} = Dimensions.get('window');
      setOrientation(height >= width ? 'portrait' : 'landscape');
    };

    const subscription = Dimensions.addEventListener(
      'change',
      handleOrientationChange,
    );

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
      console.log(
        'Refreshing cart due to refreshCart flag, timestamp:',
        route.params?.timestamp,
      );
      // Immediately show empty cart for better perceived performance
      setCart([]);

      // Add a small delay to ensure database operations complete
      setTimeout(() => {
        fetchList();
      }, 500);
    }
  }, [route.params?.refreshCart, route.params?.timestamp]);

  const calculateTotal = () =>
    cart.reduce((total, item) => total + item.quantity * item.sprice, 0);
  const calculateQty = () =>
    cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <View style={{flex: 1}}>
      <Appbar
        title="POS Dashboard"
        onMenuPress={() => navigation.openDrawer()}
      />

      <ProductsCashier
        route={route}
        cart={cart}
        setCart={setCart}
        onCartUpdate={fetchList}
      />
      <View style={styles.bottomView}>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => setModalVisible(true)}>
          <LinearGradient
            colors={['#00A7D5', '#00A7D5']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.checkoutGradient}>
            <View style={styles.checkoutContent}>
              <Text style={styles.checkoutQtyText}>{calculateQty()} items</Text>
              <Text style={styles.checkoutTotalText}>
                {formatMoney(calculateTotal(), {symbol: '₱', precision: 2})}
              </Text>
              <View style={styles.checkoutActionContainer}>
                <Text style={styles.checkoutActionText}>Checkout</Text>
                <Ionicons
                  name="arrow-forward-outline"
                  size={20}
                  color={colors.white}
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <Modal
        animationIn="slideInUp"
        animationInTiming={800}
        animationOutTiming={500}
        useNativeDriver={true}
        onBackButtonPress={() => setModalVisible(false)}
        backdropOpacity={0}
        isVisible={modalVisible}
        style={[
          styles.modalView,
          {
            height: orientation === 'portrait' ? '50%' : '100%',
            width: orientation === 'portrait' ? '100%' : '50%',
            alignSelf: orientation === 'portrait' ? 'center' : 'flex-start',
          },
        ]}>
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
                    {
                      backgroundColor:
                        cart.length === 0 ? colors.charcoalGrey : colors.accent,
                    },
                  ]}
                  onPress={() => cart.length !== 0 && onClickPay()}>
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
    justifyContent: 'flex-end',
    margin: 0,
  },
  containerStyle: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bottomView: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  checkoutBtn: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 1,
  },
  checkoutGradient: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  checkoutContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  checkoutQtyText: {
    color: colors.white,
    fontSize: 16,
  },
  checkoutTotalText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkoutActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutActionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  payButtonContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  payButton: {
    borderRadius: 30,
    paddingVertical: 15,
    width: '100%',
  },
  payButtonText: {
    textAlign: 'center',
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CashierScreen;
