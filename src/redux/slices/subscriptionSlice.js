import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {generateClient} from 'aws-amplify/api';
import NetInfo from '@react-native-community/netinfo';

const client = generateClient();

// GraphQL queries
const listSubscriptionPlans = /* GraphQL */ `
  query ListSubscriptionPlans {
    listSubscriptionPlans {
      items {
        id
        name
        description
        price
        interval
        storeLimit
        staffPerStoreLimit
        adminPerStoreLimit
        features
        isActive
      }
    }
  }
`;

const getAccountByOwnerId = /* GraphQL */ `
  query GetAccountByOwnerId($ownerId: ID!) {
    listAccounts(filter: {ownerId: {eq: $ownerId}}) {
      items {
        id
        ownerId
        ownerEmail
        subscriptionPlanId
        subscriptionStatus
        subscriptionStartDate
        subscriptionEndDate
        subscriptionPlan {
          id
          name
          price
          interval
          storeLimit
          staffPerStoreLimit
          adminPerStoreLimit
          features
        }
      }
    }
  }
`;

const updateAccount = /* GraphQL */ `
  mutation UpdateAccount($input: UpdateAccountInput!) {
    updateAccount(input: $input) {
      id
      subscriptionPlanId
      subscriptionStatus
      subscriptionEndDate
      lastModifiedBy
    }
  }
`;

const createSubscriptionHistory = /* GraphQL */ `
  mutation CreateSubscriptionHistory($input: CreateSubscriptionHistoryInput!) {
    createSubscriptionHistory(input: $input) {
      id
      accountId
      changeDate
      changedBy
      previousPlanId
      newPlanId
    }
  }
`;

const createSubscriptionPlan = /* GraphQL */ `
  mutation CreateSubscriptionPlan($input: CreateSubscriptionPlanInput!) {
    createSubscriptionPlan(input: $input) {
      id
      name
      description
      price
      interval
      storeLimit
      staffPerStoreLimit
      adminPerStoreLimit
      features
      isActive
    }
  }
`;

// Async thunks
export const fetchSubscriptionPlans = createAsyncThunk(
  'subscription/fetchPlans',
  async (_, {rejectWithValue}) => {
    try {
      const {isConnected} = await NetInfo.fetch();

      if (!isConnected) {
        const offlinePlans = await AsyncStorage.getItem(
          'offline_subscription_plans',
        );
        return offlinePlans ? JSON.parse(offlinePlans) : [];
      }

      const response = await client.graphql({
        query: listSubscriptionPlans,
      });

      const plans = response.data.listSubscriptionPlans.items;

      // Store plans in AsyncStorage for offline access
      await AsyncStorage.setItem(
        'offline_subscription_plans',
        JSON.stringify(plans),
      );

      return plans;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return rejectWithValue(error.message);
    }
  },
);

export const fetchAccountByOwnerId = createAsyncThunk(
  'subscription/fetchAccount',
  async (ownerId, {rejectWithValue}) => {
    try {
      const {isConnected} = await NetInfo.fetch();

      if (!isConnected) {
        const offlineAccount = await AsyncStorage.getItem('offline_account');
        return offlineAccount ? JSON.parse(offlineAccount) : null;
      }

      const response = await client.graphql({
        query: getAccountByOwnerId,
        variables: {ownerId},
      });

      const accounts = response.data.listAccounts.items;
      if (accounts.length === 0) {
        return null;
      }

      const account = accounts[0];

      // Store account in AsyncStorage for offline access
      await AsyncStorage.setItem('offline_account', JSON.stringify(account));

      return account;
    } catch (error) {
      console.error('Error fetching account by owner ID:', error);
      return rejectWithValue(error.message);
    }
  },
);

