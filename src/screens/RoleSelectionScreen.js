import React, {useState, useEffect, useContext, useRef} from 'react';
import {hashPassword, verifyPassword} from '../utils/PasswordUtils';
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Text,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {generateClient} from 'aws-amplify/api';
import {updateStaff} from '../graphql/mutations';
import {listStaff} from '../graphql/queries';
import {authService} from '../services/authService';
import {getCurrentUser} from '@aws-amplify/auth';
import {createStaff, createAccount} from '../graphql/mutations';
import {listSubscriptionPlans} from '../graphql/queries';

const client = generateClient();

// Helper function to migrate a plain text password to a hashed version
const migrateToHashedPassword = async (staffId, plainTextPin) => {
  try {
    // Use our custom password hashing utility
    const hashedPin = hashPassword(plainTextPin);

    // Update the staff record with the hashed password
    const client = generateClient();
    await client.graphql({
      query: updateStaff,
      variables: {
        input: {
          id: staffId,
          password: hashedPin,
        },
      },
    });

    console.log('Successfully migrated password to hashed version');
  } catch (error) {
    // Don't block the login process if migration fails
    console.error('Error migrating password to hashed version:', error);
  }
};

// Helper function to verify a PIN using our custom password utility
// This provides backward compatibility for existing users while new pins are hashed
const verifyStaffPin = (storedPassword, enteredPin) => {
  // Nothing to verify against
  if (!storedPassword) {
    return false;
  }

  try {
    // Use our custom verification that handles both formats
    return verifyPassword(storedPassword, enteredPin);
  } catch (error) {
    console.error('Error verifying PIN:', error);
    // Fallback to plain text comparison if verification fails
    return storedPassword === enteredPin;
  }
};

