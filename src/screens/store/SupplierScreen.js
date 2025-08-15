import React, {useState, useEffect} from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  withAuthenticator,
  useAuthenticator,
} from '@aws-amplify/ui-react-native';
import {
  ListItem,
  Avatar,
  Button,
  Overlay,
  SearchBar,
  FAB,
} from 'react-native-elements';
import {
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../../graphql/mutations';
import {listSuppliers} from '../../graphql/queries';
import {generateClient} from 'aws-amplify/api';
import Appbar from '../../components/Appbar';
import colors from '../../themes/colors';
import {SafeAreaView} from 'react-native-safe-area-context';


const userSelector = context => [context.user];
const KEYS_TO_FILTERS = ['store_id'];
const client = generateClient();
const Supplier = ({navigation, route}) => {
  const storeData = route.params.store;
  const {user, signOut} = useAuthenticator(userSelector);

  // State for supplier data
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSupplier, setFilteredSupplier] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // State for form inputs
  const [supplierName, setSupplierName] = useState('');
  const [contact, setContact] = useState('');
  const [address, setAddress] = useState('');

  // State for UI controls
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchQuery) {
      const filtered = suppliers.filter(
        supplier =>
          supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          supplier.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
          supplier.address.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredSupplier(filtered);
    } else {
      setFilteredSupplier(suppliers);
    }
  }, [searchQuery, suppliers]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const result = await client.graphql({
        query: listSuppliers,
        variables: {filter: {storeId: {eq: storeData.id}}},
      });
      const supplierList = result.data.listSuppliers.items;
      setSuppliers(supplierList);
      setFilteredSupplier(supplierList);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      Alert.alert('Error', 'Failed to load suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveSupplier = async () => {
    // Validate inputs
    if (!supplierName.trim()) {
      Alert.alert('Error', 'Supplier name is required!');
      return;
    }

    try {
      setLoading(true);
      // Create supplier with required fields
      const newSupplier = {
        name: supplierName.trim(),
        storeId: storeData.id,
      };

      // Only add phone if it's formatted with + sign (E.164 format)
      // AWS expects phone numbers in format like +1234567890
      if (contact.trim().startsWith('+')) {
        newSupplier.phone = contact.trim();
      }

      // Only add email if it's a valid email format
      if (address.trim() && address.includes('@')) {
        newSupplier.email = address.trim();
      }

      await client.graphql({
        query: createSupplier,
        variables: {input: newSupplier},
      });

      // Reset form fields
      setSupplierName('');
      setContact('');
      setAddress('');

      // Refresh supplier list
      fetchSuppliers();
      Alert.alert('Success', 'Supplier added successfully!');
    } catch (error) {
      console.error('Error saving supplier:', error);
      Alert.alert('Error', 'Failed to add supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update supplier function
  const updateSupplierData = async () => {
    if (!selectedSupplier) {
      return;
    }

    // Validate inputs
    if (!supplierName.trim()) {
      Alert.alert('Error', 'Supplier name is required!');
      return;
    }

    try {
      setLoading(true);
      // Create update object with required fields
      const updatedSupplier = {
        id: selectedSupplier.id,
        name: supplierName.trim(),
      };

      // Only add phone if it's formatted with + sign (E.164 format)
      // AWS expects phone numbers in format like +1234567890
      if (contact.trim().startsWith('+')) {
        updatedSupplier.phone = contact.trim();
      }

      // Only add email if it's a valid email format
      if (address.trim() && address.includes('@')) {
        updatedSupplier.email = address.trim();
      }

      await client.graphql({
        query: updateSupplier,
        variables: {input: updatedSupplier},
      });

      // Close modal and refresh list
      setEditModalVisible(false);
      setSelectedSupplier(null);
      fetchSuppliers();
      Alert.alert('Success', 'Supplier updated successfully!');
    } catch (error) {
      console.error('Error updating supplier:', error);
      Alert.alert('Error', 'Failed to update supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete supplier function
  const deleteSupplierData = supplier => {
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete ${supplier.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await client.graphql({
                query: deleteSupplier,
                variables: {input: {id: supplier.id}},
              });
              fetchSuppliers();
              Alert.alert('Success', 'Supplier deleted successfully!');
            } catch (error) {
              console.error('Error deleting supplier:', error);
              Alert.alert(
                'Error',
                'Failed to delete supplier. Please try again.',
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // Open edit modal with supplier data
  const openEditModal = supplier => {
    setSelectedSupplier(supplier);
    setSupplierName(supplier.name);
    setContact(supplier.contact);
    setAddress(supplier.address);
    setIsEditing(true);
    setEditModalVisible(true);
  };

  const keyExtractor = item => item.id;

  const renderItem = ({item}) => (
    <ListItem
      bottomDivider
      containerStyle={styles.listStyle}
      onPress={() => openEditModal(item)}>
      <Avatar
        containerStyle={{
          borderColor: 'grey',
          borderStyle: 'solid',
        
          borderRadius: 20,
          backgroundColor: colors.white,
        }}
        size={50}
        source={require('../../../assets/xzacto_icons/iconsstore/supplier2.png')}
      />
      <ListItem.Content>
        <ListItem.Title style={styles.title}>{item.name}</ListItem.Title>
        <ListItem.Subtitle>Phone: {item.phone || 'N/A'}</ListItem.Subtitle>
        <ListItem.Subtitle>Email: {item.email || 'N/A'}</ListItem.Subtitle>
      </ListItem.Content>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          style={styles.editButton}>
          <MaterialIcons name="edit" size={22} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => deleteSupplierData(item)}
          style={styles.deleteButton}>
          <MaterialIcons name="delete" size={22} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </ListItem>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar
        title="Supplier Management"
        subtitle={storeData.name || ''}
        onBack={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <SearchBar
        placeholder="Search suppliers..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
        lightTheme
        round
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading suppliers...</Text>
        </View>
      ) : (
        <FlatList
          keyExtractor={keyExtractor}
          data={filteredSupplier}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="business" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No suppliers found</Text>
              <Text style={styles.emptySubtext}>
                Add your first supplier using the + button below
              </Text>
            </View>
          }
        />
      )}

      {/* Edit Supplier Modal */}
      <Overlay
        isVisible={editModalVisible}
        onBackdropPress={() => setEditModalVisible(false)}
        overlayStyle={styles.modalContainer}>
        <View>
          <Text style={styles.modalTitle}>Edit Supplier</Text>

          <TextInput
            style={styles.input}
            placeholder="Supplier Name"
            value={supplierName}
            onChangeText={text => setSupplierName(text)}
          />
          <View>
            <TextInput
              style={styles.input}
              placeholder="Phone Number (format: +123456789)"
              value={contact}
              onChangeText={text => setContact(text)}
              keyboardType="phone-pad"
            />
            <Text style={styles.helperText}>
              Phone must begin with + (e.g., +639123456789)
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email (Optional)"
            value={address}
            onChangeText={text => setAddress(text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.modalButtonContainer}>
            <Button
              title="Cancel"
              type="outline"
              containerStyle={styles.modalButton}
              onPress={() => setEditModalVisible(false)}
            />
            <Button
              title="Update"
              containerStyle={styles.modalButton}
              onPress={updateSupplierData}
            />
          </View>
        </View>
      </Overlay>

      {/* Add Supplier FAB */}
      <FAB
        placement="right"
        color={colors.primary}
        size="large"
        icon={<Ionicons name="add" size={24} color="white" />}
        onPress={() => {
          // Reset form fields
          setSupplierName('');
          setContact('');
          setAddress('');
          
          // Open Add Supplier Modal
          setAddModalVisible(true);
        }}
        style={styles.fab}
        buttonStyle={styles.fabButton}
      />

      {/* Add Supplier Modal */}
      <Overlay
        isVisible={addModalVisible}
        onBackdropPress={() => setAddModalVisible(false)}
        overlayStyle={styles.modalContainer}>
        <View>
          <Text style={styles.modalTitle}>Add New Supplier</Text>

          <TextInput
            style={styles.input}
            placeholder="Supplier Name"
            value={supplierName}
            onChangeText={text => setSupplierName(text)}
          />
          <View>
            <TextInput
              style={styles.input}
              placeholder="Phone Number (format: +123456789)"
              value={contact}
              onChangeText={text => setContact(text)}
              keyboardType="phone-pad"
            />
            <Text style={styles.helperText}>
              Phone must begin with + (e.g., +639123456789)
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email (Optional)"
            value={address}
            onChangeText={text => setAddress(text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.modalButtonContainer}>
            <Button
              title="Cancel"
              type="outline"
              containerStyle={styles.modalButton}
              onPress={() => setAddModalVisible(false)}
            />
            <Button
              title="Save"
              containerStyle={styles.modalButton}
              onPress={() => {
                saveSupplier();
                setAddModalVisible(false);
              }}
            />
          </View>
        </View>
      </Overlay>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 60, // Increased to accommodate bottom tab navigation
  },
  fabButton: {
    height: 56,
    width: 56,
    borderRadius: 28,
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    padding: 0,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    height: 40,
  },
  listContainer: {
    paddingVertical: 12,
    paddingBottom: 80, // Extra space for FAB
  },
  listStyle: {
    minHeight: 90,
    backgroundColor: colors.white,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#6c757d',
  },
  modalContainer: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: colors.primary,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    width: '48%',
  },
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: -5,
    marginBottom: 10,
    marginLeft: 5,
  },
});

export default Supplier;
