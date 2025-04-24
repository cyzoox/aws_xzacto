import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createDrawerNavigator} from '@react-navigation/drawer';
import CashierScreen from '../screens/cashier/CashierScreen';
import CheckoutScreen from '../screens/cashier/CheckoutScreen';
import ExpensesScreen from '../screens/cashier/ExpensesScreen';
import TransactionScreen from '../screens/cashier/TransactionsScreen';
import TransactionDetailsScreen from '../screens/cashier/TransactionDetailScreen';
import StaffManagementScreen from '../screens/StaffManagementScreen';
import ProductsScreen from '../screens/store/ProductsScreen';
import CreateProductScreen from '../screens/CreateProductScreen';
import BatchEditScreen from '../screens/BatchEditScreen';
import BatchAddScreen from '../screens/BatchAddScreen';
import { RoleBasedHeader } from '../components/RoleBasedHeader';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();


function DrawerNavigator({route}) {
  const { staffData } = route.params || {};
  
  // If no staffData or role, show only basic screens
  const isAdmin = staffData?.role && (staffData.role.includes('SuperAdmin') || staffData.role.includes('Admin'));


    return (
      <Drawer.Navigator
        backBehavior="history"
        screenOptions={{
          header: ({ navigation, route }) => (
            <RoleBasedHeader
              title={route.name}
              navigation={navigation}
              staffData={staffData}
            />
          ),
        }}>
        <Drawer.Screen
          name="Home"
          component={CashierScreen}
          initialParams={{staffData}}
          options={{headerShown: false}}
        />
        {isAdmin && (
          <Drawer.Screen
            name="Staff Management"
            component={StaffManagementScreen}
            initialParams={{staffData}}
            options={{headerShown: false}}
          />
        )}
        <Drawer.Screen
          name="Checkout"
          component={CheckoutScreen}
          initialParams={{staffData}}
          options={{headerShown: false}}
        />
        <Drawer.Screen
          name="Expenses"
          component={ExpensesScreen}
          initialParams={{staffData}}
          options={{headerShown: false}}
        />
        <Drawer.Screen
          name="Transactions"
          component={TransactionScreen}
          initialParams={{staffData}}
          options={{headerShown: false}}
        />
        <Drawer.Screen
          name="TransactionDetails"
          component={TransactionDetailsScreen}
          initialParams={{staffData}}
          options={{headerShown: false}}
        />
        {isAdmin && (
          <>
            <Drawer.Screen
              name="Products Dashboard"
              component={ProductsScreen}
              initialParams={{staffData}}
              options={{headerShown: false}}
            />
            <Drawer.Screen
              name="Create Product"
              component={CreateProductScreen}
              initialParams={{staffData}}
              options={{headerShown: false}}
            />
            <Drawer.Screen
              name="BatchEdit"
              component={BatchEditScreen}
              initialParams={{staffData}}
              options={{headerShown: false}}
            />
            <Drawer.Screen
              name="BatchAdd"
              component={BatchAddScreen}
              initialParams={{staffData}}
              options={{headerShown: false}}
            />
          </>
        )}
      </Drawer.Navigator>
    );
  }

  export default DrawerNavigator;

  
