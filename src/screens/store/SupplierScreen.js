import React, { useState, useEffect } from "react";
import { Text, StyleSheet, TouchableOpacity, FlatList, View ,TextInput} from "react-native";

import EvilIcons from 'react-native-vector-icons/EvilIcons';
import {
    withAuthenticator,
    useAuthenticator
  } from '@aws-amplify/ui-react-native';
import { ListItem, Avatar } from 'react-native-elements';
import { Auth } from 'aws-amplify'; // Import Auth module
import { createSupplier } from '../../graphql/mutations';
import {  listSuppliers } from '../../graphql/queries';
import SearchInput, { createFilter } from 'react-native-search-filter';
import { generateClient } from 'aws-amplify/api';
import AppHeader from "../../components/AppHeader";
import colors from "../../themes/colors";
import ModalInputForm  from "../../components/ModalInputForm";
import { ModalInputForm1 } from "../../components/ModalInputForm1";

const userSelector = (context) => [context.user];
const KEYS_TO_FILTERS = ['store_id'];
const client = generateClient();
const Supplier = ({ navigation, route }) => {
    const storeData = route.params.store;
      const { user, signOut } = useAuthenticator(userSelector);
    const [userId, setUserId] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSupplier, setFilteredSupplier] = useState([]);
    const [supplierName, setSupplierName] = useState('');
    const [contact, setContact] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        console.log(storeData);
        fetchSuppliers();
    }, []);



    const fetchSuppliers = async () => {
     
            const result = await client.graphql({
                query: listSuppliers,
                variables: { filter: { storeId: { eq: storeData.id } } }
            });
            const supplierList = result.data.listSuppliers.items;
            setSuppliers(supplierList);
            setFilteredSupplier(supplierList);
       
    };

    const saveSupplier = async () => {
        if (!supplierName || !contact || !address) {
            alert("All fields are required!");
            return;
        }

        const newSupplier = {
            name: supplierName,
            contact,
            address,
            storeId: storeData.id,
         
        };

        console.log(newSupplier);

 
            await client.graphql({
                query: createSupplier,
                variables: { input: newSupplier }
            });
            setSupplierName('');
            setContact('');
            setAddress('');
            fetchSuppliers(); // Refresh the supplier list
        
    };

    const keyExtractor = (item, index) => index.toString();

    const renderItem = ({ item }) => (
        <ListItem bottomDivider containerStyle={styles.listStyle}>
            <Avatar 
                containerStyle={{
                    borderColor: 'grey',
                    borderStyle: 'solid',
                    borderWidth: 1,
                    borderRadius: 20,
                    backgroundColor: colors.white
                }} 
                size={50} 
                source={require('../../../assets/xzacto_icons/iconsstore/supplier2.png')}
            />
            <ListItem.Content>
                <ListItem.Title>{item.name}</ListItem.Title>
                <ListItem.Subtitle>{item.address}</ListItem.Subtitle>
            </ListItem.Content>
            <ListItem.Chevron />
        </ListItem>
    );

    return (
        <View>
            <AppHeader 
                centerText="Supplier"
                leftComponent={
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <EvilIcons name={'arrow-left'} size={30} color={colors.white} />
                    </TouchableOpacity>
                }
                rightComponent={
                    <ModalInputForm title="Add Supplier" onSave={saveSupplier}
                        displayComponent={
                            <EvilIcons style={{ textAlign: 'center' }} name={'plus'} size={30} color={colors.white} />
                        }
                    >
                        <TextInput
                            mode="outlined"
                            label="Supplier Name"
                            placeholder="Supplier Name"
                            value={supplierName}
                            onChangeText={(text) => setSupplierName(text)}
                        />
                        <TextInput
                            mode="outlined"
                            label="Contact Details"
                            placeholder="Contact Details"
                            value={contact}
                            onChangeText={(text) => setContact(text)}
                        />
                        <TextInput
                            mode="outlined"
                            label="Address"
                            placeholder="Address"
                            value={address}
                            onChangeText={(text) => setAddress(text)}
                        />
                    </ModalInputForm>
                }
            />
            <FlatList
                keyExtractor={keyExtractor}
                data={filteredSupplier}
                renderItem={renderItem}
            />
        </View>
    );
};

const styles = StyleSheet.create({
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
        shadowColor: "#EBECF0",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.89,
        shadowRadius: 2,
        elevation: 5,
    }
});

export default Supplier;
