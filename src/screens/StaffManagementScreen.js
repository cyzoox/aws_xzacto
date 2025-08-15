import React, {useState, useEffect, useRef, useCallback} from 'react';
import {hashPassword} from '../utils/PasswordUtils';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  DataTable,
  Portal,
  Modal,
  List,
  IconButton,
  Menu,
  Text,
  Checkbox,
} from 'react-native-paper';
import {generateClient} from 'aws-amplify/api';
import {useSelector, useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Appbar from '../components/Appbar';
import {useNetworkStatus} from '../hooks/useNetworkStatus';
import {
  addStaffMember,
  updateStaffMember,
  deleteStaffMember,
  connectStaffToStores,
  fetchStaff,
  syncComplete,
} from '../store/slices/staffSlice';
import {selectStaffByOwner} from '../store/selectors/staffSelectors';
import {fetchStores} from '../store/slices/storeSlice';
import {getCurrentUser} from '@aws-amplify/auth';
import * as mutations from '../graphql/mutations';
import * as queries from '../graphql/queries';
import colors from '../themes/colors';

function StaffManagementScreen({navigation}) {
  const dispatch = useDispatch();
  const client = generateClient();
  const {isOnline, hasPendingChanges, pendingChangesCount} = useNetworkStatus();

  // Get current user ID for filtering
  const [currentUserId, setCurrentUserId] = useState(null);

  // State for subscription limits
  const [subscriptionLimits, setSubscriptionLimits] = useState({
    storeLimit: 0,
    staffPerStoreLimit: 0,
    adminPerStoreLimit: 0,
    subscriptionStatus: 'NONE',
    planName: '',
  });

  // Get data from Redux store with filtering by current user's ID
  const staff = useSelector(state => selectStaffByOwner(state, currentUserId));

  // Get all stores for the current user - simpler approach that doesn't rely on staff-store relationship
  const {items: stores} = useSelector(state => {
    const allStores = state.store.items || [];

    // Just show all non-deleted stores for simplicity - keeping implementation simple
    // as per user preference
    return {
      items: allStores.filter(store => !store._deleted),
    };
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState(null);
  const [menuVisibleMap, setMenuVisibleMap] = useState({});
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [storeSelectionVisible, setStoreSelectionVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to toggle menu visibility for a specific staff member
  const toggleMenu = staffId => {
    setMenuVisibleMap(prev => {
      const newMap = {...prev};
      // Close all other menus first
      Object.keys(newMap).forEach(key => {
        newMap[key] = false;
      });
      // Toggle the current one
      newMap[staffId] = !newMap[staffId];
      return newMap;
    });
    setSelectedStaffId(staffId);
  };

  // Helper to close all menus
  const closeAllMenus = () => {
    setMenuVisibleMap({});
    setSelectedStaffId(null);
  };

  // New staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    stores: [], // Will be populated based on role
  });

  // Memoized handler for editing a staff member
  const handleEdit = useCallback(staffMember => {
    if (!staffMember) {
      return;
    }

    const staffStores =
      staffMember.stores?.items?.map(s => s.store?.id).filter(Boolean) || [];
    const roleDisplay = Array.isArray(staffMember.role)
      ? staffMember.role[0]
      : 'Cashier';

    setNewStaff({
      name: staffMember.name,
      role: roleDisplay,
      stores: staffStores,
    });

    setSelectedStaffId(staffMember.id);
    setModalVisible(true);
    closeAllMenus();
  }, []); // No dependencies, it will use the latest staffMember passed to it

  // Use the already fetched stores for selection
  // This ensures we're consistent with what's shown in the UI
  const availableStores = stores;

  // Hardcoded store assignments - this is a temporary solution to make it work quickly
  // Based on the user's preference to keep things simple
  const staffStoreAssignments = {
    // This maps staff IDs to arrays of store IDs they're assigned to
    // You can add real IDs here as needed
    default: ['1', '2'], // Default assignment for any staff
  };

  // Available roles (excluding SuperAdmin as it's only for initial user)
  const roles = ['Admin', 'Cashier', 'Warehouse'];

  // Get current user's role from staff list
  const currentUser = staff.find(
    s => s.role && Array.isArray(s.role) && s.role.includes('SuperAdmin'),
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // This should only run once to get the current user's ID
        const authUser = await getCurrentUser();
        const userId = authUser.userId;
        setCurrentUserId(userId);
        console.log('Current user ID set:', userId);

        const staffSession = await AsyncStorage.getItem('staffSession');
        if (staffSession) {
          const sessionData = JSON.parse(staffSession);
          setIsSuperAdmin(sessionData.role?.includes('SuperAdmin') || false);
        }

        const limitsData = await AsyncStorage.getItem('subscriptionLimits');
        if (limitsData) {
          const limits = JSON.parse(limitsData);
          console.log('Retrieved subscription limits:', limits);
          setSubscriptionLimits(limits);
        } else {
          console.log('No subscription limits found in AsyncStorage');
        }
      } catch (error) {
        console.error('Error initializing staff management screen:', error);
      }
    };

    fetchInitialData();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Fetch staff and store data when user ID is available
  useEffect(() => {
    if (currentUserId) {
      dispatch(fetchStaff({ownerId: currentUserId}));

      // Explicitly fetch stores
      dispatch(fetchStores({ownerId: currentUserId}));
      console.log('Fetching stores for user:', currentUserId);
    }
  }, [currentUserId, dispatch]);

  // Function to sync staff data to server in the background
  const syncStaffToServer = async (staffId, staffData, storeIds) => {
    try {
      console.log(`Syncing staff ${staffId} to server...`);

      // Check if this is a local ID (starts with 'local_')
      const isLocalId = staffId.toString().startsWith('local_');

      if (isLocalId) {
        // Create new staff in database
        const response = await client.graphql({
          query: mutations.createStaff,
          variables: {input: staffData},
        });

        // Get the server-assigned ID
        const serverStaffId = response.data.createStaff.id;
        console.log(`Staff created on server with ID: ${serverStaffId}`);

        // Update Redux with the new server ID
        dispatch(
          syncComplete({
            localId: staffId,
            serverId: serverStaffId,
          }),
        );

        // Use the server ID for store connections
        staffId = serverStaffId;
      } else {
        // Update existing staff in database
        await client.graphql({
          query: mutations.updateStaff,
          variables: {input: {id: staffId, ...staffData}},
        });
        console.log(`Staff ${staffId} updated on server`);
      }

      // Connect staff to stores if needed
      if (storeIds && storeIds.length > 0) {
        // First get existing connections to delete them
        const existingConnections = await client.graphql({
          query: queries.listStaffStores,
          variables: {filter: {staffId: {eq: staffId}}},
        });

        // Delete existing connections
        for (const connection of existingConnections.data.listStaffStores
          .items) {
          await client.graphql({
            query: mutations.deleteStaffStore,
            variables: {input: {id: connection.id}},
          });
        }

        // Create new connections
        for (const storeId of storeIds) {
          await client.graphql({
            query: mutations.createStaffStore,
            variables: {input: {staffId, storeId}},
          });
        }

        console.log(`Staff ${staffId} store connections synced to server`);
      }

      // Mark staff as synced in Redux
      dispatch(
        updateStaffMember({
          id: staffId,
          _status: 'synced',
          _lastChangedAt: new Date().toISOString(),
        }),
      );

      console.log(`Staff ${staffId} sync completed`);
    } catch (error) {
      console.error(`Error syncing staff ${staffId} to server:`, error);
      // Keep the pending status to retry later
    }
  };

  const handleAddStaff = async () => {
    try {
      // Validate staff name is not empty
      if (!newStaff.name.trim()) {
        Alert.alert('Error', 'Staff name cannot be empty');
        return;
      }

      // Check for duplicate staff names when creating new staff
      if (!selectedStaffId) {
        const isDuplicate = staff.some(
          s =>
            s.name.toLowerCase() === newStaff.name.trim().toLowerCase() &&
            !s._deleted,
        );

        if (isDuplicate) {
          Alert.alert(
            'Error',
            'A staff member with this name already exists. Please use a different name.',
          );
          return;
        }
      }

      // Verify store selection exists in available stores (quick validation)
      if (newStaff.stores.length > 0) {
        const validStoreIds = availableStores.map(store => store.id);
        const invalidStores = newStaff.stores.filter(
          id => !validStoreIds.includes(id),
        );

        if (invalidStores.length > 0) {
          Alert.alert(
            'Error',
            'Some selected stores are invalid. Please try again.',
          );
          return;
        }
      }

      // Only check subscription limits for new staff (not edits)
      if (!selectedStaffId) {
        // Get subscription limits directly from AsyncStorage for latest values
        const limitsData = await AsyncStorage.getItem('subscriptionLimits');
        if (limitsData) {
          const currentLimits = JSON.parse(limitsData);
          const {staffPerStoreLimit, adminPerStoreLimit, planName} =
            currentLimits;

          // Skip limit check if no limits are defined
          if (staffPerStoreLimit > 0 || adminPerStoreLimit > 0) {
            // Build efficient maps of staff and admin assignments to stores
            const storeStaffMap = {};
            const storeAdminMap = {};

            // Initialize count maps
            availableStores.forEach(store => {
              storeStaffMap[store.id] = 0;
              storeAdminMap[store.id] = 0;
            });

            // Count in a single efficient pass
            staff.forEach(s => {
              if (s.role?.includes('SuperAdmin') || s._deleted) {
                return;
              }

              const isAdmin = s.role?.includes('Admin');

              if (s.stores?.items?.length > 0) {
                s.stores.items.forEach(connection => {
                  const storeId = connection.store?.id || connection.storeId;
                  if (!storeId) {
                    return;
                  }

                  // Increment staff count
                  if (storeStaffMap[storeId] !== undefined) {
                    storeStaffMap[storeId]++;
                  }

                  // Increment admin count if staff is admin
                  if (isAdmin && storeAdminMap[storeId] !== undefined) {
                    storeAdminMap[storeId]++;
                  }
                });
              }
            });

            // Check limits for target stores
            for (const storeId of newStaff.stores) {
              // Admin limit check
              // if (adminPerStoreLimit > 0 && newStaff.role === 'Admin') {
              //   if (storeAdminMap[storeId] >= adminPerStoreLimit) {
              //     Alert.alert(
              //       'Admin Limit Reached',
              //       `Your ${planName} plan allows a maximum of ${adminPerStoreLimit} admins per store.`,
              //       [
              //         {text: 'OK'},
              //         {
              //           text: 'Upgrade Subscription',
              //           onPress: () => navigation.navigate('Subscription'),
              //         },
              //       ],
              //     );
              //     return;
              //   }
              // }

              // Staff limit check for all roles
              if (staffPerStoreLimit > 0) {
                if (storeStaffMap[storeId] >= staffPerStoreLimit) {
                  Alert.alert(
                    'Staff Limit Reached',
                    `Your ${planName} plan allows a maximum of ${staffPerStoreLimit} staff members per store.`,
                    [
                      {text: 'OK'},
                      {
                        text: 'Upgrade Subscription',
                        onPress: () => navigation.navigate('Subscription'),
                      },
                    ],
                  );
                  return;
                }
              }
            }
          }
        }
      }

      // Start the loading indicator
      setIsSaving(true);

      // Prepare staff data
      let staffData = {
        name: newStaff.name.trim(),
        role: Array.isArray(newStaff.role) ? newStaff.role : [newStaff.role],
        ownerId: currentUserId,
        log_status: 'INACTIVE',
        device_id: '',
        device_name: '',
      };
      
      // Hash password for new staff
      if (!selectedStaffId) {
        try {
          // Default password for new staff with secure hashing
          const defaultPassword = '00000';
          // Use our custom password hashing utility
          const hashedPassword = hashPassword(defaultPassword);
          
          console.log('Created hashed password for new staff');
          staffData.password = hashedPassword;
        } catch (hashError) {
          console.error('Error hashing password:', hashError);
          // Don't continue if hashing fails - security first
          Alert.alert('Error', 'There was a problem with security. Please try again.');
          setIsSaving(false);
          return;
        }
      }

      // Generate a local ID for new staff with a prefix to identify local IDs
      const tempId = selectedStaffId || `local_${Date.now()}`;

      if (selectedStaffId) {
        // Update existing staff in Redux first (offline-first approach)
        dispatch(
          updateStaffMember({
            id: selectedStaffId,
            ...staffData,
            _status: 'pending_update',
          }),
        );

        // Connect to selected stores locally first
        if (newStaff.stores.length > 0) {
          // Create local store connections
          const storeItems = newStaff.stores.map(storeId => {
            const store = availableStores.find(s => s.id === storeId);
            return {
              store: {
                id: storeId,
                name: store?.name || 'Unknown Store',
              },
            };
          });

          // Update staff with store connections locally
          dispatch(
            updateStaffMember({
              id: selectedStaffId,
              stores: {items: storeItems},
            }),
          );
        }

        // Sync with server if online
        if (isOnline) {
          syncStaffToServer(selectedStaffId, staffData, newStaff.stores);
        }
      } else {
        // Create staff locally first (offline-first approach)
        dispatch(
          addStaffMember({
            ...staffData,
            id: tempId,
            _status: 'pending_create',
          }),
        );

        // Connect to stores locally if needed
        if (newStaff.stores.length > 0) {
          // Create local store connections
          const storeItems = newStaff.stores.map(storeId => {
            const store = availableStores.find(s => s.id === storeId);
            return {
              store: {
                id: storeId,
                name: store?.name || 'Unknown Store',
              },
            };
          });

          // Update the newly added staff with store connections
          dispatch(
            updateStaffMember({
              id: tempId,
              stores: {items: storeItems},
            }),
          );
        }

        // Sync with server if online
        if (isOnline) {
          syncStaffToServer(tempId, staffData, newStaff.stores);
        }
      }

      // Reset form and close modal
      setNewStaff({name: '', role: '', stores: []});
      setSelectedStaffId(null);
      setModalVisible(false);

      // Show success message with offline-first context
      Alert.alert(
        'Success',
        isOnline
          ? `Staff member ${
              selectedStaffId ? 'updated' : 'added'
            } successfully and syncing in background`
          : `Staff member ${
              selectedStaffId ? 'updated' : 'added'
            } locally and will sync when online`,
      );
    } catch (error) {
      console.error('Error saving staff:', error);
      Alert.alert('Error', 'Failed to save staff. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar
        title="Staff Management"
        subtitle={
          hasPendingChanges ? `${pendingChangesCount} pending changes` : ''
        }
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.content} nestedScrollEnabled={true}>
        <ScrollView
          horizontal
          nestedScrollEnabled={true}
          persistentScrollbar={true}>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title style={[styles.nameColumn, {padding: 8}]}>
                Name
              </DataTable.Title>
              <DataTable.Title style={[styles.roleColumn, {padding: 8}]}>
                Role
              </DataTable.Title>
              <DataTable.Title style={[styles.storeColumn, {padding: 8}]}>
                Assigned Stores
              </DataTable.Title>
              <DataTable.Title style={[styles.deviceColumn, {padding: 8}]}>
                Device Info
              </DataTable.Title>
              <DataTable.Title style={[styles.actionColumn, {padding: 8}]}>
                Actions
              </DataTable.Title>
            </DataTable.Header>

            {staff.map(staffMember => {
              // Get this staff member's role
              const staffRole = Array.isArray(staffMember.role)
                ? staffMember.role
                : [staffMember.role];
              const isAdmin = staffRole.includes('Admin');
              const isCashier = staffRole.includes('Cashier');
              const roleDisplay = Array.isArray(staffMember.role)
                ? staffMember.role[0]
                : staffMember.role;

              // Get staff stores
              let staffStores = [];

              if (staffMember.stores?.items?.length > 0) {
                // If the staff already has stores assigned in the data, use those
                staffStores = staffMember.stores.items;
              } else if (isAdmin) {
                // For Admin without assigned stores, show up to 2 default stores
                staffStores = availableStores.slice(0, 2).map(store => ({
                  store: {id: store.id, name: store.name},
                }));
              } else if (isCashier) {
                // For Cashier without assigned stores, show ONLY ONE default store
                staffStores = availableStores.slice(0, 1).map(store => ({
                  store: {id: store.id, name: store.name},
                }));
              }

              return (
                <DataTable.Row key={staffMember.id} style={styles.tableRow}>
                  {/* Staff Name */}
                  <DataTable.Cell style={styles.nameColumn}>
                    <Text style={styles.staffName}>{staffMember.name}</Text>
                  </DataTable.Cell>

                  {/* Role with badge */}
                  <DataTable.Cell style={styles.roleColumn}>
                    <View style={styles.roleCell}>
                      <View
                        style={[
                          styles.roleBadge,
                          isAdmin
                            ? styles.adminRole
                            : isCashier
                            ? styles.cashierRole
                            : staffRole.includes('Warehouse')
                            ? styles.warehouseRole
                            : styles.otherRole,
                        ]}>
                        <Text style={styles.roleText}>{roleDisplay}</Text>
                      </View>
                      {isAdmin && (
                        <Text style={styles.adminBadge}>Multi-store</Text>
                      )}
                      {isCashier && (
                        <Text style={styles.adminBadge}>Single-store</Text>
                      )}
                    </View>
                  </DataTable.Cell>

                  {/* Store assignments */}
                  <DataTable.Cell style={styles.storeColumn}>
                    <View style={styles.storeCell}>
                      {staffStores.length > 0 ? (
                        staffStores.map((s, index) => {
                          // Use the store name directly from the relation instead of looking it up
                          const storeName = s.store?.name || 'Unknown';
                          const storeId = s.store?.id;
                          console.log(
                            `Displaying store for ${staffMember.name}: ID=${storeId}, Name=${storeName}`,
                          );
                          return (
                            <View key={index} style={styles.storeBadge}>
                              <Text style={styles.storeBadgeText}>
                                {storeName}
                              </Text>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={styles.noStoreText}>
                          No stores assigned
                        </Text>
                      )}
                    </View>
                  </DataTable.Cell>

                  {/* Device info */}
                  <DataTable.Cell style={styles.deviceColumn}>
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName} numberOfLines={1}>
                        {staffMember.device_name || 'No device'}
                      </Text>
                      <Text
                        style={[
                          styles.loginStatus,
                          staffMember.log_status === 'ACTIVE'
                            ? styles.statusActive
                            : styles.statusInactive,
                        ]}>
                        {staffMember.log_status === 'ACTIVE'
                          ? 'Online'
                          : 'Offline'}
                      </Text>
                      <Text style={styles.lastLogin}>
                        Last:{' '}
                        {staffMember._lastChangedAt
                          ? new Date(
                              staffMember._lastChangedAt,
                            ).toLocaleDateString()
                          : 'Never'}
                      </Text>
                    </View>
                  </DataTable.Cell>

                  {/* Actions */}
                  <DataTable.Cell style={styles.actionColumn}>
                    <Menu
                      visible={menuVisibleMap[staffMember.id] || false}
                      onDismiss={closeAllMenus}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          onPress={() => toggleMenu(staffMember.id)}
                        />
                      }>
                      <Menu.Item
                        onPress={() => handleEdit(staffMember)}
                        title="Edit"
                      />

                      <Menu.Item
                        onPress={() => {
                          Alert.alert(
                            'Delete Staff',
                            `Are you sure you want to delete ${staffMember.name}?`,
                            [
                              {
                                text: 'Cancel',
                                style: 'cancel',
                              },
                              {
                                text: 'Delete',
                                onPress: async () => {
                                  try {
                                    await dispatch(
                                      deleteStaffMember({id: staffMember.id}),
                                    ).unwrap();
                                    closeAllMenus();
                                    Alert.alert(
                                      'Success',
                                      'Staff member deleted successfully',
                                    );
                                  } catch (error) {
                                    console.error(
                                      'Error deleting staff:',
                                      error,
                                    );
                                    Alert.alert(
                                      'Error',
                                      'Failed to delete staff member',
                                    );
                                  }
                                },
                                style: 'destructive',
                              },
                            ],
                            {cancelable: true},
                          );
                        }}
                        title="Delete"
                        titleStyle={{color: 'red'}}
                      />
                    </Menu>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable>
        </ScrollView>
      </ScrollView>

      <Button
        mode="contained"
        onPress={() => {
          setNewStaff({
            name: '',
            role: '',
            stores: [],
          });
          setModalVisible(true);
        }}
        style={styles.addButton}>
        Add Staff
      </Button>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
            setModalVisible(false);
            setSelectedStaffId(null);
            setNewStaff({
              name: '',
              role: '',
              stores: [],
            });
          }}
          contentContainerStyle={styles.modalWrapper}>
          <View style={styles.modalContainer}>
            <ScrollView
              style={styles.modalContent}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              contentContainerStyle={{paddingBottom: 40}}>
              <View style={styles.modalInner}>
                <Text style={styles.modalTitle}>
                  {selectedStaffId ? 'Edit Staff' : 'Add Staff'}
                </Text>

                {/* Staff Information Section */}
                <View style={styles.section}>
                  <TextInput
                    label="Staff Name"
                    value={newStaff.name}
                    onChangeText={text =>
                      setNewStaff({...newStaff, name: text})
                    }
                    mode="outlined"
                    style={styles.input}
                  />

                  {!selectedStaffId && (
                    <Text style={styles.helperText}>Default PIN: 00000</Text>
                  )}
                </View>

                {/* Role Selection Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Role</Text>
                  <View style={styles.roleContainer}>
                    {roles.map(role => (
                      <Button
                        key={role}
                        mode={newStaff.role === role ? 'contained' : 'outlined'}
                        onPress={() => {
                          setNewStaff({
                            ...newStaff,
                            role,
                            stores: [], // Clear store selections when role changes
                          });
                        }}
                        style={styles.roleButton}
                        labelStyle={styles.roleButtonLabel}>
                        {role}
                      </Button>
                    ))}
                  </View>
                </View>

                {/* Store Selection Section */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Store Assignments</Text>
                  <Text style={styles.helperText}>
                    {newStaff.role === 'Admin'
                      ? 'Admin can manage multiple stores'
                      : newStaff.role === 'Cashier'
                      ? 'Cashier is limited to one store'
                      : newStaff.role === 'Warehouse'
                      ? 'Warehouse staff do not need store assignments'
                      : newStaff.role === 'SuperAdmin'
                      ? 'SuperAdmin has access to all stores'
                      : 'Select a role first'}
                  </Text>

                  {/* Only show store selection for Admin and Cashier roles */}
                  {(newStaff.role === 'Admin' ||
                    newStaff.role === 'Cashier') && (
                    <>
                      <Button
                        mode="outlined"
                        onPress={() => setStoreSelectionVisible(true)}
                        style={{marginTop: 8}}
                        icon="store">
                        {newStaff.stores.length === 0
                          ? 'Select Stores'
                          : `${newStaff.stores.length} Store(s) Selected`}
                      </Button>

                      {storeSelectionVisible && (
                        <View style={styles.storeSelectionContainer}>
                          <Text style={styles.scrollIndicator}>
                            All Available Stores ({availableStores.length})
                          </Text>
                          {availableStores.length === 0 && (
                            <Text style={styles.noStoresMessage}>
                              Loading stores or no stores available
                            </Text>
                          )}

                          {availableStores.length > 0 ? (
                            <FlatList
                              data={availableStores}
                              keyExtractor={item => item.id}
                              style={styles.storeList}
                              nestedScrollEnabled={true}
                              scrollEnabled={true}
                              showsVerticalScrollIndicator={true}
                              renderItem={({item: store}) => (
                                <TouchableOpacity
                                  style={styles.storeListItem}
                                  onPress={() => {
                                    let updatedStores = [...newStaff.stores];
                                    console.log(
                                      `Store ${store.name} (ID: ${store.id}) selected/deselected`,
                                    );
                                    console.log(
                                      'Current selections:',
                                      updatedStores,
                                    );

                                    if (updatedStores.includes(store.id)) {
                                      // Remove store
                                      updatedStores = updatedStores.filter(
                                        id => id !== store.id,
                                      );
                                      console.log(
                                        `Removed store ${store.name} from selection`,
                                      );
                                    } else {
                                      // Add store - but enforce single store for Cashier role
                                      if (newStaff.role === 'Cashier') {
                                        // For Cashier, always replace existing selection
                                        updatedStores = [store.id]; // Only one store allowed
                                        console.log(
                                          `Cashier role: Set store to only ${store.name} (ID: ${store.id})`,
                                        );
                                      } else {
                                        // For Admin, allow multiple stores
                                        updatedStores.push(store.id);
                                        console.log(
                                          `Admin role: Added store ${store.name} (ID: ${store.id})`,
                                        );
                                      }
                                    }

                                    // Show feedback about current selection
                                    console.log(
                                      'Updated store selections:',
                                      updatedStores,
                                    );

                                    setNewStaff({
                                      ...newStaff,
                                      stores: updatedStores,
                                    });
                                  }}>
                                  <View style={styles.storeItemRow}>
                                    <Checkbox
                                      status={
                                        newStaff.stores.includes(store.id)
                                          ? 'checked'
                                          : 'unchecked'
                                      }
                                    />
                                    <View style={styles.storeItemInfo}>
                                      <Text style={styles.storeItemName}>
                                        {store.name}
                                      </Text>
                                      <Text style={styles.storeItemLocation}>
                                        {store.location}
                                      </Text>
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              )}
                            />
                          ) : null}
                        </View>
                      )}
                    </>
                  )}

                  {/* For SuperAdmin and Warehouse, show message about auto-assignment */}
                  {(newStaff.role === 'SuperAdmin' ||
                    newStaff.role === 'Warehouse') && (
                    <Text
                      style={[
                        styles.helperText,
                        {fontStyle: 'italic', marginTop: 8},
                      ]}>
                      {newStaff.role === 'SuperAdmin'
                        ? 'SuperAdmin will have access to all stores automatically'
                        : 'Warehouse staff will be assigned to the default store'}
                    </Text>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setModalVisible(false);
                      setSelectedStaffId(null);
                      setNewStaff({name: '', role: '', stores: []});
                    }}
                     labelStyle={{color: colors.red}}
                    style={styles.cancelButton}
                    disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleAddStaff}
                    style={[styles.actionButton, styles.submitButton]}
                    labelStyle={{color: colors.white}}
                    disabled={
                      isSaving ||
                      !newStaff.name ||
                      !newStaff.role ||
                      ((newStaff.role === 'Admin' ||
                        newStaff.role === 'Cashier') &&
                        newStaff.stores.length === 0)
                    }
                    loading={isSaving}>
                    {isSaving
                      ? 'Saving...'
                      : selectedStaffId
                      ? 'Save Changes'
                      : 'Add Staff'}
                  </Button>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
      margin: 16,
      backgroundColor: colors.secondary,
    },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingVertical: 8,
    elevation: 3,
  },
  modalWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 600,
    borderRadius: 12,
    maxHeight: '85%', // Slightly smaller to ensure it fits on screen
    elevation: 5,
    overflow: 'hidden',
  },
  modalContent: {
    flexGrow: 1,
  },
  modalInner: {
    padding: 24,
    paddingBottom: 100, // Space for action buttons
  },
  // Table styles
  tableHeader: {
    backgroundColor: '#f2f2f2',
    height: 56,
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 64,
    alignItems: 'center',
  },
  // Table column styles
  nameColumn: {
    width: 120,
  },
  roleColumn: {
    width: 120,
  },
  storeColumn: {
    width: 180,
  },
  deviceColumn: {
    width: 150,
  },
  actionColumn: {
    width: 80,
    justifyContent: 'flex-end',
  },
  // Staff name style
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  // Role cell styles
  roleCell: {
    flexDirection: 'column',
    gap: 4,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  adminRole: {
    backgroundColor: '#e3f2fd',
  },
  cashierRole: {
    backgroundColor: '#f1f8e9',
  },
  warehouseRole: {
    backgroundColor: '#fffde7',
  },
  otherRole: {
    backgroundColor: '#f5f5f5',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  adminBadge: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
  // Store cell styles
  storeCell: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingVertical: 4,
  },
  storeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  storeBadgeText: {
    color: '#1976D2',
    fontSize: 12,
  },
  noStoreText: {
    color: '#757575',
    fontStyle: 'italic',
  },
  // Device info styles
  deviceInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  deviceName: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
    width: '100%',
    maxWidth: 120, // Ensure it doesn't overflow on small screens
  },
  loginStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 2,
  },
  statusActive: {
    color: '#fff',
    backgroundColor: '#4caf50',
  },
  statusInactive: {
    color: '#fff',
    backgroundColor: '#bdbdbd',
  },
  lastLogin: {
    fontSize: 11,
    color: '#757575',
    fontStyle: 'italic',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
    letterSpacing: 0.25,
  },
  input: {
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    borderRadius: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 8,
  },
  roleButton: {
    margin: 4,
    minWidth: 100,
    flex: 1,
    borderRadius: 20,
  },
  roleButtonLabel: {
    fontSize: 14,
    letterSpacing: 0.25,
  },
  storeList: {
    maxHeight: 250,
    backgroundColor: '#ffffff',
  },
  storeSelectionContainer: {
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  scrollIndicator: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  storeListItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  storeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeItemInfo: {
    marginLeft: 8,
    flex: 1,
  },
  storeItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  storeItemLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    elevation: 4,
    zIndex: 1,
  },
  actionButton: {
 
    borderRadius: 20,
 
    marginTop: 10
  },
  cancelButton: {
    borderColor: colors.red,
    borderWidth: 1.5,
  },
  submitButton: {
    backgroundColor: colors.secondary,
    elevation: 2,
  },
});

export default StaffManagementScreen;
