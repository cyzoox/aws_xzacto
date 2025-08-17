import {configureStore, combineReducers} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import productReducer from './slices/productSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import inventoryReducer from './slices/inventorySlice';
import categoryReducer from './slices/categorySlice';
import storeSettingsReducer from './slices/storeSettingsSlice';

// NOTE: staffSlice is missing, which is causing errors. This configuration assumes it's not needed for now.

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: [
    'products',
    'subscription',
    'inventory',
    'categories',
    'storeSettings',
  ], // Whitelist all existing reducers
};

const rootReducer = combineReducers({
  products: productReducer,
  subscription: subscriptionReducer,
  inventory: inventoryReducer,
  categories: categoryReducer,
  storeSettings: storeSettingsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