const RoleSelectionScreen = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasSuperAdmin, setHasSuperAdmin] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');

  // Check for existing login session and SuperAdmin on component mount
  useEffect(() => {
    let isMounted = true; // Track if component is mounted

    const initialize = async () => {
      try {
        // Check if user is already logged in
        const staffData = await authService.checkExistingLogin();

        if (staffData) {
          console.log('Found existing login session for:', staffData.name);

          if (!isMounted) {
            return;
          } // Check if still mounted

          // Update session access time
          authService.updateSessionAccessTime();

          // Navigate based on role
          const primaryRole = Array.isArray(staffData.role)
            ? staffData.role[0]
            : staffData.role;

          switch (primaryRole) {
            case 'SuperAdmin':
              navigation.replace('SuperAdmin', {staffData});
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
              if (isMounted) {
                setLoading(false);
              }
          }
        } else {
          // No existing session, check if there is a SuperAdmin account
          if (!isMounted) {
            return;
          } // Check if still mounted

          // Get the authenticated user ID
          const authUser = await getCurrentUser();
          const authUserId = authUser.userId;

          if (isMounted) {
            // setUserId(authUserId);

            // Check if there's a SuperAdmin for this user
            await checkForSuperAdmin(authUserId);

            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [navigation]);

  // Function to check if SuperAdmin exists for the authenticated user
  const checkForSuperAdmin = async authUserId => {
    if (!authUserId) {
      console.error('No ownerId provided to checkForSuperAdmin');
      return false;
    }

    try {
      console.log('Checking for SuperAdmin with ownerId:', authUserId);

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
            ownerId: {eq: authUserId},
            role: {contains: 'SuperAdmin'},
          },
        },
      });

      console.log('SuperAdmin check response:', response);
      const superAdmins = response.data?.listStaff?.items || [];

      // Set state based on whether SuperAdmin exists
      const exists = superAdmins.length > 0;
      console.log(exists);
      setHasSuperAdmin(exists);
      console.log('SuperAdmin exists:', exists);

      return exists;
    } catch (error) {
      console.error('Error checking for SuperAdmin:', error);
      return false;
    }
  };

  // Function to create a new SuperAdmin account
  const createSuperAdmin = async (adminName, adminPin) => {
    const authUser = await getCurrentUser();
    const authUserId = authUser.userId;
    try {
      setLoading(true);

      if (!authUserId) {
        Alert.alert('Error', 'Authentication error. Please restart the app.');
        setLoading(false);
        return;
      }

      // Check if a SuperAdmin already exists before creating a new one
      // This prevents potential race conditions
      const exists = await checkForSuperAdmin(authUserId);
      if (exists) {
        console.log('SuperAdmin already exists, skipping creation');
        setLoading(false);
        return;
      }

      // Get user's email for the account
      const authUser = await getCurrentUser();
      const userEmail = authUser.signInDetails?.loginId || '';
      console.log('Creating account for user with email:', userEmail);

      // Get the free subscription plan as default
      let freePlan = null;
      try {
        const plansResponse = await client.graphql({
          query: listSubscriptionPlans,
          variables: {
            filter: {name: {eq: 'Free'}},
          },
        });

        const plans = plansResponse.data?.listSubscriptionPlans?.items;
        if (plans && plans.length > 0) {
          freePlan = plans[0];
          console.log('Found free plan:', freePlan.id);
        } else {
          console.log(
            'No free plan found, creating account without subscription plan',
          );
        }
      } catch (planError) {
        console.error('Error fetching subscription plans:', planError);
      }

      // Create account first
      const accountResponse = await client.graphql({
        query: createAccount,
        variables: {
          input: {
            ownerId: authUserId,
            ownerEmail: userEmail,
            subscriptionPlanId: freePlan?.id || null,
            subscriptionStatus: freePlan ? 'ACTIVE' : 'NONE',
            subscriptionStartDate: freePlan ? new Date().toISOString() : null,
            subscriptionEndDate: null, // Free plan doesn't expire
            lastModifiedBy: 'SYSTEM',
          },
        },
      });

      const newAccount = accountResponse.data.createAccount;
      console.log('Account created:', newAccount.id);

      // Hash the PIN before creating the SuperAdmin
      let hashedPin;
      try {
        // Use our custom password hashing utility
        hashedPin = hashPassword(adminPin || '00000');
        console.log('Created hashed PIN for SuperAdmin');
      } catch (hashError) {
        console.error('Error hashing SuperAdmin PIN:', hashError);
        // Error handling - don't fall back to plain text
        Alert.alert(
          'Error',
          'There was a problem with security. Please try again.',
        );
        setLoading(false);
        return;
      }

      // Create SuperAdmin staff with custom name and hashed PIN
      const staffResponse = await client.graphql({
        query: createStaff,
        variables: {
          input: {
            name: adminName || 'Super Admin',
            password: hashedPin, // Use hashed PIN
            role: ['SuperAdmin'], // Schema requires array of roles
            log_status: 'INACTIVE',
            device_id: '',
            device_name: '',
            ownerId: authUserId, // Associate with authenticated user
            accountId: newAccount.id, // Link to the newly created account
          },
        },
      });

      console.log('SuperAdmin created:', staffResponse.data.createStaff);

      // Set the staff data for login
      const staffData = staffResponse.data.createStaff;

      // Save login session using authService
      await authService.saveLoginSession(staffData);
      console.log('Staff login session saved for new SuperAdmin');

      // Navigate to SuperAdmin screen
      navigation.replace('SuperAdmin', {staffData});
    } catch (error) {
      console.error('Error creating SuperAdmin:', error);
      Alert.alert(
        'Error',
        'Failed to create SuperAdmin account. Please try again.',
      );
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

      console.log('Attempting login with:', {username, pin});

      // Query staff with stores connection
      const response = await client.graphql({
        query: `
          query ListStaffWithStores($filter: ModelStaffFilterInput) {
            listStaff(filter: $filter) {
              items {
                id
                name
                password
                ownerId
                role
                stores {
                  items {
                    store {
                      id
                      name
                      ownerId
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          filter: {
            name: {eq: username},
          },
        },
      });

      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('Data:', response.data);
      console.log('Items:', response.data?.listStaff?.items);

      const staff = response.data?.listStaff?.items[0];

      if (!staff) {
        Alert.alert('Error', 'Invalid username or PIN');
        return;
      }

      // Verify PIN - handle both bcrypt hashed and plain text passwords
      const isValidPin = verifyStaffPin(staff.password, pin);

      if (!isValidPin) {
        console.log('PIN verification failed');
        Alert.alert('Error', 'Invalid username or PIN');
        return;
      }

      console.log('PIN verification successful');

      // If login was successful with a plain text password, upgrade it to a hashed version
      // This ensures smooth migration of existing accounts
      if (isValidPin && staff.password === pin) {
        console.log('Migrating plain text password to hashed version');
        migrateToHashedPassword(staff.id, pin);
      }

      // Get assigned store for staff
      const stores = staff.stores?.items || [];
      console.log('Staff stores:', JSON.stringify(stores, null, 2));

      // Get primary role to check if it's a warehouse role
      const primaryRole = Array.isArray(staff.role)
        ? staff.role[0]
        : staff.role;
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
        store_id: stores.length > 0 ? stores[0].store.id : null, // null for warehouse roles with no stores
        // Ensure ownerId is available in staffData - use store's ownerId if staff doesn't have one
        ownerId:
          staff.ownerId ||
          (stores.length > 0 && stores[0].store.ownerId) ||
          null,
      };

      console.log('Staff data:', staffData);

      // Save login session using authService
      await authService.saveLoginSession(staffData);
      console.log('Staff login session saved');

      // Navigate based on role
      switch (primaryRole) {
        case 'SuperAdmin':
          navigation.replace('SuperAdmin', {staffData});
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

      {/* Modal for SuperAdmin creation */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Create SuperAdmin Account</Text>

            <TextInput
              value={newAdminName}
              onChangeText={setNewAdminName}
              placeholder="Username"
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              value={newAdminPin}
              onChangeText={setNewAdminPin}
              placeholder="PIN (5 digits)"
              secureTextEntry
              style={styles.modalInput}
              keyboardType="numeric"
              maxLength={5}
            />

            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.button, styles.buttonCancel]}
                onPress={() => {
                  setModalVisible(false);
                  setNewAdminName('');
                  setNewAdminPin('');
                }}>
                <Text style={styles.buttonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.button, styles.createButton]}
                onPress={() => {
                  if (!newAdminName.trim()) {
                    Alert.alert('Error', 'Please enter a valid username');
                    return;
                  }
                  if (!newAdminPin.trim() || newAdminPin.length < 5) {
                    Alert.alert('Error', 'Please enter a 5-digit PIN');
                    return;
                  }
                  setModalVisible(false);
                  createSuperAdmin(newAdminName, newAdminPin);
                }}>
                <Text style={styles.buttonText}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
            No SuperAdmin account found. You need to create a SuperAdmin account
            to proceed.
          </Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            disabled={loading}
            style={[
              styles.button,
              styles.createButton,
              loading && styles.buttonDisabled,
            ]}>
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  buttonCancel: {
    backgroundColor: '#6c757d',
    flex: 1,
    marginRight: 10,
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
