import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { TextInput, Button, DataTable, Portal, Modal } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import Appbar from '../components/Appbar';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { addStore } from '../store/slices/storeSlice';

export default function StoreManagementScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isOnline, hasPendingChanges, pendingChangesCount } = useNetworkStatus();

  // Get data from Redux store
  const { items: stores, loading } = useSelector(state => state.store);
  const { items: staff } = useSelector(state => state.staff);
  
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

    // Create store input
    const storeInput = {
      ...newStore,
      status: 'ACTIVE'
    };

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
            <DataTable.Header>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title>Location</DataTable.Title>
              <DataTable.Title>Staff Count</DataTable.Title>
            </DataTable.Header>

            {stores.map((store) => {
              const storeStaff = staff.filter(s => s.storeID === store.id);
              return (
                <DataTable.Row key={store.id}>
                  <DataTable.Cell>{store.name}</DataTable.Cell>
                  <DataTable.Cell>{store.location}</DataTable.Cell>
                  <DataTable.Cell>{storeStaff.length}</DataTable.Cell>
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
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    marginBottom: 16,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 16,
  },
  offlineBanner: {
    backgroundColor: '#f8d7da',
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f5c6cb',
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
});
