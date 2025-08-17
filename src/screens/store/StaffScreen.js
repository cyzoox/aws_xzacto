import React, {useState, useEffect, useCallback} from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {ListItem, Avatar, CheckBox, Button, FAB} from 'react-native-elements';
import {TextInput} from 'react-native-paper';
import Alert from '../../components/Alert';
import Appbar from '../../components/Appbar';
import colors from '../../themes/colors';
import {SafeAreaView} from 'react-native-safe-area-context';

import {generateClient} from 'aws-amplify/api';
import {getCurrentUser} from '@aws-amplify/auth';
import {createStaff, createStaffStore} from '../../graphql/mutations';
import {listStaff, listStaffStores} from '../../graphql/queries';
import * as queries from '../../graphql/queries';

const client = generateClient();

const StaffsScreen = ({navigation, route}) => {
  const STORE = route.params.store;
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [addStaffModalVisible, setAddStaffModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);
  const [selected, setSelected] = useState('');
  const [item, setItem] = useState([]);
  const [upgrade_plan, setUpgradePlan] = useState(false);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authUserId, setAuthUserId] = useState(null);
  const keyExtractor = (item, index) => index.toString();

  // Get authenticated user on component mount
  useEffect(() => {
    const getAuthUser = async () => {
      try {
        const {userId} = await getCurrentUser();
        setAuthUserId(userId);
        console.log('Authenticated user ID:', userId);
      } catch (error) {
        console.error('Error getting authenticated user:', error);
      }
    };

    getAuthUser();
    fetchStaff();
  }, [fetchStaff]);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      if (!STORE || !STORE.id) {
        console.log('No store ID available to filter staff');
        return;
      }

      console.log(`Fetching cashiers for store: ${STORE.id}`);

      // First approach: Using StaffStore connections to find staff assigned to this store
      const staffStoreResult = await client.graphql({
        query: listStaffStores,
        variables: {
          filter: {
            storeId: {eq: STORE.id},
          },
        },
      });

      // Get the staff IDs related to this store
      const staffIds = staffStoreResult.data.listStaffStores.items.map(
        item => item.staffId,
      );
      console.log(`Found ${staffIds.length} staff associations for this store`);

      if (staffIds.length === 0) {
        console.log('No staff found for this store');
        setStaffs([]);
        return;
      }

      // Get each cashier one by one since 'in' operator isn't supported
      console.log('Fetching cashier info for each staff ID...');
      let cashierStaff = [];

      // For simplicity, fetch all cashiers first, then filter by our staffIds
      const result = await client.graphql({
        query: listStaff,
        variables: {
          filter: {
            role: {contains: 'Cashier'},
          },
        },
      });

      // Filter the cashiers that belong to this store
      if (result.data.listStaff.items) {
        cashierStaff = result.data.listStaff.items.filter(staff =>
          staffIds.includes(staff.id),
        );
      }

      console.log(`Found ${cashierStaff.length} cashiers for this store`);
      setStaffs(cashierStaff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      // Use a more descriptive error message
      console.log('Failed to load cashiers for this store:', error.message);
    } finally {
      setLoading(false);
    }
  }, [STORE]);

  const saveStaff = async (
    name,
    storeId,
    storeName,
    password,
    status,
    deviceName = '',
    deviceId = '',
    logStatus = 'INACTIVE',
  ) => {
    if (!name || !password) {
      alert('Name and PIN are required!');
      return false;
    }

    // Validate PIN is numeric and exactly 5 digits
    if (!/^\d{5}$/.test(password)) {
      alert('PIN must be exactly 5 digits');
      return false;
    }

    try {
      const {userId} = await getCurrentUser();
      if (!userId) {
        alert('Authentication error. Please sign in again.');
        return false;
      }

      // Create a new staff with role set to Cashier only
      const newStaff = {
        name,
        password,
        role: ['Cashier'], // Enforcing Cashier role only
        device_id: deviceId,
        device_name: deviceName,
        log_status: logStatus,
        ownerId: userId, // Include owner ID from authenticated user
      };

      console.log('Creating new cashier with valid fields:', newStaff);

      // 1. Create the staff member first
      const staffResult = await client.graphql({
        query: createStaff,
        variables: {input: newStaff},
      });

      // 2. Get the new staff ID
      const newStaffId = staffResult.data.createStaff.id;
      console.log('Cashier created with ID:', newStaffId);

      // 3. Now connect this staff member to the store using the StaffStore relationship
      try {
        const staffStoreConnection = {
          staffId: newStaffId, // Correct field name is staffId (lowercase 'd')
          storeId: STORE.id, // Correct field name is storeId (lowercase 'd')
        };

        console.log('Connecting staff to store:', staffStoreConnection);

        await client.graphql({
          query: createStaffStore,
          variables: {input: staffStoreConnection},
        });

        console.log('Staff-Store connection created successfully');
      } catch (connectionError) {
        console.error('Error connecting staff to store:', connectionError);
        console.error(
          'Connection error details:',
          JSON.stringify(connectionError, null, 2),
        );
        // Even if connection fails, the staff was created
      }

      console.log('Cashier added successfully!');
      fetchStaff(); // Refresh the staff list
      return true;
    } catch (error) {
      console.error('Error saving cashier:', error);
      alert('Failed to add cashier. Please try again.');
      return false;
    }
  };

  const onEditStaff = item => {
    setName(item.name);
    setPassword(item.password);
    setItem(item);
    if (item.status === 'Active') {
      setCheck1(true);
      setSelected('Active');
    } else {
      setCheck2(true);
      setSelected('Inactive');
    }
    setOverlayVisible(true);
  };

  const renderItem = ({item}) => (
    <ListItem
      underlayColor="#f1f1f1"
      onPress={() => onEditStaff(item)}
      bottomDivider
      containerStyle={styles.listStyle}>
      <Avatar
        containerStyle={{
          borderColor: 'grey',
          borderStyle: 'solid',

          borderRadius: 20,
          backgroundColor: colors.white,
        }}
        size={50}
        source={require('../../../assets//xzacto_icons/iconsstore/cashier.png')}
      />
      <ListItem.Content>
        <ListItem.Title>{item.name}</ListItem.Title>
      </ListItem.Content>
      <View>
        <Text
          style={
            item.status === 'Active'
              ? {fontSize: 15, fontWeight: '700', color: colors.green}
              : {fontSize: 15, fontWeight: '700', color: colors.red}
          }>
          {item.status}
        </Text>
      </View>
    </ListItem>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Alert
        visible={upgrade_plan}
        onCancel={() => setUpgradePlan(false)}
        onProceed={() => setUpgradePlan(false)}
        title="Cashier Limit Reached"
        content="Maximum number of cashiers for your current plan has been reached."
        confirmTitle="OK"
      />
      <Appbar
        title={'Cashiers'}
        subtitle={STORE.name || ''}
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading cashiers...</Text>
        </View>
      ) : staffs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={70} color={colors.lightGray} />
          <Text style={styles.emptyText}>No cashiers found</Text>
          <Text style={styles.emptySubText}>
            Add cashiers to your store using the + button
          </Text>
        </View>
      ) : (
        <FlatList
          keyExtractor={keyExtractor}
          data={staffs}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Edit Staff Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={overlayVisible}
        onRequestClose={() => setOverlayVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Staff Details</Text>
              <TouchableOpacity onPress={() => setOverlayVisible(false)}>
                <Ionicons name="close" size={24} color={colors.darkGray} />
              </TouchableOpacity>
            </View>

            <TextInput
              mode="outlined"
              label="Name"
              value={name}
              placeholder="Enter cashier name"
              style={styles.textInput}
              onChangeText={text => setName(text)}
            />

            <TextInput
              mode="outlined"
              label="PIN"
              value={password}
              placeholder="Enter 5-digit PIN"
              keyboardType="numeric"
              style={styles.textInput}
              onChangeText={text => setPassword(text)}
              maxLength={5}
              secureTextEntry
            />

            <Text style={styles.statusLabel}>Status</Text>
            <View style={styles.checkboxContainer}>
              <CheckBox
                title="Active"
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                checked={check1}
                containerStyle={styles.checkbox}
                onPress={() => {
                  setCheck1(true);
                  setSelected('Active');
                  setCheck2(false);
                }}
              />
              <CheckBox
                title="Inactive"
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                checked={check2}
                containerStyle={styles.checkbox}
                onPress={() => {
                  setCheck2(true);
                  setSelected('Inactive');
                  setCheck1(false);
                }}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                type="outline"
                buttonStyle={styles.cancelButton}
                titleStyle={{color: colors.darkGray}}
                onPress={() => setOverlayVisible(false)}
              />
              <Button
                title="Save"
                buttonStyle={styles.saveButton}
                onPress={() => {
                  setOverlayVisible(false);
                  fetchStaff();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add New Cashier Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addStaffModalVisible}
        onRequestClose={() => setAddStaffModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Cashier</Text>
              <TouchableOpacity onPress={() => setAddStaffModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.darkGray} />
              </TouchableOpacity>
            </View>

            <TextInput
              mode="outlined"
              label="Name"
              placeholder="Enter cashier name"
              style={styles.textInput}
              onChangeText={text => setName(text)}
            />

            <TextInput
              mode="outlined"
              label="PIN"
              placeholder="Enter 5-digit PIN"
              keyboardType="numeric"
              style={styles.textInput}
              onChangeText={text => setPassword(text)}
              maxLength={5}
              secureTextEntry
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                type="outline"
                buttonStyle={styles.cancelButton}
                titleStyle={{color: colors.darkGray}}
                onPress={() => setAddStaffModalVisible(false)}
              />
              <Button
                title="Save"
                buttonStyle={styles.saveButton}
                onPress={() => {
                  if (name && password) {
                    saveStaff(name, STORE.id, STORE.name, password, 'Active');
                    setAddStaffModalVisible(false);
                    setName('');
                    setPassword('');
                  } else {
                    alert('Please enter both name and PIN');
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <FAB
        placement="right"
        color={colors.secondary}
        size="large"
        icon={<Ionicons name="add" size={24} color="white" />}
        onPress={() => {
          setName('');
          setPassword('');
          setAddStaffModalVisible(true);
        }}
        style={styles.fab}
        buttonStyle={styles.fabButton}
      />
    </SafeAreaView>
  );
};

StaffsScreen.navigationOptions = () => {
  return {
    headerShown: false,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  text: {
    fontSize: 30,
  },
  listStyle: {
    flex: 1,
    height: 75,
    backgroundColor: colors.white,
    marginHorizontal: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    // paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  subText: {
    color: '#4c4c4c',
    fontSize: 12,
  },
  div: {
    height: 1,
    width: '100%',
    backgroundColor: '#e1e1e1',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.darkGray,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkGray,
  },
  textInput: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
    color: colors.darkGray,
  },
  checkboxContainer: {
    flexDirection: 'row',
    marginLeft: -10,
    marginBottom: 10,
  },
  checkbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 8,
    marginLeft: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    borderColor: colors.darkGray,
    paddingHorizontal: 20,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
  },
  listContainer: {
    paddingVertical: 12,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 60,
  },
  fabButton: {
    height: 56,
    width: 56,
    borderRadius: 28,
  },
});

export default StaffsScreen;
