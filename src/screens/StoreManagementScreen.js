import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { TextInput, Button, DataTable, Portal, Modal } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import Appbar from '../components/Appbar';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { addStore } from '../store/slices/storeSlice';
import { getCurrentUser } from '@aws-amplify/auth';

export default function StoreManagementScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isOnline, hasPendingChanges, pendingChangesCount } = useNetworkStatus();
  const [currentUserId, setCurrentUserId] = useState(null);

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
  
  // Get the authenticated user ID on component mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const authUser = await getCurrentUser();
        const userId = authUser.userId;
        console.log('StoreManagementScreen: Current user ID set:', userId);
        setCurrentUserId(userId);
      } catch (error) {
        console.error('Error getting current user:', error);
        Alert.alert('Error', 'Authentication error. Please restart the app.');
      }
    };
    
    fetchUserId();
  }, []);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newStore, setNewStore] = useState({
    name: '',
    location: '',
  });

  const handleAddStore = () => {
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

    // Create store input
    const storeInput = {
      ...newStore,
      ownerId: currentUserId, // Associate store with the authenticated user
      status: 'ACTIVE'
    };
    
    console.log('Creating store with ownerId:', currentUserId);

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
        onMenuPress={() => navigation.openDrawer()}
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
