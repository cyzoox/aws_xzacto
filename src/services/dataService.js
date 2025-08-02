import {generateClient} from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import {store} from '../store';
import {syncService} from './syncService';
import {
  setStoreList,
  setLoading as setStoreLoading,
  setError as setStoreError,
} from '../store/slices/storeSlice';
import {
  setStaffList,
  setLoading as setStaffLoading,
  setError as setStaffError,
} from '../store/slices/staffSlice';
import {
  setSalesList,
  setLoading as setSalesLoading,
  setError as setSalesError,
} from '../store/slices/salesSlice';

const client = generateClient();

// Timestamp cache to prevent frequent refetching
const lastFetchTimestamps = {
  stores: null,
  staff: null,
  sales: null,
  products: null,
  inventory: null,
  customers: null,
  // Add more entities as needed
};

// Cache expiration time (5 minutes in milliseconds)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Check if cache is valid for an entity
const isCacheValid = entity => {
  if (!lastFetchTimestamps[entity]) {
    return false;
  }

  const now = new Date().getTime();
  return now - lastFetchTimestamps[entity] < CACHE_EXPIRATION;
};

// Update cache timestamp for an entity
const updateCacheTimestamp = entity => {
  lastFetchTimestamps[entity] = new Date().getTime();
};

class DataService {
  // Initial data fetch on app startup
  async fetchInitialData() {
    // Use existing syncService to handle offline state
    if (!syncService.isOnline) {
      console.log('App offline, using cached Redux data only');
      return;
    }

    // Don't block the UI, let this run in the background
    this.fetchStores(true);
    this.fetchStaff(true);
    this.fetchSales(true);
  }

  // Fetch stores with caching
  async fetchStores(force = false) {
    // Check if we should use cached Redux data
    if (!force && isCacheValid('stores')) {
      console.log('Using cached store data');
      return store.getState().store.items;
    }

    try {
      store.dispatch(setStoreLoading(true));

      const {data} = await client.graphql({
        query: queries.listStores,
      });

      const stores = data.listStores.items;
      store.dispatch(setStoreList(stores));
      updateCacheTimestamp('stores');

      return stores;
    } catch (error) {
      console.error('Error fetching stores:', error);
      store.dispatch(setStoreError(error.message));
      return store.getState().store.items; // Return cached data on error
    } finally {
      store.dispatch(setStoreLoading(false));
    }
  }

  // Fetch staff with caching
  async fetchStaff(force = false) {
    if (!force && isCacheValid('staff')) {
      console.log('Using cached staff data');
      return store.getState().staff.items;
    }

    try {
      store.dispatch(setStaffLoading(true));

      const {data} = await client.graphql({
        query: queries.listStaff,
      });

      const staffList = data.listStaff.items;
      store.dispatch(setStaffList(staffList));
      updateCacheTimestamp('staff');

      return staffList;
    } catch (error) {
      console.error('Error fetching staff:', error);
      store.dispatch(setStaffError(error.message));
      return store.getState().staff.items; // Return cached data on error
    } finally {
      store.dispatch(setStaffLoading(false));
    }
  }

  // Fetch sales with caching
  async fetchSales(force = false) {
    if (!force && isCacheValid('sales')) {
      console.log('Using cached sales data');
      return store.getState().sales.items;
    }

    try {
      store.dispatch(setSalesLoading(true));

      const {data} = await client.graphql({
        query: queries.listSaleTransactions,
      });

      const salesList = data.listSaleTransactions.items;
      store.dispatch(setSalesList(salesList));
      updateCacheTimestamp('sales');

      return salesList;
    } catch (error) {
      console.error('Error fetching sales:', error);
      store.dispatch(setSalesError(error.message));
      return store.getState().sales.items; // Return cached data on error
    } finally {
      store.dispatch(setSalesLoading(false));
    }
  }

  // Fetch products for a specific store
  async fetchProductsByStore(storeId, force = false) {
    const cacheKey = `products_${storeId}`;

    if (!force && isCacheValid(cacheKey)) {
      console.log(`Using cached products for store ${storeId}`);
      return store.getState().product?.itemsByStore?.[storeId] || [];
    }

    try {
      const {data} = await client.graphql({
        query: queries.listProducts,
        variables: {
          filter: {
            storeId: {eq: storeId},
          },
        },
      });

      const products = data.listProducts.items;
      // Note: This assumes you have a product slice with the right actions
      // If not, you'll need to create one or modify this function

      updateCacheTimestamp(cacheKey);
      return products;
    } catch (error) {
      console.error(`Error fetching products for store ${storeId}:`, error);
      return [];
    }
  }

  // Fetch pending inventory requests for a store
  async getPendingInventoryRequests(storeId, force = false) {
    const cacheKey = `inventory_requests_${storeId}`;

    if (!force && isCacheValid(cacheKey)) {
      console.log(`Using cached inventory requests for store ${storeId}`);
      // If we had a Redux slice for inventory requests, we'd use it here
      // For now, we don't have a persistent cache
    }

    try {
      const {data} = await client.graphql({
        query: queries.listInventoryRequests,
        variables: {
          filter: {
            storeId: {eq: storeId},
            status: {eq: 'Pending'},
          },
        },
      });

      const requests = data.listInventoryRequests.items;
      updateCacheTimestamp(cacheKey);
      return requests;
    } catch (error) {
      console.error(
        `Error fetching inventory requests for store ${storeId}:`,
        error,
      );
      return [];
    }
  }

  // Clear all cache timestamps to force fresh fetches
  invalidateAllCache() {
    Object.keys(lastFetchTimestamps).forEach(key => {
      lastFetchTimestamps[key] = null;
    });
  }

  // Invalidate specific entity cache
  invalidateCache(entity) {
    lastFetchTimestamps[entity] = null;
  }
}

export const dataService = new DataService();
