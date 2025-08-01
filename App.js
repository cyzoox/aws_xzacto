import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, LogBox, View, Text, ActivityIndicator } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { PersistGate } from 'redux-persist/integration/react';
import { withAuthenticator } from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import awsconfig from './src/aws-exports';

// Configure Amplify
Amplify.configure(awsconfig);

// Import components
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import SuperAdminScreen from './src/screens/SuperAdminScreen';
import CheckSubscriptionsScreen from './src/screens/CheckSubscriptionsScreen';
import CashierNavigator from './src/navigation/CashierNavigator';
import WarehouseNavigator from './src/navigation/WarehouseNavigator';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import SuperAdminNavigator from './src/navigation/SuperAdminNavigator';
import DrawerNavigator from './src/navigation/DrawerNavigation';

// Import store
import { store, persistor } from './src/store';

// Ignore specific LogBox warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'Non-serializable values were found in the navigation state',
]);

const Stack = createStackNavigator();

// Simple fallback screen in case the app fails to load
const FallbackScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
    <Text style={{ fontSize: 24, marginBottom: 20, color: '#007AFF' }}>XZACTO</Text>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={{ marginTop: 20 }}>Loading application...</Text>
  </View>
);

const App = () => {
  // Immediately hide any splash screens when app starts
  // useEffect(() => {
  //   try {
  //     // Hide react-native-splash-screen if it exists
  //     if (SplashScreen && SplashScreen.hide) {
  //       SplashScreen.hide();
  //       console.log('Splash screen hidden successfully');
  //     }
  //   } catch (error) {
  //     console.error('Error hiding splash screen:', error);
  //   }
  // }, []);

  // Main app content once it's ready
  return (
    <ReduxProvider store={store}>
      <PaperProvider>
        <PersistGate loading={<FallbackScreen />} persistor={persistor}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
              <Stack.Screen name="SuperAdmin" component={SuperAdminNavigator} />
              <Stack.Screen name="CheckSubscriptions" component={CheckSubscriptionsScreen} />
              <Stack.Screen name="MainApp" component={BottomTabNavigator} />
              <Stack.Screen name="CashierApp" component={DrawerNavigator} />
              <Stack.Screen name="WarehouseApp" component={WarehouseNavigator} />
            </Stack.Navigator>
          </NavigationContainer>
        </PersistGate>
      </PaperProvider>
    </ReduxProvider>
  );
};

// Wrap the App component with withAuthenticator
export default withAuthenticator(App);
