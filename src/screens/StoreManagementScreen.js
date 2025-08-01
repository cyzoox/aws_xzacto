import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { TextInput, Button, DataTable, Portal, Modal } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Appbar from '../components/Appbar';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { addStore, fetchStores } from '../store/slices/storeSlice';
import { getCurrentUser } from '@aws-amplify/auth';

export default function StoreManagementScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isOnline, hasPendingChanges, pendingChangesCount } = useNetworkStatus();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [subscriptionLimits, setSubscriptionLimits] = useState({
    storeLimit: 0,
    staffPerStoreLimit: 0,
    adminPerStoreLimit: 0,
    subscriptionStatus: 'NONE',
    planName: ''
  });

  // Get data from Redux store - filtered by current user's ownership
  const { items: stores, loading } = useSelector(state => {
    const allStores = state.store.items || [];
    
    // Filter stores by current user's ownership
    return {
      items: currentUserId
        ? allStores.filter(store => store.ownerId === currentUserId && !store._deleted)
        : [],
      loading: state.store.loading
    };
  });
  
  // Get data from Redux store with filtering by current user's ID
  const { items: staff } = useSelector(state => {
    const allStaff = state.staff.items || [];
    return {
      items: currentUserId 
        ? allStaff.filter(s => s.ownerId === currentUserId && !s._deleted)
        : []
    };
  });
  
  // Get the authenticated user ID and subscription limits on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get authenticated user ID
        const authUser = await getCurrentUser();
        const userId = authUser.userId;
        console.log('StoreManagementScreen: Current user ID set:', userId);
        setCurrentUserId(userId);
        
        // Fetch stores using the fetchStores action
        dispatch(fetchStores({ ownerId: userId }));
        console.log('Dispatched fetchStores action for user:', userId);
        
        // Get subscription limits from AsyncStorage
        const limitsData = await AsyncStorage.getItem('subscriptionLimits');
        if (limitsData) {
          const limits = JSON.parse(limitsData);
          console.log('Retrieved subscription limits:', limits);
          setSubscriptionLimits(limits);
        } else {
          console.log('No subscription limits found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error initializing store management screen:', error);
        Alert.alert('Error', 'Authentication error. Please restart the app.');
      }
    };
    
    initialize();
  }, []);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    location: '',
  });

  const handleAddStore = async () => {
    // Validate required fields
    if (!newStore.name || !newStore.location) {
      Alert.alert('Error', 'Store name and location are required');
      return;
    }
    
    // Ensure we have a current user ID
    if (!currentUserId) {
      Alert.alert('Error', 'Authentication error. Please restart the app.');
      return;
    }

    // Fetch the latest subscription limits from AsyncStorage
    // This ensures we have the most up-to-date limits
    let currentLimit = 0;
    let currentPlanName = '';
    
    try {
      const freshLimitsData = await AsyncStorage.getItem('subscriptionLimits');
      if (freshLimitsData) {
        const freshLimits = JSON.parse(freshLimitsData);
        console.log('Fetched fresh subscription limits:', freshLimits);
        
        // Update state for future use
        setSubscriptionLimits(freshLimits);
        
        // Extract values for immediate use
        currentLimit = freshLimits.storeLimit || 0;
        currentPlanName = freshLimits.planName || '';
      }
    } catch (error) {
      console.error('Error fetching fresh subscription limits:', error);
    }
    
    // Check against subscription store limit
    const currentStoreCount = stores.length;
    
    console.log('DEBUG - Current store count:', currentStoreCount);
    console.log('DEBUG - Store limit:', currentLimit);
    console.log('DEBUG - Plan name:', currentPlanName);
    console.log('DEBUG - Fresh limits used:', { currentLimit, currentPlanName });
    console.log('DEBUG - Is condition met?', currentLimit > 0 && currentStoreCount >= currentLimit);
    console.log('DEBUG - Part 1:', currentLimit > 0);
    console.log('DEBUG - Part 2:', currentStoreCount >= currentLimit);
    console.log('DEBUG - Stores array:', JSON.stringify(stores));
    
    // Only apply limit if it's a positive number and we've reached or exceeded the limit
    // If limit is 0 or negative, it means unlimited
    if (currentLimit > 0 && currentStoreCount >= currentLimit) {
      // Show upgrade alert if limit reached
      Alert.alert(
        'Store Limit Reached',
        `Your ${currentPlanName || 'current'} plan allows a maximum of ${currentLimit} stores. Please upgrade your subscription to add more stores.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade Subscription', 
            onPress: () => navigation.navigate('Subscription', { staffData: staff[0] })
          }
        ]
      );
      return;
    }

    // Create store input
    const storeInput = {
      ...newStore,
      ownerId: currentUserId, // Associate store with the authenticated user
      status: 'ACTIVE'
    };
    
    console.log(`Creating store with ownerId: ${currentUserId} (${currentStoreCount + 1}/${currentLimit > 0 ? currentLimit : '∞'} stores)`);

    // Dispatch action to add store
    dispatch(addStore(storeInput));

    // Reset form
    setNewStore({
      name: '',
      location: ''
    });
    setModalVisible(false);

    // Show success message with sync status
    Alert.alert(
      'Success',
      isOnline ? 
        'Store added successfully' : 
        'Store added and will be synced when online'
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar
        title="Store Management"
        subtitle={hasPendingChanges ? `${pendingChangesCount} pending changes` : ''}
        onBack={() => navigation.goBack()}
      />
      
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You are currently offline</Text>
          {hasPendingChanges && (
            <Text style={styles.pendingText}>{pendingChangesCount} changes pending sync</Text>
          )}
        </View>
      )}
      
      <View style={styles.content}>
        <Button 
          mode="contained" 
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        >
          Add New Store
        </Button>

        <ScrollView>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title style={styles.nameColumn}>Store Name</DataTable.Title>
              <DataTable.Title style={styles.locationColumn}>Location</DataTable.Title>
              <DataTable.Title style={styles.statusColumn}>Status</DataTable.Title>
            </DataTable.Header>

            {stores.map((store) => {
              return (
                <DataTable.Row key={store.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.nameColumn}>
                    <Text style={styles.storeName}>{store.name}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.locationColumn}>{store.location}</DataTable.Cell>
                  <DataTable.Cell style={[styles.statusColumn, {justifyContent: 'center', alignItems: 'center'}]}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Active</Text>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable>
        </ScrollView>

        {/* Add Store Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modal}
          >
            <Text style={styles.modalTitle}>Add New Store</Text>
            
            <TextInput
              label="Store Name"
              value={newStore.name}
              onChangeText={(text) => setNewStore({...newStore, name: text})}
              mode="outlined"
              style={styles.input}
              placeholder="Enter store name"
            />
            
            <TextInput
              label="Location"
              value={newStore.location}
              onChangeText={(text) => setNewStore({...newStore, location: text})}
              mode="outlined"
              style={styles.input}
              multiline
              placeholder="Enter store location"
            />

            <Button
              mode="contained"
              onPress={handleAddStore}
              style={styles.submitButton}
            >
              Add Store
            </Button>
          </Modal>
        </Portal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    padding: 16
  },
  addButton: {
    margin: 16,
    backgroundColor: '#2196F3'
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    elevation: 5
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center'
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5'
  },
  offlineBanner: {
    backgroundColor: '#f8d7da',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f5c6cb'
  },
  offlineText: {
    color: '#721c24',
    fontSize: 14,
    fontWeight: 'bold'
  },
  pendingText: {
    color: '#856404',
    fontSize: 12,
    marginTop: 4
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 8
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  nameColumn: {
    flex: 2
  },
  locationColumn: {
    flex: 2
  },
  statusColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  storeName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2196F3'
  },
  statusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'center'
  },
  statusText: {
    color: '#2e7d32',
    fontSize: 12,
    fontWeight: '600'
  }
});
