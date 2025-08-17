import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WarehouseHomeScreen from '../screens/warehouse/WarehouseHomeScreen';
import WarehouseInventoryScreen from '../screens/warehouse/WarehouseInventoryScreen';
import StoreRequestsScreen from '../screens/warehouse/StoreRequestsScreen';
import RequestDetailsScreen from '../screens/warehouse/RequestDetailsScreen';
import WarehouseProductAddScreen from '../screens/warehouse/WarehouseProductAddScreen';
import WarehouseSummaryReportScreen from '../screens/warehouse/WarehouseSummaryReportScreen';
import BatchAddScreen from '../screens/BatchAddScreen';
import BatchEditScreen from '../screens/BatchEditScreen';
import {colors} from '../constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Shared screen options for stack navigators
const stackScreenOptions = {
  headerShown: false,
  headerStyle: {
    backgroundColor: colors.primary,
  },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
};

// Helper for tab screen options
const getTabScreenOptions = (iconName, label) => ({
  tabBarIcon: ({color, size, focused}) => (
    <Icon name={focused ? iconName : iconName} color={color} size={size} />
  ),
  tabBarLabel: label,
  headerShown: false, // We show headers on the stack, not the tab
});

// Stack Navigators for each tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen
      name="WarehouseHome"
      component={WarehouseHomeScreen}
      // options={{ title: 'Warehouse Dashboard' }}
    />
  </Stack.Navigator>
);

const InventoryStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen
      name="WarehouseInventory"
      component={WarehouseInventoryScreen}
      // options={{ title: 'Inventory' }}
    />
    <Stack.Screen
      name="WarehouseProductAddScreen"
      component={WarehouseProductAddScreen}
      options={{title: 'Add Product'}}
    />
    <Stack.Screen
      name="BatchAdd"
      component={BatchAddScreen}
      // options={{ title: 'Add Batch' }}
    />
    <Stack.Screen
      name="BatchEdit"
      component={BatchEditScreen}
      options={{title: 'Edit Batch'}}
    />
  </Stack.Navigator>
);

const RequestsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen
      name="RequestsMain"
      component={StoreRequestsScreen}
      options={{title: 'Store Requests'}}
    />
    <Stack.Screen
      name="RequestDetails"
      component={RequestDetailsScreen}
      // options={{ title: 'Request Details' }}
    />
  </Stack.Navigator>
);

const ReportsStack = () => (
  <Stack.Navigator screenOptions={stackScreenOptions}>
    <Stack.Screen
      name="WarehouseSummaryReport"
      component={WarehouseSummaryReportScreen}
      options={{title: 'Inventory Reports'}}
    />
  </Stack.Navigator>
);

// Main Warehouse Navigator (Tab-based)
const WarehouseNavigator = ({route}) => {
  // staffData is passed via route.params from the parent navigator
  const {staffData} = route.params;

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
      }}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={getTabScreenOptions('home', 'Home')}
        initialParams={{staffData}}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryStack}
        options={getTabScreenOptions('warehouse', 'Inventory')}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsStack}
        options={getTabScreenOptions('truck-delivery', 'Requests')}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsStack}
        options={getTabScreenOptions('chart-bar', 'Reports')}
      />
    </Tab.Navigator>
  );
};

export default WarehouseNavigator;
