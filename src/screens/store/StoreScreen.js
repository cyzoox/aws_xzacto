import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteStore, setStoreList, setLoading as setStoreLoading } from '../../store/slices/storeSlice';
import { Text, StyleSheet, View, FlatList, Alert, ActivityIndicator } from "react-native";
import { ListItem, Badge } from "react-native-elements";
import { generateClient } from 'aws-amplify/api';
import { listStores } from '../../graphql/queries';
import Appbar from '../../components/Appbar';
import colors from '../../themes/colors';
import { Auth } from 'aws-amplify';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = generateClient();

const StoreScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items: stores, loading } = useSelector(state => state.store);
  const { items: staff } = useSelector(state => state.staff);
  const [currentUserStores, setCurrentUserStores] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch initial data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      dispatch(setStoreLoading(true));
      try {
        await fetchUserInfo();
        await fetchStores();
        console.log('Initialization complete - data should be loaded');
      } catch (err) {
        console.log('Error initializing data:', err);
        setErrorMessage('Failed to load data. Please try again.');
      } finally {
        dispatch(setStoreLoading(false));
        console.log('Loading state set to false');
      }
    };

    initializeData();
  }, [dispatch]);

  // Set the current store in AsyncStorage and Redux
  const setCurrentStoreHandler = (store) => {
    try {
      // Save to AsyncStorage
      const saveStore = async () => {
        await AsyncStorage.setItem('currentStoreData', JSON.stringify(store));
        console.log('Store saved to AsyncStorage:', store.name);
      };
      saveStore();
    } catch (err) {
      console.log('Error saving store to AsyncStorage:', err);
    }
  };

  // We're disabling this effect since we're now loading directly from AsyncStorage
  // This was causing a race condition with our direct data fetching
  /*
  useEffect(() => {
    const currentStaff = staff.find(s => !s._deleted);
    if (currentStaff) {
      const isAdmin = currentStaff.role.includes('Admin') || currentStaff.role.includes('SuperAdmin');
      if (isAdmin) {
        // For admin roles, show all active stores
        const activeStores = stores.filter(s => !s._deleted);
        console.log('Admin stores from Redux:', activeStores);
        // We're no longer setting currentUserStores here to avoid conflict
      } else {
        // For non-admin roles, show assigned stores through StaffStore relationship
        const assignedStores = currentStaff.stores?.items
          ?.filter(s => s.store && !s.store._deleted)
          ?.map(s => s.store) || [];
        console.log('Staff assigned stores from Redux:', assignedStores);
        // We're no longer setting currentUserStores here to avoid conflict
      }
    }
  }, [staff, stores]);
  */

  // Fetch user info and assigned stores
  async function fetchUserInfo() {
    try {
      // Get staff data directly from AsyncStorage instead of session
      const staffJson = await AsyncStorage.getItem('staffData');
      if (!staffJson) {
        console.log('No staff data found in AsyncStorage');
        // Set default role if no data
        setCurrentUserRole('Guest');
        return;
      }
      
      const staffData = JSON.parse(staffJson);
      console.log('Loaded staff data from AsyncStorage:', staffData);
      
      if (!staffData) {
        console.log('Invalid staff data');
        setCurrentUserRole('Guest');
        return;
      }
      
      // Set user role
      const userRole = Array.isArray(staffData.role) ? staffData.role[0] : staffData.role;
      console.log('Setting user role to:', userRole);
      setCurrentUserRole(userRole);
      
      // For Admin/SuperAdmin, show all stores
      const isAdmin = userRole === 'Admin' || userRole === 'SuperAdmin';
      if (isAdmin) {
        const activeStores = stores.filter(s => !s._deleted);
        console.log('Admin active stores:', activeStores);
        setCurrentUserStores(activeStores);

        // If SuperAdmin has no stores, create a default store
        if (userRole === 'SuperAdmin' && activeStores.length === 0) {
          const defaultStore = {
            name: 'Main Store',
            location: 'Default Location',
            isDefault: true
          };
          dispatch(addStore(defaultStore));
          setCurrentUserStores([{ ...defaultStore, id: Date.now().toString() }]);
        }
      } else {
        // For other roles, only show assigned stores from session
        const assignedStores = staffData.stores?.items
          ?.filter(s => s.store && !s.store._deleted)
          ?.map(s => s.store) || [];
        console.log('Staff assigned stores from session:', assignedStores);
        setCurrentUserStores(assignedStores);
      }
    } catch (err) {
      console.log('Error fetching user info:', err);
      setErrorMessage('Failed to fetch user information. Please try again.');
      throw err;
    }
  }

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value });
  }



  async function fetchStores() {
    try {
      // Get staff data directly from AsyncStorage
      const staffJson = await AsyncStorage.getItem('staffData');
      if (!staffJson) {
        console.log('No staff data found in AsyncStorage when fetching stores');
        fetchAllStores();
        return;
      }
      
      const staffData = JSON.parse(staffJson);
      console.log('Using staff data for store fetch:', JSON.stringify(staffData, null, 2));
      
      if (!staffData || !staffData.role) {
        console.log('Invalid staff data for fetching stores');
        fetchAllStores();
        return;
      }
      
      // Fetch stores from API based on staff role
      const isAdmin = Array.isArray(staffData.role) ? 
        staffData.role.includes('SuperAdmin') || staffData.role.includes('Admin') :
        staffData.role === 'SuperAdmin' || staffData.role === 'Admin';
      
      console.log('Staff is admin:', isAdmin);
      console.log('Staff stores:', JSON.stringify(staffData.stores, null, 2));
      
      const storeData = await client.graphql({
        query: listStores,
        variables: {
          filter: isAdmin 
            ? undefined // Show all stores for admin roles
            : { id: { eq: staffData.store_id ? [staffData.store_id] : [] } } // Use the store_id we saved earlier
        }
      });
      
      if (storeData?.data?.listStores?.items) {
        const filteredStores = storeData.data.listStores.items.filter(store => !store._deleted);
        console.log('Fetched stores:', JSON.stringify(filteredStores, null, 2));
        dispatch(setStoreList(filteredStores));
        
        // Set to currentUserStores for display on screen
        setCurrentUserStores(filteredStores);
        console.log('Set currentUserStores with length:', filteredStores.length);
      } else {
        console.log('No stores data available');
        dispatch(setStoreList([]));
        setCurrentUserStores([]);
      }
    } catch (err) {
      console.log('Error fetching stores:', err);
      setErrorMessage('Failed to fetch stores. Please try again.');
    }
  }

  async function fetchAllStores() {
    try {
      const storeData = await client.graphql({
        query: listStores
      });
      
      const fetchedStores = storeData.data.listStores.items || [];
      dispatch(setStoreList(fetchedStores));
      setCurrentUserStores(fetchedStores);
    } catch (error) {
      console.error('Error fetching all stores:', error);
      setErrorMessage('Failed to load stores. Please try again.');
    }
  }

  const isDefaultStore = (store) => {
    return store.isDefault || 
      store.name.toLowerCase().includes('default') || 
      store.name.toLowerCase().includes('main');
  };

  async function addStore() {
    try {
      // Validation checks
      if (!formState.name?.trim()) {
        setErrorMessage("Store name is required");
        return;
      }
      if (!formState.location?.trim()) {
        setErrorMessage("Store location is required");
        return;
      }

      // Create store with required fields from schema
      const newStore = {
        name: formState.name.trim(),
        location: formState.location.trim()
      };

      // Check for duplicate store names
      const isDuplicate = stores.some(store => 
        !store._deleted && 
        store.name.toLowerCase() === newStore.name.toLowerCase()
      );
      if (isDuplicate) {
        setErrorMessage("A store with this name already exists");
        return;
      }

      // If this is the first store and user is SuperAdmin, mark it as default
      const activeStores = stores.filter(s => !s._deleted);
      if (activeStores.length === 0 && currentUserRole === 'SuperAdmin') {
        newStore.isDefault = true;
      }

      // Dispatch to Redux which will handle the API call
      dispatch(addStore(newStore));

      // Update currentUserStores if user is Admin/SuperAdmin
      if (currentUserRole === 'Admin' || currentUserRole === 'SuperAdmin') {
        setCurrentUserStores(prev => [...prev, { ...newStore, id: Date.now().toString() }]);
      }

      // Reset form and close modal
      setFormState(initialFormState);
      setErrorMessage("");
      setOverlayVisible(false);

      // Show success message
      Alert.alert(
        'Store Created',
        isOnline ?
          `Store "${newStore.name}" has been created successfully` :
          `Store "${newStore.name}" will be created when online`
      );
    } catch (err) {
      console.log("Error creating store:", err);
      // Get assigned store for staff
      const staffJson = await AsyncStorage.getItem('staffData');
      const staffData = JSON.parse(staffJson);
      const stores = staffData.stores?.items || [];
      console.log('Staff stores:', JSON.stringify(stores, null, 2));
      
      // Get primary role to check if it's a warehouse role
      const primaryRole = Array.isArray(staffData.role) ? staffData.role[0] : staffData.role;
      console.log('Primary role:', primaryRole);
      
      // For non-warehouse roles, require store assignment
      if (primaryRole !== 'Warehouse' && stores.length === 0) {
        console.log('WARNING: No store assigned to non-warehouse staff');
        // For now, we'll continue anyway to avoid blocking users
        // Alert.alert('Error', 'No store assigned to this staff member');
        // return;
      }

      setErrorMessage("Failed to create store. Please try again.");
    }
  }
  
  async function deleteStoreData(storeId) {
    try {
      // Get the store to check if it exists
      const store = stores.find(s => s.id === storeId);
      if (!store) {
        setErrorMessage('Store not found');
        return;
      }

      // Check if this is the default store (first created store)
      const activeStores = stores.filter(s => !s._deleted);
      const isDefaultStore = activeStores.length > 0 && activeStores[0].id === storeId;
      if (isDefaultStore) {
        Alert.alert(
          'Cannot Delete Default Store',
          'The default store cannot be deleted as it is required for system operation.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check if this is the last store
      if (activeStores.length === 1) {
        Alert.alert(
          'Cannot Delete Store',
          'You cannot delete the last store. At least one store must remain active.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check if store has any staff members through StaffStore relationship
      const assignedStaff = staff.filter(s => {
        // Check both direct storeID and many-to-many relationship through StaffStore
        const hasDirectAssignment = s.storeID === storeId && !s._deleted;
        const hasManyToManyAssignment = s.stores?.items?.some(si => 
          !si._deleted && si.store?.id === storeId
        );
        return hasDirectAssignment || hasManyToManyAssignment;
      });

      if (assignedStaff.length > 0) {
        const staffNames = assignedStaff.map(s => s.name).join(', ');
        Alert.alert(
          'Cannot Delete Store',
          `This store has ${assignedStaff.length} active staff member${assignedStaff.length > 1 ? 's' : ''}: ` +
          `${staffNames}. \n\nPlease reassign or remove staff members first.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Confirm deletion
      Alert.alert(
        'Delete Store',
        `Are you sure you want to delete "${store.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              // Delete the store
              dispatch(deleteStore({ id: storeId }));

              // Update currentUserStores
              setCurrentUserStores(prev => prev.filter(s => s.id !== storeId));

              // Show success message
              Alert.alert(
                'Store Deleted',
                isOnline ?
                  `Store "${store.name}" has been deleted successfully` :
                  `Store "${store.name}" will be deleted when online`
              );
            }
          }
        ]
      );
    } catch (err) {
      console.log('Error deleting store:', err);
      setErrorMessage('Failed to delete store. Please try again.');
    }
  }

  const renderItem = ({ item }) => {
    if (!item || !item.name) return null;

    const isAdmin = currentUserRole === 'Admin' || currentUserRole === 'SuperAdmin';
    const isDefault = isDefaultStore(item);
    return (
      <ListItem 
        containerStyle={[styles.storeCard, isDefault && styles.defaultStore]} 
        onPress={() => {
          setCurrentStoreHandler(item);
          navigation.navigate('StoreDashboard', { store: item });
        }}
      >
        <View style={styles.storeIconContainer}>
          <Text style={styles.storeIcon}>{item.name?.charAt(0) || 'S'}</Text>
        </View>
        
        <ListItem.Content>
          <View style={styles.storeHeader}>
            <Text style={styles.storeName}>{item.name}</Text>
            
            <View style={styles.badgeContainer}>
              {isDefault && (
                <Badge 
                  value="Default" 
                  badgeStyle={{ backgroundColor: colors.primary }} 
                  textStyle={styles.badgeText}
                  containerStyle={styles.defaultBadge}
                />
              )}
            </View>
          </View>
          
          <View style={styles.locationContainer}>
            <Icon name="map-pin" size={14} color="#6c757d" style={{ marginRight: 5 }} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
          
          <View style={styles.storeFooter}>
            <Text style={styles.tapToSelect}>Tap to select this store</Text>
          </View>
        </ListItem.Content>
      </ListItem>
    );
  };
             

  return (
    <View style={styles.container}>
      <Appbar
        title="Your Stores"
        subtitle={`${currentUserRole || 'User'}`}
        onBack={() => navigation.goBack()}
      />
      
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{currentUserStores.length}</Text>
              <Text style={styles.statLabel}>Total Stores</Text>
            </View>
          </View>
          
          <Text style={styles.sectionTitle}>Select a Store</Text>
          
          <FlatList
            data={currentUserStores}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icon name="alert-circle" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {currentUserRole ? 'No stores assigned to your account' : 'Loading stores...'}
                </Text>
              </View>
            }
          />
        </View>
      )}

      {/* Add Store button and overlay removed as requested */}
    </View>
  );
};



const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginHorizontal: 16,
    color: '#343a40',
  },
  storeCard: {
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    padding: 16,
  },
  defaultStore: {
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
    backgroundColor: '#f8f9ff'
  },
  storeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  storeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap'
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    flex: 1,
    color: '#343a40',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6c757d',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  defaultBadge: {
    marginRight: 4
  },
  storeFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tapToSelect: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  // Keep these styles for backward compatibility
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center'
  },
  lgridStyle: {
    borderRadius: 10,
    marginVertical: 5,
    marginHorizontal: 0,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding: 12
  },
});

export default StoreScreen;
