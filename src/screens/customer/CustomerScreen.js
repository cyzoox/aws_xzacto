import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {API, graphqlOperation, Auth} from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';

const CustomerScreen = () => {
  const [customers, setCustomers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [points, setPoints] = useState('0');
  const [allowCredit, setAllowCredit] = useState(false);
  const [creditLimit, setCreditLimit] = useState('0');

  const user = useSelector(state => state.user?.user);

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const fetchCustomers = async () => {
    if (!user?.ownerId) {
      return;
    }
    try {
      const customerData = await API.graphql(
        graphqlOperation(queries.listCustomers, {
          filter: {ownerId: {eq: user.ownerId}},
        }),
      );
      setCustomers(customerData.data.listCustomers.items);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Could not fetch customers.');
    }
  };

  const handleAddCustomer = () => {
    setCurrentCustomer(null);
    setName('');
    setEmail('');
    setPhone('');
    setPoints('0');
    setAllowCredit(false);
    setCreditLimit('0');
    setIsModalVisible(true);
  };

  const handleEditCustomer = customer => {
    setCurrentCustomer(customer);
    setName(customer.name);
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
    setPoints(customer.points?.toString() || '0');
    setAllowCredit(customer.allowCredit || false);
    setCreditLimit(customer.creditLimit?.toString() || '0');
    setIsModalVisible(true);
  };

  const handleDeleteCustomer = async customerId => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.graphql(
                graphqlOperation(mutations.deleteCustomer, {
                  input: {id: customerId},
                }),
              );
              fetchCustomers();
            } catch (error) {
              console.error('Error deleting customer:', error);
              Alert.alert('Error', 'Could not delete customer.');
            }
          },
        },
      ],
    );
  };

  const handleSaveCustomer = async () => {
    if (!name) {
      Alert.alert('Validation Error', 'Customer name is required.');
      return;
    }

    const customerDetails = {
      name,
      email,
      phone,
      points: parseFloat(points) || 0,
      allowCredit,
      creditLimit: parseFloat(creditLimit) || 0,
      ownerId: user.ownerId,
      // Assuming a default or selected storeId is available
      // You might need to add a store selector UI
      storeId: user.storeId, // This is an assumption, adjust as needed
    };

    try {
      if (currentCustomer) {
        // Update existing customer
        await API.graphql(
          graphqlOperation(mutations.updateCustomer, {
            input: {id: currentCustomer.id, ...customerDetails},
          }),
        );
      } else {
        // Create new customer
        await API.graphql(
          graphqlOperation(mutations.createCustomer, {input: customerDetails}),
        );
      }
      fetchCustomers();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.alert('Error', `Could not save customer: ${error.message}`);
    }
  };

  const renderItem = ({item}) => (
    <View style={customerStyles.itemContainer}>
      <View style={customerStyles.itemTextContainer}>
        <Text style={customerStyles.itemText}>{item.name}</Text>
        <Text>Credit Balance: {item.creditBalance || 0}</Text>
        <Text>
          Credit Allowed:{' '}
          {item.allowCredit ? `Yes (Limit: ${item.creditLimit || 0})` : 'No'}
        </Text>
      </View>
      <View style={customerStyles.buttonsContainer}>
        <TouchableOpacity
          onPress={() => handleEditCustomer(item)}
          style={[customerStyles.button, customerStyles.editButton]}>
          <Text style={customerStyles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteCustomer(item.id)}
          style={[customerStyles.button, customerStyles.deleteButton]}>
          <Text style={customerStyles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Management</Text>
      <FlatList
        data={customers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text>No customers found.</Text>}
      />
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAddCustomer}>
        <Text style={styles.primaryButtonText}>Add New Customer</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {currentCustomer ? 'Edit Customer' : 'Add Customer'}
          </Text>
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
          />
          <TextInput
            placeholder="Points"
            value={points}
            onChangeText={setPoints}
            style={styles.input}
            keyboardType="numeric"
          />
          <View style={customerStyles.switchContainer}>
            <Text>Allow Credit</Text>
            <Switch value={allowCredit} onValueChange={setAllowCredit} />
          </View>
          {allowCredit && (
            <TextInput
              placeholder="Credit Limit"
              value={creditLimit}
              onChangeText={setCreditLimit}
              style={styles.input}
              keyboardType="numeric"
            />
          )}
          <Button title="Save" onPress={handleSaveCustomer} />
          <Button
            title="Cancel"
            onPress={() => setIsModalVisible(false)}
            color="red"
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
});

const customerStyles = StyleSheet.create({
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#007BFF',
  },
  deleteButton: {
    backgroundColor: '#DC3545',
  },
  buttonText: {
    color: 'white',
  },
});

export default CustomerScreen;
