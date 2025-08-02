import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {generateClient} from 'aws-amplify/api';

// Async thunks
const client = generateClient();

// GraphQL queries and mutations
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import {listStaffWithStores} from '../../graphql/custom-queries';

const initialState = {
  items: [], // Staff data
  loading: false,
  error: null,
  lastSync: new Date().toISOString(),
  pendingChanges: [], // For offline changes that need to be synced
};

// Create initial SuperAdmin account
export const createInitialSuperAdmin = createAsyncThunk(
  'staff/createInitialSuperAdmin',
  async ({ownerId}) => {
    try {
      const response = await client.graphql({
        query: mutations.createStaff,
        variables: {
          input: {
            name: 'Super Admin',
            password: '00000',
            role: ['SuperAdmin'],
            log_status: 'INACTIVE',
            device_id: '',
            device_name: '',
            ownerId,
          },
        },
      });

      return response.data.createStaff;
    } catch (error) {
      console.error('Error creating SuperAdmin:', error);
      throw error;
    }
  },
);

// Fetch staff by owner ID
export const fetchStaff = createAsyncThunk(
  'staff/fetchStaff',
  async ({ownerId}) => {
    try {
      console.log('Fetching staff with stores for ownerId:', ownerId);
      const response = await client.graphql({
        query: listStaffWithStores,
        variables: {
          filter: {
            ownerId: {eq: ownerId},
          },
        },
      });

      // Log the fetched staff data with their store relationships
      console.log(
        'Staff with store relationships:',
        response.data.listStaff.items.map(staff => ({
          id: staff.id,
          name: staff.name,
          stores: staff.stores?.items?.map(connection => ({
            id: connection.store?.id,
            name: connection.store?.name,
          })),
        })),
      );

      return response.data.listStaff.items;
    } catch (error) {
      console.error('Error fetching staff with stores:', error);
      throw error;
    }
  },
);

// Connect staff to stores
export const connectStaffToStores = createAsyncThunk(
  'staff/connectStaffToStores',
  async ({staffId, storeIds}, {dispatch}) => {
    try {
      console.log('Connecting staff', staffId, 'to stores:', storeIds);

      // Create connections in API
      const results = [];

      for (const storeId of storeIds) {
        try {
          const response = await client.graphql({
            query: mutations.createStaffStore,
            variables: {
              input: {
                staffId,
                storeId,
              },
            },
          });

          results.push({
            success: true,
            store: {id: storeId},
          });
        } catch (err) {
          console.error(
            `Failed to connect staff ${staffId} to store ${storeId}:`,
            err,
          );
          results.push({success: false, storeId, error: err.message});
        }
      }

      // Return both staffId and results for the reducer
      return {staffId, results};
    } catch (error) {
      console.error('Error connecting staff to stores:', error);
      throw error;
    }
  },
);

