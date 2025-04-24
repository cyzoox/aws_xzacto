import React, { useCallback, useEffect } from "react";
import { Text, StyleSheet, View, TouchableOpacity, FlatList, ScrollView, Modal, Alert } from "react-native";

import EvilIcons from 'react-native-vector-icons/EvilIcons'
import Feather from 'react-native-vector-icons/Feather'
import { Row, Col, Grid } from 'react-native-easy-grid';
import { useState } from "react";
import { TextInput } from 'react-native-paper';
import moment from 'moment';

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
  const [staffFilter, setStaffFilter] = useState('All Staff');
  const [staffList, setStaffList] = useState(['All Staff', staffData.name]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const descriptions = [
    "Rental Expense",
    "Fuel Expense",
    "Salary",
    "Electric Bill",
    "Water Bill",
    "Internet / Telephone Bill",
    'Others please specify'
  ]

  useEffect(() => {
    fetchExpenses();
  }, [filter, staffFilter]);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      // Get current date in ISO format for filtering
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfDayISO = startOfDay.toISOString();
      
      // Get start of week and month for filtering
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      let filterParams = { storeId: { eq: staffData.store_id } };
      
      // Apply date filter
      if (filter === 'Today') {
        filterParams.date = { ge: startOfDayISO };
      } else if (filter === 'This Week') {
        filterParams.date = { ge: startOfWeek.toISOString() };
      } else if (filter === 'This Month') {
        filterParams.date = { ge: startOfMonth.toISOString() };
      }
      
      // Apply staff filter if not 'All Staff'
      if (staffFilter !== 'All Staff') {
        filterParams.staffName = { eq: staffFilter };
      }

      const result = await client.graphql({
        query: listExpenses,
        variables: { filter: filterParams }
      });
      
      const expenseList = result.data.listExpenses.items;
      
      // Sort expenses by date (newest first)
      expenseList.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setExpenses(expenseList);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      Alert.alert("Error", "Failed to load expenses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveExpense = async () => {
    // Validation checks
    if (!description || description === 'Description') {
      Alert.alert("Error", "Please select a description");
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }
    
    // Handle "Others" case
    const finalDescription = description === 'Others please specify' 
      ? (other || 'Other Expense') 
      : description;
    
    // Construct the new expense object with only valid fields from the schema
    const newExpense = {
      name: finalDescription,
      storeId: staffData.store_id,
      staffId: staffData.id,
      staffName: staffData.name,
      category: description,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      notes: description === 'Others please specify' ? other : ''
    };
  
    try {
      setIsLoading(true);
      
      // Save Expense using a GraphQL mutation
      const result = await client.graphql({
        query: createExpense,
        variables: { input: newExpense },
      });
  
      // Reset form fields
      setDescription('Description');
      setAmount('');
      setOthers('');
      
      // Refresh expenses list
      await fetchExpenses();
      Alert.alert("Success", "Expense saved successfully!");
    } catch (error) {
      console.error("Error saving expense:", error);
      Alert.alert("Error", `Failed to save expense: ${error.message || 'Please try again'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    let total = 0;
    expenses.forEach(item => {
      total += parseFloat(item.amount || 0);
    });

    return total;
  }

  const renderItem = ({ item }) => (
    <Row style={styles.row}>    
      <Col style={[styles.ColStyle, {alignItems: 'flex-start', paddingLeft: 5}]}>
        <Text style={styles.textColor}>{item.name}</Text>
        <Text style={styles.dateText}>{moment(item.date).format('MMM DD, YYYY')}</Text>
      </Col>   
      <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
        <Text style={styles.textColor}>{formatMoney(item.amount, { symbol: "₱", precision: 2 })}</Text>
      </Col> 
      <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
        <Text style={styles.textColor}>{item.staffName || 'Unknown'}</Text>
      </Col> 
    </Row>
  );

  const filterOptions = ['Today', 'This Week', 'This Month', 'All'];
  const handleStaffFilterChange = (selectedStaff) => {
    setStaffFilter(selectedStaff);
  };

  return (
    <View style={styles.container}>
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
              <View style={styles.addButtonContainer}>
                <EvilIcons name={'plus'} size={30} color={colors.white}/>
                <Text style={styles.addButtonText}>Expense</Text>
              </View>
            }
            title="Add Expenses" 
            onSave={saveExpense}
          >
            <SelectDropdown
              data={descriptions}
              defaultButtonText={description}
              onSelect={(selectedItem) => {
                setDescription(selectedItem)
              }}
              buttonTextAfterSelection={(selectedItem) => selectedItem}
              rowTextForSelection={(item) => item}
              buttonStyle={styles.dropdown}
              buttonTextStyle={styles.dropdownText}
            />
            
            {description === 'Others please specify' && (
              <TextInput
                mode="outlined"
                label="Please specify"
                placeholder="Please specify"
                value={other}
                onChangeText={(text) => setOthers(text)}
                style={styles.textInput}
              />
            )}
            
            <TextInput
              mode="outlined"
              label="Amount"
              placeholder="Amount"
              value={amount}
              keyboardType="numeric"
              onChangeText={(text) => setAmount(text)}
              style={styles.textInput}
            />
          </ModalInputForm>
        }
      />
      
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Date:</Text>
        <SelectDropdown
          data={filterOptions}
          defaultValue={filter}
          onSelect={(selectedItem) => setFilter(selectedItem)}
          buttonStyle={styles.filterDropdown}
          buttonTextStyle={styles.filterDropdownText}
          dropdownStyle={styles.filterDropdownMenu}
        />
        <Text style={[styles.filterLabel, {marginLeft: 15}]}>Staff:</Text>
        <SelectDropdown
          data={staffList}
          defaultValue={staffFilter}
          onSelect={handleStaffFilterChange}
          buttonStyle={styles.filterDropdown}
          buttonTextStyle={styles.filterDropdownText}
          dropdownStyle={styles.filterDropdownMenu}
        />
      </View>
      
      <DataTable
        headerTitles={['Description', 'Amount', 'Staff']}
        total={calculateTotal()}
        alignment="center"
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading expenses...</Text>
          </View>
        ) : expenses.length > 0 ? (
          <FlatList
            keyExtractor={(item) => item.id}
            data={expenses}
            renderItem={renderItem}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No expenses found</Text>
          </View>
        )}
      </DataTable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addButtonContainer: {
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center"
  },
  addButtonText: {
    color: colors.white, 
    textAlign: 'center', 
    marginLeft: 3
  },
  row: {
    height: 50, 
    shadowColor: "#EBECF0", 
    marginVertical: 1.5, 
    marginHorizontal: 5, 
    backgroundColor: 'white'
  },
  ColStyle: {
    justifyContent: 'center',
  },
  textColor: {
    color: colors.black,
    fontSize: 14,
  },
  dateText: {
    color: colors.charcoalGrey,
    fontSize: 12,
    marginTop: 2,
  },
  dropdown: {
    marginTop: 5,
    width: '100%',
    height: 56,
    backgroundColor: "#FFF",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#444",
  },
  dropdownText: {
    textAlign: 'left', 
    color: 'grey', 
    fontSize: 15
  },
  textInput: {
    marginTop: 10,
    backgroundColor: colors.white,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  filterLabel: {
    fontSize: 14,
    marginRight: 10,
    color: colors.charcoalGrey,
  },
  filterDropdown: {
    width: 120,
    height: 35,
    backgroundColor: colors.lightGrey,
    borderRadius: 5,
  },
  filterDropdownText: {
    fontSize: 14,
    color: colors.charcoalGrey,
  },
  filterDropdownMenu: {
    borderRadius: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.charcoalGrey,
  }
});

export default ExpensesScreen;
