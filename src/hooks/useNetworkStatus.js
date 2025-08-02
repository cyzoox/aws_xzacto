import {useState, useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {useSelector} from 'react-redux';
import {syncService} from '../services/syncService';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  // Get pending changes from all slices
  const storePendingChanges = useSelector(
    state => state.store?.pendingChanges || [],
  );
  const staffPendingChanges = useSelector(
    state => state.staff?.pendingChanges || [],
  );
  const salesPendingChanges = useSelector(
    state => state.sales?.pendingChanges || [],
  );

  // Calculate total pending changes
  const totalPendingChanges =
    storePendingChanges.length +
    staffPendingChanges.length +
    salesPendingChanges.length;

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online);

      // If we're coming back online and have pending changes, trigger sync
      if (online && totalPendingChanges > 0) {
        syncService.syncData();
      }
    });

    // Initial network check
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, [totalPendingChanges]);

  return {
    isOnline,
    hasPendingChanges: totalPendingChanges > 0,
    pendingChangesCount: totalPendingChanges,
  };
};
