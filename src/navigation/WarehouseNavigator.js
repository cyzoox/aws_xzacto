import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import WarehouseHomeScreen from '../screens/warehouse/WarehouseHomeScreen';
import WarehouseInventoryScreen from '../screens/warehouse/WarehouseInventoryScreen';
import StoreRequestsScreen from '../screens/warehouse/StoreRequestsScreen';
import OrderDetailsScreen from '../screens/warehouse/OrderDetailsScreen';
import BatchAddScreen from '../screens/BatchAddScreen';
import BatchEditScreen from '../screens/BatchEditScreen';
import WarehouseProductScreen from '../screens/warehouse/WarehouseProductScreen';
import {colors} from '../constants/theme';
import RequestDetailsScreen from '../screens/warehouse/RequestDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const HomeStack = ({staffData}) => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen
      name="WarehouseHome"
      component={WarehouseHomeScreen}
      initialParams={{staffData}}
    />
    <Stack.Screen
      name="WarehouseProductAdd"
      component={WarehouseProductScreen}
      options={{title: 'Add Warehouse Product'}}
    />
  </Stack.Navigator>
);

const InventoryStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen
      name="WarehouseInventory"
      component={WarehouseInventoryScreen}
    />
    <Stack.Screen name="BatchAdd" component={BatchAddScreen} />
    <Stack.Screen name="BatchEdit" component={BatchEditScreen} />
  </Stack.Navigator>
);
const RequestsStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="RequestsMain" component={StoreRequestsScreen} />
    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
  </Stack.Navigator>
);

// Tab navigation component
const TabNavigation = ({navigation, route, staffData}) => {
  return (
    <Tab.Navigator
      screenOptions={({route, focused}) => ({
        tabBarIcon: ({size}) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Inventory') {
            iconName = focused ? 'warehouse' : 'warehouse-outline';
          } else if (route.name === 'Requests') {
            iconName = focused ? 'truck-delivery' : 'truck-delivery-outline';
          }
          return <Icon name={iconName} size={size} color={colors.primary} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen
        name="Home"
        component={HomeStack}
        initialParams={{staffData}}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryStack}
        initialParams={{staffData}}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsStack}
        initialParams={{staffData}}
      />
    </Tab.Navigator>
  );
};

const WarehouseNavigator = ({staffData}) => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen
        name="TabScreens"
        component={TabNavigation}
        initialParams={{staffData}}
      />
      <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
    </Stack.Navigator>
  );
};

export default WarehouseNavigator;
