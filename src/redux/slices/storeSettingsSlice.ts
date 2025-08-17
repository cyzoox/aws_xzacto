import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple store settings interface without DataStore dependencies
export interface StoreSettingsInterface {
  id: string;
  storeId: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  vatPercentage?: number;
  lowStockThreshold?: number;
  allowCashierSalesView?: boolean;
  allowCreditSales?: boolean;
  currencySymbol?: string;
  receiptFooterText?: string;
  businessHours?: string;
}

// Define RootState interface to avoid undefined RootState error
export interface RootState {
  storeSettings: StoreSettingsState;
}

// Define the state shape with proper types
interface StoreSettingsState {
  settings: StoreSettingsInterface | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  pendingChanges: boolean;
  lastSyncTime: string | null;
}

const initialState: StoreSettingsState = {
  settings: null,
  loading: false,
  error: null,
  isConnected: true, // Assuming connected by default
  pendingChanges: false,
  lastSyncTime: null,
};

// Async thunks for AsyncStorage operations with proper typing
export const fetchStoreSettings = createAsyncThunk<
  StoreSettingsInterface | null,
  string,
  {rejectValue: string}
>('storeSettings/fetchSettings', async (storeId: string, {rejectWithValue}) => {
  try {
    // Create a storage key based on storeId
    const storageKey = `@StoreSettings_${storeId}`;

    // Retrieve settings from AsyncStorage
    const storedSettings = await AsyncStorage.getItem(storageKey);

    if (storedSettings) {
      return JSON.parse(storedSettings) as StoreSettingsInterface;
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching store settings:', error);
    return rejectWithValue(error.message || 'Failed to fetch store settings');
  }
});

export const createStoreSettings = createAsyncThunk<
  StoreSettingsInterface,
  Partial<StoreSettingsInterface>,
  {rejectValue: string}
>(
  'storeSettings/createSettings',
  async (settings: Partial<StoreSettingsInterface>, {rejectWithValue}) => {
    try {
      // Make sure required fields are present
      if (!settings.storeId) {
        return rejectWithValue('Store ID is required');
      }

      // Generate a unique ID if not provided
      const settingsId =
        settings.id ||
        `settings-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Set up the timeout promise for better UX
      const timeoutPromise = new Promise<StoreSettingsInterface>(
        (_, reject) => {
          setTimeout(() => reject(new Error('Save operation timed out')), 3000);
        },
      );

      console.log(
        `Creating store settings with ID ${settingsId} for store ${settings.storeId}`,
      );

      // Create the settings object with defaults
      const newSettings: StoreSettingsInterface = {
        id: settingsId,
        storeId: settings.storeId,
        name: settings.name || '',
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        logoUrl: settings.logoUrl || '',
        vatPercentage: settings.vatPercentage || 0,
        lowStockThreshold: settings.lowStockThreshold || 5,
        allowCashierSalesView: settings.allowCashierSalesView ?? true,
        allowCreditSales: settings.allowCreditSales ?? true,
        currencySymbol: settings.currencySymbol || '$',
        receiptFooterText: settings.receiptFooterText || '',
        businessHours: settings.businessHours || '',
      };

      // Create a storage key based on storeId
      const storageKey = `@StoreSettings_${settings.storeId}`;

      // Save promise
      const savePromise = (async () => {
        await AsyncStorage.setItem(storageKey, JSON.stringify(newSettings));
        return newSettings;
      })();

      // Race the promises to handle timeout
      return await Promise.race([savePromise, timeoutPromise]);
    } catch (error: any) {
      console.error('Error creating store settings:', error);
      return rejectWithValue(
        error.message || 'Failed to create store settings',
      );
    }
  },
);

export const updateStoreSettings = createAsyncThunk<
  StoreSettingsInterface,
  {id: string; storeId: string; updates: Partial<StoreSettingsInterface>},
  {rejectValue: string}
>(
  'storeSettings/updateSettings',
  async ({storeId, updates}, {rejectWithValue}) => {
    try {
      // Create storage key based on storeId
      const storageKey = `@StoreSettings_${storeId}`;

      // Get original settings
      const storedSettings = await AsyncStorage.getItem(storageKey);

      if (!storedSettings) {
        return rejectWithValue('Store settings not found');
      }

      // Parse stored settings
      const original = JSON.parse(storedSettings) as StoreSettingsInterface;

      // Create updated settings by merging original with updates
      const updated: StoreSettingsInterface = {
        ...original,
        ...updates,
        // Ensure these fields are never undefined
        id: original.id,
        storeId: original.storeId,
      };

      // Save updated settings
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));

      return updated;
    } catch (error: any) {
      console.error('Error updating store settings:', error);
      return rejectWithValue(
        error.message || 'Failed to update store settings',
      );
    }
  },
);

const storeSettingsSlice = createSlice({
  name: 'storeSettings',
  initialState,
  reducers: {
    // Handle network status changes
    setNetworkStatus(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },

    // When settings are saved successfully to AsyncStorage
    saveSucceeded(state) {
      state.pendingChanges = false;
      state.lastSyncTime = new Date().toISOString();
    },

    // When a store setting is updated (from AsyncStorage)
    settingsUpdated(state, action: PayloadAction<StoreSettingsInterface>) {
      state.settings = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch settings
      .addCase(fetchStoreSettings.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStoreSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchStoreSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An error occurred';
      })

      // Create settings
      .addCase(createStoreSettings.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStoreSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(createStoreSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An error occurred';
      })

      // Update settings
      .addCase(updateStoreSettings.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStoreSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(updateStoreSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An error occurred';
      });
  },
});

export const {setNetworkStatus, saveSucceeded, settingsUpdated} =
  storeSettingsSlice.actions;

// Selectors with proper typing and null checks to handle possible undefined state
export const selectStoreSettings = (state: RootState) =>
  state.storeSettings?.settings || null;
export const selectIsLoading = (state: RootState) =>
  state.storeSettings?.loading || false;
export const selectError = (state: RootState) =>
  state.storeSettings?.error || null;
export const selectIsConnected = (state: RootState) =>
  state.storeSettings?.isConnected ?? true;
export const selectHasPendingChanges = (state: RootState) =>
  state.storeSettings?.pendingChanges || false;
export const selectLastSyncTime = (state: RootState) =>
  state.storeSettings?.lastSyncTime || null;

export default storeSettingsSlice.reducer;
