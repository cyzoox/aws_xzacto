import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
  lastSync: null,
  pendingChanges: [], // For offline changes that need to be synced
};

export const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    setSalesList: (state, action) => {
      state.items = action.payload;
      state.lastSync = new Date().toISOString();
    },
    addSaleTransaction: (state, action) => {
      const newSale = {
        ...action.payload,
        id: Date.now().toString(), // Temporary ID until synced
        _status: 'pending_create',
        timestamp: new Date().toISOString(),
      };
      state.items.push(newSale);
      state.pendingChanges.push({
        type: 'CREATE',
        data: newSale,
        timestamp: new Date().toISOString(),
      });
    },
    updateSaleTransaction: (state, action) => {
      const index = state.items.findIndex(
        item => item.id === action.payload.id,
      );
      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...action.payload,
          _status: 'pending_update',
        };
        state.pendingChanges.push({
          type: 'UPDATE',
          data: action.payload,
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
    clearPendingChanges: state => {
      state.pendingChanges = [];
    },
    clearAll: state => {
      state.items = [];
      state.pendingChanges = [];
      state.lastSync = null;
      state.error = null;
    },
    syncComplete: (state, action) => {
      // Update local IDs with server IDs after sync
      const {localId, serverId} = action.payload;
      const index = state.items.findIndex(item => item.id === localId);
      if (index !== -1) {
        state.items[index].id = serverId;
        state.items[index]._status = 'synced';
      }
    },
  },
});

export const {
  setSalesList,
  addSaleTransaction,
  updateSaleTransaction,
  setLoading,
  setError,
  clearPendingChanges,
  clearAll,
  syncComplete,
} = salesSlice.actions;

export default salesSlice.reducer;
