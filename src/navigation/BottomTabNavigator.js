import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import centralized data service
import { dataService } from '../services/dataService';

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
import CreateProductScreen from '../screens/CreateProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import BatchEditScreen from '../screens/BatchEditScreen';
import BatchAddScreen from '../screens/BatchAddScreen';
import BillsAndReceipt from '../screens/store/BillsAndReceipt';

const Tab = createBottomTabNavigator();
const StoreStack = createStackNavigator();
const HomeStack = createStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="CustomerScreen"
        component={CustomerScreen}
        options={{ headerShown: false }}
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
        name="BillsAndReceipt"
        component={BillsAndReceipt}
        options={{headerShown: false}}
      />
    </StoreStack.Navigator>
  );
}

const BottomTabNavigator = () => {
  const [pendingRequests, setPendingRequests] = useState(0);
  const [newTransactions, setNewTransactions] = useState(0);
  const [storeName, setStoreName] = useState('Store');
  const [homeName, setHomeName] = useState('Home');
  
  // Select data from Redux store
  const { loading: storeLoading } = useSelector(state => state.store);
  const sales = useSelector(state => state.sales?.items) || [];
  
  useEffect(() => {
    const fetchNotificationData = async () => {
      try {        
        // Get store information from session
        const sessionData = await AsyncStorage.getItem('staffSession');
        if (!sessionData) return;
        
        const parsedData = JSON.parse(sessionData);
        if (!parsedData.storeData) {
          console.log('Store data not found in session');
          return;
        }
        
        const { storeData } = parsedData;
        setStoreName(storeData.name || 'Store');
        const storeId = storeData.id;
        
        // Use centralized data service to fetch pending requests
        const inventoryRequests = await dataService.getPendingInventoryRequests(storeId);
        setPendingRequests(inventoryRequests.length);
        
        // Get today's transactions from Redux state instead of refetching
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        
        const todayTransactions = sales.filter(tx => 
          tx.storeId === storeId && 
          tx.createdAt >= todayStart && 
          !tx._deleted
        );
        
        setNewTransactions(todayTransactions.length);
        
      } catch (error) {
        console.error('Error fetching notification data:', error);
      }
    };
    
    // Initial fetch
    fetchNotificationData();
    
    // Set up interval to refresh data every 5 minutes
    const intervalId = setInterval(fetchNotificationData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [sales]); // Only re-run when sales data changes
  
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Stores') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3A6EA5',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {height: 60, paddingBottom: 5},
        tabBarLabelStyle: {fontSize: 12},
      })}>
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarLabel: homeName,
          headerShown: false,
          tabBarBadge: pendingRequests > 0 ? pendingRequests : null,
          tabBarBadgeStyle: {backgroundColor: '#dc3545'},
        }}
      />
      <Tab.Screen
        name="Stores"
        component={StoreStackScreen}
        options={{
          headerShown: false,
          tabBarLabel: storeName,
          tabBarBadge: pendingRequests > 0 ? pendingRequests : null,
          tabBarBadgeStyle: {backgroundColor: '#dc3545'},
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
