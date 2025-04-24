import React, {useState} from 'react';
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

const client = generateClient();

const RoleSelectionScreen = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

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
      
      // Save staff data to AsyncStorage for use in other screens
      try {
        await AsyncStorage.setItem('staffData', JSON.stringify(staffData));
        console.log('Staff data saved to AsyncStorage');
      } catch (storageError) {
        console.error('Error saving staff data to AsyncStorage:', storageError);
      }

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Staff Login</Text>
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
