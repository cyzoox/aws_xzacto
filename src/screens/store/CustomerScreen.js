import React, {useState, useEffect} from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';

import EvilIcons from 'react-native-vector-icons/EvilIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {ListItem, Avatar, Overlay, Button} from 'react-native-elements';
import {TextInput} from 'react-native-paper';
import {AddCustomer} from './forms/AddCustomer';
import AppHeader from '../../components/AppHeader';
import colors from '../../themes/colors';
import {API, graphqlOperation} from '@aws-amplify/api';
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../../graphql/mutations';
import {listCustomers} from '../../graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Hub} from '@aws-amplify/core';
const CustomerScreen = ({navigation, route}) => {
  const STORE = route.params.store;

  const [c_name, setName] = useState('');
  const [c_address, setAddress] = useState('');
  const [c_mobile, setMobile] = useState('');
  const [c_email, setEmail] = useState('');
  const [c_points, setPoints] = useState('0');
  const [c_info, setCustomerInfo] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [deleteOverlayVisible, setDeleteOverlayVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staffData, setStaffData] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Not synced');

  // Set up DataStore sync listener
  useEffect(() => {
    const hubListener = Hub.listen('datastore', async hubData => {
      const {event, data} = hubData.payload;
      if (event === 'networkStatus') {
        setSyncStatus(data.active ? 'Online' : 'Offline');
      } else if (event === 'ready') {
        console.log('DataStore is ready');
      } else if (event === 'outboxStatus') {
        console.log(
          'DataStore outbox status:',
          data.isEmpty ? 'Empty' : `${data.outboxSize} items`,
        );
      }
    });

    // Start DataStore
    DataStore.start();

    return () => {
      hubListener();
    };
  }, []);

  // Load staff data from AsyncStorage for owner ID association
  const loadStaffData = async () => {
    try {
      const staffJson = await AsyncStorage.getItem('staffData');
      if (staffJson) {
        const data = JSON.parse(staffJson);
        setStaffData(data);
        console.log('Staff data loaded:', data.id);
        // Use userId rather than username for authentication (as per app requirements)
        if (data.userId) {
          console.log(
            'Using userId for proper store association:',
            data.userId,
          );
        }
      } else {
        console.log('No staff data found in AsyncStorage');
      }
    } catch (err) {
      console.error('Error loading staff data:', err);
    }
  };

  // Fetch customers using GraphQL API with local caching for offline support
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Check if we have customer data in the cache first
      const cachedCustomersJson = await AsyncStorage.getItem(
        `customers_${STORE.id}`,
      );
      let cachedCustomers = [];
      let cacheTimestamp = 0;

      if (cachedCustomersJson) {
        const cacheData = JSON.parse(cachedCustomersJson);
        cachedCustomers = cacheData.data;
        cacheTimestamp = cacheData.timestamp;

        // If cache is fresh (less than 5 minutes old), use it immediately
        const cacheAge = Date.now() - cacheTimestamp;
        if (cacheAge < 5 * 60 * 1000) {
          // 5 minutes
          console.log('Using cached customer data');
          setCustomers(cachedCustomers);
          setLoading(false);
        }
      }

      // Get customers from GraphQL API
      const filter = {storeId: {eq: STORE.id}};
      const response = await API.graphql(
        graphqlOperation(listCustomers, {filter, limit: 100}),
      );
      const customerList = response.data.listCustomers.items;
      console.log('Fetched customers:', customerList.length);

      // Save to cache for future use
      await AsyncStorage.setItem(
        `customers_${STORE.id}`,
        JSON.stringify({
          data: customerList,
          timestamp: Date.now(),
        }),
      );

      setCustomers(customerList);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to fetch customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  // Create a new customer using DataStore (offline-first)
  const saveCustomer = async (
    name,
    storeId,
    storeName, // Kept for compatibility with AddCustomer component
    address = null,
    points = 0,
    phone = null,
    email = null,
  ) => {
    // Validation checks
    if (!name) {
      Alert.alert('Error', 'Customer name is required!');
      return;
    }
    try {
      setIsSaving(true);

      // Create new customer using GraphQL API
      const customerInput = {
        name: name,
        storeId: storeId,
        phone: phone || null,
        email: email || null,
        address: address || null,
        points: points ? parseInt(points) : 0,
        // Use userId rather than username as per app requirements
        ownerId: staffData?.userId || staffData?.ownerId || null,
      };

      const response = await API.graphql(
        graphqlOperation(createCustomer, {input: customerInput}),
      );
      const newCustomer = response.data.createCustomer;

      console.log('Customer created:', newCustomer);
      Alert.alert('Success', 'Customer saved successfully!');

      // Update local state for immediate UI update (optimistic update)
      setCustomers(prev => [...prev, newCustomer]);

      // Update cache
      const cachedCustomersJson = await AsyncStorage.getItem(
        `customers_${STORE.id}`,
      );
      if (cachedCustomersJson) {
        const cacheData = JSON.parse(cachedCustomersJson);
        await AsyncStorage.setItem(
          `customers_${STORE.id}`,
          JSON.stringify({
            data: [...cacheData.data, newCustomer],
            timestamp: Date.now(),
          }),
        );
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.alert('Error', 'Failed to save customer');
    } finally {
      setIsSaving(false);
    }
  };

  // Update an existing customer using GraphQL API
  const updateExistingCustomer = async () => {
    if (!c_info || !c_info.id) {
      Alert.alert('Error', 'No customer selected for update');
      return;
    }

    if (!c_name) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    try {
      // Update customer using GraphQL API
      const updateInput = {
        id: c_info.id,
        name: c_name,
        phone: c_mobile || null,
        email: c_email || null,
        address: c_address || null,
        points: parseInt(c_points) || 0,
      };

      const response = await API.graphql(
        graphqlOperation(updateCustomer, {input: updateInput}),
      );
      const updated = response.data.updateCustomer;

      console.log('Customer updated:', updated);

      // Update local state for immediate UI update (optimistic update)
      setCustomers(prev =>
        prev.map(item => (item.id === updated.id ? updated : item)),
      );

      // Update cache
      const cachedCustomersJson = await AsyncStorage.getItem(
        `customers_${STORE.id}`,
      );
      if (cachedCustomersJson) {
        const cacheData = JSON.parse(cachedCustomersJson);
        await AsyncStorage.setItem(
          `customers_${STORE.id}`,
          JSON.stringify({
            data: cacheData.data.map(item =>
              item.id === updated.id ? updated : item,
            ),
            timestamp: Date.now(),
          }),
        );
      }

      setOverlayVisible(false);
      Alert.alert('Success', 'Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      Alert.alert('Error', 'Failed to update customer');
    }
  };
  // Delete customer
  const removeCustomer = async customerId => {
    try {
      // Confirm deletion
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to delete this customer?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setIsDeleting(true);

              try {
                // Delete customer using GraphQL API
                const deleteInput = {id: customerId};
                await API.graphql(
                  graphqlOperation(deleteCustomer, {input: deleteInput}),
                );

                console.log('Customer deleted:', customerId);
                Alert.alert('Success', 'Customer deleted successfully!');

                // Update local state for immediate UI update (optimistic update)
                setCustomers(prev => prev.filter(c => c.id !== customerId));

                // Update cache
                const cachedCustomersJson = await AsyncStorage.getItem(
                  `customers_${STORE.id}`,
                );
                if (cachedCustomersJson) {
                  const cacheData = JSON.parse(cachedCustomersJson);
                  await AsyncStorage.setItem(
                    `customers_${STORE.id}`,
                    JSON.stringify({
                      data: cacheData.data.filter(c => c.id !== customerId),
                      timestamp: Date.now(),
                    }),
                  );
                }
              } catch (error) {
                console.error('Error deleting customer:', error);
                Alert.alert('Error', 'Failed to delete customer');
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error('Error initiating customer deletion:', error);
    }
  };

  // Render each customer item in the list
  const renderItem = ({item}) => (
    <ListItem
      underlayColor={'#fffff'}
      bottomDivider
      containerStyle={styles.listStyle}
      onPress={() =>
        navigation.navigate('CreditDetails', {customer: item, store: STORE})
      }>
      <Avatar
        title={item.name?.[0] || 'C'}
        size={60}
        source={require('../../../assets//xzacto_icons/iconsstore/customer.png')}
      />
      <ListItem.Content>
        <ListItem.Title>{item.name}</ListItem.Title>
        <ListItem.Subtitle>{item.address || 'No address'}</ListItem.Subtitle>
        <Text style={styles.phoneText}>{item.phone || 'No phone'}</Text>
      </ListItem.Content>
      <View style={{flexDirection: 'row'}}>
        <TouchableOpacity
          onPress={() => {
            setCustomerInfo(item);
            setName(item.name || '');
            setAddress(item.address || '');
            setMobile(item.phone || '');
            setEmail(item.email || '');
            setPoints(item.points !== undefined ? item.points.toString() : '0');
            setOverlayVisible(true);
          }}>
          <FontAwesome name={'edit'} size={25} color={colors.primary} />
        </TouchableOpacity>

        <View style={{width: 20}} />
        <TouchableOpacity
          onPress={() => {
            setCustomerInfo(item);
            setDeleteOverlayVisible(true);
          }}>
          <FontAwesome name={'trash'} size={25} color={colors.red} />
        </TouchableOpacity>
        <View style={{width: 10}} />
      </View>
    </ListItem>
  );

  // Refresh control for pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  // Sync with server manually
  const syncWithServer = async () => {
    try {
      setSyncStatus('Syncing...');
      await DataStore.sync();
      setSyncStatus('Synced');
      Alert.alert('Success', 'Data synchronized with server');
    } catch (error) {
      console.error('Error syncing with server:', error);
      setSyncStatus('Sync failed');
      Alert.alert('Error', 'Failed to sync with server');
    }
  };

  // Set up interval for periodic data refresh (simulating subscription)
  useEffect(() => {
    // Load data when component mounts
    loadStaffData();
    fetchCustomers();

    // Create a subscription to network status changes to handle online/offline transitions
    const hubListener = Hub.listen('networkStatus', data => {
      console.log('Network status changed:', data);
      if (data.payload.online === true) {
        // When we come back online, fetch latest data
        console.log('Network connection restored, fetching fresh data');
        fetchCustomers();
      }
    });

    // Set up periodic refresh for data (every 30 seconds)
    const refreshInterval = setInterval(() => {
      // Only refresh if not currently refreshing and not offline
      if (!refreshing) {
        fetchCustomers();
      }
    }, 30000); // 30 seconds

    // Clean up on unmount
    return () => {
      clearInterval(refreshInterval);
      hubListener();
      console.log('Customer refresh interval and hub listener cleaned up');
    };
  }, []);

  // Set up refresh when component comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('CustomerScreen in focus, refreshing data');
      fetchCustomers();
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <AppHeader
        centerText="Customers & Credits"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <EvilIcons name={'arrow-left'} size={30} color={colors.white} />
          </TouchableOpacity>
        }
        rightComponent={
          <View style={styles.headerRightContainer}>
            <TouchableOpacity
              onPress={syncWithServer}
              style={styles.syncButton}>
              <FontAwesome
                name={syncStatus === 'Syncing...' ? 'refresh' : 'cloud-upload'}
                size={18}
                color={colors.white}
              />
              {syncStatus === 'Offline' && (
                <View style={styles.offlineIndicator} />
              )}
            </TouchableOpacity>
            <AddCustomer saveCustomer={saveCustomer} store={STORE} />
          </View>
        }
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No customers found</Text>
              <Text>Add a new customer using the + button</Text>
            </View>
          }
        />
      )}

      {/* Edit Customer Overlay */}
      <Overlay
        isVisible={overlayVisible}
        overlayStyle={{
          width: '80%',
          paddingHorizontal: 30,
          paddingBottom: 20,
          paddingTop: 15,
        }}
        onBackdropPress={() => setOverlayVisible(false)}>
        <>
          <Text style={styles.overlayTitle}>Edit Customer Details</Text>
          <TextInput
            mode="outlined"
            value={c_name}
            label="Name"
            placeholder="Customer Name"
            onChangeText={text => setName(text)}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            value={c_address}
            label="Address"
            placeholder="Customer Address"
            onChangeText={text => setAddress(text)}
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            value={c_mobile}
            label="Mobile No."
            placeholder="Mobile Number"
            onChangeText={text => setMobile(text)}
            style={styles.input}
            keyboardType="phone-pad"
          />
          <TextInput
            mode="outlined"
            value={c_email}
            label="Email"
            placeholder="Email Address"
            onChangeText={text => setEmail(text)}
            style={styles.input}
            keyboardType="email-address"
          />
          <TextInput
            mode="outlined"
            value={c_points}
            label="Points"
            placeholder="Customer Points"
            onChangeText={text => setPoints(text)}
            style={styles.input}
            keyboardType="numeric"
          />
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              buttonStyle={styles.cancelButton}
              onPress={() => setOverlayVisible(false)}
            />
            <Button
              title="Save"
              buttonStyle={styles.saveButton}
              onPress={updateExistingCustomer}
            />
          </View>
        </>
      </Overlay>

      {/* Delete Confirmation Overlay */}
      <Overlay
        isVisible={deleteOverlayVisible}
        overlayStyle={styles.deleteOverlay}
        onBackdropPress={() => setDeleteOverlayVisible(false)}>
        <>
          <Text style={styles.deleteTitle}>Delete Customer</Text>
          <Text style={styles.deleteMessage}>
            Are you sure you want to delete {c_info?.name}? This action cannot
            be undone.
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              buttonStyle={styles.cancelButton}
              onPress={() => setDeleteOverlayVisible(false)}
            />
            <Button
              title="Delete"
              buttonStyle={styles.deleteButton}
              onPress={removeCustomer}
            />
          </View>
        </>
      </Overlay>
    </View>
  );
};

CustomerScreen.navigationOptions = () => {
  return {
    headerShown: false,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButton: {
    marginRight: 15,
    padding: 5,
  },
  offlineIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
  text: {
    fontSize: 30,
  },
  listStyle: {
    flex: 1,
    height: 85,
    backgroundColor: colors.white,
    marginHorizontal: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
  },
  phoneText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  overlayTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    color: colors.primary,
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: colors.accent,
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: '#999',
    minWidth: 100,
  },
  deleteButton: {
    backgroundColor: colors.red,
    minWidth: 100,
  },
  deleteOverlay: {
    width: '80%',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  deleteTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.red,
  },
  deleteMessage: {
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 20,
  },
});

export default CustomerScreen;
