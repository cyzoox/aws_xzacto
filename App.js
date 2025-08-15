import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {StatusBar, LogBox, View, Text, ActivityIndicator} from 'react-native';
import {Provider as ReduxProvider} from 'react-redux';
import {Provider as PaperProvider} from 'react-native-paper';
import {PersistGate} from 'redux-persist/integration/react';
import {withAuthenticator} from '@aws-amplify/ui-react-native';
import {Amplify, Hub} from 'aws-amplify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import awsconfig from './src/aws-exports';

// We're no longer using DataStore for store settings due to initialization issues
// Using AsyncStorage instead for a simpler and more reliable approach

// Configure Amplify basic services
Amplify.configure(awsconfig);

// Import components
import OnboardingScreen from './src/screens/OnboardingScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import SuperAdminScreen from './src/screens/SuperAdminScreen';
import CheckSubscriptionsScreen from './src/screens/CheckSubscriptionsScreen';
import CashierNavigator from './src/navigation/CashierNavigator';
import WarehouseNavigator from './src/navigation/WarehouseNavigator';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import SuperAdminNavigator from './src/navigation/SuperAdminNavigator';
import DrawerNavigator from './src/navigation/DrawerNavigation';

// Import store
import {store, persistor} from './src/store';

// Ignore specific LogBox warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'Non-serializable values were found in the navigation state',
]);

const Stack = createStackNavigator();

// Simple fallback screen in case the app fails to load
const FallbackScreen = () => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    }}>
    <Text style={{fontSize: 24, marginBottom: 20, color: '#007AFF'}}>
      XZACTO
    </Text>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={{marginTop: 20}}>Loading application...</Text>
  </View>
);

// Import DataSyncService
import DataSyncService from './src/services/DataSyncService';

const App = () => {
  // State to track if onboarding has been seen
  const [initialRoute, setInitialRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataStoreReady, setDataStoreReady] = useState(false);

  // Initialize app services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('Initializing app services...');
        
        // Initialize services that don't require DataStore
        // We've removed DataStore for store settings due to initialization issues
        
        // Initialize any other services needed here
        
        // Preload any critical app data from AsyncStorage
        // This aligns with the optimization strategy to prefetch data at startup
        try {
          // You can add any critical data preloading here
          // Example: await AsyncStorage.getItem('@AppSettings');
        } catch (storageError) {
          console.error('Error preloading data:', storageError);
        }
        
        // Mark app as ready to render
        setDataStoreReady(true);
        console.log('App services initialized successfully');
      } catch (error) {
        console.error('Error during app initialization:', error);
        // Continue the app flow despite initialization error
        setDataStoreReady(true);
      }
    };
    
    initializeServices();
  }, []);
  
  // Check if user has seen onboarding on app startup
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        if (hasSeenOnboarding === 'true') {
          setInitialRoute('RoleSelection');
        } else {
          setInitialRoute('Onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Default to showing onboarding if there's an error
        setInitialRoute('Onboarding');
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  // Show loading screen until we determine the initial route and DataStore is ready
  if (isLoading || !dataStoreReady) {
    return <FallbackScreen />;
  }

  // Main app content once it's ready
  return (
    <ReduxProvider store={store}>
      <PaperProvider>
        <PersistGate loading={<FallbackScreen />} persistor={persistor}>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <NavigationContainer>
            <Stack.Navigator 
              initialRouteName={initialRoute}
              screenOptions={{headerShown: false}}>
              <Stack.Screen 
                name="Onboarding"
                component={OnboardingScreen}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen
                name="RoleSelection"
                component={RoleSelectionScreen}
              />
              <Stack.Screen name="SuperAdmin" component={SuperAdminNavigator} />
              <Stack.Screen
                name="CheckSubscriptions"
                component={CheckSubscriptionsScreen}
              />
              <Stack.Screen name="MainApp" component={BottomTabNavigator} />
              <Stack.Screen name="CashierApp" component={DrawerNavigator} />
              <Stack.Screen
                name="WarehouseApp"
                component={WarehouseNavigator}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PersistGate>
      </PaperProvider>
    </ReduxProvider>
  );
};

// Wrap the App component with withAuthenticator
export default withAuthenticator(App);
