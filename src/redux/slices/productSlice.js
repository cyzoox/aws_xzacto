import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateClient } from 'aws-amplify/api';
import { listProducts, getProduct } from '../../graphql/queries';
import { createProduct, updateProduct, deleteProduct, createVariant, createAddon } from '../../graphql/mutations';
import NetInfo from '@react-native-community/netinfo';

const client = generateClient();

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const { isConnected } = await NetInfo.fetch();
      
      if (!isConnected) {
        const offlineProducts = await AsyncStorage.getItem('offline_products');
        return offlineProducts ? JSON.parse(offlineProducts) : [];
      }

      const response = await client.graphql({
        query: listProducts
      });
      
      const products = response.data.listProducts.items;
      await AsyncStorage.setItem('offline_products', JSON.stringify(products));
      return products;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createProductWithDetails = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const { isConnected } = await NetInfo.fetch();
      
      if (!isConnected) {
        const offlineAction = {
          type: 'CREATE',
          data: productData,
          timestamp: Date.now(),
          id: product.id
        };
        
        const pendingActions = await AsyncStorage.getItem('pending_product_actions');
        const actions = pendingActions ? JSON.parse(pendingActions) : [];
        actions.push(offlineAction);
        await AsyncStorage.setItem('pending_product_actions', JSON.stringify(actions));
        
        // Store in offline products
        const offlineProducts = await AsyncStorage.getItem('offline_products');
        const products = offlineProducts ? JSON.parse(offlineProducts) : [];
        products.push({ ...product, variants, addons, _offline: true });
        await AsyncStorage.setItem('offline_products', JSON.stringify(products));
        
        return { ...product, variants, addons, _offline: true };
      }

      // Online creation
      // Create the main product first
      try {
        // Create the main product first
        const productResult = await client.graphql({
          query: createProduct,
          variables: { input: productData.product }
        });
        
        const newProduct = productResult.data.createProduct;
        console.log('Created product:', newProduct);
        
        // Create variants if any
        const variantResults = await Promise.all(
          productData.variants.map(async variant => {
            try {
              const result = await client.graphql({
                query: createVariant,
                variables: { 
                  input: {
                    name: variant.name,
                    price: variant.price,
                    productId: newProduct.id
                  }
                }
              });
              return result.data.createVariant;
            } catch (error) {
              console.error('Error creating variant:', error);
              return null;
            }
          })
        );
        
        // Create addons if any
        const addonResults = await Promise.all(
          productData.addons.map(async addon => {
            try {
              const result = await client.graphql({
                query: createAddon,
                variables: {
                  input: {
                    name: addon.name,
                    price: addon.price,
                    productId: newProduct.id
                  }
                }
              });
              return result.data.createAddon;
            } catch (error) {
              console.error('Error creating addon:', error);
              return null;
            }
          })
        );
        
        // Filter out any failed creations
        const variants = variantResults.filter(v => v !== null);
        const addons = addonResults.filter(a => a !== null);
        
        return {
          ...newProduct,
          variants,
          addons
        };
      } catch (error) {
        console.error('Error in createProductWithDetails:', error);
        throw error;
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const syncOfflineActions = createAsyncThunk(
  'products/syncOfflineActions',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { isConnected } = await NetInfo.fetch();
      if (!isConnected) return;

      const pendingActions = await AsyncStorage.getItem('pending_product_actions');
      if (!pendingActions) return;

      const actions = JSON.parse(pendingActions);
      
      for (const action of actions) {
        if (action.type === 'CREATE') {
          await dispatch(createProductWithDetails(action.data));
        }
        // Add other action types as needed (UPDATE, DELETE)
      }
      
      // Clear pending actions after successful sync
      await AsyncStorage.removeItem('pending_product_actions');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
    syncStatus: 'idle'
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    markProductAsOffline: (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload);
      if (index !== -1) {
        state.items[index]._offline = true;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create product
      .addCase(createProductWithDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProductWithDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createProductWithDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Sync offline actions
      .addCase(syncOfflineActions.pending, (state) => {
        state.syncStatus = 'syncing';
      })
      .addCase(syncOfflineActions.fulfilled, (state) => {
        state.syncStatus = 'completed';
      })
      .addCase(syncOfflineActions.rejected, (state, action) => {
        state.syncStatus = 'failed';
        state.error = action.payload;
      });
  }
});

export const { resetError, markProductAsOffline } = productSlice.actions;
export default productSlice.reducer;
