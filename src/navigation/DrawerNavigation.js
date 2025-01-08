import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createDrawerNavigator} from '@react-navigation/drawer';
import CashierScreen from '../screens/cashier/CashierScreen';
import { DrawerContent } from '../components/DrawerContent';
import CheckoutScreen from '../screens/cashier/CheckoutScreen';
import ExpensesScreen from '../screens/cashier/ExpensesScreen';
import TransactionScreen from '../screens/cashier/TransactionsScreen';
import TransactionDetailsScreen from '../screens/cashier/TransactionDetailScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();


function DrawerNavigator({route}) {
  const { staffData } = route.params;

    return (
      <Drawer.Navigator
        backBehavior="history"
        drawerContent={props => (
          <DrawerContent {...props} staffData={staffData} />
        )}>
        <Drawer.Screen
          name="Home"
          component={CashierScreen}
          initialParams={{staffData}}
          options={{headerShown: false}}
        />
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
          options={{headerShown: false}} />
      </Drawer.Navigator>
    );
  }

  export default DrawerNavigator;

  
