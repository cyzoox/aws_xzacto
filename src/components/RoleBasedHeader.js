import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Appbar, Menu, IconButton} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';

// Reset navigation flag when logging out
let hasNavigated = false;

export function RoleBasedHeader({title, navigation, staffData}) {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      setMenuVisible(false); // Close menu before logout

      // Clear all session data
      await AsyncStorage.removeItem('staffSession');
      await AsyncStorage.removeItem('@store');
      await AsyncStorage.removeItem('@currency');

      // Clear Redux store
      dispatch({type: 'store/clearAll'});
      dispatch({type: 'staff/clearAll'});
      dispatch({type: 'sales/clearAll'});

      // Reset navigation flag and navigate
      hasNavigated = false; // Reset the flag so login screen can work
      navigation.reset({
        index: 0,
        routes: [{name: 'RoleSelection'}],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <Appbar.Header style={styles.header}>
      {navigation.canGoBack() ? (
        <Appbar.BackAction onPress={() => navigation.goBack()} />
      ) : (
        <Appbar.Action icon="menu" onPress={() => navigation.openDrawer()} />
      )}

      <Appbar.Content title={title} />

      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <IconButton
            icon="account"
            size={24}
            onPress={() => setMenuVisible(true)}
          />
        }>
        <Menu.Item title={staffData?.name || 'User'} disabled />
        <Menu.Item title={staffData?.role?.[0] || 'No Role'} disabled />
        <Menu.Item onPress={handleLogout} title="Logout" />
      </Menu>
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  header: {
    elevation: 4,
  },
});
