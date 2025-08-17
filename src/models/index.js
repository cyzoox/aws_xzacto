import {DataStore} from '@aws-amplify/datastore';
import {StoreSettings} from './storeSettings';
import {schema} from './schema';

// Models are registered automatically with DataStore
// NOTE: DataStore configuration has been centralized in App.js
// This prevents the "Schema is not initialized" errors caused by multiple configurations

// Export the models
export {StoreSettings, schema};

/**
 * Simple Customer model for DataStore
 * Keeps implementation straightforward as per user preferences
 */
export class Customer {
  constructor(init) {
    Object.assign(this, init);
  }

  static copyOf(source, mutator) {
    const copy = new Customer(source);
    return mutator(copy);
  }
}
