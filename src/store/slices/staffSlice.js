import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { client } from 'aws-amplify/api';

// Async thunks
export const createInitialSuperAdmin = createAsyncThunk(
  'staff/createInitialSuperAdmin',
  async ({ ownerId }) => {
    const response = await client.graphql({
      query: createStaff,
      variables: {
        input: {
          name: 'Super Admin',
          password: '00000', // Default PIN as per auth flow
          role: ['SuperAdmin'], // Schema requires array of roles
          log_status: 'INACTIVE',
          device_id: '',
          device_name: '',
          ownerId // Associate with authenticated user
        }
      }
    });
    return response.data.createStaff;
  }
);


export const fetchStaff = createAsyncThunk(
  'staff/fetchStaff',
  async ({ ownerId }) => {
    // Fetch staff by ownerId
    const response = await client.graphql({
      query: listStaffs,
      variables: {
        filter: {
          ownerId: { eq: ownerId }
        }
      }
    });

    return response.data.listStaffs.items;
  }
);

export const connectStaffToStores = createAsyncThunk(
  'staff/connectToStores',
  async ({ staffId, storeIds }) => {
    const results = await Promise.all(
      storeIds.map(async (storeId) => {
        try {
          const response = await client.graphql({
            query: createStaffStore,
            variables: {
              input: {
                staffId,
                storeId,
              },
            },
          });

          const connection = response.data.createStaffStore;
          return { 
            success: true, 
            storeId,
            store: connection.store,
            staff: connection.staff
          };
        } catch (error) {
          console.error('Error connecting staff to store:', error);
          return { success: false, storeId, error };
        }
      }),
    );

    const failedConnections = results.filter(r => !r.success);
    if (failedConnections.length > 0) {
      console.error('Failed to connect staff to some stores:', failedConnections);
    }

    return { staffId, results };
  },
);

// GraphQL queries and mutations
const listStaffs = /* GraphQL */ `
  query ListStaffs($filter: ModelStaffFilterInput) {
    listStaffs(filter: $filter) {
      items {
        id
        name
        password
        role
        log_status
        device_id
        device_name
        ownerId
        stores {
          items {
            store {
              id
              name
              location
            }
          }
        }
        _deleted
      }
    }
  }
`;

const listStores = /* GraphQL */ `
  query ListStores {
    listStores {
      items {
        id
        name
        location
        _deleted
      }
    }
  }
`;

const createStaffStore = /* GraphQL */ `
  mutation CreateStaffStore($input: CreateStaffStoreInput!) {
    createStaffStore(input: $input) {
      id
      staffId
      storeId
      staff {
        id
        name
        role
        password
        log_status
        device_id
        device_name
        ownerId
      }
      store {
        id
        name
        location
      }
    }
  }
`;

const deleteStaffStore = /* GraphQL */ `
  mutation DeleteStaffStore($input: DeleteStaffStoreInput!) {
    deleteStaffStore(input: $input) {
      id
      staffId
      storeId
    }
  }
`;

const createStaff = /* GraphQL */ `
  mutation CreateStaff($input: CreateStaffInput!) {
    createStaff(input: $input) {
      id
      name
      password
      role
      log_status
      device_id
      device_name
      ownerId
      createdAt
      updatedAt
    }
  }
`;

const updateStaff = /* GraphQL */ `
  mutation UpdateStaff($input: UpdateStaffInput!) {
    updateStaff(input: $input) {
      id
      name
      role
      password
      log_status
      device_id
      device_name
      ownerId
      stores {
        items {
          store {
            id
            name
            location
          }
        }
      }
    }
  }
`;

const initialState = {
  items: [], // Staff will be fetched from the server
  loading: false,
  error: null,
  lastSync: new Date().toISOString(),
  pendingChanges: [] // For offline changes that need to be synced
};

// Helper function to determine app route based on role
const getAppRouteForRole = (role) => {
  if (!role) return null;
  if (role === 'SuperAdmin' || role === 'Admin') return 'MainApp';
  if (role === 'Cashier') return 'CashierApp';
  if (role === 'Warehouse') return 'WarehouseApp';
  return null;
};

