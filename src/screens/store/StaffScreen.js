import React, {useState, useEffect} from 'react';
import {Text, StyleSheet, View, TouchableOpacity, FlatList, ActivityIndicator} from 'react-native';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import {
  ListItem,
  Avatar,
  CheckBox,
  Overlay,
  Button,
} from 'react-native-elements';
import {TextInput} from 'react-native-paper';
import Alert from '../../components/Alert';
import { AddStaff } from './forms/AddStaff';
import AppHeader from '../../components/AppHeader';
import colors from '../../themes/colors';

import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from '@aws-amplify/auth';
import { createStaff, createStaffStore } from '../../graphql/mutations';
import { listStaff, listStaffStores } from '../../graphql/queries';
import * as queries from '../../graphql/queries';


const client = generateClient();

const StaffsScreen = ({navigation, route}) => {
  const STORE = route.params.store;
  const [overlayVisible, setOverlayVisible] = useState(false);
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
        const { userId } = await getCurrentUser();
        setAuthUserId(userId);
        console.log('Authenticated user ID:', userId);
      } catch (error) {
        console.error('Error getting authenticated user:', error);
      }
    };
    
    getAuthUser();
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
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
            storeId: { eq: STORE.id } 
          }
        }
      });
      
      // Get the staff IDs related to this store
      const staffIds = staffStoreResult.data.listStaffStores.items.map(item => item.staffId);
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
            role: { contains: "Cashier" }
          } 
        }
      });
      
      // Filter the cashiers that belong to this store
      if (result.data.listStaff.items) {
        cashierStaff = result.data.listStaff.items.filter(staff => 
          staffIds.includes(staff.id)
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
  };

const saveStaff = async (
    name,
    storeId,
    storeName,
    password,
    status,
    deviceName = '',
    deviceId = '',
    logStatus = "INACTIVE",
  ) => {
    if (!name || !password) {
      alert("Name and PIN are required!");
      return false;
    }

    // Validate PIN is numeric and exactly 5 digits
    if (!/^\d{5}$/.test(password)) {
      alert("PIN must be exactly 5 digits");
      return false;
    }

    try {
      const { userId } = await getCurrentUser();
      if (!userId) {
        alert("Authentication error. Please sign in again.");
        return false;
      }

      // Create a new staff with role set to Cashier only
      const newStaff = {
        name,
        password,
        role: ["Cashier"], // Enforcing Cashier role only
        device_id: deviceId,
        device_name: deviceName,
        log_status: logStatus,
        ownerId: userId // Include owner ID from authenticated user
      };
      
      console.log('Creating new cashier with valid fields:', newStaff);
  
      // 1. Create the staff member first
      const staffResult = await client.graphql({
        query: createStaff,
        variables: { input: newStaff },
      });
      
      // 2. Get the new staff ID
      const newStaffId = staffResult.data.createStaff.id;
      console.log("Cashier created with ID:", newStaffId);
      
      // 3. Now connect this staff member to the store using the StaffStore relationship
      try {
        const staffStoreConnection = {
          staffId: newStaffId,  // Correct field name is staffId (lowercase 'd')
          storeId: STORE.id     // Correct field name is storeId (lowercase 'd')
        };
        
        console.log("Connecting staff to store:", staffStoreConnection);
        
        await client.graphql({
          query: createStaffStore,
          variables: { input: staffStoreConnection }
        });
        
        console.log("Staff-Store connection created successfully");
      } catch (connectionError) {
        console.error("Error connecting staff to store:", connectionError);
        console.error("Connection error details:", JSON.stringify(connectionError, null, 2));
        // Even if connection fails, the staff was created
      }
      
      console.log("Cashier added successfully!");
      fetchStaff(); // Refresh the staff list
      return true;
    } catch (error) {
      console.error("Error saving cashier:", error);
      alert("Failed to add cashier. Please try again.");
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
          borderWidth: 1,
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
    <View style={styles.container}>
      <Alert
        visible={upgrade_plan}
        onCancel={() => setUpgradePlan(false)}
        onProceed={() => setUpgradePlan(false)}
        title="Cashier Limit Reached"
        content="Maximum number of cashiers for your current plan has been reached."
        confirmTitle="OK"
      />
      <AppHeader
        centerText="Cashiers"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <EvilIcons name={'arrow-left'} size={30} color={colors.white} />
          </TouchableOpacity>
        }
        rightComponent={
          <AddStaff saveStaff={saveStaff} store={STORE} />
        }
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading cashiers...</Text>
        </View>
      ) : staffs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No cashiers found</Text>
          <Text style={styles.emptySubText}>Add cashiers to your store using the + button</Text>
        </View>
      ) : (
        <FlatList
          keyExtractor={keyExtractor}
          data={staffs}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <Overlay
        isVisible={overlayVisible}
        overlayStyle={{
          width: '70%',
          paddingHorizontal: 30,
          paddingBottom: 20,
          paddingTop: 15,
        }}
        onBackdropPress={() => setOverlayVisible(false)}>
        <>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 10,
            }}>
            Edit Staff Details
          </Text>
          <TextInput
            mode="outlined"
            value={name}
            placeholder="Name"
            onChangeText={text => setName(text)}
          />
          <TextInput
            mode="outlined"
            value={password}
            placeholder="Password"
            onChangeText={text => setPassword(text)}
            maxLength={6}
          />

          <View style={{flexDirection: 'row', marginLeft: -10}}>
            <CheckBox
              textStyle={{fontSize: 10}}
              title="Active"
              checkedIcon="dot-circle-o"
              uncheckedIcon="circle-o"
              checked={check1}
              onPress={() => {
                setCheck1(!check1), setSelected('Active'), setCheck2(false);
              }}
            />
            <CheckBox
              textStyle={{fontSize: 10}}
              title="Inactive"
              checkedIcon="dot-circle-o"
              uncheckedIcon="circle-o"
              checked={check2}
              onPress={() => {
                setCheck2(!check2), setSelected('Inactive'), setCheck1(false);
              }}
            />
          </View>
          <Button
            title="Save"
            buttonStyle={{marginTop: 20, backgroundColor: colors.accent}}
            onPress={() => {
              setOverlayVisible(false);
              fetchStaff();
            }}
          />
        </>
      </Overlay>
    </View>
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
    backgroundColor: '#f5f5f5',
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
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.grey,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.grey,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default StaffsScreen;
