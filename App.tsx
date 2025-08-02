import React, {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {Provider as PaperProvider} from 'react-native-paper';
import {Provider as ReduxProvider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistor} from './src/store';
import {syncService} from './src/services/syncService';
import {dataService} from './src/services/dataService';
import {createStackNavigator} from '@react-navigation/stack';
import {
  withAuthenticator,
  useAuthenticator,
} from '@aws-amplify/ui-react-native';
import {NavigationContainer} from '@react-navigation/native';
import {StoreProvider} from './src/context/StoreContext';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import CashierScreen from './src/screens/cashier/CashierScreen';
import DrawerNavigator from './src/navigation/DrawerNavigation';
import SuperAdminNavigator from './src/navigation/SuperAdminNavigator';
import WarehouseNavigator from './src/navigation/WarehouseNavigator';
import './src/navigation/gesture-handler';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
const Stack = createStackNavigator();

const App = () => {
  useEffect(() => {
    // Initialize services
    syncService.init();

    // Pre-fetch core data for better performance and offline capability
    const initializeData = async () => {
      try {
        await dataService.fetchInitialData();
        console.log('Initial data fetching complete');
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();

    return () => syncService.destroy();
  }, []);

  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PaperProvider>
          <StoreProvider>
            <GestureHandlerRootView style={{flex: 1}}>
              <NavigationContainer>
                <Stack.Navigator initialRouteName="RoleSelection">
                  {/* Role selection screen */}
                  <Stack.Screen
                    name="RoleSelection"
                    component={RoleSelectionScreen}
                    options={{headerShown: false}}
                  />
                  {/* SuperAdmin application */}
                  <Stack.Screen
                    name="SuperAdminScreen"
                    component={SuperAdminNavigator}
                    initialParams={{staffData: null}}
                    options={{headerShown: false}}
                  />
                  {/* Admin application */}
                  <Stack.Screen
                    name="MainApp"
                    component={BottomTabNavigator}
                    initialParams={{staffData: null}}
                    options={{headerShown: false}}
                  />
                  {/* Cashier application */}
                  <Stack.Screen
                    name="CashierApp"
                    component={DrawerNavigator}
                    initialParams={{staffData: null}}
                    options={{headerShown: false}}
                  />
                  {/* Warehouse application */}
                  <Stack.Screen
                    name="WarehouseApp"
                    component={WarehouseNavigator}
                    initialParams={{staffData: null}}
                    options={{headerShown: false}}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </GestureHandlerRootView>
          </StoreProvider>
        </PaperProvider>
      </PersistGate>
    </ReduxProvider>
  );
};

export default withAuthenticator(App);

const styles = StyleSheet.create({
  container: {width: 400, flex: 1, padding: 20, alignSelf: 'center'},
  todo: {marginBottom: 15},
  input: {
    backgroundColor: '#ddd',
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
  },
  todoName: {fontSize: 20, fontWeight: 'bold'},
  buttonContainer: {
    alignSelf: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 8,
  },
  buttonText: {color: 'white', padding: 16, fontSize: 18},
});
