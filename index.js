/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// index.js

import { Amplify } from 'aws-amplify';
import { DataStore } from '@aws-amplify/datastore';
import amplifyconfig from './src/amplifyconfiguration.json';

// Configure Amplify
Amplify.configure(amplifyconfig);

// Initialize DataStore with configuration for offline-first functionality
DataStore.configure({
  syncExpressions: [
    () => ({ type: 'syncExpression' })
  ],
  errorHandler: (error) => {
    console.error('DataStore error:', error);
  },
  maxRecordsToSync: 10000, // Number of records to sync at a time
  fullSyncInterval: 24 * 60, // Full sync every 24 hours (in minutes)
});

AppRegistry.registerComponent(appName, () => App);