// Staff slice
export const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    setStaffList: (state, action) => {
      state.items = action.payload;
      state.lastSync = new Date().toISOString();
    },

    addStaffMember: (state, action) => {
      // Create staff with all required fields
      // Use the ID from the payload if provided, otherwise generate one
      const staffId = action.payload.id || Date.now().toString();

      const newStaff = {
        id: staffId,
        name: action.payload.name,
        password: action.payload.password || '00000',
        role: Array.isArray(action.payload.role)
          ? action.payload.role
          : [action.payload.role],
        log_status: action.payload.log_status || 'INACTIVE',
        device_id: action.payload.device_id || '',
        device_name: action.payload.device_name || '',
        ownerId: action.payload.ownerId,
        // Initialize empty stores array
        stores: {items: []},
        _status: 'pending_create',
        _lastChangedAt: new Date().toISOString(),
        _deleted: false,
      };

      // Only modify state, don't return anything
      state.items.push(newStaff);
    },

    updateStaffMember: (state, action) => {
      const {id, ...changes} = action.payload;
      const index = state.items.findIndex(item => item.id === id);

      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...changes,
          _status: 'pending_update',
          _lastChangedAt: new Date().toISOString(),
        };
      }
    },

    updateStaffStores: (state, action) => {
      const {staffId, stores} = action.payload;
      const staffIndex = state.items.findIndex(item => item.id === staffId);

      if (staffIndex !== -1) {
        // Update or initialize stores property on the staff
        state.items[staffIndex].stores = stores;
        console.log(
          `Updated local staff store connections for staff ID: ${staffId}`,
        );
      }
    },

    syncComplete: (state, action) => {
      const {localId, serverId} = action.payload;
      const index = state.items.findIndex(item => item.id === localId);

      if (index !== -1) {
        state.items[index].id = serverId;
        state.items[index]._status = 'synced';
      }
    },
    deleteStaffMember: (state, action) => {
      const {id} = action.payload;
      const staffToDelete = state.items.find(s => s.id === id);

      if (staffToDelete) {
        if (
          Array.isArray(staffToDelete.role) &&
          staffToDelete.role.includes('SuperAdmin')
        ) {
          // Prevent deletion of SuperAdmin
          return state;
        }

        // Mark as deleted (soft delete)
        staffToDelete._deleted = true;
        staffToDelete._status = 'pending_delete';
        staffToDelete._lastChangedAt = new Date().toISOString();

        // Also update other required fields
        staffToDelete.log_status = 'INACTIVE'; // Update status as per schema
        staffToDelete.device_id = ''; // Clear device info
        staffToDelete.device_name = '';

        // Add to pending changes for sync
        state.pendingChanges.push({
          type: 'DELETE',
          data: {
            id, // DeleteStaffInput only requires id
            log_status: 'INACTIVE', // Ensure status is updated in API
          },
          timestamp: new Date().toISOString(),
        });

        return state;
      }
      return state;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearPendingChanges: state => {
      state.pendingChanges = [];
    },
    clearAll: state => {
      state.items = [];
      state.pendingChanges = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: builder => {
    builder
      // Create initial SuperAdmin
      .addCase(createInitialSuperAdmin.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInitialSuperAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createInitialSuperAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch staff
      .addCase(fetchStaff.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastSync = new Date().toISOString();
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Connect staff to stores
      .addCase(connectStaffToStores.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectStaffToStores.fulfilled, (state, action) => {
        state.loading = false;
        const {staffId, results} = action.payload;
        const staff = state.items.find(item => item.id === staffId);

        if (staff) {
          // Update store connections with full store data
          const successfulConnections = results
            .filter(r => r.success)
            .map(r => ({
              store: r.store,
            }));

          staff.stores = {items: successfulConnections};
          staff._status = 'synced';
          staff._lastChangedAt = new Date().toISOString();
        }
      })
      .addCase(connectStaffToStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

// Export slice actions
export const {
  setStaffList,
  addStaffMember,
  updateStaffMember,
  setLoading,
  setError,
  clearPendingChanges,
  clearAll,
  syncComplete,
  deleteStaffMember,
} = staffSlice.actions;

// Utility function to migrate existing staff to new schema
export const migrateStaffToNewSchema = async staff => {
  if (!staff) {
    return null;
  }

  try {
    // Get all stores to assign to SuperAdmin
    const {data} = await API.graphql(graphqlOperation(listStores));
    const stores = data.listStores.items;

    // Create new staff object with required fields
    const migratedStaff = {
      ...staff,
      stores: {items: []}, // Initialize empty stores
      log_status: staff.log_status || 'INACTIVE',
      device_id: staff.device_id || '',
      device_name: staff.device_name || '',
      _status: 'synced',
      _lastChangedAt: new Date().toISOString(),
      _deleted: false,
    };

    // For SuperAdmin, assign all stores
    if (migratedStaff.role.includes('SuperAdmin')) {
      for (const store of stores) {
        try {
          await API.graphql(
            graphqlOperation(createStaffStore, {
              input: {
                staffId: migratedStaff.id,
                storeId: store.id,
              },
            }),
          );
        } catch (error) {
          console.error('Error connecting SuperAdmin to store:', error);
        }
      }
    }

    return migratedStaff;
  } catch (error) {
    console.error('Error migrating staff:', error);
    return null;
  }
};

// Export reducer
export default staffSlice.reducer;
