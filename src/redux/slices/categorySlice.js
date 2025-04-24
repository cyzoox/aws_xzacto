import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/api';
import { createCategory, updateCategory, deleteCategory } from '../../graphql/mutations';
import { listCategories } from '../../graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = generateClient();

// Async storage keys
const OFFLINE_CATEGORIES = 'offline_categories';
const OFFLINE_ACTIONS = 'offline_category_actions';

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const result = await client.graphql({
        query: listCategories
      });
      return result.data.listCategories.items;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createCategoryWithDetails = createAsyncThunk(
  'categories/createCategory',
  async (categoryData, { getState, rejectWithValue }) => {
    try {
      const result = await client.graphql({
        query: createCategory,
        variables: { input: categoryData }
      });
      return result.data.createCategory;
    } catch (error) {
      // Store offline action
      const offlineAction = {
        type: 'CREATE',
        data: categoryData,
        timestamp: new Date().toISOString()
      };

      const existingActions = JSON.parse(await AsyncStorage.getItem(OFFLINE_ACTIONS) || '[]');
      await AsyncStorage.setItem(OFFLINE_ACTIONS, JSON.stringify([...existingActions, offlineAction]));

      // Store category in offline storage
      const offlineCategories = JSON.parse(await AsyncStorage.getItem(OFFLINE_CATEGORIES) || '[]');
      const offlineCategory = {
        ...categoryData,
        id: `offline_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _version: 1,
        _deleted: false,
        _lastChangedAt: Date.now()
      };
      await AsyncStorage.setItem(OFFLINE_CATEGORIES, JSON.stringify([...offlineCategories, offlineCategory]));

      return offlineCategory;
    }
  }
);

export const updateCategoryWithDetails = createAsyncThunk(
  'categories/updateCategory',
  async ({ id, ...updates }, { rejectWithValue }) => {
    try {
      const result = await client.graphql({
        query: updateCategory,
        variables: { input: { id, ...updates } }
      });
      return result.data.updateCategory;
    } catch (error) {
      // Store offline action
      const offlineAction = {
        type: 'UPDATE',
        data: { id, ...updates },
        timestamp: new Date().toISOString()
      };

      const existingActions = JSON.parse(await AsyncStorage.getItem(OFFLINE_ACTIONS) || '[]');
      await AsyncStorage.setItem(OFFLINE_ACTIONS, JSON.stringify([...existingActions, offlineAction]));

      // Update category in offline storage
      const offlineCategories = JSON.parse(await AsyncStorage.getItem(OFFLINE_CATEGORIES) || '[]');
      const updatedCategories = offlineCategories.map(cat => 
        cat.id === id ? { ...cat, ...updates, updatedAt: new Date().toISOString() } : cat
      );
      await AsyncStorage.setItem(OFFLINE_CATEGORIES, JSON.stringify(updatedCategories));

      return { id, ...updates };
    }
  }
);

export const deleteCategoryWithDetails = createAsyncThunk(
  'categories/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      const result = await client.graphql({
        query: deleteCategory,
        variables: { input: { id } }
      });
      return result.data.deleteCategory;
    } catch (error) {
      // Store offline action
      const offlineAction = {
        type: 'DELETE',
        data: { id },
        timestamp: new Date().toISOString()
      };

      const existingActions = JSON.parse(await AsyncStorage.getItem(OFFLINE_ACTIONS) || '[]');
      await AsyncStorage.setItem(OFFLINE_ACTIONS, JSON.stringify([...existingActions, offlineAction]));

      // Remove category from offline storage
      const offlineCategories = JSON.parse(await AsyncStorage.getItem(OFFLINE_CATEGORIES) || '[]');
      const updatedCategories = offlineCategories.filter(cat => cat.id !== id);
      await AsyncStorage.setItem(OFFLINE_CATEGORIES, JSON.stringify(updatedCategories));

      return { id };
    }
  }
);

export const syncOfflineActions = createAsyncThunk(
  'categories/syncOfflineActions',
  async (_, { dispatch }) => {
    const offlineActions = JSON.parse(await AsyncStorage.getItem(OFFLINE_ACTIONS) || '[]');
    
    for (const action of offlineActions) {
      try {
        switch (action.type) {
          case 'CREATE':
            await dispatch(createCategoryWithDetails(action.data));
            break;
          case 'UPDATE':
            await dispatch(updateCategoryWithDetails(action.data));
            break;
          case 'DELETE':
            await dispatch(deleteCategoryWithDetails(action.data.id));
            break;
        }
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }

    // Clear offline actions after successful sync
    await AsyncStorage.setItem(OFFLINE_ACTIONS, '[]');
  }
);

const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    loading: false,
    error: null,
    offlineMode: false
  },
  reducers: {
    setOfflineMode: (state, action) => {
      state.offlineMode = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create category
      .addCase(createCategoryWithDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategoryWithDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createCategoryWithDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update category
      .addCase(updateCategoryWithDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategoryWithDetails.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(cat => cat.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateCategoryWithDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete category
      .addCase(deleteCategoryWithDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategoryWithDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(cat => cat.id !== action.payload.id);
      })
      .addCase(deleteCategoryWithDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setOfflineMode } = categorySlice.actions;
export default categorySlice.reducer;
