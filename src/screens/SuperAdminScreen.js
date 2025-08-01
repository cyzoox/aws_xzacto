import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateClient } from 'aws-amplify/api';
import { listAccounts } from '../graphql/queries';

// Initialize API client
const client = generateClient();
import { useSelector, useDispatch } from 'react-redux';
import Appbar from '../components/Appbar';
import { getCurrentUser } from '@aws-amplify/auth';
import { syncService } from '../services/syncService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { addStore } from '../store/slices/storeSlice';
import { fetchStaff } from '../store/slices/staffSlice';
import { Card } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function SuperAdminScreen({ navigation, route }) {
  const [accountsWithoutSubscription, setAccountsWithoutSubscription] = useState([]);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const [subscriptionLimits, setSubscriptionLimits] = useState({
    storeLimit: 0,
    staffPerStoreLimit: 0,
    adminPerStoreLimit: 0,
    subscriptionStatus: 'NONE',
    planName: ''
  });

  const { staffData } = route.params;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const userIdRef = useRef(null);

  // Get network status
  const { isOnline, hasPendingChanges, pendingChangesCount } = useNetworkStatus();
  
  // Get only the staff data belonging to the current authenticated user
  const { items: staff, loading: staffLoading } = useSelector(state => {
    const allStaff = state.staff.items || [];
    if (!userIdRef.current) return { items: [], loading: state.staff.loading };
    
    return {
      items: allStaff.filter(s => s.ownerId === userIdRef.current && !s._deleted),
      loading: state.staff.loading
    };
  });
  
  // Get stores owned by the current user
  const { items: stores, loading: storeLoading } = useSelector(state => {
    const allStores = state.store.items || [];
    
    // Filter stores by ownership - only show stores owned by the current user
    return {
      items: userIdRef.current
        ? allStores.filter(store => store.ownerId === userIdRef.current && !store._deleted)
        : [],
      loading: state.store.loading
    };
  });
  
  // Get sales data
  const { items: sales } = useSelector(state => {
    const allSales = state.sales?.items || [];
    return { items: allSales.filter(s => !s._deleted) };
  });

  // Only run this effect once to initialize the screen
  useEffect(() => {
    if (initialized) return;
    
    const initializeScreen = async () => {
      try {
        setLoading(true);
        console.log('Initializing SuperAdmin screen');
        
        // Get authenticated user ID
        const authUser = await getCurrentUser();
        const authUserId = authUser.userId;
        userIdRef.current = authUserId;
        console.log('Set authenticated user ID:', authUserId);
        
        // Fetch staff for this user specifically
        console.log('Fetching staff for user:', authUserId);
        await dispatch(fetchStaff({ ownerId: authUserId }));

        // Fetch initial data
        console.log('Fetching initial data');
        await syncService.fetchInitialData();
        
        // Check if user has an active subscription
        await checkUserSubscription(authUserId);
        
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing SuperAdmin screen:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeScreen();
  }, [dispatch, initialized]);
  
  // Function to check if user has an active subscription and get subscription plan limits
  const checkUserSubscription = async (userId) => {
    try {
      // Fetch all accounts for this user
      const accountResult = await client.graphql({
        query: listAccounts,
        variables: {
          filter: {
            ownerId: { eq: userId }
          }
        }
      });
      
      const userAccounts = accountResult.data.listAccounts.items;
      const currentDate = new Date();
      
      // If no accounts found, redirect to subscription screen
      if (userAccounts.length === 0) {
        console.log('No accounts found, redirecting to subscription screen');
        navigation.navigate('Subscription', { staffData, isNewUser: true });
        return;
      }
      
      // Find active account and subscription
      let activeAccount = null;
      let subscriptionActive = false;
      
      for (const account of userAccounts) {
        const isExpired = account.subscriptionEndDate && 
          new Date(account.subscriptionEndDate) < currentDate;
        
        if (account.subscriptionStatus === 'ACTIVE' && !isExpired) {
          activeAccount = account;
          subscriptionActive = true;
          break;
        }
      }
      
      if (!subscriptionActive) {
        console.log('No active subscription found, redirecting to subscription screen');
        navigation.navigate('Subscription', { 
          staffData,
          account: userAccounts[0], 
          isRenewal: userAccounts[0].subscriptionStatus === 'EXPIRED' 
        });
        return;
      }
      
      // Get the subscription plan details for the active account
      if (activeAccount && activeAccount.subscriptionPlan) {
        const plan = activeAccount.subscriptionPlan;
        console.log('Active subscription plan found:', plan.name);
        
        // Store the subscription limits
        setSubscriptionLimits({
          storeLimit: plan.storeLimit || 0,
          staffPerStoreLimit: plan.staffPerStoreLimit || 0,
          adminPerStoreLimit: plan.adminPerStoreLimit || 0,
          subscriptionStatus: activeAccount.subscriptionStatus,
          planName: plan.name
        });
        
        // Save subscription limits to AsyncStorage for other screens to use
        await AsyncStorage.setItem('subscriptionLimits', JSON.stringify({
          storeLimit: plan.storeLimit || 0,
          staffPerStoreLimit: plan.staffPerStoreLimit || 0,
          adminPerStoreLimit: plan.adminPerStoreLimit || 0,
          subscriptionStatus: activeAccount.subscriptionStatus,
          planName: plan.name
        }));
        
        console.log(`Subscription limits: ${plan.storeLimit} stores, ${plan.staffPerStoreLimit} staff per store`);
      } else {
        console.log('Account has no associated subscription plan');
      }
    } catch (error) {
      console.error('Error checking user subscription:', error);
      // Don't block access to the screen on error, just log it
    }
  };

  // Function to check for accounts without active subscriptions
  const checkAccountsWithoutSubscription = async () => {
    try {
      setLoading(true);
      
      // Fetch all accounts using client
      const accountResult = await client.graphql({
        query: listAccounts
      });
      
      const allAccounts = accountResult.data.listAccounts.items;
      
      // If account database is empty, the current user has no subscription
      if (allAccounts.length === 0) {
        // Create a temporary account object for the current user to show in the alert
        const tempAccount = {
          id: 'temp-' + Date.now(),
          ownerId: userIdRef.current,
          ownerEmail: staffData?.email || 'Current User',
          subscriptionStatus: 'NONE'
        };
        
        setAccountsWithoutSubscription([tempAccount]);
        setShowSubscriptionAlert(true);
        return;
      }
      
      const currentDate = new Date();
      
      // Find accounts without active subscriptions that belong to the current user
      const accountsWithNoSub = allAccounts.filter(account => {
        // First check if this account belongs to the current user
        if (account.ownerId !== userIdRef.current) return false;
        
        // Then check if subscription status is not active or has expired
        const isExpired = account.subscriptionEndDate && 
          new Date(account.subscriptionEndDate) < currentDate;
          
        return account.subscriptionStatus !== 'ACTIVE' || isExpired;
      });
      
      setAccountsWithoutSubscription(accountsWithNoSub);
      
      if (accountsWithNoSub.length > 0) {
        setShowSubscriptionAlert(true);
      } else {
        Alert.alert(
          'Subscription Check',
          'All accounts have active subscriptions.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error checking subscriptions:', error);
      Alert.alert('Error', 'Failed to check subscriptions');
    } finally {
      setLoading(false);
    }
  };

  // Calculated values
  const storeCount = stores.length;
  const totalStaffCount = staff.length;
  const totalSales = sales.reduce((total, sale) => total + (parseFloat(sale.total) || 0), 0);

  if (loading || storeLoading || staffLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar
        title="Dashboard"
        subtitle={hasPendingChanges ? `${pendingChangesCount} pending changes` : ''}
        onBack={null} // No back button for dashboard
      />
      
      <ScrollView style={styles.scrollView}>
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Icon name="cloud-off" size={20} color="#721c24" style={styles.bannerIcon} />
            <View>
              <Text style={styles.offlineText}>You are currently offline</Text>
              {hasPendingChanges && (
                <Text style={styles.pendingText}>{pendingChangesCount} changes pending sync</Text>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Welcome back, {staffData?.name || 'Admin'}</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>
        
        <Card containerStyle={styles.overviewCard}>
          <Text style={styles.cardTitle}>Business Overview</Text>
          
          <View style={styles.metricsContainer}>
            <TouchableOpacity 
              style={styles.metricItem}
              onPress={() => stores.length > 0 && navigation.navigate('Store Management')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#E1F5FE' }]}>
                <Icon name="store" size={24} color="#0288D1" />
              </View>
              <Text style={styles.metricValue}>{storeCount}</Text>
              <Text style={styles.metricLabel}>Stores</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.metricItem}
              onPress={() => totalStaffCount > 0 && navigation.navigate('Staff Management')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="people" size={24} color="#388E3C" />
              </View>
              <Text style={styles.metricValue}>{totalStaffCount}</Text>
              <Text style={styles.metricLabel}>Staff</Text>
            </TouchableOpacity>
            
            <View style={styles.metricItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Icon name="attach-money" size={24} color="#F57C00" />
              </View>
              <Text style={styles.metricValue}>${totalSales.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Sales</Text>
            </View>
          </View>
        </Card>

        <Card containerStyle={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Staff Management')}
          >
            <Icon name="people" size={22} color="#fff" style={styles.actionIcon} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionButtonText}>Manage Staff</Text>
              <Text style={styles.actionButtonSubtext}>Add or view staff members</Text>
            </View>
            <Icon name="chevron-right" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Store Management')}
          >
            <Icon name="store" size={22} color="#fff" style={styles.actionIcon} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionButtonText}>Manage Stores</Text>
              <Text style={styles.actionButtonSubtext}>Add or view store locations</Text>
            </View>
            <Icon name="chevron-right" size={22} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#8E44AD' }]}
            onPress={() => navigation.navigate('Subscription', { staffData })}
          >
            <Icon name="card-membership" size={22} color="#fff" style={styles.actionIcon} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionButtonText}>Subscription Management</Text>
              <Text style={styles.actionButtonSubtext}>View and upgrade subscription plans</Text>
            </View>
            <Icon name="chevron-right" size={22} color="#fff" />
          </TouchableOpacity>
          
          {/* <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#E91E63' }]}
            onPress={() => checkAccountsWithoutSubscription()}
          >
            <Icon name="assignment-late" size={22} color="#fff" style={styles.actionIcon} />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionButtonText}>Check Subscriptions</Text>
              <Text style={styles.actionButtonSubtext}>Find users without active subscriptions</Text>
            </View>
            <Icon name="chevron-right" size={22} color="#fff" />
          </TouchableOpacity> */}
        </Card>
        
        {/* {stores.length === 0 && (
          <Card containerStyle={styles.setupCard}>
            <Text style={styles.cardTitle}>Get Started</Text>
            <Text style={styles.setupText}>You need to create a default store to begin managing your business.</Text>
            
            <TouchableOpacity 
              style={[styles.setupButton]}
              onPress={() => {
                if (!userIdRef.current) {
                  Alert.alert('Error', 'Authentication error. Please restart the app.');
                  return;
                }
                
                dispatch(addStore({
                  name: 'Default Store',
                  location: 'Main Branch',
                  ownerId: userIdRef.current // Associate store with the authenticated user
                }));
                Alert.alert(
                  'Success',
                  isOnline ? 
                    'Default store created successfully' : 
                    'Default store created and will be synced when online'
                );
              }}
            >
              <Icon name="add-business" size={20} color="#fff" style={styles.actionIcon} />
              <Text style={styles.setupButtonText}>Create Default Store</Text>
            </TouchableOpacity>
          </Card>
        )} */}
      </ScrollView>

      {/* Alert for accounts without subscriptions */}
      {showSubscriptionAlert && accountsWithoutSubscription.length > 0 && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Accounts Without Active Subscriptions</Text>
              <ScrollView style={styles.alertScrollView}>
                {accountsWithoutSubscription.map((account, index) => (
                  <TouchableOpacity
                    key={account.id}
                    style={styles.storeItem}
                    onPress={() => {
                      setShowSubscriptionAlert(false);
                      // Navigate to subscription screen with account data
                      navigation.navigate('SubscriptionScreen', {
                        account: account,
                        fromAccountCheck: true
                      });
                    }}
                  >
                    <Text style={styles.storeItemText}>{account.ownerEmail}</Text>
                    <View style={styles.statusContainer}>
                      <Text style={[styles.statusText, 
                        {color: account.subscriptionStatus === 'EXPIRED' ? '#d9534f' : '#f0ad4e'}]}>
                        {account.subscriptionStatus}
                      </Text>
                      <Icon name="chevron-right" size={24} color="#555" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={checkAccountsWithoutSubscription}
              >
                <Icon name="warning" size={24} color="#FF9800" />
                <Text style={styles.actionButtonText}>Check Subscriptions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  scrollView: {
    flex: 1,
  },
  offlineBanner: {
    backgroundColor: '#f8d7da',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  bannerIcon: {
    marginRight: 10,
  },
  offlineText: {
    color: '#721c24',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pendingText: {
    color: '#856404',
    fontSize: 12,
    marginTop: 4,
  },
  headerContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // Cards
  overviewCard: {
    borderRadius: 12,
    padding: 16,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  actionsCard: {
    borderRadius: 12,
    padding: 16,
    margin: 10,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  setupCard: {
    borderRadius: 12,
    padding: 16,
    margin: 10,
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
    backgroundColor: '#e8f4ff',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  // Metrics
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  // Actions
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  // Setup
  setupText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    lineHeight: 20,
  },
  setupButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Alert dialog styles
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#E91E63',
  },
  alertSubtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    color: '#555',
  },
  storeList: {
    maxHeight: 300,
  },
  storeListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  storeListName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  assignButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  assignButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
