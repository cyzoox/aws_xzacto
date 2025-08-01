import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import SuperAdminScreen from '../screens/SuperAdminScreen';
import StaffManagementScreen from '../screens/StaffManagementScreen';
import StoreManagementScreen from '../screens/StoreManagementScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import { RoleBasedHeader } from '../components/RoleBasedHeader';

const Drawer = createDrawerNavigator();

function SuperAdminNavigator({route}) {
  const { staffData } = route.params;

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
        name="SuperAdminDashboard"
        component={SuperAdminScreen}
        initialParams={{staffData}}
        options={{headerShown: false}}
      />
      <Drawer.Screen
        name="Staff Management"
        component={StaffManagementScreen}
        initialParams={{staffData}}
        options={{headerShown: false}}
      />
      <Drawer.Screen
        name="Store Management"
        component={StoreManagementScreen}
        initialParams={{staffData}}
        options={{headerShown: false}}
      />
      <Drawer.Screen
        name="Subscription"
        component={SubscriptionScreen}
        initialParams={{staffData}}
        options={{headerShown: false}}
      />
    </Drawer.Navigator>
  );
}

export default SuperAdminNavigator;
