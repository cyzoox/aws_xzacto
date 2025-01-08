import React, { useEffect, useState } from 'react';
import  {uploadData}  from '@aws-amplify/storage';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  SafeAreaView
} from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { createTodo } from './src/graphql/mutations';
import { listTodos } from './src/graphql/queries';
import {createStackNavigator} from '@react-navigation/stack';
import {
  withAuthenticator,
  useAuthenticator
} from '@aws-amplify/ui-react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import CashierScreen from './src/screens/cashier/CashierScreen';
import DrawerNavigator from './src/navigation/DrawerNavigation';
import './src/navigation/gesture-handler'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
const Stack = createStackNavigator();

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <NavigationContainer>
    <Stack.Navigator initialRouteName="RoleSelection">
      {/* Role selection screen for admin or cashier */}
      <Stack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
        options={{ headerShown: false }}
      />
      {/* Main application */}
      <Stack.Screen
        name="MainApp"
        component={BottomTabNavigator}
        initialParams={{ staffData: null }} 
        options={{ headerShown: false }}
      />
       <Stack.Screen
          name="CashierApp"
          component={DrawerNavigator}
          initialParams={{ staffData: null }} 
          options={{ headerShown: false }}
        />
    </Stack.Navigator>
  </NavigationContainer>
  </GestureHandlerRootView>
  );
};

export default withAuthenticator(App);

const styles = StyleSheet.create({
  container: { width: 400, flex: 1, padding: 20, alignSelf: 'center' },
  todo: { marginBottom: 15 },
  input: {
    backgroundColor: '#ddd',
    marginBottom: 10,
    padding: 8,
    fontSize: 18
  },
  todoName: { fontSize: 20, fontWeight: 'bold' },
  buttonContainer: {
    alignSelf: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 8
  },
  buttonText: { color: 'white', padding: 16, fontSize: 18 }
});