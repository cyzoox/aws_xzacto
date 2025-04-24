import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, DataTable, Portal, Modal, List, IconButton, Menu, Text, Checkbox } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Appbar from '../components/Appbar';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { addStaffMember, updateStaffMember, deleteStaffMember, connectStaffToStores, fetchStaff } from '../store/slices/staffSlice';
import { getCurrentUser } from '@aws-amplify/auth';

function StaffManagementScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isOnline, hasPendingChanges, pendingChangesCount } = useNetworkStatus();

  // Get data from Redux store
  const { items: staff } = useSelector(state => state.staff);
  const { items: stores } = useSelector(state => state.store);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [storeSelectionVisible, setStoreSelectionVisible] = useState(false);
  
  // New staff form state
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    stores: [] // Store assignments for many-to-many
  });

  // Load existing staff data when editing
  useEffect(() => {
    if (selectedStaffId) {
      const staffMember = staff.find(s => s.id === selectedStaffId);
      if (staffMember) {
        setNewStaff({
          name: staffMember.name,
          role: staffMember.role[0], // Use first role as we only support single role
          stores: staffMember.stores?.items?.map(s => s.store?.id) || [],
        });
      }
    }
  }, [selectedStaffId]);

  // Filter out deleted stores
  const availableStores = stores?.filter(store => !store._deleted) || [];

  // Available roles (excluding SuperAdmin as it's only for initial user)
  const roles = ['Admin', 'Cashier', 'Warehouse'];
  
  // Get current user's role from staff list
  const [currentUserId, setCurrentUserId] = useState(null);
  const currentUser = staff.find(s => s.role.includes('SuperAdmin'));
  const isSuperAdmin = currentUser?.role.includes('SuperAdmin');

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
      if (staffMember?.role.includes('SuperAdmin')) {
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

    // Store is required for Admin and Cashier roles, but not for Warehouse
    if (newStaff.role !== 'Warehouse' && !newStaff.stores?.length) {
      Alert.alert('Error', 'Please select at least one store');
      return;
    }

    // For non-admin roles, only one store is allowed (UI restriction)
    if (newStaff.role !== 'Admin' && newStaff.stores.length > 1) {
      Alert.alert('Error', 'Non-admin staff can only be assigned to one store');
      return;
    }

    try {
      // Get the current authenticated user
      let ownerId;
      try {
        const authUser = await getCurrentUser();
        ownerId = authUser.userId;
        console.log('Got authenticated userId:', ownerId);
      } catch (authError) {
        console.warn('Error getting current user, using stored ID:', authError);
        // Fallback to the stored current user ID
        ownerId = currentUserId || '';
      }
      
      // If still no ownerId, show error - staff must be linked to an owner
      if (!ownerId) {
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
        ownerId: ownerId // Include ownerId from authenticated user
      };
      
      console.log('Creating staff with ownerId:', ownerId);

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
      // Create new staff
      const newStaffMember = dispatch(addStaffMember(staffInput));
      
      // Connect staff to stores after creation (if not warehouse role)
      if (newStaff.role !== 'Warehouse' && newStaff.stores.length > 0) {
        // Get the new staff ID from the items in the Redux store
        // (We can't use unwrap because addStaffMember is not an async thunk)
        setTimeout(() => {
          const createdStaffMembers = staff.filter(s => s.name === staffInput.name && !s._deleted);
          const newStaffId = createdStaffMembers[createdStaffMembers.length - 1]?.id;
          
          if (newStaffId) {
            dispatch(connectStaffToStores({
              staffId: newStaffId,
              storeIds: newStaff.stores
            }));
          }
        }, 500); // Add a small delay to ensure staff is created first
      }
    }

    // Refresh staff list
    await fetchStaff();

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
      <ScrollView style={styles.content}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={styles.nameColumn}>Name</DataTable.Title>
            <DataTable.Title style={styles.roleColumn}>Role</DataTable.Title>
            <DataTable.Title style={styles.storeColumn}>Assigned Stores</DataTable.Title>
            <DataTable.Title style={styles.actionColumn}>Actions</DataTable.Title>
          </DataTable.Header>

          {staff
            .filter(s => !s._deleted)
            .map((staffMember) => {
              const isAdmin = staffMember.role.includes('Admin');
              const isSuperAdmin = staffMember.role.includes('SuperAdmin');
              const staffStores = staffMember.stores?.items || [];
              const storeNames = staffStores.length > 0
                ? staffStores.map(s => {
                    const store = availableStores.find(st => st.id === s.store?.id);
                    return store ? store.name : 'Unknown';
                  }).join(', ')
                : 'N/A';

              return (
                <DataTable.Row key={staffMember.id}>
                  <DataTable.Cell style={styles.nameColumn}>{staffMember.name}</DataTable.Cell>
                  <DataTable.Cell style={styles.roleColumn}>
                    <View style={styles.roleCell}>
                      <Text>{staffMember.role[0]}</Text>
                      {staffMember.role[0] === 'Admin' && (
                        <Text style={styles.adminBadge}>Multi-store</Text>
                      )}
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.storeColumn}>
                    <View style={styles.storeCell}>
                      {staffStores.length > 0 ? (
                        staffStores.map((s, index) => {
                          const store = availableStores.find(st => st.id === s.store?.id);
                          return store ? (
                            <View key={store.id} style={styles.storeBadge}>
                              <Text style={styles.storeBadgeText}>{store.name}</Text>
                            </View>
                          ) : null;
                        })
                      ) : (
                        <Text style={styles.noStoreText}>No stores assigned</Text>
                      )}
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.actionColumn}>
                    {!isSuperAdmin && (
                      <Menu
                        visible={menuVisible && selectedStaffId === staffMember.id}
                        onDismiss={() => {
                          setMenuVisible(false);
                          setSelectedStaffId(null);
                        }}
                        anchor={(
                          <IconButton
                            icon="dots-vertical"
                            onPress={() => {
                              setSelectedStaffId(staffMember.id);
                              setMenuVisible(true);
                            }}
                          />
                        )}
                      >
                        <Menu.Item
                          onPress={() => {
                            // Load staff data for editing
                            setNewStaff({
                              name: staffMember.name,
                              role: staffMember.role[0], // Use first role as we only support single role
                              stores: staffMember.stores?.items?.map(s => s.store?.id) || [],
                            });
                            setSelectedStaffId(staffMember.id);
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
                                      setMenuVisible(false);
                                      setSelectedStaffId(null);
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
                    )}
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
                  <Text style={styles.sectionTitle}>Store Assignment</Text>
                  <Text style={styles.helperText}>
                    {newStaff.role === 'Admin' 
                      ? 'Admin can manage multiple stores'
                      : newStaff.role 
                        ? 'Select one store to assign'
                        : 'Please select a role first'}
                  </Text>
                  {newStaff.role && (
                    <ScrollView style={styles.storeList} nestedScrollEnabled={true}>
                      {availableStores.map(store => (
                        <List.Item
                          key={store.id}
                          title={store.name}
                          description={store.location}
                          onPress={() => {
                            const isSelected = newStaff.stores.includes(store.id);
                            let newStores;

                            if (newStaff.role === 'Admin') {
                              // Admin can select multiple stores
                              newStores = isSelected
                                ? newStaff.stores.filter(id => id !== store.id)
                                : [...newStaff.stores, store.id];
                            } else {
                              // Non-admin can only select one store
                              newStores = [store.id];
                            }

                            setNewStaff({ ...newStaff, stores: newStores });
                          }}
                          left={props => (
                            <List.Icon
                              {...props}
                              icon={newStaff.role === 'Admin'
                                ? (newStaff.stores.includes(store.id) ? 'checkbox-marked' : 'checkbox-blank-outline')
                                : (newStaff.stores[0] === store.id ? 'radiobox-marked' : 'radiobox-blank')
                              }
                              color={newStaff.stores.includes(store.id) ? '#2196F3' : undefined}
                            />
                          )}
                          style={styles.storeListItem}
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>
            </ScrollView>
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
                disabled={!newStaff.name || !newStaff.role || newStaff.stores.length === 0}
              >
                {selectedStaffId ? 'Save Changes' : 'Add Staff'}
              </Button>
            </View>
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
    padding: 16
  },
  addButton: {
    margin: 16,
    backgroundColor: '#2196F3'
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
  // Table column styles
  nameColumn: {
    flex: 2
  },
  roleColumn: {
    flex: 2
  },
  storeColumn: {
    flex: 4
  },
  actionColumn: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  // Role cell styles
  roleCell: {
    flexDirection: 'column',
    gap: 4
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