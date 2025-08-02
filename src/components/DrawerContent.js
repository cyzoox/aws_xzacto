import React, {useState} from 'react';
import {View, StyleSheet, Image, TouchableOpacity, Text} from 'react-native';
import {DrawerItem, DrawerContentScrollView} from '@react-navigation/drawer';
import colors from '../themes/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Alert from './Alert';
import Ionicons from 'react-native-vector-icons/Ionicons';

export function DrawerContent(props) {
  const {staffData} = props;
  const [alerts, setAlert] = useState(false);
  const [switch_alerts, setSwitchAlert] = useState(false);
  const [switchStore, setSwitchStore] = useState(false);
  const [activeItem, setActiveItem] = useState('Dashboard');

  // Check if user is SuperAdmin
  const isSuperAdmin = staffData?.role?.includes('SuperAdmin');

  const onSwitch = async () => {
    await AsyncStorage.removeItem('@store');
    await AsyncStorage.removeItem('@currency');
    props.navigation.goBack();
  };

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
  };

  const onCancelSwitchAlert = () => {
    setSwitchAlert(false);
  };
  // Handler for drawer item press with navigation
  const handleItemPress = (screen, itemName) => {
    setActiveItem(itemName);
    props.navigation.navigate(screen);
  };

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
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
        {/* Header section with colored background */}
        <View style={styles.headerBackground}>
          <View style={styles.userInfoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.title}>XZACTO</Text>
              <Text style={styles.branchTitle}>
                {staffData ? staffData.name : 'No Branch'}
              </Text>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.attendantInfo}
              onPress={() => props.navigation.navigate('Attendance')}>
              <View style={styles.avatarContainer}>
                <Image
                  source={require('../../assets/assets/cashier.png')}
                  style={styles.avatarImage}
                />
              </View>
              <View style={styles.userTextContainer}>
                <Text style={styles.userName}>
                  {staffData ? staffData.name : 'No Attendant'}
                </Text>
                <Text style={styles.userRole}>
                  {staffData ? staffData.role : 'Tap to Change'}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={colors.white}
                style={styles.arrowIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.menuContainer}>
          {/* Main Navigation */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>MAIN MENU</Text>

            <TouchableOpacity
              style={[
                styles.menuItem,
                activeItem === 'Home' && styles.activeMenuItem,
              ]}
              onPress={() => handleItemPress('Home', 'Home')}>
              <Ionicons
                name="home-outline"
                size={22}
                color={
                  activeItem === 'Home' ? colors.primary : colors.charcoalGrey
                }
              />
              <Text
                style={[
                  styles.menuItemText,
                  activeItem === 'Home' && styles.activeMenuItemText,
                ]}>
                Home
              </Text>
            </TouchableOpacity>

            {/* Staff Management (only for Admin) */}
            {isSuperAdmin && (
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  activeItem === 'Staff Management' && styles.activeMenuItem,
                ]}
                onPress={() =>
                  handleItemPress('Staff Management', 'Staff Management')
                }>
                <Ionicons
                  name="people-outline"
                  size={22}
                  color={
                    activeItem === 'Staff Management'
                      ? colors.primary
                      : colors.charcoalGrey
                  }
                />
                <Text
                  style={[
                    styles.menuItemText,
                    activeItem === 'Staff Management' &&
                      styles.activeMenuItemText,
                  ]}>
                  Staff Management
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.menuItem,
                activeItem === 'Printer Settings' && styles.activeMenuItem,
              ]}
              onPress={() =>
                handleItemPress('Printer Settings', 'Printer Settings')
              }>
              <Ionicons
                name="print-outline"
                size={22}
                color={
                  activeItem === 'Printer Settings'
                    ? colors.primary
                    : colors.charcoalGrey
                }
              />
              <Text
                style={[
                  styles.menuItemText,
                  activeItem === 'Printer Settings' &&
                    styles.activeMenuItemText,
                ]}>
                Printer Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.menuItem,
                activeItem === 'Expenses' && styles.activeMenuItem,
              ]}
              onPress={() => handleItemPress('Expenses', 'Expenses')}>
              <Ionicons
                name="cash-outline"
                size={22}
                color={
                  activeItem === 'Expenses'
                    ? colors.primary
                    : colors.charcoalGrey
                }
              />
              <Text
                style={[
                  styles.menuItemText,
                  activeItem === 'Expenses' && styles.activeMenuItemText,
                ]}>
                Expenses
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.menuItem,
                activeItem === 'Transactions' && styles.activeMenuItem,
              ]}
              onPress={() => handleItemPress('Transactions', 'Transactions')}>
              <Ionicons
                name="swap-horizontal-outline"
                size={22}
                color={
                  activeItem === 'Transactions'
                    ? colors.primary
                    : colors.charcoalGrey
                }
              />
              <Text
                style={[
                  styles.menuItemText,
                  activeItem === 'Transactions' && styles.activeMenuItemText,
                ]}>
                Transactions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Admin Products Section */}
          {isSuperAdmin && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>PRODUCTS</Text>

              <TouchableOpacity
                style={[
                  styles.menuItem,
                  activeItem === 'Products Dashboard' && styles.activeMenuItem,
                ]}
                onPress={() =>
                  handleItemPress('Products Dashboard', 'Products Dashboard')
                }>
                <Ionicons
                  name="grid-outline"
                  size={22}
                  color={
                    activeItem === 'Products Dashboard'
                      ? colors.primary
                      : colors.charcoalGrey
                  }
                />
                <Text
                  style={[
                    styles.menuItemText,
                    activeItem === 'Products Dashboard' &&
                      styles.activeMenuItemText,
                  ]}>
                  Products Dashboard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.menuItem,
                  activeItem === 'Create Product' && styles.activeMenuItem,
                ]}
                onPress={() =>
                  handleItemPress('Create Product', 'Create Product')
                }>
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={
                    activeItem === 'Create Product'
                      ? colors.primary
                      : colors.charcoalGrey
                  }
                />
                <Text
                  style={[
                    styles.menuItemText,
                    activeItem === 'Create Product' &&
                      styles.activeMenuItemText,
                  ]}>
                  Create Product
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Account Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>

            <TouchableOpacity
              style={[
                styles.menuItem,
                activeItem === 'Staff Profile' && styles.activeMenuItem,
              ]}
              onPress={() => handleItemPress('Staff Profile', 'Staff Profile')}>
              <Ionicons
                name="person-outline"
                size={22}
                color={
                  activeItem === 'Staff Profile'
                    ? colors.primary
                    : colors.charcoalGrey
                }
              />
              <Text
                style={[
                  styles.menuItemText,
                  activeItem === 'Staff Profile' && styles.activeMenuItemText,
                ]}>
                Staff Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setAlert(true)}>
              <Ionicons name="log-out-outline" size={22} color={colors.white} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  drawerContent: {
    flex: 1,
  },
  headerBackground: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    paddingBottom: 15,
    marginBottom: 20,
    elevation: 4,
  },
  userInfoSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 1,
  },
  branchTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 12,
  },
  attendantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 5,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
  },
  userTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  userRole: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  arrowIcon: {
    opacity: 0.7,
  },
  menuContainer: {
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    color: colors.boldGrey,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 5,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(0, 67, 105, 0.08)',
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 15,
    fontWeight: '500',
    color: colors.charcoalGrey,
  },
  activeMenuItemText: {
    color: colors.primary,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 10,
    elevation: 3,
  },
  logoutText: {
    marginLeft: 16,
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});