export const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {

    setStaffList: (state, action) => {
      state.items = action.payload;
      state.lastSync = new Date().toISOString();
      
      // Update current role if available
      const currentStaff = action.payload.find(s => !s._deleted);
      if (currentStaff) {
        state.currentRole = currentStaff.role[0];
        state.initialized = true;
        state.appRoute = getAppRouteForRole(currentStaff.role[0]);
      }
    },
    addStaffMember: (state, action) => {
      // Validate required fields as per schema
      if (!action.payload.name?.trim()) {
        console.error('Staff name is required');
        return state;
      }

      if (!action.payload.role) {
        console.error('Staff role is required');
        return state;
      }



      // Create staff with required fields
      const newStaff = {
        id: Date.now().toString(),
        name: action.payload.name.trim(),
        password: '00000', // Default PIN as per auth flow
        role: Array.isArray(action.payload.role) ? action.payload.role : [action.payload.role],
        log_status: 'INACTIVE',
        device_id: '',
        device_name: '',
        ownerId: action.payload.ownerId,
        _status: 'pending_create',
        _lastChangedAt: new Date().toISOString(),
        _deleted: false
      };

      state.items.push(newStaff);

      // Only send required fields
      const createInput = {
        name: newStaff.name,
        password: '00000', // Default PIN
        role: newStaff.role,
        log_status: 'INACTIVE',
        device_id: '',
        device_name: '',
        ownerId: action.payload.ownerId
      };



      state.pendingChanges.push({
        type: 'CREATE',
        data: createInput,
        localId: newStaff.id, // Keep track of local ID for sync
        timestamp: new Date().toISOString(),
      });
      return state;
    },
    updateStaffMember: (state, action) => {
      const { id, ...changes } = action.payload;
      const staff = state.items.find(item => item.id === id);
      
      if (staff) {
        // Validate required fields as per schema
        if (changes.name !== undefined && !changes.name?.trim()) {
          console.error('Staff name is required');
          return;
        }

        if (changes.role !== undefined && !changes.role) {
          console.error('Staff role is required');
          return;
        }

        if (changes.stores !== undefined && !changes.stores?.length) {
          console.error('At least one store assignment is required');
          return;
        }

        // Create updated staff for local state
        const updatedStaff = {
          ...staff,
          ...changes,
          // Ensure role is always an array
          role: changes.role ? (Array.isArray(changes.role) ? changes.role : [changes.role]) : staff.role,
          // Keep existing password if not provided
          password: changes.password || staff.password,
          _status: 'pending_update',
          _lastChangedAt: new Date().toISOString(),
        };

        // Update local state
        const index = state.items.findIndex(item => item.id === id);
        state.items[index] = updatedStaff;



        // Only send required fields
        const updateInput = {
          id,
          name: updatedStaff.name,
          password: updatedStaff.password,
          role: updatedStaff.role,
          log_status: updatedStaff.log_status,
          device_id: updatedStaff.device_id,
          device_name: updatedStaff.device_name,
          ownerId: updatedStaff.ownerId
        };

        state.pendingChanges.push({
          type: 'UPDATE',
          data: updateInput,
          timestamp: new Date().toISOString(),
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
    },
    deleteStaffMember: (state, action) => {
      const { id } = action.payload;
      const staff = state.items.find(item => item.id === id);
      
      if (staff) {
        // Cannot delete SuperAdmin as per authentication flow
        if (staff.role.includes('SuperAdmin')) {
          state.error = 'Cannot delete SuperAdmin account';
          return;
        }
        if (staff.role.includes('SuperAdmin')) {
          console.error('Cannot delete SuperAdmin staff');
          return state;
        }

        // Mark for deletion in local state
        const index = state.items.findIndex(item => item.id === id);
        state.items[index] = {
          ...staff,
          _status: 'pending_delete',
          _deleted: true,
          _lastChangedAt: new Date().toISOString(),
          stores: { items: [] }, // Clear store connections as per schema
          log_status: 'INACTIVE', // Update status as per schema
          device_id: '', // Clear device info
          device_name: '',
        };

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
    }
  },
  extraReducers: (builder) => {
    builder
      // Create initial SuperAdmin
      .addCase(createInitialSuperAdmin.pending, (state) => {
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
      .addCase(fetchStaff.pending, (state) => {
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
      .addCase(connectStaffToStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectStaffToStores.fulfilled, (state, action) => {
        state.loading = false;
        const { staffId, results } = action.payload;
        const staff = state.items.find(item => item.id === staffId);
        
        if (staff) {
          // Update store connections with full store data
          const successfulConnections = results
            .filter(r => r.success)
            .map(r => ({
              store: r.store
            }));

          staff.stores = { items: successfulConnections };
          staff._status = 'synced';
          staff._lastChangedAt = new Date().toISOString();
        }
      })
      .addCase(connectStaffToStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
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
export const migrateStaffToNewSchema = async (staff) => {
  if (!staff) return null;

  try {
    // Get all stores to assign to SuperAdmin
    const { data } = await API.graphql(graphqlOperation(listStores));
    const stores = data.listStores.items;

    // Create new staff object with required fields
    const migratedStaff = {
      ...staff,
      stores: { items: [] }, // Initialize empty stores
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
