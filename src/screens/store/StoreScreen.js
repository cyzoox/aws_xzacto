import React, { useEffect, useState } from 'react';
import { uploadData } from '@aws-amplify/storage';
import { Text, StyleSheet, View, FlatList, Dimensions, TouchableOpacity, Image, ScrollView, TextInput, SafeAreaView } from "react-native";
import { Card, ListItem, Avatar, Badge, Overlay, Button } from "react-native-elements";
import formatMoney from 'accounting-js/lib/formatMoney.js';
import { generateClient } from 'aws-amplify/api';
import { createStore, updateStore, deleteStore, createStoreSettings } from '../../graphql/mutations';
import { listStores } from '../../graphql/queries';
import Appbar from '../../components/Appbar';
import colors from '../../themes/colors';
import { Auth } from 'aws-amplify'; // Import Auth module
import Icon from 'react-native-vector-icons/Feather'; 

const windowHeight = Dimensions.get('window').height;
const initialFormState = { store_name: '',  branch: '', owner: '', password: '', store_type: '', confirmPassword:''};
const client = generateClient();

const StoreScreen = ({navigation}) => {
  const [formState, setFormState] = useState(initialFormState);
  const [stores, setStores] = useState([]);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false); // Toggle password visibility
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false); // Toggle confirm password visibility
  const [errorMessage, setErrorMessage] = useState(''); // For displaying errors


  useEffect(() => {
    fetchUserId(); // Fetch and set user ID as owner
    fetchStores();
  }, []);

  // Fetch the authenticated user's ID to set as owner
  async function fetchUserId() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const userId = user.attributes.sub; // Get the user's unique ID
      setFormState((prevFormState) => ({ ...prevFormState, owner: userId }));
    } catch (err) {
      console.log('Error fetching user ID:', err);
    }
  }

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value });
  }

  async function fetchStores() {
    try {
      const storeData = await client.graphql({
        query: listStores,
      });
      const stores = storeData.data.listStores.items;
      console.log('Fetched stores:', stores);

      // Sync the stores list to S3 as a JSON file
      const fileContent = JSON.stringify(stores);
      const fileName = `stores-${new Date().toISOString()}.json`;
      
      await uploadData({
        key: fileName,
        body: fileContent,
        contentType: 'application/json',
      });

      console.log(`Stores synced to S3 with file name: ${fileName}`);
      setStores(stores);
    } catch (err) {
      console.log('Error fetching stores:', err);
    }
  }
  async function addStore() {
    // Step 1: Validation checks for form inputs
    if (formState.password !== formState.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
  
    if (formState.password.length < 5) {
      setErrorMessage("Password must be at least 5 characters long");
      return;
    }
  
    if (!formState.store_name || !formState.branch) {
      setErrorMessage("Store name and branch are required.");
      return;
    }
  
    try {
      // Step 2: Create the new store
      const newStore = {
        store_name: formState.store_name,
        branch: formState.branch,
        owner: formState.owner,
        password: formState.password,
        store_type: formState.store_type,
      };
  
      // Send the GraphQL mutation to create the store
      const storeResponse = await client.graphql({
        query: createStore, // Replace with your actual `createStore` mutation
        variables: { input: newStore },
      });
  
      // Extract the store ID from the response
      const storeId = storeResponse.data.createStore.id; // Adjust field names to match your API response
  
      console.log("Store created successfully with ID:", storeId);
  
      // Step 3: Create store settings with default values
      const newStoreSettings = {
        storeId: storeId,
        lowstock: 10, // Example default value
        vat: 15, // Example default value
        cashierview: true, // Example default value
        allow_credit: true, // Example default value
        headers:[]
      };
  
      // Send the GraphQL mutation to create the store settings
      await client.graphql({
        query: createStoreSettings, // Replace with your actual `createStoreSettings` mutation
        variables: { input: newStoreSettings },
      });
  
      console.log("Store settings created successfully for store ID:", storeId);
  
      // Step 4: Reset form state and close the overlay
      setFormState(initialFormState); // Reset form fields
      setErrorMessage(""); // Clear error messages
      setOverlayVisible(false); // Hide the overlay
  
      // Refresh the store list
      fetchStores();
  
    } catch (err) {
      console.log("Error creating store or settings:", err);
    }
  }
  
  async function deleteStoreData(storeId) {
    try {
      const deletedStore = await client.graphql({
        query: deleteStore,
        variables: { input: { id: storeId } }
      });
      console.log('Store deleted:', deletedStore);
      fetchStores(); // Refresh the list after deletion
    } catch (err) {
      console.log('Error deleting store:', err);
    }
  }

  const renderItem = ({ item }) => (
    <ListItem bottomDivider underlayColor="white" containerStyle={styles.lgridStyle} onPress={() => navigation.navigate('StoreDashboard', {'storess': item})}>
      <Avatar title={item.store_name[0]} size='large' source={require('../../../assets/xzacto_icons/iconsstore/stores2.png')} />
      <ListItem.Content>
        <ListItem.Title>{item.store_name}</ListItem.Title>
        <ListItem.Subtitle>{item.branch}</ListItem.Subtitle>
      </ListItem.Content>
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.primary }}>{formatMoney(0, { symbol: '₱', precision: 2 })}</Text>
    </ListItem>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar
        title="POS Dashboard"
        onMenuPress={() => console.log("Menu pressed")}
        onSearchPress={() => console.log("Search pressed")}
        onNotificationPress={() => console.log("Notifications pressed")}
        onProfilePress={() => console.log("Profile pressed")}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <FlatList
          keyExtractor={(key) => key._id}
          data={stores}
          renderItem={renderItem}
        />
       <Overlay
          isVisible={overlayVisible}
          overlayStyle={{ width: "80%" }}
          onBackdropPress={() => setOverlayVisible(false)} // Close overlay when tapped outside
        >
          <View style={styles.overlayContent}>
            <Text style={styles.heading}>Create New Store</Text>

            {/* Display error message if passwords don't match or if password is too short */}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TextInput
              onChangeText={(value) => setInput('store_name', value)}
              style={styles.input}
              value={formState.store_name}
              placeholder="Store Name"
            />
            <TextInput
              onChangeText={(value) => setInput('branch', value)}
              style={styles.input}
              value={formState.branch}
              placeholder="Branch"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                onChangeText={(value) => setInput('password', value)}
                style={styles.input}
                value={formState.password}
                placeholder="Password"
                secureTextEntry={!passwordVisible}
                maxLength={5} // Limit password length to 5 characters
              />
              <Icon
                name={passwordVisible ? 'eye' : 'eye-off'}
                size={24}
                color="gray"
                onPress={() => setPasswordVisible(!passwordVisible)} // Toggle password visibility
                style={styles.eyeIcon}
              />
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                onChangeText={(value) => setInput('confirmPassword', value)}
                style={styles.input}
                value={formState.confirmPassword}
                placeholder="Confirm Password"
                secureTextEntry={!confirmPasswordVisible}
              />
              <Icon
                name={confirmPasswordVisible ? 'eye' : 'eye-off'}
                size={24}
                color="gray"
                onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} // Toggle confirm password visibility
                style={styles.eyeIcon}
              />
            </View>

            <TextInput
              onChangeText={(value) => setInput('store_type', value)}
              style={styles.input}
              value={formState.store_type}
              placeholder="Store Type"
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                buttonStyle={styles.cancelButton}
                onPress={() => setOverlayVisible(false)} // Hide overlay on cancel
              />
              <Button
                title="Create"
                buttonStyle={styles.createButton}
                onPress={addStore} // Call addStore function on create
              />
            </View>
          </View>
        </Overlay>
      </ScrollView>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setOverlayVisible(true)} // Show the overlay on press
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default StoreScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  store: { marginBottom: 15 },
  input: {
    backgroundColor: '#ddd',
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
    width: '100%',
    borderRadius: 5
  },
  storeName: { fontSize: 20, fontWeight: 'bold' },
  storeDetails: { fontSize: 16 },
  buttonContainer: {
    alignSelf: 'center',
    backgroundColor: 'black',
    paddingHorizontal: 8,
    marginTop: 10,
    borderRadius: 5
  },
  buttonText: { color: 'white', padding: 16, fontSize: 18 },
  xlgridStyle: {
    backgroundColor: colors.primary, 
    height: windowHeight / 4, 
    borderBottomLeftRadius: 35, 
    borderBottomRightRadius: 35, 
    justifyContent: 'center',
    shadowColor: "#EBECF0",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
  },
  lgridStyle: {
    flex: 1,
    height: 90,
    padding: 10,
    backgroundColor: colors.white, 
    marginHorizontal: 15, 
    marginTop: 10, 
    marginBottom: 5,
    borderRadius: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 10, 
    alignItems: 'center',
    shadowColor: "#EBECF0",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.green,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
});
