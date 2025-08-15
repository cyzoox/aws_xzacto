/**
 * DataStoreManager - Centralized management of AWS DataStore
 * Ensures proper initialization and prevents multiple schema registrations
 */
import { DataStore } from '@aws-amplify/datastore';
import { StoreSettings } from '../models/storeSettings';
import { schema } from '../models/schema';

// Track initialization status
let initialized = false;

// Define a single place for DataStore configuration
const configure = async () => {
  if (initialized) {
    console.log('DataStore already initialized, skipping configuration');
    return;
  }
  
  try {
    console.log('Configuring DataStore...');
    
    // Clear any existing state to prevent initialization conflicts
    await DataStore.clear();
    
    // Configure with consistent settings
    DataStore.configure({
      syncExpressions: [() => ({ type: 'syncExpression' })],
      errorHandler: error => {
        console.error('DataStore error:', error);
      },
      maxRecordsToSync: 10000,
      fullSyncInterval: 24 * 60,
    });
    
    console.log('DataStore configured successfully');
  } catch (error) {
    console.error('Error configuring DataStore:', error);
    throw error;
  }
};

// Start DataStore and ensure models are registered
const start = async () => {
  if (initialized) {
    console.log('DataStore already started, returning instance');
    return DataStore;
  }
  
  try {
    console.log('Starting DataStore...');
    
    // Explicitly ensure models are registered by importing them
    console.log('Schema verification:', schema ? 'Schema loaded' : 'Schema missing');
    console.log('StoreSettings model:', StoreSettings ? 'Model loaded' : 'Model missing');
    
    // Start DataStore
    await DataStore.start();
    
    // Verify initialization with a simple query test
    try {
      await DataStore.query(StoreSettings);
      console.log('Schema verification successful - DataStore is ready');
    } catch (queryError) {
      console.error('Schema verification failed, restarting DataStore:', queryError);
      await DataStore.clear();
      await DataStore.start();
    }
    
    initialized = true;
    console.log('DataStore started successfully');
    
    return DataStore;
  } catch (error) {
    console.error('Error starting DataStore:', error);
    throw error;
  }
};

export default {
  configure,
  start,
  get instance() {
    return DataStore;
  }
};
