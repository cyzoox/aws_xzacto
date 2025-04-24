import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import {
  DrawerItem,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import {
  Title,
  Caption,
  Drawer,
  Text,
} from 'react-native-paper';
import colors from '../themes/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Alert from './Alert';

export function DrawerContent(props) {
  const { staffData } = props;
  const [alerts, setAlert] = useState(false);
  const [switch_alerts, setSwitchAlert] = useState(false);
  const [switchStore, setSwitchStore] = useState(false);
  
  // Check if user is SuperAdmin
  const isSuperAdmin = staffData?.role?.includes('SuperAdmin');
  const onSwitch = async() => {
    await AsyncStorage.removeItem('@store');
    await AsyncStorage.removeItem('@currency');
    props.navigation.goBack();

  }

  const logout = async () => {
    try {
      // Clear all session data
      await AsyncStorage.removeItem('staffSession');
      await AsyncStorage.removeItem('@store');
      await AsyncStorage.removeItem('@currency');
      
      // Navigate back to role selection
      props.navigation.replace('RoleSelection');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const onCancelAlert = () => {
    setAlert(false);
  }

  const onCancelSwitchAlert = () => {
    setSwitchAlert(false)
  }
  return (
    <DrawerContentScrollView {...props}>
      <Alert
        visible={alerts}
        onCancel={onCancelAlert}
        onProceed={logout}
        title="Log Out?"
        content="Do you really want to log out?"
        confirmTitle="Yes"
      />
      <Alert
        visible={switch_alerts}
        onCancel={onCancelSwitchAlert}
        onProceed={onSwitch}
        title="Switch Store?"
        content="Do you really want to switch store?"
        confirmTitle="Yes"
      />
      <View style={styles.drawerContent}>
        <View style={styles.userInfoSection}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
            <Title style={styles.title}>XZACTO</Title>
            <Title style={styles.branch_title}>
              {staffData ? staffData.name : 'No Branch'}
            </Title>
          </View>
          <View
            style={{
              borderTopWidth: 2,
              borderColor: colors.primary,
              marginRight: 15,
              marginBottom: 10,
            }}
          />
          <View>
            <TouchableOpacity
              style={styles.attendantInfo}
              onPress={() => props.navigation.navigate('Attendance')}>
              <Image
                source={require('../../assets/assets/cashier.png')}
                style={{width: 45, height: 45}}
              />
              <View>
                <Caption style={styles.caption}>
                  {staffData ? staffData.name : 'No Attendant'}
                </Caption>
                {!staffData && (
                  <Text style={styles.attendantText}>Tap to Change</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <Drawer.Section style={styles.drawerSection}>
          {isSuperAdmin && (
            <>
              <DrawerItem
                icon={({color, size}) => (
                  <Image
                    source={require('../../assets/assets/fintech.png')}
                    style={{width: 30, height: 30}}
                  />
                )}
                label="Dashboard"
                labelStyle={styles.drawerItemLabel}
                onPress={() => props.navigation.navigate('SuperAdminDashboard')}
              />
              <DrawerItem
                icon={({color, size}) => (
                  <Image
                    source={require('../../assets/assets/settings.png')}
                    style={{width: 30, height: 30}}
                  />
                )}
                label="Staff Management"
                labelStyle={styles.drawerItemLabel}
                onPress={() => props.navigation.navigate('Staff Management')}
              />
              <DrawerItem
                icon={({color, size}) => (
                  <Image
                    source={require('../../assets/assets/fintech.png')}
                    style={{width: 30, height: 30}}
                  />
                )}
                label="Store Management"
                labelStyle={styles.drawerItemLabel}
                onPress={() => props.navigation.navigate('Store Management')}
              />
            </>
          )}
          <DrawerItem
            icon={({color, size}) => (
              <Image
                source={require('../../assets/assets/payment.png')}
                style={{width: 30, height: 35}}
              />
            )}
            label="Customers"
            labelStyle={styles.drawerItemLabel}
            onPress={() => props.navigation.navigate('Customer')}
          />
          <DrawerItem
            icon={({color, size}) => (
              <Image
                source={require('../../assets/assets/payment.png')}
                style={{width: 30, height: 35}}
              />
            )}
            label="Credit Transactions"
            labelStyle={styles.drawerItemLabel}
            onPress={() => props.navigation.navigate('Credits')}
          />
          <DrawerItem
            icon={({color, size}) => (
              <Image
                source={require('../../assets/assets/expenses.png')}
                style={{width: 30, height: 30}}
              />
            )}
            label="Expenses"
            labelStyle={styles.drawerItemLabel}
            onPress={() => props.navigation.navigate('Expenses')}
          />
          <DrawerItem
            icon={({color, size}) => (
              <Image
                source={require('../../assets/assets/fintech.png')}
                style={{width: 30, height: 30}}
              />
            )}
            label="Transactions"
            labelStyle={styles.drawerItemLabel}
            onPress={() => props.navigation.navigate('Transactions')}
          />
          <DrawerItem
            icon={({color, size}) => (
              <Image
                source={require('../../assets/assets/fintech.png')}
                style={{width: 30, height: 30}}
              />
            )}
            label="Delivery Request"
            labelStyle={styles.drawerItemLabel}
            onPress={() => props.navigation.navigate('DeliveryRequest')}
          />
          <DrawerItem
            icon={({color, size}) => (
              <Image
                source={require('../../assets/assets/settings.png')}
                style={{width: 30, height: 30}}
              />
            )}
            label="Settings"
            labelStyle={styles.drawerItemLabel}
            onPress={() => props.navigation.navigate('Settings')}
          />
        </Drawer.Section>
        <Drawer.Section>
          <DrawerItem
            icon={({color, size}) => (
              <Image
                source={require('../../assets/logout.png')}
                style={{width: 30, height: 30}}
              />
            )}
            label="Logout"
            labelStyle={styles.drawerItemLabel}
            onPress={() => setAlert(true)}
          />
        </Drawer.Section>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 15,
  },
  title: {
    marginTop: 15,
    fontSize: 30,
    fontWeight: '700',
  },
  branch_title: {
    fontSize: 15,
    fontWeight: '700',
  },
  caption: {
    fontSize: 20,
    marginLeft: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    flex: 1,
  },
  attendantInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 10,
    paddingLeft: 20,
    paddingVertical: 5,
    marginRight: 20,
  },
  attendantText: {
    textAlign: 'center',
    fontSize: 10,
    fontStyle: 'italic',
  },
  drawerSection: {
    marginTop: 15,
  },
  drawerItemLabel: {
    color: colors.statusBarCoverDark,
    fontSize: 16,
    fontWeight: '700',
  },
});