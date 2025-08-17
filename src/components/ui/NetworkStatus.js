/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useSelector} from 'react-redux';
import {
  selectIsConnected,
  selectHasPendingChanges,
} from '../../redux/slices/storeSettingsSlice';

/**
 * NetworkStatus - A component to display network connectivity status
 *
 * Shows the current network connectivity status and pending changes
 * to provide visual feedback for offline-first functionality
 * Uses Redux to retrieve status automatically without props
 */
const NetworkStatus = () => {
  // Get network status and pending changes from Redux store with default fallbacks
  // Use try-catch to handle potential Redux store initialization issues
  let isConnected = true;
  let pendingChanges = false;

  try {
    const storeIsConnected = useSelector(selectIsConnected);
    const storePendingChanges = useSelector(selectHasPendingChanges);

    // Only update if the selector returns actual values
    if (storeIsConnected !== undefined) {
      isConnected = storeIsConnected;
    }
    if (storePendingChanges !== undefined) {
      pendingChanges = storePendingChanges;
    }
  } catch (error) {
    console.log('NetworkStatus: Redux store not ready yet', error);
    // Keep using defaults
  }
  // Determine the status message and icon based on connectivity and pending changes
  const getStatusInfo = () => {
    if (isConnected) {
      return {
        icon: 'wifi',
        color: pendingChanges ? '#e6a23c' : '#67c23a',
        message: pendingChanges
          ? 'Online - Syncing changes...'
          : 'Online - All changes synced',
      };
    } else {
      return {
        icon: 'wifi-off',
        color: '#f56c6c',
        message: pendingChanges
          ? 'Offline - Changes will sync when connected'
          : 'Offline - No pending changes',
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={styles.container}>
      <FontAwesome name={statusInfo.icon} size={16} color={statusInfo.color} />
      <Text style={[styles.statusText, {color: statusInfo.color}]}>
        {statusInfo.message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default NetworkStatus;
