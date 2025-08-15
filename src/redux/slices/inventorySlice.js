import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import {
  listInventoryRequests,
  listRequestItems,
  getWarehouseProduct,
} from '../../graphql/queries';

const client = generateClient();

// Async thunk to fetch inventory requests for a specific store
export const fetchInventoryRequests = createAsyncThunk(
  'inventory/fetchInventoryRequests',
  async (storeId, { dispatch, rejectWithValue }) => {
    if (!storeId) {
      return rejectWithValue('No store ID provided.');
    }
    try {
      const { userId: ownerId } = await getCurrentUser();
      const response = await client.graphql({
        query: listInventoryRequests,
        variables: {
          filter: {
            and: [
              { storeId: { eq: storeId } },
              { ownerId: { eq: ownerId } }
            ]
          }
        },
      });
      const requests = response.data.listInventoryRequests.items || [];

      if (requests.length > 0) {
        const requestIds = requests.map(req => req.id);
        dispatch(fetchRequestItems(requestIds));
      }

      return requests;
    } catch (error) {
      console.error('Error fetching inventory requests:', error);
      return rejectWithValue('Failed to fetch inventory requests.');
    }
  }
);

// Async thunk to fetch items for given request IDs
export const fetchRequestItems = createAsyncThunk(
  'inventory/fetchRequestItems',
  async (requestIds, { rejectWithValue }) => {
    if (!requestIds || requestIds.length === 0) {
      return {}; // Return empty object if no IDs
    }
    try {
      const requestItemPromises = requestIds.map(async requestId => {
        const response = await client.graphql({
          query: listRequestItems,
          variables: { filter: { requestId: { eq: requestId } } },
        });
        const items = response.data.listRequestItems.items || [];

        const itemsWithProducts = await Promise.all(
          items.map(async item => {
            if (item.warehouseProductId) {
              try {
                const productResponse = await client.graphql({
                  query: getWarehouseProduct,
                  variables: { id: item.warehouseProductId },
                });
                const product = productResponse.data.getWarehouseProduct;
                return {
                  ...item,
                  productName: product?.name || 'Unknown Product',
                };
              } catch (productError) {
                console.error(`Error fetching product for item ${item.id}:`, productError);
                return { ...item, productName: 'Unknown Product' };
              }
            }
            return { ...item, productName: 'Unknown Product' };
          })
        );
        return { requestId, items: itemsWithProducts };
      });

      const results = await Promise.all(requestItemPromises);

      const groupedItems = results.reduce((acc, result) => {
        acc[result.requestId] = result.items;
        return acc;
      }, {});

      return groupedItems;
    } catch (error) {
      console.error('Error fetching request items:', error);
      return rejectWithValue('Failed to fetch request items.');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    requests: [],
    requestItems: {}, // Storing items by requestId
    loading: false,
    error: null,
  },
  reducers: {
    resetInventoryError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Inventory Requests
      .addCase(fetchInventoryRequests.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryRequests.fulfilled, (state, action) => {
        state.requests = action.payload;
        if (action.payload.length === 0) {
            state.loading = false;
        }
      })
      .addCase(fetchInventoryRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Request Items
      .addCase(fetchRequestItems.pending, state => {
        state.loading = true;
      })
      .addCase(fetchRequestItems.fulfilled, (state, action) => {
        state.loading = false;
        state.requestItems = { ...state.requestItems, ...action.payload };
      })
      .addCase(fetchRequestItems.rejected, (state, action) => {
        state.loading = false;
        if (!state.error) {
          state.error = action.payload;
        }
      });
  },
});

export const { resetInventoryError } = inventorySlice.actions;
export default inventorySlice.reducer;
