import {generateClient} from 'aws-amplify/api';
import {getCurrentUser} from '@aws-amplify/auth';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import {store} from '../store';
import {
  setStaffList,
  clearPendingChanges as clearStaffPendingChanges,
  syncComplete as staffSyncComplete,
  setLoading as setStaffLoading,
  setError as setStaffError,
} from '../store/slices/staffSlice';
import {
  setStoreList,
  clearPendingChanges as clearStorePendingChanges,
  syncComplete as storeSyncComplete,
  setLoading as setStoreLoading,
  setError as setStoreError,
} from '../store/slices/storeSlice';
import {
  setSalesList,
  clearPendingChanges as clearSalesPendingChanges,
  syncComplete as salesSyncComplete,
  setLoading as setSalesLoading,
  setError as setSalesError,
} from '../store/slices/salesSlice';

const client = generateClient();

import NetInfo from '@react-native-community/netinfo';
import {AppState} from 'react-native';

class SyncService {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.unsubscribeNetInfo = null;
    this.appStateSubscription = null;
  }

  // Initialize online/offline listeners
  init() {
    // Subscribe to network state changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      if (online !== this.isOnline) {
        this.handleConnectivityChange(online);
      }
    });

    // Subscribe to app state changes
    this.appStateSubscription = AppState.addEventListener(
      'change',
      nextAppState => {
        if (nextAppState === 'active') {
          this.checkConnectivityAndSync();
        }
      },
    );

    // Initial connectivity check
    this.checkConnectivityAndSync();
  }

  async checkConnectivityAndSync() {
    try {
      const netInfo = await NetInfo.fetch();
      const online = netInfo.isConnected && netInfo.isInternetReachable;
      this.handleConnectivityChange(online);
    } catch (error) {
      console.error('Error checking connectivity:', error);
    }
  }

  handleConnectivityChange(online) {
    this.isOnline = online;
    if (online) {
      this.syncData(); // Attempt to sync when we come back online
    }
  }

  // Initial data fetch
  async fetchInitialData() {
    try {
      // Set loading states
      store.dispatch(setStoreLoading(true));
      store.dispatch(setStaffLoading(true));
      store.dispatch(setSalesLoading(true));

      // Get the authenticated user ID first
      const {username: userId} = await getCurrentUser();
      console.log('Fetching data for user ID:', userId);

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Fetch stores that belong to the current user only
      const {data: storeData} = await client.graphql({
        query: queries.listStores,
        variables: {
          filter: {ownerId: {eq: userId}},
        },
      });
      store.dispatch(setStoreList(storeData.listStores.items));
      console.log(
        `Fetched ${storeData.listStores.items.length} stores for user:`,
        userId,
      );

      // Then fetch staff for the current user only
      const {data: staffData} = await client.graphql({
        query: queries.listStaff,
        variables: {
          filter: {ownerId: {eq: userId}},
        },
      });
      store.dispatch(setStaffList(staffData.listStaff.items));
      console.log(
        `Fetched ${staffData.listStaff.items.length} staff members for user:`,
        userId,
      );

      // Finally fetch sales
      const {data: salesData} = await client.graphql({
        query: queries.listSaleTransactions,
      });
      store.dispatch(setSalesList(salesData.listSaleTransactions.items));
    } catch (error) {
      console.error('Error fetching initial data:', error);
      store.dispatch(setStoreError(error.message));
      store.dispatch(setStaffError(error.message));
      store.dispatch(setSalesError(error.message));
      // Continue with offline data from Redux store
    } finally {
      store.dispatch(setStoreLoading(false));
      store.dispatch(setStaffLoading(false));
      store.dispatch(setSalesLoading(false));
    }
  }

  // Sync pending changes with backend
  async syncData() {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    const state = store.getState();

    try {
      // Set loading states
      store.dispatch(setStoreLoading(true));
      store.dispatch(setStaffLoading(true));
      store.dispatch(setSalesLoading(true));

      // Sync stores first
      const storePendingChanges = state.store?.pendingChanges || [];
      for (const change of storePendingChanges) {
        try {
          if (change.type === 'CREATE') {
            const {data: newStore} = await client.graphql({
              query: mutations.createStore,
              variables: {input: change.data},
            });
            store.dispatch(
              storeSyncComplete({
                localId: change.localId, // Use the stored local ID
                serverId: newStore.createStore.id,
              }),
            );
          } else if (change.type === 'UPDATE') {
            await client.graphql({
              query: mutations.updateStore,
              variables: {input: change.data},
            });
          } else if (change.type === 'DELETE') {
            await client.graphql({
              query: mutations.deleteStore,
              variables: {input: {id: change.data.id}},
            });
          }
        } catch (error) {
          console.error('Error syncing store:', error);
          store.dispatch(setStoreError(error.message));
          // Continue with next change
        }
      }
      store.dispatch(clearStorePendingChanges());

      // Then sync staff
      const staffPendingChanges = state.staff?.pendingChanges || [];
      for (const change of staffPendingChanges) {
        try {
          if (change.type === 'CREATE') {
            // Ensure role is an array as per schema
            const input = {
              ...change.data,
              role: Array.isArray(change.data.role)
                ? change.data.role
                : [change.data.role],
            };

            const {data: newStaff} = await client.graphql({
              query: mutations.createStaff,
              variables: {input},
            });
            store.dispatch(
              staffSyncComplete({
                localId: change.localId,
                serverId: newStaff.createStaff.id,
              }),
            );
          } else if (change.type === 'UPDATE') {
            // Ensure role is an array as per schema
            const input = {
              ...change.data,
              role: Array.isArray(change.data.role)
                ? change.data.role
                : [change.data.role],
            };

            await client.graphql({
              query: mutations.updateStaff,
              variables: {input},
            });
          } else if (change.type === 'DELETE') {
            // Verify staff is not SuperAdmin before deletion
            const {data: staffData} = await client.graphql({
              query: queries.getStaff,
              variables: {id: change.data.id},
            });

            const staff = staffData.getStaff;
            if (!staff) {
              console.log('Staff already deleted');
              continue;
            }

            if (staff.role.includes('SuperAdmin')) {
              console.error('Cannot delete SuperAdmin staff');
              continue;
            }

            // DeleteStaffInput only requires id
            await client.graphql({
              query: mutations.deleteStaff,
              variables: {
                input: {id: change.data.id},
              },
            });
          }
        } catch (error) {
          console.error('Error syncing staff:', error);
          store.dispatch(setStaffError(error.message));
          // Continue with next change
        }
      }
      store.dispatch(clearStaffPendingChanges());

      // Finally sync sales
      for (const change of state.sales.pendingChanges) {
        try {
          if (change.type === 'CREATE') {
            const {data: newSale} = await client.graphql({
              query: mutations.createSaleTransaction,
              variables: {input: change.data},
            });
            store.dispatch(
              salesSyncComplete({
                localId: change.data.id,
                serverId: newSale.createSaleTransaction.id,
              }),
            );
          } else if (change.type === 'UPDATE') {
            await client.graphql({
              query: mutations.updateSaleTransaction,
              variables: {input: change.data},
            });
          }
        } catch (error) {
          console.error('Error syncing sale:', error);
          store.dispatch(setSalesError(error.message));
          // Continue with next change
        }
      }
      store.dispatch(clearSalesPendingChanges());
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      store.dispatch(setStoreLoading(false));
      store.dispatch(setStaffLoading(false));
      store.dispatch(setSalesLoading(false));
      this.syncInProgress = false;
    }
  }

  // Cleanup
  destroy() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

export const syncService = new SyncService();
