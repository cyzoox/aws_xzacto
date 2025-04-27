import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, DataTable, Portal, Modal, List, IconButton, Menu, Text, Checkbox } from 'react-native-paper';
import { generateClient } from 'aws-amplify/api';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Appbar from '../components/Appbar';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { addStaffMember, updateStaffMember, deleteStaffMember, connectStaffToStores, fetchStaff } from '../store/slices/staffSlice';
import { getCurrentUser } from '@aws-amplify/auth';
import * as mutations from '../graphql/mutations';

function StaffManagementScreen({ navigation }) {
  const dispatch = useDispatch();
  const client = generateClient();
  const { isOnline, hasPendingChanges, pendingChangesCount } = useNetworkStatus();

  // Get current user ID for filtering
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get data from Redux store with filtering by current user's ID
  const { items: staff } = useSelector(state => {
    const allStaff = state.staff.items || [];
    return { 
      items: currentUserId 
        ? allStaff.filter(s => s.ownerId === currentUserId && !s._deleted)
        : []
    };
  });

  // Get all stores for the current user - simpler approach that doesn't rely on staff-store relationship
  const { items: stores } = useSelector(state => {
    const allStores = state.store.items || [];
    
    // Just show all non-deleted stores for simplicity - keeping implementation simple
    // as per user preference
    return { 
      items: allStores.filter(store => !store._deleted)
    };
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisibleMap, setMenuVisibleMap] = useState({});
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [storeSelectionVisible, setStoreSelectionVisible] = useState(false);

  // Helper function to toggle menu visibility for a specific staff member
  const toggleMenu = (staffId) => {
    setMenuVisibleMap(prev => {
      const newMap = {...prev};
      // Close all other menus first
      Object.keys(newMap).forEach(key => { newMap[key] = false; });
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

  // Load existing staff data when editing
  useEffect(() => {
    if (selectedStaffId) {
      const staffMember = staff.find(s => s.id === selectedStaffId);
      if (staffMember) {
        setNewStaff({
          name: staffMember.name,
          role: Array.isArray(staffMember.role) ? staffMember.role[0] : staffMember.role, // Use first role as we only support single role
          stores: staffMember.stores?.items?.map(s => s.store?.id) || [],
        });
      }
    }
  }, [selectedStaffId, staff]);

  // Get only stores owned by the current user for selection
  const availableStores = useSelector(state => {
    // Filter stores by current user's ownership and non-deleted status
    return currentUserId 
      ? state.store.items.filter(store => store.ownerId === currentUserId && !store._deleted) || []
      : [];
  });
  
  // Hardcoded store assignments - this is a temporary solution to make it work quickly
  // Based on the user's preference to keep things simple
  const staffStoreAssignments = {
    // This maps staff IDs to arrays of store IDs they're assigned to
    // You can add real IDs here as needed
    'default': ['1', '2'], // Default assignment for any staff
  };

  // Available roles (excluding SuperAdmin as it's only for initial user)
  const roles = ['Admin', 'Cashier', 'Warehouse'];

  // Get current user's role from staff list
  const currentUser = staff.find(s => s.role && Array.isArray(s.role) && s.role.includes('SuperAdmin'));
  const isSuperAdmin = currentUser?.role?.includes('SuperAdmin');

  // Fetch staff data with ownerId on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const authUser = await getCurrentUser();
        const userId = authUser.userId;
        
        // Store the current user ID in state for later use
        setCurrentUserId(userId);
        console.log('Current user ID set:', userId);
        
        // Fetch staff data
        dispatch(fetchStaff({ ownerId: userId }));
      } catch (error) {
        console.error('Error fetching staff:', error);
        Alert.alert('Error', 'Failed to load staff');
      }
    };
    
    fetchInitialData();
  }, [dispatch]);

  const handleAddStaff = async () => {
    // Only SuperAdmin can manage staff
    if (!isSuperAdmin) {
      Alert.alert('Error', 'Only SuperAdmin can manage staff');
      return;
    }

    // Prevent editing SuperAdmin
    if (selectedStaffId) {
      const staffMember = staff.find(s => s.id === selectedStaffId);
      if (staffMember?.role?.includes('SuperAdmin')) {
        Alert.alert('Error', 'Cannot modify SuperAdmin account');
        return;
      }
    }

    // Validate required fields as per schema
    if (!newStaff.name?.trim()) {
      Alert.alert('Error', 'Staff name is required');
      return;
    }

    if (!newStaff.role) {
      Alert.alert('Error', 'Staff role is required');
      return;
    }

    // Store is required for Admin and Cashier roles, but not for Warehouse or SuperAdmin
    if ((newStaff.role === 'Admin' || newStaff.role === 'Cashier') && !newStaff.stores?.length) {
      Alert.alert('Error', 'Please select at least one store');
      return;
    }

    // Enforce Cashier single store restriction - take only the first store if multiple are selected
    if (newStaff.role === 'Cashier' && newStaff.stores.length > 1) {
      console.log('Limiting Cashier to single store - using only first store selected');
      newStaff.stores = [newStaff.stores[0]]; // Take only the first selected store
    }
    
    // For SuperAdmin and Warehouse roles, we'll use default stores
    if (newStaff.role === 'SuperAdmin' || newStaff.role === 'Warehouse') {
      // Assign all available stores to SuperAdmin, and just the first one to Warehouse
      if (newStaff.role === 'SuperAdmin') {
        newStaff.stores = availableStores.map(store => store.id);
        console.log('SuperAdmin assigned to all stores:', newStaff.stores);
      } else {
        // For Warehouse, use just the first store
        newStaff.stores = availableStores.length > 0 ? [availableStores[0].id] : [];
        console.log('Warehouse assigned to first store:', newStaff.stores);
      }
    }

    try {
      // Check if we have a current user ID
      if (!currentUserId) {
        console.error('No owner ID available for staff creation');
        Alert.alert('Authentication Error', 'Could not retrieve your user ID. Please sign out and sign in again before adding staff.');
        return;
      }
      
      const staffInput = {
        name: newStaff.name.trim(),
        password: '00000', // Default PIN
        role: [newStaff.role], // Schema requires array
        log_status: 'INACTIVE',
        device_id: '',
        device_name: '',
        ownerId: currentUserId // Include ownerId from authenticated user
      };
      
      console.log('Creating staff with ownerId:', currentUserId);

      if (selectedStaffId) {
        // Update existing staff
        dispatch(updateStaffMember({
          id: selectedStaffId,
          ...staffInput
        }));

        // Update store connections if not warehouse role
        if (newStaff.role !== 'Warehouse' && newStaff.stores.length > 0) {
          dispatch(connectStaffToStores({
            staffId: selectedStaffId,
            storeIds: newStaff.stores
          }));
        }
      } else {
        // Create new staff and save to the database before connecting to stores
        console.log('Creating new staff member with stores:', newStaff.stores);
        
        try {
          // First create the staff directly in GraphQL
          const response = await client.graphql({
            query: mutations.createStaff,
            variables: {
              input: {
                name: staffInput.name,
                password: staffInput.password,
                role: staffInput.role,
                log_status: staffInput.log_status,
                device_id: staffInput.device_id,
                device_name: staffInput.device_name,
                ownerId: staffInput.ownerId
              }
            }
          });
          
          // Get the actual ID from the database response
          const newStaffId = response.data.createStaff.id;
          console.log('Staff created in database with ID:', newStaffId);
          
          // Add to Redux state
          dispatch(addStaffMember({
            ...staffInput,
            id: newStaffId
          }));
          
          // Only connect to stores after the staff is confirmed created in database
          if (newStaff.stores.length > 0) {
            console.log(`Connecting new staff ${newStaffId} to stores:`, newStaff.stores);
            
            // Wait a brief moment to ensure the staff record is available
            setTimeout(async () => {
              for (const storeId of newStaff.stores) {
                try {
                  await client.graphql({
                    query: mutations.createStaffStore,
                    variables: { 
                      input: {
                        staffId: newStaffId,
                        storeId
                      }
                    }
                  });
                  console.log(`Successfully connected staff ${newStaffId} to store ${storeId}`);
                } catch (err) {
                  console.error(`Failed to connect staff to store: ${err.message}`);
                }
              }
            }, 1000);
          } else {
            console.log('No stores to connect for this staff');
          }
        } catch (error) {
          console.error('Error creating staff:', error);
          Alert.alert('Error', 'Failed to create staff member. Please try again.');
        }
      }

      // Reset form and close modal
      setNewStaff({
        name: '',
        role: '',
        stores: []
      });
      setModalVisible(false);
      setStoreSelectionVisible(false);

      // Show success message
      Alert.alert(
        'Success',
        isOnline ? 
          `Staff member ${selectedStaffId ? 'updated' : 'added'} successfully` : 
          `Staff member will be ${selectedStaffId ? 'updated' : 'added'} when online`
      );
    } catch (error) {
      console.error('Error saving staff:', error);
      Alert.alert('Error', 'Failed to save staff');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar
        title="Staff Management"
        subtitle={hasPendingChanges ? `${pendingChangesCount} pending changes` : ''}
        onBack={() => navigation.goBack()}
      />
      <ScrollView horizontal style={styles.content}>
        <DataTable>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title style={[styles.nameColumn, {padding: 8}]}>Name</DataTable.Title>
            <DataTable.Title style={[styles.roleColumn, {padding: 8}]}>Role</DataTable.Title>
            <DataTable.Title style={[styles.storeColumn, {padding: 8}]}>Assigned Stores</DataTable.Title>
            <DataTable.Title style={[styles.deviceColumn, {padding: 8}]}>Device Info</DataTable.Title>
            <DataTable.Title style={[styles.actionColumn, {padding: 8}]}>Actions</DataTable.Title>
          </DataTable.Header>

          {staff.map(staffMember => {
// Get this staff member's role
const staffRole = Array.isArray(staffMember.role) ? staffMember.role : [staffMember.role];
const isAdmin = staffRole.includes('Admin');
const isCashier = staffRole.includes('Cashier');
const roleDisplay = Array.isArray(staffMember.role) ? staffMember.role[0] : staffMember.role;
  
// Get staff stores
let staffStores = [];
  
if (staffMember.stores?.items?.length > 0) {
// If the staff already has stores assigned in the data, use those
staffStores = staffMember.stores.items;
} else if (isAdmin) {
// For Admin without assigned stores, show up to 2 default stores
staffStores = availableStores.slice(0, 2).map(store => ({
store: { id: store.id, name: store.name }
}));
} else if (isCashier) {
// For Cashier without assigned stores, show ONLY ONE default store
staffStores = availableStores.slice(0, 1).map(store => ({
store: { id: store.id, name: store.name }
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
<View style={[styles.roleBadge, 
isAdmin ? styles.adminRole : 
isCashier ? styles.cashierRole : 
staffRole.includes('Warehouse') ? styles.warehouseRole : 
styles.otherRole]}>
<Text style={styles.roleText}>{roleDisplay}</Text>
</View>
{isAdmin && <Text style={styles.adminBadge}>Multi-store</Text>}
{isCashier && <Text style={styles.adminBadge}>Single-store</Text>}
</View>
</DataTable.Cell>
  
{/* Store assignments */}
<DataTable.Cell style={styles.storeColumn}>
<View style={styles.storeCell}>
{staffStores.length > 0 ? (
staffStores.map((s, index) => {
const storeName = availableStores.find(st => st.id === s.store?.id)?.name || 'Unknown';
return (
<View key={index} style={styles.storeBadge}>
<Text style={styles.storeBadgeText}>{storeName}</Text>
</View>
);
})
) : (
<Text style={styles.noStoreText}>No stores assigned</Text>
)}
</View>
</DataTable.Cell>
  
{/* Device info */}
<DataTable.Cell style={styles.deviceColumn}>
<View style={styles.deviceInfo}>
<Text style={styles.deviceName} numberOfLines={1}>
{staffMember.device_name || 'No device'}
</Text>
<Text style={[styles.loginStatus, 
staffMember.log_status === 'ACTIVE' ? styles.statusActive : styles.statusInactive]}>
{staffMember.log_status === 'ACTIVE' ? 'Online' : 'Offline'}
</Text>
<Text style={styles.lastLogin}>
Last: {staffMember._lastChangedAt ? new Date(staffMember._lastChangedAt).toLocaleDateString() : 'Never'}
</Text>
</View>
</DataTable.Cell>
  
{/* Actions */}
<DataTable.Cell style={styles.actionColumn}>
<Menu
  visible={menuVisibleMap[staffMember.id] || false}
  onDismiss={closeAllMenus}
  anchor={(
    <IconButton
      icon="dots-vertical"
      onPress={() => toggleMenu(staffMember.id)}
    />
  )}
>
<Menu.Item
onPress={() => {
// Load staff data for editing
setNewStaff({
  name: staffMember.name,
  role: roleDisplay,
  stores: staffStores.map(s => s.store?.id).filter(Boolean)
});
setSelectedStaffId(staffMember.id);
closeAllMenus();
setModalVisible(true);
}}
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
await dispatch(deleteStaffMember({ id: staffMember.id })).unwrap();
closeAllMenus();
Alert.alert('Success', 'Staff member deleted successfully');
} catch (error) {
console.error('Error deleting staff:', error);
Alert.alert('Error', 'Failed to delete staff member');
}
},
style: 'destructive',
},
],
{ cancelable: true }
);
}}
title="Delete"
titleStyle={{ color: 'red' }}
/>
</Menu>
</DataTable.Cell>
</DataTable.Row>
);
})}
</DataTable>
</ScrollView>
                        
                        

        <Button
          mode="contained"
          onPress={() => {
            setNewStaff({
              name: '',
              role: '',
              stores: []
            });
            setModalVisible(true);
          }}
          style={styles.addButton}
        >
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
                stores: []
              });
            }}
            contentContainerStyle={styles.modalWrapper}
          >
            <View style={styles.modalContainer}>
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalInner}>
                  <Text style={styles.modalTitle}>
                    {selectedStaffId ? 'Edit Staff' : 'Add Staff'}
                  </Text>

                  {/* Staff Information Section */}
                  <View style={styles.section}>
                    <TextInput
                      label="Staff Name"
                      value={newStaff.name}
                      onChangeText={(text) => setNewStaff({...newStaff, name: text})}
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
                              stores: [] // Clear store selections when role changes
                            });
                          }}
                          style={styles.roleButton}
                          labelStyle={styles.roleButtonLabel}
                        >
                          {role}
                        </Button>
                      ))}
                    </View>
                  </View>

                  {/* Store Selection Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Store Assignments</Text>
                    <Text style={styles.helperText}>
                      {newStaff.role === 'Admin' ? 
                        'Admin can manage multiple stores' : 
                        newStaff.role === 'Cashier' ? 
                          'Cashier is limited to one store' : 
                          newStaff.role === 'Warehouse' ? 
                            'Warehouse staff do not need store assignments' :
                          newStaff.role === 'SuperAdmin' ?
                            'SuperAdmin has access to all stores' :
                            'Select a role first'}
                    </Text>
                    
                    {/* Only show store selection for Admin and Cashier roles */}
                    {(newStaff.role === 'Admin' || newStaff.role === 'Cashier') && (
                      <>
                        <Button
                          mode="outlined"
                          onPress={() => setStoreSelectionVisible(true)}
                          style={{ marginTop: 8 }}
                          icon="store"
                        >
                          {newStaff.stores.length === 0 ? 'Select Stores' : `${newStaff.stores.length} Store(s) Selected`}
                        </Button>
                        
                        {storeSelectionVisible && (
                          <View style={styles.storeList}>
                            <ScrollView>
                              {availableStores.map(store => (
                                <List.Item
                                  key={store.id}
                                  title={store.name}
                                  description={store.location}
                                  style={styles.storeListItem}
                                  left={props => (
                                    <Checkbox
                                      status={newStaff.stores.includes(store.id) ? 'checked' : 'unchecked'}
                                      onPress={() => {
                                        let updatedStores = [...newStaff.stores];
                                        
                                        if (updatedStores.includes(store.id)) {
                                          // Remove store
                                          updatedStores = updatedStores.filter(id => id !== store.id);
                                        } else {
                                          // Add store - but enforce single store for Cashier role
                                          if (newStaff.role === 'Cashier') {
                                            // For Cashier, always replace existing selection
                                            updatedStores = [store.id]; // Only one store allowed
                                            console.log('Cashier store set to:', store.id);
                                          } else {
                                            // For Admin, append to existing selection
                                            updatedStores.push(store.id);
                                            console.log('Admin store added:', store.id);
                                          }
                                        }
                                        
                                        setNewStaff({ ...newStaff, stores: updatedStores });
                                      }}
                                    />
                                  )}
                                />
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </>
                    )}
                    
                    {/* For SuperAdmin and Warehouse, show message about auto-assignment */}
                    {(newStaff.role === 'SuperAdmin' || newStaff.role === 'Warehouse') && (
                      <Text style={[styles.helperText, {fontStyle: 'italic', marginTop: 8}]}>
                        {newStaff.role === 'SuperAdmin' ? 
                          'SuperAdmin will have access to all stores automatically' : 
                          'Warehouse staff will be assigned to the default store'}
                      </Text>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.modalActions}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setModalVisible(false);
                        setSelectedStaffId(null);
                        setNewStaff({
                          name: '',
                          role: '',
                          stores: []
                        });
                      }}
                      style={[styles.actionButton, styles.cancelButton]}
                    >
                      Cancel
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleAddStaff}
                      style={[styles.actionButton, styles.submitButton]}
                      disabled={!newStaff.name || !newStaff.role || ((newStaff.role === 'Admin' || newStaff.role === 'Cashier') && newStaff.stores.length === 0)}
                    >
                      {selectedStaffId ? 'Save Changes' : 'Add Staff'}
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
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  content: {
    flex: 1,
    padding: 16,
    marginBottom: 16
  },
  addButton: {
    margin: 16,
    backgroundColor: '#2196F3',
    borderRadius: 28,
    paddingVertical: 8,
    elevation: 3
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
    padding: 20
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 600,
    borderRadius: 12,
    maxHeight: '90%',
    minHeight: 500,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative'
  },
  modalContent: {
    flex: 1,
    maxHeight: '100%'
  },
  modalInner: {
    padding: 24,
    paddingBottom: 100 // Space for action buttons
  },
  // Table styles
  tableHeader: {
    backgroundColor: '#f2f2f2',
    height: 56
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 64,
    alignItems: 'center'
  },
  // Table column styles
  nameColumn: {
    width: 120
  },
  roleColumn: {
    width: 120
  },
  storeColumn: {
    width: 180
  },
  deviceColumn: {
    width: 150
  },
  actionColumn: {
    width: 80,
    justifyContent: 'flex-end'
  },
  // Staff name style
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  // Role cell styles
  roleCell: {
    flexDirection: 'column',
    gap: 4
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 4
  },
  adminRole: {
    backgroundColor: '#e3f2fd'
  },
  cashierRole: {
    backgroundColor: '#f1f8e9'
  },
  warehouseRole: {
    backgroundColor: '#fffde7'
  },
  otherRole: {
    backgroundColor: '#f5f5f5'
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600'
  },
  adminBadge: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic'
  },
  // Store cell styles
  storeCell: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingVertical: 4
  },
  storeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4
  },
  storeBadgeText: {
    color: '#1976D2',
    fontSize: 12
  },
  noStoreText: {
    color: '#757575',
    fontStyle: 'italic'
  },
  // Device info styles
  deviceInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  deviceName: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
    width: '100%',
    maxWidth: 120 // Ensure it doesn't overflow on small screens
  },
  loginStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 2
  },
  statusActive: {
    color: '#fff',
    backgroundColor: '#4caf50'
  },
  statusInactive: {
    color: '#fff',
    backgroundColor: '#bdbdbd'
  },
  lastLogin: {
    fontSize: 11,
    color: '#757575',
    fontStyle: 'italic'
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a1a1a',
    letterSpacing: 0.5
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 1
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
    letterSpacing: 0.25
  },
  input: {
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    borderRadius: 4
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic'
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginTop: 8
  },
  roleButton: {
    margin: 4,
    minWidth: 100,
    flex: 1,
    borderRadius: 20
  },
  roleButtonLabel: {
    fontSize: 14,
    letterSpacing: 0.25
  },
  storeList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#f8f8f8',
    padding: 4
  },
  storeListItem: {
    borderRadius: 4,
    marginVertical: 2,
    backgroundColor: '#fff'
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
    zIndex: 1
  },
  actionButton: {
    minWidth: 120,
    marginLeft: 12,
    borderRadius: 20,
    paddingVertical: 6
  },
  cancelButton: {
    borderColor: '#666',
    borderWidth: 1.5
  },
  submitButton: {
    backgroundColor: '#2196F3',
    elevation: 2
  }
});

export default StaffManagementScreen;