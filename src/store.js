import {configureStore, combineReducers} from '@reduxjs/toolkit';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import productReducer from './redux/slices/productSlice';
import storeReducer from './store/slices/storeSlice';
import staffReducer from './store/slices/staffSlice';
import categoryReducer from './redux/slices/categorySlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['products', 'store', 'staff', 'categories'], // Persist products, store, staff, and categories reducers
};

const rootReducer = combineReducers({
  products: productReducer,
  store: storeReducer,
  staff: staffReducer,
  categories: categoryReducer,
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
