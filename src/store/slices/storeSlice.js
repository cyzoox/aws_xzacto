import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../../graphql/queries';

// Async thunks
const client = generateClient();

// Fetch stores by owner ID
export const fetchStores = createAsyncThunk(
  'store/fetchStores',
  async ({ ownerId }) => {
    try {
      console.log('Fetching stores for ownerId:', ownerId);
      const response = await client.graphql({
        query: queries.listStores,
        variables: {
          filter: {
            ownerId: { eq: ownerId }
          }
        }
      });

      return response.data.listStores.items;
    } catch (error) {
      console.error('Error fetching stores:', error);
      throw error;
    }
  }
);

const initialState = {
  items: [
    {
      id: '1',
      name: 'Main Store',
      location: 'Manila',
      _status: 'synced',
      _lastChangedAt: new Date().toISOString(),
      _deleted: false,
      products: [],
      staff: [],
      transactions: [],
      expenses: [],
      customers: [],
      suppliers: []
    }
  ],
  loading: false,
  error: null,
  lastSync: new Date().toISOString(),
  pendingChanges: [], // For offline changes that need to be synced
};

export const storeSlice = createSlice({
  name: 'store',
  initialState,
  reducers: {
    setStoreList: (state, action) => {
      state.items = action.payload;
      state.lastSync = new Date().toISOString();
    },
    addStore: (state, action) => {
      // Ensure required fields from schema are present
      if (!action.payload.name || !action.payload.location) {
        console.error('Store name and location are required');
        return;
      }

      // Create store with all fields for local state
      const newStore = {
        ...action.payload,
        id: Date.now().toString(), // Temporary ID until synced
        _status: 'pending_create',
        _lastChangedAt: new Date().toISOString(),
        _deleted: false,
        products: [], // Initialize empty relations as per schema
        staff: [],
        transactions: [],
        expenses: [],
        customers: [],
        suppliers: []
      };
      state.items.push(newStore);

      // Only send required fields to the API
      const createInput = {
        name: action.payload.name,
        location: action.payload.location,
        ownerId: action.payload.ownerId // Include ownerId when creating store
      };
      
      state.pendingChanges.push({
        type: 'CREATE',
        data: createInput,
        localId: newStore.id, // Keep track of local ID for sync
        timestamp: new Date().toISOString()
      });
    },
    updateStore: (state, action) => {
      const { id, ...changes } = action.payload;
      const store = state.items.find(item => item.id === id);
      
      if (store) {
        // Ensure required fields remain present after update
        const updatedStore = {
          ...store,
          ...changes,
          _status: 'pending_update',
          _lastChangedAt: new Date().toISOString()
        };

        // Validate required fields from schema
        if (!updatedStore.name || !updatedStore.location) {
          console.error('Store name and location are required');
          return;
        }

        // Update the store
        const index = state.items.findIndex(item => item.id === id);
        state.items[index] = updatedStore;
        
        // Only send required fields to the API
        const updateInput = {
          id,
          name: updatedStore.name,
          location: updatedStore.location
        };

        state.pendingChanges.push({
          type: 'UPDATE',
          data: updateInput,
          timestamp: new Date().toISOString()
        });
      }
    },
    deleteStore: (state, action) => {
      const { id } = action.payload;
      const store = state.items.find(item => item.id === id);
      
      if (store) {
        // Mark store as deleted locally
        const index = state.items.findIndex(item => item.id === id);
        state.items[index] = {
          ...store,
          _deleted: true,
          _status: 'pending_delete',
          _lastChangedAt: new Date().toISOString()
        };

        // Add to pending changes for sync
        state.pendingChanges.push({
          type: 'DELETE',
          data: { id },
          timestamp: new Date().toISOString()
        });
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearPendingChanges: (state) => {
      state.pendingChanges = [];
    },
    clearAll: (state) => {
      state.items = [];
      state.pendingChanges = [];
      state.lastSync = null;
      state.error = null;
    },
    syncComplete: (state, action) => {
      // Update local IDs with server IDs after sync
      const { localId, serverId } = action.payload;
      const index = state.items.findIndex(item => item.id === localId);
      if (index !== -1) {
        state.items[index].id = serverId;
        state.items[index]._status = 'synced';
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch stores
      .addCase(fetchStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastSync = new Date().toISOString();
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setStoreList,
  addStore,
  updateStore,
  deleteStore,
  setLoading,
  setError,
  clearPendingChanges,
  clearAll,
  syncComplete
} = storeSlice.actions;

export default storeSlice.reducer;
