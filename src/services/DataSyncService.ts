// Keep DataStore import only for other models that still use it
import { DataStore } from '@aws-amplify/datastore';
import { Hub } from '@aws-amplify/core';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../redux/store';
// No longer need to import StoreSettings model
import { 
  setNetworkStatus, 
  saveSucceeded, // Renamed from syncSucceeded
  settingsUpdated, 
  fetchStoreSettings
} from '../redux/slices/storeSettingsSlice';

/**
 * DataSyncService: A singleton service that manages DataStore lifecycle,
 * network status, and model observations.
 */
class DataSyncService {
  private static instance: DataSyncService;
  private initialized: boolean = false;
  
  private constructor() {
    this.setupNetworkListener();
  }
  
  /**
   * Get the singleton instance of DataSyncService
   */
  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }
  
  /**
   * Initialize sync service listeners (DataStore is now initialized in App.js)
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // NOTE: DataStore.start() has been moved to App.js to centralize initialization
      // and avoid "Schema is not initialized" errors
      
      // Set up DataStore hub listeners for sync events
      this.setupDataStoreHubListeners();
      
      // Set up model observers
      this.setupModelObservers();
      
      this.initialized = true;
      console.log('DataSyncService initialized successfully');
    } catch (error) {
      console.error('Error initializing DataSyncService:', error);
      throw error;
    }
  }
  
  /**
   * Listen for network status changes
   */
  private setupNetworkListener(): void {
    // Subscribe to network state changes
    NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      
      // Dispatch network status to Redux
      store.dispatch(setNetworkStatus(isConnected));
      
      // If coming back online, try to sync
      if (isConnected && this.initialized) {
        this.sync();
      }
    });
  }
  
  /**
   * Set up listeners for DataStore hub events
   */
  private setupDataStoreHubListeners(): void {
    Hub.listen('datastore', async (hubData) => {
      // Define the structure of the payload object with proper typing
      interface DataStoreHubPayload {
        event: string;
        data?: {
          model?: string;
          isEmpty?: boolean;
          active?: boolean;
          error?: Error | string;
        };
      }
      
      // Cast the payload to our defined interface
      const { event, data } = hubData.payload as DataStoreHubPayload;
      
      // Log the event for debugging
      console.log('DataStore Hub Event:', event, data);
      
      // Handle different DataStore events
      switch (event) {
        case 'ready':
          console.log('DataStore is ready');
          break;
        
        case 'syncQueriesReady':
          console.log('DataStore sync queries are ready');
          this.sync();
          break;
        
        case 'modelSynced':
          // Handle other models that still use DataStore
          // StoreSettings now uses AsyncStorage and no longer needs sync
          console.log('Model synced:', data?.model);
          break;
        
        case 'syncQueriesStarted':
          console.log('DataStore sync queries started');
          break;
        
        case 'outboxStatus':
          // Handle outbox status changes
          if (data && data.isEmpty !== undefined) {
            console.log('DataStore outbox is empty:', data.isEmpty);
          }
          break;
        
        case 'networkStatus':
          // Handle network status changes from DataStore
          if (data && data.active !== undefined) {
            console.log('DataStore network is active:', data.active);
          }
          break;
        
        case 'error':
          // Handle DataStore errors
          if (data && data.error) {
            console.error('DataStore error:', data.error);
          }
          break;
      }
    });
  }
  
  /**
   * Set up observers for model changes
   */
  private setupModelObservers(): void {
    // StoreSettings now uses AsyncStorage and doesn't need DataStore observers
    console.log('Setting up model observers for remaining DataStore models');
    
    // You can add observers for other models here if needed
    // Example:
    // DataStore.observe(SomeOtherModel).subscribe(...)
  }
  
  /**
   * Manually trigger data loading and synchronization
   */
  public async sync(): Promise<void> {
    try {
      console.log('Synchronizing data...');
      
      // Load settings from AsyncStorage for store settings
      const currentStoreId = await AsyncStorage.getItem('@current_store_id');
      if (currentStoreId) {
        // Fetch store settings for current store
        console.log('Fetching settings for store:', currentStoreId);
        store.dispatch(fetchStoreSettings(currentStoreId));
      }
      
      // Update last sync time in Redux store
      const now = new Date().toISOString();
      store.dispatch(saveSucceeded()); // Using saveSucceeded instead of syncSucceeded
      
      // Sync other DataStore models if needed
      // Add your DataStore sync code for other models here
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }
  
  /**
   * Clear local DataStore data
   */
  public async clear(): Promise<void> {
    try {
      await DataStore.clear();
      this.initialized = false;
      console.log('DataStore cleared');
    } catch (error) {
      console.error('Error clearing DataStore:', error);
    }
  }
  
  /**
   * Stop DataStore synchronization and clean up subscriptions
   */
  async cleanup() {
    try {
      // Stop DataStore
      await DataStore.clear();
      this.initialized = false;
      
      console.log('DataSyncService cleaned up');
    } catch (error) {
      console.error('Error cleaning up DataSyncService:', error);
    }
  }
}

// Export the class for singleton usage
export default DataSyncService;
