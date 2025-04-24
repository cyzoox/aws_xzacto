import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import staffReducer from './slices/staffSlice';
import storeReducer from './slices/storeSlice';
import salesReducer from './slices/salesSlice';

// Root reducer combining all slices
const rootReducer = combineReducers({
  staff: staffReducer,
  store: storeReducer,
  sales: salesReducer,
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // Add blacklist/whitelist if needed
  blacklist: ['_persist'] // Don't persist the persist state itself
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store with middleware
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Create sync middleware to handle offline data
export const syncMiddleware = () => (next) => (action) => {
  const result = next(action);
  const state = store.getState();

  // Check for pending changes when online
  if (navigator.onLine) {
    const staffPendingChanges = state.staff?.pendingChanges || [];
    const storePendingChanges = state.store?.pendingChanges || [];

    // TODO: Implement sync logic when back online
    if (staffPendingChanges.length > 0 || storePendingChanges.length > 0) {
      console.log('Pending changes detected, will sync when implemented');
    }
  }

  return result;
};
