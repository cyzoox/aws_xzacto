import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteStore, setStoreList, setLoading as setStoreLoading, addStore } from '../../store/slices/storeSlice';
import { Text, StyleSheet, View, FlatList, Alert, ActivityIndicator } from "react-native";
import { ListItem, Badge } from "react-native-elements";
import { generateClient } from 'aws-amplify/api';
import * as queries from '../../graphql/queries';
import { listStores } from '../../graphql/queries';
import Appbar from '../../components/Appbar';
import colors from '../../themes/colors';
import { getCurrentUser } from '@aws-amplify/auth';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatMoney } from 'accounting-js';
import { syncService } from '../../services/syncService';

const client = generateClient();

// Store Summary Card Component
const StoreSummaryCard = ({ store, isDefault, onPress }) => {
  return (
    <ListItem 
      containerStyle={[styles.storeCard, isDefault && styles.defaultStore]} 
      onPress={onPress}
    >
      <View style={styles.storeIconContainer}>
        <Text style={styles.storeIcon}>{store.name?.charAt(0) || 'S'}</Text>
      </View>
      
      <ListItem.Content>
        <View style={styles.storeHeader}>
          <Text style={styles.storeName}>{store.name}</Text>
          
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
          <Text style={styles.locationText}>{store.location || 'No location set'}</Text>
        </View>
        
        <View style={styles.storeFooter}>
          <Text style={styles.tapToSelect}>Tap to select this store</Text>
        </View>
      </ListItem.Content>
    </ListItem>
  );
};

const StoreScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items: stores, loading: storeLoading } = useSelector(state => state.store);
  const { items: staff } = useSelector(state => state.staff);
  const [currentUserStores, setCurrentUserStores] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [defaultStoreId, setDefaultStoreId] = useState(null);
  const initialFormState = { name: '', location: '' };
  const [formState, setFormState] = useState(initialFormState);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Fetch initial data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        // Get the current authenticated user
        const userInfo = await getCurrentUser();
        // Correctly extract the username (which is our userId in the system)
        const userId = userInfo.userId;
        console.log('Authenticated user ID (username):', userId);
        
        // Get staff data to determine role
        const staffJson = await AsyncStorage.getItem('staffData');
        if (!staffJson) {
          console.log('No staff data found in AsyncStorage');
          setErrorMessage('Staff data not found');
          setLoading(false);
          return;
        }
        
        const staffData = JSON.parse(staffJson);
        const userRole = Array.isArray(staffData.role) ? staffData.role[0] : staffData.role;
        setCurrentUserRole(userRole);
        
        // Make direct GraphQL call to fetch stores
        console.log('Fetching stores directly with ownerId filter:', userId);
        const { data: storeData } = await client.graphql({
          query: listStores,
          variables: { filter: { ownerId: { eq: userId } } }
        });
        
        // Log what we got from the database
        const filteredStores = storeData.listStores.items.filter(s => !s._deleted);
        console.log(`Directly fetched ${filteredStores.length} stores for user ${userId}`);
        
        // Set the stores directly from the query result
        dispatch(setStoreList(filteredStores));
        setCurrentUserStores(filteredStores);
        
        // Find default store
        const defaultStore = filteredStores.find(s => s.isDefault);
        if (defaultStore) {
          setDefaultStoreId(defaultStore.id);
        }
        
        console.log('Initialization complete - data should be loaded');
      } catch (err) {
        console.log('Error initializing data:', err);
        setErrorMessage('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Set the current store in AsyncStorage and Redux
  const setCurrentStoreHandler = async (store) => {
    try {
      // Save to AsyncStorage for persistence
      await AsyncStorage.setItem('currentStore', JSON.stringify(store));
      
      // Get staff data
      const staffJson = await AsyncStorage.getItem('staffData');
      if (staffJson) {
        const staffData = JSON.parse(staffJson);
        
        // Update staff data with current store
        const updatedStaffData = {
          ...staffData,
          store_id: store.id
        };
        
        // Save updated staff data
        await AsyncStorage.setItem('staffData', JSON.stringify(updatedStaffData));
      }
      
      console.log(`Set current store to: ${store.name} (${store.id})`);
    } catch (err) {
      console.error('Error setting current store:', err);
      Alert.alert('Error', 'Failed to set current store. Please try again.');
    }
  };

  // Utility function to get user role from AsyncStorage
  const getUserRole = async () => {
    try {
      const staffJson = await AsyncStorage.getItem('staffData');
      if (!staffJson) {
        console.log('No staff data found in AsyncStorage');
        return null;
      }
      
      const staffData = JSON.parse(staffJson);
      return Array.isArray(staffData.role) ? staffData.role[0] : staffData.role;
    } catch (err) {
      console.log('Error getting user role:', err);
      return null;
    }
  };

  // Handle refresh of stores
  const refreshStores = async () => {
    try {
      setLoading(true);
      const userInfo = await getCurrentUser();
      const userId = userInfo.username;
      
      console.log('Refreshing stores for user:', userId);
      const { data: storeData } = await client.graphql({
        query: listStores,
        variables: { filter: { ownerId: { eq: userId } } }
      });
      
      const filteredStores = storeData.listStores.items.filter(s => !s._deleted);
      console.log(`Refreshed ${filteredStores.length} stores for user ${userId}`);
      
      dispatch(setStoreList(filteredStores));
      setCurrentUserStores(filteredStores);
      
      const defaultStore = filteredStores.find(s => s.isDefault);
      if (defaultStore) {
        setDefaultStoreId(defaultStore.id);
      }
    } catch (err) {
      console.log('Error refreshing stores:', err);
      setErrorMessage('Failed to refresh stores');
    } finally {
      setLoading(false);
    }
  };

  // Check if a store is the default store
  const isDefaultStore = (store) => {
    if (store.isDefault) return true;
    if (defaultStoreId && store.id === defaultStoreId) return true;
    
    // Fallback: check if it's the "Main Store" or contains "default" in name
    const name = store.name.toLowerCase();
    return name.includes('main store') || name.includes('default');
  };

  const renderItem = ({ item }) => {
    if (!item || !item.name) return null;

    const isDefault = isDefaultStore(item);
    return (
      <StoreSummaryCard 
        store={item} 
        isDefault={isDefault} 
        onPress={() => {
          setCurrentStoreHandler(item);
          navigation.navigate('StoreDashboard', { store: item });
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Appbar
        title="Your Stores"
        subtitle={`${currentUserRole || 'User'}`}
      />
      
      {loading || storeLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 20, color: '#555' }}>Loading your stores...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {errorMessage ? (
            <View style={styles.centered}>
              <Text style={{ color: 'red', marginBottom: 10 }}>{errorMessage}</Text>
            </View>
          ) : null}
          
          {currentUserStores.length === 0 ? (
            <View style={styles.centered}>
              <View style={styles.emptyState}>
                <Icon name="shopping-bag" size={60} color={colors.primary} />
                <Text style={styles.emptyText}>
                  You don't have any stores yet. Please contact your administrator to get access.
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              data={currentUserStores}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
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
  storeCard: {
    marginBottom: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    backgroundColor: 'white',
    padding: 16,
  },
  defaultStore: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  defaultBadge: {
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#6c757d',
  },
  storeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  storeIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40',
  },
  warningBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  warningText: {
    fontSize: 10,
    color: '#212529',
    fontWeight: 'bold',
  },
  storeFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  tapToSelect: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
  }
});

export default StoreScreen;
