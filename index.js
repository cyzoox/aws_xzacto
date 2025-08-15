/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// NOTE: DataStore configuration has been moved to App.js to avoid initialization conflicts
// This ensures we have only one place configuring DataStore, which prevents the
// "Schema is not initialized" errors caused by multiple initializations

AppRegistry.registerComponent(appName, () => App);