export const upgradeSubscription = createAsyncThunk(
  'subscription/upgrade',
  async ({accountId, currentPlanId, newPlanId, staffId}, {rejectWithValue}) => {
    try {
      const {isConnected} = await NetInfo.fetch();

      if (!isConnected) {
        // Store upgrade request for later sync
        const pendingAction = {
          type: 'UPGRADE_SUBSCRIPTION',
          data: {accountId, currentPlanId, newPlanId, staffId},
          timestamp: Date.now(),
        };

        const pendingActions = await AsyncStorage.getItem(
          'pending_subscription_actions',
        );
        const actions = pendingActions ? JSON.parse(pendingActions) : [];
        actions.push(pendingAction);
        await AsyncStorage.setItem(
          'pending_subscription_actions',
          JSON.stringify(actions),
        );

        // Get plan details for optimistic update
        const offlinePlans = await AsyncStorage.getItem(
          'offline_subscription_plans',
        );
        const plans = offlinePlans ? JSON.parse(offlinePlans) : [];
        const selectedPlan = plans.find(plan => plan.id === newPlanId);

        // Update the offline account with new subscription
        const offlineAccount = await AsyncStorage.getItem('offline_account');
        if (offlineAccount) {
          const account = JSON.parse(offlineAccount);
          const updatedAccount = {
            ...account,
            subscriptionPlanId: newPlanId,
            subscriptionStatus: 'active',
            subscriptionEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            subscriptionPlan: selectedPlan,
            _offline: true,
          };
          await AsyncStorage.setItem(
            'offline_account',
            JSON.stringify(updatedAccount),
          );
          return updatedAccount;
        }

        return null;
      }

      // Online upgrade
      // 1. Update account with new subscription plan
      const updateResult = await client.graphql({
        query: updateAccount,
        variables: {
          input: {
            id: accountId,
            subscriptionPlanId: newPlanId,
            lastModifiedBy: staffId,
            subscriptionStatus: 'active',
            subscriptionEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        },
      });

      // 2. Record subscription change in history
      await client.graphql({
        query: createSubscriptionHistory,
        variables: {
          input: {
            accountId: accountId,
            changeDate: new Date().toISOString(),
            changedBy: staffId,
            previousPlanId: currentPlanId,
            newPlanId: newPlanId,
          },
        },
      });

      // 3. Fetch the updated account with the new plan
      const response = await client.graphql({
        query: getAccountByOwnerId,
        variables: {ownerId: updateResult.data.updateAccount.ownerId},
      });

      const updatedAccount = response.data.listAccounts.items[0];

      // Update the offline cache
      await AsyncStorage.setItem(
        'offline_account',
        JSON.stringify(updatedAccount),
      );

      return updatedAccount;
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      return rejectWithValue(error.message);
    }
  },
);

export const createDefaultFreePlan = createAsyncThunk(
  'subscription/createDefaultPlan',
  async (_, {rejectWithValue}) => {
    try {
      const {isConnected} = await NetInfo.fetch();

      if (!isConnected) {
        // Cannot create a plan offline
        return rejectWithValue('Cannot create subscription plan while offline');
      }

      const response = await client.graphql({
        query: createSubscriptionPlan,
        variables: {
          input: {
            name: 'Free',
            description: 'Free tier with limited features',
            price: 0,
            interval: 'monthly',
            storeLimit: 2,
            staffPerStoreLimit: 3,
            adminPerStoreLimit: 1,
            features: ['basic_pos', 'basic_inventory'],
            isActive: true,
          },
        },
      });

      const newPlan = response.data.createSubscriptionPlan;

      // Update offline cache
      const offlinePlans = await AsyncStorage.getItem(
        'offline_subscription_plans',
      );
      const plans = offlinePlans ? JSON.parse(offlinePlans) : [];
      plans.push(newPlan);
      await AsyncStorage.setItem(
        'offline_subscription_plans',
        JSON.stringify(plans),
      );

      return newPlan;
    } catch (error) {
      console.error('Error creating default free plan:', error);
      return rejectWithValue(error.message);
    }
  },
);

export const syncSubscriptionActions = createAsyncThunk(
  'subscription/syncActions',
  async (_, {dispatch, rejectWithValue}) => {
    try {
      const {isConnected} = await NetInfo.fetch();
      if (!isConnected) {
        return rejectWithValue('No internet connection');
      }

      const pendingActions = await AsyncStorage.getItem(
        'pending_subscription_actions',
      );
      if (!pendingActions) {
        return;
      }

      const actions = JSON.parse(pendingActions);

      for (const action of actions) {
        if (action.type === 'UPGRADE_SUBSCRIPTION') {
          // Re-dispatch the upgrade action but exclude the _offline flag
          await dispatch(
            upgradeSubscription({
              ...action.data,
              _sync: true, // Mark that this is a sync operation
            }),
          );
        }
      }

      // Clear pending actions after successful sync
      await AsyncStorage.removeItem('pending_subscription_actions');
      return true;
    } catch (error) {
      console.error('Error syncing subscription actions:', error);
      return rejectWithValue(error.message);
    }
  },
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: {
    plans: [],
    currentAccount: null,
    loading: false,
    error: null,
    syncStatus: 'idle',
  },
  reducers: {
    resetError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch subscription plans
      .addCase(fetchSubscriptionPlans.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(fetchSubscriptionPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch account
      .addCase(fetchAccountByOwnerId.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountByOwnerId.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAccount = action.payload;
      })
      .addCase(fetchAccountByOwnerId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Upgrade subscription
      .addCase(upgradeSubscription.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(upgradeSubscription.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentAccount = action.payload;
        }
      })
      .addCase(upgradeSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create default free plan
      .addCase(createDefaultFreePlan.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDefaultFreePlan.fulfilled, (state, action) => {
        state.loading = false;
        state.plans.push(action.payload);
      })
      .addCase(createDefaultFreePlan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Sync subscription actions
      .addCase(syncSubscriptionActions.pending, state => {
        state.syncStatus = 'syncing';
      })
      .addCase(syncSubscriptionActions.fulfilled, state => {
        state.syncStatus = 'completed';
      })
      .addCase(syncSubscriptionActions.rejected, (state, action) => {
        state.syncStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const {resetError} = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
