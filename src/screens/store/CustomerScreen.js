import React from "react";
import { Text, StyleSheet, View, TouchableOpacity, FlatList } from "react-native";

import EvilIcons from 'react-native-vector-icons/EvilIcons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'


import { ListItem, Avatar, Overlay, Button } from 'react-native-elements'
import { useState } from "react";
import { TextInput } from "react-native-paper";
import { AddCustomer } from "./forms/AddCustomer";
import AppHeader from "../../components/AppHeader";
import colors from "../../themes/colors";
import { generateClient } from 'aws-amplify/api';
import { createCustomer } from '../../graphql/mutations';
import { listCustomers } from '../../graphql/queries';
const client = generateClient();
const CustomerScreen = ({navigation, route}) => {
  const STORE =  route.params.store
  
 
  const [c_name, setName] = useState('');
  const [c_address, setAddress]= useState('');
  const [c_mobile, setMobile]= useState('');
  const [c_balance, setBalance]= useState('');
  const [c_info, setCustomerInfo]= useState([]);
  const [customers, setCustomers]= useState([]);
  const [overlayVisible, setOverlayVisible]= useState(false);

  const fetchCustomers = async () => {
 
    const result = await client.graphql({
        query: listCustomers,
        variables: { filter: { storeId: { eq: STORE.id } } }
    });
    const customerList = result.data.listCustomers.items;
    setCustomers(customerList);
  

};
const saveCustomer = async (
    name,
    storeId,
    storeName,
    address,
    creditBalance = 0,
    mobileNo,
    telNo = null
  ) => {
    // Construct the new customer object correctly
    const newCustomer = {
      name,
      address,
      credit_balance: creditBalance,
      mobile_no: mobileNo,
      tel_no: "",
      storeId: storeId,    // Use the parameter directly
      store: storeName, // Use the parameter directly
    };
  
    console.log(newCustomer); // Debugging: Check the new customer data structure
  
    // Validation checks
    if (!name || !mobileNo) {
      console.log("Name, Mobile No, and Store ID are required!");
      return;
    }
  
    if (isNaN(creditBalance) || creditBalance < 0) {
      console.log("Credit balance must be a valid positive number.");
      return;
    }
  
    try {
      // Save customer using a GraphQL mutation
      await client.graphql({
        query: createCustomer, // Replace with the actual mutation for creating customers
        variables: { input: newCustomer },
      });
  
      console.log("Customer saved successfully!");
      fetchCustomers(); // Reload customers if implemented
    } catch (error) {
      console.error("Error saving customer:", error);
      console.log("Failed to save customer. Please try again.");
    }
  };
  
  

const renderItem = ({ item }) => (
  item.store_id === STORE._id &&
  
  <ListItem underlayColor={'#fffff'} 
  // onPress={()=> navigation.navigate('CreditDetails', {customer: item, store: STORE})}
   bottomDivider containerStyle={styles.listStyle}>
         <Avatar title={item.name[0]} size={60} source={require('../../../assets//xzacto_icons/iconsstore/customer.png')}/>
    <ListItem.Content>
      <ListItem.Title>{item.name}</ListItem.Title>
      <ListItem.Subtitle>{item.address}</ListItem.Subtitle>
    </ListItem.Content>
    <View style={{flexDirection:'row'}}>
      <TouchableOpacity onPress={()=> {setCustomerInfo(item),setAddress(item.address),setName(item.name),setMobile(item.mobile_no),setBalance(item.credit_balance), setOverlayVisible(true)}}>
        <FontAwesome name={'edit'} size={25} color={colors.primary}/>
      </TouchableOpacity>
    
    <View style={{width: 20}}></View>
    <FontAwesome name={'expeditedssl'} size={25} color={colors.red}/>
    <View style={{width: 10}}></View>
    </View>
   
  </ListItem>
)

  return (
    <View>
        <AppHeader 
          centerText="Customers & Credits" 
          leftComponent={
            <TouchableOpacity onPress={()=> navigation.goBack()}>
              <EvilIcons name={'arrow-left'} size={30} color={colors.white}/>
            </TouchableOpacity>
        }
        rightComponent={
          <AddCustomer saveCustomer={saveCustomer} store={STORE} />
        }/>
        <FlatList
    
        data={customers}
        renderItem={renderItem}
      />
        <Overlay
        isVisible={overlayVisible}
        overlayStyle={{ width: "70%" , paddingHorizontal: 30, paddingBottom: 20, paddingTop:15}}
        onBackdropPress={() => setOverlayVisible(false)}
      >
        <>
        <Text style={{textAlign:'center', fontSize: 18, fontWeight:'700', marginBottom:10}}>Edit Customer Details</Text>
          <TextInput
          mode="outlined"
          value={c_name}
            placeholder="Name"
            onChangeText={(text) => setName(text)}
           
          />
           <TextInput
          mode="outlined"
          value={c_address}
            placeholder="Address"
            onChangeText={(text) => setAddress(text)}
           
          />
        <TextInput
          mode="outlined"
          value={c_mobile}
            placeholder="Mobile No."
            onChangeText={(text) => setMobile(text)}
           
          />
         <TextInput
          mode="outlined"
          value={`${c_balance}`}
            placeholder="Credit Balance"
            onChangeText={(text) => setBalance(text)}
           
          />
          <Button
            title="Save"
            buttonStyle={{marginTop: 20, backgroundColor: colors.accent}}
            onPress={() => {
              setOverlayVisible(false);
              
            }}
          />
        </>
      </Overlay>
    </View>
  );
};

CustomerScreen.navigationOptions = () => {
  return {
    headerShown: false
  };
}

const styles = StyleSheet.create({
  text: {
    fontSize: 30
  },
  listStyle: {
    flex:1,
    height: 75,
    backgroundColor: colors.white, 
    marginHorizontal: 15,
    paddingHorizontal: 15, 
    marginBottom: 10,
    marginTop: 10, 
    borderRadius: 15, 
    flexDirection:'row', 
    justifyContent:'space-between', 
    paddingHorizontal: 10, 
    alignItems:'center',
    shadowColor: "#EBECF0",
    shadowOffset: {
      width: 0,
      height: 5,
     
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
  }
});

export default CustomerScreen;
