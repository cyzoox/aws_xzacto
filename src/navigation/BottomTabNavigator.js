import React, {useState, useEffect} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {View, Text, StyleSheet, Platform} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import centralized data service
import {dataService} from '../services/dataService';

// Screen Imports
import HomeScreen from '../screens/HomeScreen';
import StoreScreen from '../screens/store/StoreScreen';
import StoreDashboard from '../screens/store/StoreDashboard';
import ProductsScreen from '../screens/store/ProductsScreen';
import Supplier from '../screens/store/SupplierScreen';
import StaffsScreen from '../screens/store/StaffScreen';
import CustomerScreen from '../screens/customer/CustomerScreen';
import ExpensesScreen from '../screens/store/ExpensesScreen';
import StoreSettings from '../screens/store/StoreSettings';
import DeliveryRequestScreen from '../screens/store/DeliveryRequestScreen';
import StoreRequestsScreen from '../screens/store/StoreRequestsScreen';
import ReportsScreen from '../screens/store/ReportsScreen';
import SummaryReportScreen from '../screens/store/SummaryReportScreen';
import SalesAnalyticsScreen from '../screens/reports/SalesAnalyticsScreen';
import RemainingStockScreen from '../screens/reports/RemainingStockScreen';
import CreateProductScreen from '../screens/CreateProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import BatchEditScreen from '../screens/BatchEditScreen';
import BatchAddScreen from '../screens/BatchAddScreen';
import BillsAndReceipt from '../screens/store/BillsAndReceipt';
import CreditScreen from '../screens/store/CreditScreen';
import CreditTransactionsScreen from '../screens/store/CreditTransactionsScreen';
import BillsAndReceiptReports from '../screens/store/BillsAndReceiptReports';
import BillsAndReceiptItemsReport from '../screens/store/BillsAndReceiptItemsReport';

const Tab = createBottomTabNavigator();
const StoreStack = createStackNavigator();
const HomeStack = createStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <HomeStack.Screen
        name="CustomerScreen"
        component={CustomerScreen}
        options={{headerShown: false}}
      />
    </HomeStack.Navigator>
  );
}

function StoreStackScreen() {
  return (
    <StoreStack.Navigator>
      <StoreStack.Screen
        name="StoresScreen"
        component={StoreScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="StoreDashboard"
        component={StoreDashboard}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="ProductDashboard"
        component={ProductsScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="CreateProduct"
        component={CreateProductScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="BatchAdd"
        component={BatchAddScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="Supplier"
        component={Supplier}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="BatchEdit"
        component={BatchEditScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="DeliveryRequest"
        component={DeliveryRequestScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="StoreRequests"
        component={StoreRequestsScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="Staffs"
        component={StaffsScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="Customers"
        component={CustomerScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="Settings"
        component={StoreSettings}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="CreditScreen"
        component={CreditScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="SummaryReport"
        component={SummaryReportScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="SalesAnalytics"
        component={SalesAnalyticsScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="RemainingStock"
        component={RemainingStockScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="BillsAndReceipt"
        component={BillsAndReceipt}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="BillsAndReceiptReports"
        component={BillsAndReceiptReports}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="BillsAndReceiptItemsReport"
        component={BillsAndReceiptItemsReport}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="CreditTransactionsScreen"
        component={CreditTransactionsScreen}
        options={{headerShown: false}}
      />
    </StoreStack.Navigator>
  );
}

const BottomTabNavigator = () => {
  const [pendingRequests, setPendingRequests] = useState(0);
  const [storeName, setStoreName] = useState('Store');
  const [homeName, setHomeName] = useState('Home');

  useEffect(() => {
    const fetchNotificationData = async () => {
      try {
        const sessionData = await AsyncStorage.getItem('staffSession');
        if (!sessionData) {
          return;
        }

        const parsedData = JSON.parse(sessionData);
        if (!parsedData.storeData) {
          console.log('Store data not found in session');
          return;
        }

        const {storeData} = parsedData;
        setStoreName(storeData.name || 'Store');
        const storeId = storeData.id;

        const inventoryRequests = await dataService.getPendingInventoryRequests(
          storeId,
        );
        setPendingRequests(inventoryRequests.length);
      } catch (error) {
        console.error('Error fetching notification data:', error);
      }
    };

    fetchNotificationData();

    const intervalId = setInterval(fetchNotificationData, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarInactiveTintColor: '#888',
        tabBarActiveTintColor: '#007AFF',
      }}>
      <Tab.Screen
        name={homeName}
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <View style={styles.iconContainer}>
              <Ionicons name="home-outline" color={color} size={size} />
              <Text style={{color, fontSize: 12}}>{homeName}</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name={storeName}
        component={StoreStackScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="store-outline"
                color={color}
                size={size}
              />
              <Text style={{color, fontSize: 12}}>{storeName}</Text>
            </View>
          ),
          tabBarBadge: pendingRequests > 0 ? pendingRequests : null,
          tabBarBadgeStyle: {backgroundColor: 'red'},
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    elevation: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    height: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default BottomTabNavigator;
