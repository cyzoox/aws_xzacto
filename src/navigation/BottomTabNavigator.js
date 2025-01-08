import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import StoreScreen from '../screens/store/StoreScreen';
import StoreDashboard from '../screens/store/StoreDashboard';
import ProductScreen from '../screens/store/ProductScreen';
import Supplier from '../screens/store/SupplierScreen';
import { ProductDetails } from '../components/ProductDetails';
import StaffsScreen from '../screens/store/StaffScreen';
import CustomerScreen from '../screens/store/CustomerScreen';
import ExpensesScreen from '../screens/store/ExpensesScreen';
import StoreSettings from '../screens/store/StoreSettings';

const Tab = createBottomTabNavigator();
const StoreStack = createStackNavigator();

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
        component={ProductScreen}
        options={{headerShown: false}}
      />
      <StoreStack.Screen
        name="ProductDetails"
        component={ProductDetails}
        options={{headerShown: false}}
      />
       <StoreStack.Screen
        name="Supplier"
        component={Supplier}
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
    </StoreStack.Navigator>
  );
}


const BottomTabNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/>
      <Tab.Screen name="Stores" component={StoreStackScreen} options={{ headerShown: false }}/>
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
