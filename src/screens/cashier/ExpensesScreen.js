import React, { useCallback, useEffect } from "react";
import { Text, StyleSheet, View, TouchableOpacity, FlatList, ScrollView,Modal } from "react-native";

import EvilIcons from 'react-native-vector-icons/EvilIcons'
import Feather from 'react-native-vector-icons/Feather'
import { Row, Col, Grid } from 'react-native-easy-grid';
import { useState } from "react";
import {TextInput } from 'react-native-paper';



import formatMoney from 'accounting-js/lib/formatMoney.js'
import SelectDropdown from 'react-native-select-dropdown'
import AppHeader from "../../components/AppHeader";
import ModalInputForm from "../../components/ModalInputForm";
import colors from "../../themes/colors";
import DataTable from "../../components/DataTable";

import { generateClient } from 'aws-amplify/api';
import { createExpense } from '../../graphql/mutations';
import { listExpenses } from '../../graphql/queries';
const client = generateClient();

const ExpensesScreen = ({navigation, route}) => {
  const {staffData} =  route.params;
  const [description, setDescription] = useState('Description')
  const [amount, setAmount] = useState('')
  const [other, setOthers] = useState('')
  const [specificDate, setSpecificDatePicker] = useState(false)
  const [filter, setFilter] = useState('Today')
  const [attendant, setAttendant] = useState('');
  const [attendant_info, setAttendantInfo] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const descriptions = [
    "Rental Expense",
    "Fuel Expense",
    "Salary",
    "Electic Bill",
    "Water Bill",
    "Internet / Telephone Bill",
    'Others please specify'
  ]

  useEffect(() => {
    fetchExpenses();
}, []);

  const fetchExpenses = async () => {
 
    const result = await client.graphql({
        query: listExpenses,
        variables: { filter: { storeId: { eq: staffData.store_id }, attendantId: {eq: staffData.id} } }
    });
    const expenseList = result.data.listExpenses.items;
    setExpenses(expenseList);
  

};
  
const saveExpense = async () => {
    // Construct the new customer object correctly
    const newExpense = {
        description,
        storeId: staffData.store_id,
        category: description,
        attendant: staffData.name,
        attendantId: staffData.id,
        amount: parseFloat(amount),    // Use the parameter directly
       // Use the parameter directly
    };
  
    console.log(newExpense); // Debugging: Check the new customer data structure
  
    // Validation checks
    if (!description || !amount) {
      console.log("Description and Amount are required!");
      return;
    }
  

    try {
      // Save Expense using a GraphQL mutation
      await client.graphql({
        query: createExpense, // Replace with the actual mutation for creating customers
        variables: { input: newExpense },
      });
  
      console.log("Expense saved successfully!");
      fetchExpenses(); // Reload Expense if implemented
    } catch (error) {
      console.error("Error saving Expense:", error);
      console.log("Failed to save Expense. Please try again.");
    }
  };


  const calculateTotal = () => {
    let total = 0;
    [].forEach(item => {
      total =+ item.amount
    });

    return total;
  }

  const renderItem = ({ item }) => (
    <Row style={{height: 40,shadowColor: "#EBECF0", marginVertical:1.5,marginHorizontal: 5,backgroundColor:'white'}}>    
      <Col  style={[styles.ColStyle,{alignItems: 'center'}]}>
            <Text  style={styles.textColor}>{item.description}</Text>
      </Col>   
      <Col  style={[styles.ColStyle,{alignItems: 'center'}]}>
            <Text  style={styles.textColor}>{formatMoney(item.amount, { symbol: "₱", precision: 2 })}</Text>
      </Col> 
      <Col  style={[styles.ColStyle,{alignItems: 'center'}]}>
            <Text  style={styles.textColor}>{item.attendant}</Text>
      </Col> 
    </Row>
)


  return (
    <View style={{flex: 1}}>
        <AppHeader 
          centerText="Expenses"
          leftComponent={
            <TouchableOpacity onPress={()=> navigation.goBack()}>
              <EvilIcons name={'arrow-left'} size={30} color={colors.white}/>
            </TouchableOpacity>
        }
        rightComponent={
          <ModalInputForm
                displayComponent={
                    <View style={{flexDirection:"row", justifyContent:"center", alignItems:"center"}}>
                        <EvilIcons style={{textAlign:'center'}}  name={'plus'} size={30} color={colors.white}/>
                        <Text style={{color: colors.white, textAlign:'center', marginLeft: 3}}> Expense</Text>
                    </View>
                }
                title="Add Expenses" 
                onSave={saveExpense}
                >
                
                <SelectDropdown
                    data={descriptions}
                    defaultButtonText={description}
                    onSelect={(selectedItem, index) => {
                      setDescription(selectedItem)
                    }}
                    buttonTextAfterSelection={(selectedItem, index) => {
                      // text represented after item is selected
                      // if data array is an array of objects then return selectedItem.property to render after item is selected
                      return selectedItem
                    }}
                    rowTextForSelection={(item, index) => {
                      // text represented for each item in dropdown
                      // if data array is an array of objects then return item.property to represent item in dropdown
                      return item
                    }}
                    buttonStyle={{
                        marginTop: 5,
                       width: '100%',
                        height: 56,
                        backgroundColor: "#FFF",
                        borderRadius: 5,
                        borderWidth: 1,
                        borderColor: "#444",}}
                        buttonTextStyle={{textAlign: 'left', color: 'grey', fontSize: 15}}
                  />
                {description === 'Others please specify' ? <TextInput
                    mode="outlined"
                    label="Please specify"
                    placeholder="Please specify"
                    onChangeText={(text)=> setOthers(text)}
                    />: null}
              <TextInput
                    mode="outlined"
                    label="Amount"
                    placeholder="Amount"
                    onChangeText={(text)=> setAmount(text)}
                    />
              </ModalInputForm>
      }
         />
         
      <DataTable
          headerTitles={['Description', 'Amount', 'Attendant']}
          total={calculateTotal()}
          alignment="center"
        >
          <FlatList
                keyExtractor={(key) => key.uid}
                data={expenses}
                renderItem={renderItem}
              />
        </DataTable>    
        {/* <Modal animationType={'slide'} visible={specificDate} transparent>
                   <View style={{ flex: 1 ,flexDirection: 'column', justifyContent: 'flex-end'}}>
                        <View style={{ height: "30%" ,width: '100%',  justifyContent:"center"}}>
                            <DatePicker
                                monthDisplayMode={'en-long'}
                                minDate={'2020-03-06'}
                                                    confirm={date => {
                                       setSpecificDate(moment(date,'YYYY-MM-DD').format('MMMM DD, YYYY')),
                                       setSpecificDatePicker(false)
                                       setFilter(moment(date,'YYYY-MM-DD').format('MMMM DD, YYYY'))
                                       setFilter(moment(date,'YYYY-MM-DD').format('MMMM DD, YYYY'))
                                    }}
                                    cancel={date => {
                                      setSpecificDatePicker(false)
                                    }}
                                titleText="Select Start Date"
                                cancelText="Cancel"
                                toolBarStyle={{backgroundColor: colors.accent}}
                                /> 
                    </View>
                    </View>
          </Modal> */}
    </View>
  );
};

