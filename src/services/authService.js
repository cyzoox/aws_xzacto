import AsyncStorage from '@react-native-async-storage/async-storage';
import {Auth} from 'aws-amplify';

// Auth session keys
const AUTH_STAFF_DATA_KEY = 'staffData';
const AUTH_STORE_DATA_KEY = 'currentStoreData';
const AUTH_SESSION_KEY = 'staffSession';

/**
 * Service to handle authentication related functions
 * with a focus on simplicity and proper ownership association
 */
class AuthService {
  /**
   * Checks if a user is already logged in by checking AsyncStorage
   * @returns {Promise<Object|null>} Staff data if logged in, null otherwise
   */
  async checkExistingLogin() {
    try {
      // Check if we have staff data in AsyncStorage
      const staffJson = await AsyncStorage.getItem(AUTH_STAFF_DATA_KEY);
      if (!staffJson) {
        console.log('No stored staff login found');
        return null;
      }

      // Parse the stored staff data
      const staffData = JSON.parse(staffJson);
      console.log('Found existing staff login:', staffData.name);

      return staffData;
    } catch (error) {
      console.error('Error checking login state:', error);
      return null;
    }
  }

  /**
   * Saves staff data to persist login between app sessions
   * @param {Object} staffData The staff data to save
   * @returns {Promise<boolean>} Success status
   */
  async saveLoginSession(staffData) {
    try {
      if (!staffData) {
        console.error('Invalid staff data provided');
        return false;
      }

      // Save staff data
      await AsyncStorage.setItem(
        AUTH_STAFF_DATA_KEY,
        JSON.stringify(staffData),
      );

      // Create a session record with timestamp
      const sessionData = {
        staffData,
        timestamp: new Date().toISOString(),
        lastAccess: new Date().toISOString(),
      };

      await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
      console.log('Login session saved successfully');

      return true;
    } catch (error) {
      console.error('Error saving login session:', error);
      return false;
    }
  }

  /**
   * Updates the last access time for the current session
   */
  async updateSessionAccessTime() {
    try {
      const sessionJson = await AsyncStorage.getItem(AUTH_SESSION_KEY);
      if (!sessionJson) {
        return;
      }

      const session = JSON.parse(sessionJson);
      session.lastAccess = new Date().toISOString();

      await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error updating session access time:', error);
    }
  }

  /**
   * Logs the user out by clearing session data
   * @returns {Promise<boolean>} Success status
   */
  async logout() {
    try {
      // Clear all auth-related data
      await AsyncStorage.removeItem(AUTH_STAFF_DATA_KEY);
      await AsyncStorage.removeItem(AUTH_STORE_DATA_KEY);
      await AsyncStorage.removeItem(AUTH_SESSION_KEY);

      // Sign out from Amplify Auth
      await Auth.signOut();

      console.log('User logged out successfully');
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }

  /**
   * Gets the current selected store for the staff
   * @returns {Promise<Object|null>} Store data if available, null otherwise
   */
  async getCurrentStore() {
    try {
      const storeJson = await AsyncStorage.getItem(AUTH_STORE_DATA_KEY);
      if (!storeJson) {
        return null;
      }

      return JSON.parse(storeJson);
    } catch (error) {
      console.error('Error getting current store:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
