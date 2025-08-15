import React, {useState, useEffect} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import {generateClient} from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import Appbar from '../../components/Appbar';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';

const client = generateClient();

const CustomerScreen = ({route}) => {
  const staff = useSelector(state => state.staff.items[0]);
  const STORE = route.params.store;
  const navigation = useNavigation();
  const [customers, setCustomers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'details'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [points, setPoints] = useState('0');
  const [allowCredit, setAllowCredit] = useState(false);
  const [creditLimit, setCreditLimit] = useState('0');


  // Use useFocusEffect instead of useEffect to ensure this runs every time the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('CustomerScreen focused, STORE:', STORE);
      if (STORE?.id) {
        fetchCustomers();
      }
      return () => {
        // Cleanup function (optional)
      };
    }, [STORE?.id])
  );
  
  // Keep the useEffect for initial mount if needed
  useEffect(() => {
    console.log('CustomerScreen mounted, STORE:', STORE);
  }, []);

  const fetchCustomers = async () => {
    if (!STORE || !STORE.id) {
      Alert.alert('Error', 'Store information is missing.');
      return;
    }
    try {
      const customerData = await client.graphql({
        query: queries.listCustomers,
        variables: {
          filter: {storeId: {eq: STORE.id}},
        },
      });
      setCustomers(customerData.data.listCustomers.items);
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Could not fetch customers.');
    }
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setModalMode('add');
    setName('');
    setEmail('');
    setPhone('');
    setPoints('0');
    setAllowCredit(false);
    setCreditLimit('0');
    setIsModalVisible(true);
  };

  const handleViewDetails = customer => {
    setSelectedCustomer(customer);
    setModalMode('details');
    setIsModalVisible(true);
  };

  const handleSwitchToEditMode = () => {
    if (!selectedCustomer) return;
    setName(selectedCustomer.name);
    setEmail(selectedCustomer.email || '');
    setPhone(selectedCustomer.phone || '');
    setPoints(selectedCustomer.points?.toString() || '0');
    setAllowCredit(selectedCustomer.allowCredit || false);
    setCreditLimit(selectedCustomer.creditLimit?.toString() || '0');
    setModalMode('edit');
  };

  const handleDeleteCustomer = async customerId => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this customer?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.graphql({
                query: mutations.deleteCustomer,
                variables: {input: {id: customerId}},
              });
              fetchCustomers(); // Refresh the list
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
      email: email || null,
      phone: phone || null,
      points: parseFloat(points) || 0,
      allowCredit,
      creditLimit: parseFloat(creditLimit) || 0,
      ownerId: (await getCurrentUser()).userId,
      storeId: STORE.id,
    };
    console.log(customerDetails);
    try {
      if (modalMode === 'edit' && selectedCustomer) {
        const updateDetails = {
          id: selectedCustomer.id,
          ...customerDetails,
        };
        await client.graphql({
          query: mutations.updateCustomer,
          variables: {input: updateDetails},
        });
      } else {
        await client.graphql({
          query: mutations.createCustomer,
          variables: {input: customerDetails},
        });
      }
      fetchCustomers();
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.alert('Error', `Could not save customer: ${error.message}`);
    }
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.customerCard}
      onPress={() => handleViewDetails(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerPhone}>{item.phone}</Text>
      </View>
      <View style={styles.cardMiddle}>
        <Text style={styles.pointsText}>Points: {item.points || 0}</Text>
        {/* Display credit status and limit */}
        <Text style={[styles.creditText, {color: item.allowCredit ? '#007E33' : '#999'}]}>
          {item.allowCredit 
            ? `Credit: ₱${parseFloat(item.creditLimit || 0).toFixed(2)}` 
            : 'No Credit'}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <TouchableOpacity onPress={() => handleDeleteCustomer(item.id)}>
          <Text style={styles.deleteButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Appbar title="Customers" onBack={() => navigation.goBack()} subtitle={STORE.name}/>
      <FlatList
        data={customers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyListText}>No customers yet. Add one!</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={handleAddCustomer}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          {modalMode === 'details' && selectedCustomer ? (
            // Loyalty Card View
            <View style={styles.loyaltyCard}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                  <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>
              <View style={styles.loyaltyCardHeader}>
                <Text style={styles.loyaltyCardTitle}>MEMBER</Text>
                <Text style={styles.loyaltyCardStore}>{STORE.name}</Text>
              </View>
              <View style={styles.loyaltyCardBody}>
                <QRCode
                  value={selectedCustomer.id}
                  size={80}
                  backgroundColor="transparent"
                  color="#FFFFFF"
                />
                <View style={styles.loyaltyCardDetails}>
                  <Text style={styles.loyaltyCardName}>
                    {selectedCustomer.name}
                  </Text>
                  <Text style={styles.loyaltyCardId}>
                    ID: {selectedCustomer.id}
                  </Text>
                </View>
              </View>
              <View style={styles.loyaltyCardFooter}>
                <View style={styles.loyaltyCardStats}>
                  <Text style={styles.loyaltyCardPoints}>
                    Points: {selectedCustomer.points || 0}
                  </Text>
                  {/* Display credit status and limit in detail view */}
                  <Text style={[styles.loyaltyCardCredit, {color: selectedCustomer.allowCredit ? '#007E33' : '#999'}]}>
                    {selectedCustomer.allowCredit 
                      ? `Credit Limit: ₱${parseFloat(selectedCustomer.creditLimit || 0).toFixed(2)}` 
                      : 'No Credit Available'}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleSwitchToEditMode}>
                  <Text style={styles.loyaltyCardEdit}>Edit Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Add/Edit Form View
            <View style={styles.formContainer}>
              <Text style={styles.modalTitle}>
                {modalMode === 'add' ? 'Add New Customer' : 'Edit Customer'}
              </Text>
              <TextInput
                placeholder="Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
              <TextInput
                placeholder="Email (Optional)"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
              />
              <TextInput
                placeholder="Phone (Optional)"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
              />
              <TextInput
                placeholder="Initial Points"
                value={points}
                onChangeText={setPoints}
                style={styles.input}
                keyboardType="numeric"
              />
              <View style={styles.switchContainer}>
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
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveCustomer}>
                <Text style={styles.saveButtonText}>Save Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}>
                <Text style={styles.saveButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 80, // To make space for FAB
  },
  emptyListText: {
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16,
      color: '#666',
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cardMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    color: '#3498DB',
    fontWeight: '500',
  },
  creditText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 80, // Adjusted for bottom tab navigator
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  fabText: {
    fontSize: 30,
    color: '#FFFFFF',
    lineHeight: 32, // Adjust for vertical centering
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loyaltyCard: {
    width: '90%',
    aspectRatio: 1.586, // Standard credit card aspect ratio
    borderRadius: 15,
    backgroundColor: '#2C3E50',
    padding: 20,
    justifyContent: 'space-between',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  loyaltyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loyaltyCardTitle: {
    fontSize: 14,
    color: '#BDC3C7',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  loyaltyCardStore: {
    fontSize: 16,
    color: '#ECF0F1',
    fontWeight: 'bold',
  },
  loyaltyCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  loyaltyCardDetails: {
    marginLeft: 15,
    flex: 1, // Allow details to take remaining space and wrap text
  },
  loyaltyCardName: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loyaltyCardId: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 4,
  },
  loyaltyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loyaltyCardStats: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  loyaltyCardCredit: {
    fontSize: 14,
    fontWeight: '500',
  },
  loyaltyCardPoints: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loyaltyCardEdit: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
  },
  saveButton: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#95A5A6',
    marginTop: 10,
  },
});

export default CustomerScreen;