ExpensesScreen.navigationOptions = () => {
  return {
    headerShown: false
  };
}

const styles = StyleSheet.create({
  text: {
    fontSize: 30
  },
  ColStyle: {
    width: 120,
    justifyContent: 'center',
    
}, textColor: {
  fontSize: 14,
  color: colors.black,
  textAlign:'center'
},

avatarStyle: {
  borderColor: colors.accent,
  borderStyle: 'solid',
  borderWidth: 1,
  borderRadius: 20,
  backgroundColor:colors.white
},
listStyle: {
  flexDirection:'row',
  justifyContent:'space-between', 
  backgroundColor: colors.white,
  borderColor: colors.accent,
  borderWidth: 1,
  shadowColor: "#EBECF0",
shadowOffset: {
  width: 0,
  height: 5,
 
},
shadowOpacity: 0.89,
shadowRadius: 2,
elevation: 5,
paddingVertical: 15, 
marginHorizontal: 10, 
marginVertical: 5,
paddingHorizontal: 10, 
borderRadius: 10},
filterStyle: {
  backgroundColor:colors.white, 
  paddingVertical: 9, 
  width: '45%',
  borderRadius: 5,
  shadowColor: "#EBECF0",
  shadowOffset: {
    width: 0,
    height: 5,
   
  },
  shadowOpacity: 0.89,
  shadowRadius: 2,
  elevation: 5,
  borderColor: colors.white,
  borderWidth:  1
},
storeList: {
  flex: 1,
  borderColor: colors.boldGrey,
  borderWidth: 1,
  paddingVertical: 8,
  marginVertical: 5,
  borderRadius: 5,
  backgroundColor: colors.white,
  shadowColor: "#EBECF0",
  shadowOffset: {
    width: 0,
    height: 2,
   
  },
  shadowOpacity: 0.89,
  shadowRadius: 2,
  elevation: 2,
},
dateFilter : {
  borderWidth: 1, 
  borderRadius: 5, 
  flexDirection:'row', 
  alignItems:'center', 
  flex: 1, 
  margin: 2, 
  justifyContent:'center', 
  borderColor: colors.accent,
backgroundColor: colors.accent}
});

export default ExpensesScreen;
