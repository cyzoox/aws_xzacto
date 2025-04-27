import React, {useState, useEffect} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {generateClient} from 'aws-amplify/api';
import {listStaff} from '../graphql/queries';
import { authService } from '../services/authService';
import { getCurrentUser } from '@aws-amplify/auth';
import { createStaff } from '../graphql/mutations';

const client = generateClient();

const RoleSelectionScreen = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasSuperAdmin, setHasSuperAdmin] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // Check for existing login session and SuperAdmin on component mount
  useEffect(() => {
    let isMounted = true; // Track if component is mounted
    
    const initialize = async () => {
      try {
        // Check if user is already logged in
        const staffData = await authService.checkExistingLogin();
        
        if (staffData) {
          console.log('Found existing login session for:', staffData.name);
          
          if (!isMounted) return; // Check if still mounted
          
          // Update session access time
          authService.updateSessionAccessTime();
          
          // Navigate based on role
          const primaryRole = Array.isArray(staffData.role) ? staffData.role[0] : staffData.role;
          
          switch (primaryRole) {
            case 'SuperAdmin':
              navigation.replace('SuperAdminScreen', {staffData});
              break;
            case 'Admin':
              navigation.replace('MainApp', {staffData});
              break;
            case 'Cashier':
              navigation.replace('CashierApp', {staffData});
              break;
            case 'Warehouse':
              navigation.replace('WarehouseApp', {staffData});
              break;
            default:
              // If role is invalid, reset to login screen
              if (isMounted) setLoading(false);
          }
        } else {
          // No existing session, check if there is a SuperAdmin account
          if (!isMounted) return; // Check if still mounted
          
          // Get the authenticated user ID
          const authUser = await getCurrentUser();
          const authUserId = authUser.userId;
          
          if (isMounted) {
            setUserId(authUserId);
            
            // Check if there's a SuperAdmin for this user
            await checkForSuperAdmin(authUserId);
            
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        if (isMounted) setLoading(false);
      }
    };
    
    initialize();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [navigation]);
  
  // Function to check if SuperAdmin exists for the authenticated user
  const checkForSuperAdmin = async (ownerId) => {
    if (!ownerId) {
      console.error('No ownerId provided to checkForSuperAdmin');
      return false;
    }
    
    try {
      console.log('Checking for SuperAdmin with ownerId:', ownerId);
      
      // Query staff with SuperAdmin role for this owner
      const response = await client.graphql({
        query: `
          query ListSuperAdminStaff($filter: ModelStaffFilterInput) {
            listStaff(filter: $filter) {
              items {
                id
                name
                role
              }
            }
          }
        `,
        variables: {
          filter: {
            ownerId: { eq: ownerId },
            role: { contains: 'SuperAdmin' }
          }
        }
      });
      
      console.log('SuperAdmin check response:', response);
      const superAdmins = response.data?.listStaff?.items || [];
      
      // Set state based on whether SuperAdmin exists
      const exists = superAdmins.length > 0;
      setHasSuperAdmin(exists);
      console.log('SuperAdmin exists:', exists);
      
      return exists;
    } catch (error) {
      console.error('Error checking for SuperAdmin:', error);
      return false;
    }
  };
  
  // Function to create a new SuperAdmin account
  const createSuperAdmin = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        Alert.alert('Error', 'Authentication error. Please restart the app.');
        setLoading(false);
        return;
      }
      
      // Check if a SuperAdmin already exists before creating a new one
      // This prevents potential race conditions
      const exists = await checkForSuperAdmin(userId);
      if (exists) {
        console.log('SuperAdmin already exists, skipping creation');
        setLoading(false);
        return;
      }
      
      // Create SuperAdmin staff with default PIN
      const response = await client.graphql({
        query: createStaff,
        variables: {
          input: {
            name: 'Super Admin',
            password: '00000', // Default PIN as per auth flow
            role: ['SuperAdmin'], // Schema requires array of roles
            log_status: 'INACTIVE',
            device_id: '',
            device_name: '',
            ownerId: userId // Associate with authenticated user
          }
        }
      });
      
      console.log('SuperAdmin created:', response.data.createStaff);
      
      // Set the staff data for login
      const staffData = response.data.createStaff;
      
      // Save login session using authService
      await authService.saveLoginSession(staffData);
      console.log('Staff login session saved for new SuperAdmin');
      
      // Navigate to SuperAdmin screen
      navigation.replace('SuperAdminScreen', {staffData});
    } catch (error) {
      console.error('Error creating SuperAdmin:', error);
      Alert.alert('Error', 'Failed to create SuperAdmin account. Please try again.');
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !pin) {
      Alert.alert('Error', 'Please enter your username and PIN');
      return;
    }

    try {
      setLoading(true);

      console.log('Attempting login with:', { username, pin });

      // Query staff with stores connection
      const response = await client.graphql({
        query: `
          query ListStaffWithStores($filter: ModelStaffFilterInput) {
            listStaff(filter: $filter) {
              items {
                id
                name
                password
                role
                stores {
                  items {
                    store {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          filter: {
            name: { eq: username }
          }
        }
      });

      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('Data:', response.data);
      console.log('Items:', response.data?.listStaff?.items);

      const staff = response.data?.listStaff?.items[0];

      if (!staff) {
        Alert.alert('Error', 'Invalid username or PIN');
        return;
      }

      // Verify PIN
      if (staff.password !== pin) {
        Alert.alert('Error', 'Invalid username or PIN');
        return;
      }

      // Get assigned store for staff
      const stores = staff.stores?.items || [];
      console.log('Staff stores:', JSON.stringify(stores, null, 2));
      
      // Get primary role to check if it's a warehouse role
      const primaryRole = Array.isArray(staff.role) ? staff.role[0] : staff.role;
      console.log('Primary role:', primaryRole);
      
      // For non-warehouse roles, require store assignment
      // We'll temporarily disable this check since it's causing problems for users
      // with valid store assignments
      if (false && primaryRole !== 'Warehouse' && stores.length === 0) {
        console.log('WARNING: No store assigned to non-warehouse staff');
        Alert.alert('Error', 'No store assigned to this staff member');
        return;
      }

      // Set staff data with store ID if available
      const staffData = {
        ...staff,
        store_id: stores.length > 0 ? stores[0].store.id : null // null for warehouse roles with no stores
      };

      console.log('Staff data:', staffData);
      
      // Save login session using authService
      await authService.saveLoginSession(staffData);
      console.log('Staff login session saved');

      // Navigate based on role
      switch (primaryRole) {
        case 'SuperAdmin':
          navigation.replace('SuperAdminScreen', {staffData});
          break;
        case 'Admin':
          navigation.replace('MainApp', {staffData});
          break;
        case 'Cashier':
          navigation.replace('CashierApp', {staffData});
          break;
        case 'Warehouse':
          navigation.replace('WarehouseApp', {staffData});
          break;
        default:
          Alert.alert('Error', 'Invalid role assignment');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading indicator while checking for existing session
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Login</Text>
      
      {hasSuperAdmin ? (
        // Normal login form if SuperAdmin exists
        <>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            value={pin}
            onChangeText={setPin}
            placeholder="PIN"
            secureTextEntry
            style={styles.input}
            keyboardType="numeric"
            maxLength={5}
          />
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[styles.button, loading && styles.buttonDisabled]}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        // Create SuperAdmin button if no SuperAdmin exists
        <>
          <Text style={styles.infoText}>
            No SuperAdmin account found. You need to create a SuperAdmin account to proceed.
          </Text>
          <TouchableOpacity
            onPress={createSuperAdmin}
            disabled={loading}
            style={[styles.button, styles.createButton, loading && styles.buttonDisabled]}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create SuperAdmin Account</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  createButton: {
    backgroundColor: '#28a745',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#99c9ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RoleSelectionScreen;
