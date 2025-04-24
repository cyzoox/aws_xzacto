import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RoleBasedHeader } from '../components/RoleBasedHeader';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { syncService } from '../services/syncService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { addStore } from '../store/slices/storeSlice';

export default function SuperAdminScreen({ navigation, route }) {
  const { staffData } = route.params;
  const dispatch = useDispatch();

  // Get data from Redux store
  const { items: stores, loading } = useSelector(state => state.store);
  const { items: staff } = useSelector(state => state.staff);
  const { items: sales } = useSelector(state => state.sales) || { items: [] };

  // Get network status
  const { isOnline, hasPendingChanges, pendingChangesCount } = useNetworkStatus();

  // Calculated values
  const storeCount = stores.length;
  const totalStaffCount = staff.length;
  const totalSales = sales.reduce((total, sale) => total + (sale.total || 0), 0);

  useEffect(() => {
    // Initial data fetch if not already in Redux store
    if (stores.length === 0 || staff.length === 0) {
      syncService.fetchInitialData();
    }
  }, [stores.length, staff.length]);



  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RoleBasedHeader
        title="SuperAdmin Dashboard"
        navigation={navigation}
        staffData={staffData}
      />
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You are currently offline</Text>
          {hasPendingChanges && (
            <Text style={styles.pendingText}>{pendingChangesCount} changes pending sync</Text>
          )}
        </View>
      )}
      <Text style={styles.header}>SuperAdmin Dashboard</Text>
      <View style={styles.summaryContainer}>
        <TouchableOpacity 
          style={[styles.summaryBox, styles.summaryBoxClickable]}
          onPress={() => navigation.navigate('Store Management')}
        >
          <Text style={styles.summaryText}>Total Stores</Text>
          <Text style={styles.summaryNumber}>{storeCount}</Text>
          <Text style={styles.summarySubtext}>Active Stores</Text>
        </TouchableOpacity>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>Total Staff</Text>
          <Text style={styles.summaryNumber}>{totalStaffCount}</Text>
          <Text style={styles.summarySubtext}>Registered Staff</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>Total Sales</Text>
          <Text style={styles.summaryNumber}>${totalSales.toFixed(2)}</Text>
          <Text style={styles.summarySubtext}>All Time Sales</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Staff Management')}
        >
          <Text style={styles.actionButtonText}>Manage Staff</Text>
          <Text style={styles.actionButtonSubtext}>Add or view staff members</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Store Management')}
        >
          <Text style={styles.actionButtonText}>Manage Stores</Text>
          <Text style={styles.actionButtonSubtext}>Add or view store locations</Text>
        </TouchableOpacity>

        {stores.length === 0 && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => {
              dispatch(addStore({
                name: 'Default Store',
                location: 'Main Branch',
              }));
              Alert.alert(
                'Success',
                isOnline ? 
                  'Default store created successfully' : 
                  'Default store created and will be synced when online'
              );
            }}
          >
            <Text style={styles.actionButtonText}>Create Default Store</Text>
            <Text style={styles.actionButtonSubtext}>Required for staff management</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  actionContainer: {
    padding: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 16,
  },
  summaryBox: {
    width: '45%',
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    alignItems: 'center',
  },
  summaryBoxClickable: {
    backgroundColor: '#e8f4ff',
    borderWidth: 1,
    borderColor: '#007AFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  summaryText: {
    fontSize: 16,
    color: '#555',
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  summarySubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    margin: 15,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
});
