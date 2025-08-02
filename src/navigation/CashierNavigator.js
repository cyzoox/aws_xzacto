import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {View, Text} from 'react-native';

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Temporary placeholder screen for Cashier functionality
const CashierHomeScreen = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <Text style={{fontSize: 24, fontWeight: 'bold'}}>Cashier Home</Text>
    <Text style={{marginTop: 10}}>Point of Sale Terminal</Text>
  </View>
);

// Temporary placeholder screen for order history
const OrderHistoryScreen = () => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
    <Text style={{fontSize: 24, fontWeight: 'bold'}}>Order History</Text>
  </View>
);

// Tab screen options helper
const getTabScreenOptions = (iconName, label) => ({
  tabBarIcon: ({color, size}) => (
    <Icon name={iconName} color={color} size={size} />
  ),
  tabBarLabel: label,
  headerShown: true,
  headerStyle: {
    backgroundColor: '#007AFF',
  },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
});

// Cashier interface navigator
const CashierNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="POS"
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      }}>
      <Tab.Screen
        name="POS"
        component={CashierHomeScreen}
        options={getTabScreenOptions('cash-register', 'POS')}
      />
      <Tab.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={getTabScreenOptions('history', 'History')}
      />
    </Tab.Navigator>
  );
};

export default CashierNavigator;
