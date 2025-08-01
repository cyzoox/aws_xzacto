import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import SuperAdminNavigator from './SuperAdminNavigator';
import StoreManagementScreen from '../screens/store/StoreManagementScreen';

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab screen options helper
const getTabScreenOptions = (iconName, label) => ({
  tabBarIcon: ({ color, size }) => (
    <Icon name={iconName} color={color} size={size} />
  ),
  tabBarLabel: label,
  headerShown: false,
});

// Stack screen options
const stackScreenOptions = {
  headerShown: true,
  headerStyle: {
    backgroundColor: '#007AFF',
  },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
};

// Main application navigator - for Admin and SuperAdmin users
const MainNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={SuperAdminNavigator}
        options={getTabScreenOptions('view-dashboard', 'Dashboard')}
      />
      <Tab.Screen
        name="Stores"
        component={StoreStack}
        options={getTabScreenOptions('store', 'Stores')}
      />
    </Tab.Navigator>
  );
};

// Store management stack
const StoreStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen 
      name="StoreManagement" 
      component={StoreManagementScreen} 
      options={{ title: 'Store Management' }}
    />
  </Stack.Navigator>
);

export default MainNavigator;
