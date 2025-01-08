import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, TextInput } from 'react-native';
import { API, graphqlOperation } from 'aws-amplify';
import { listExpenses } from '../graphql/queries'; // Assume we have a query for listing expenses
import { createExpense } from '../graphql/mutations'; // Mutation to create a new expense

const ExpensesScreen = () => {
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const expenseData = await API.graphql(graphqlOperation(listExpenses));
      setExpenses(expenseData.data.listExpenses.items);
    } catch (error) {
      console.error('Error fetching expenses', error);
    }
  };

  const handleAddExpense = async () => {
    try {
      const input = {
        description,
        amount: parseFloat(amount),
        category,
      };
      await API.graphql(graphqlOperation(createExpense, { input }));
      fetchExpenses(); // Refresh the list after adding an expense
      setDescription('');
      setAmount('');
      setCategory('');
    } catch (error) {
      console.error('Error adding expense', error);
    }
  };

  return (
    <View>
      <Text>Expenses</Text>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.description}</Text>
            <Text>{item.category}</Text>
            <Text>{item.amount}</Text>
          </View>
        )}
      />
      <TextInput placeholder="Description" value={description} onChangeText={setDescription} />
      <TextInput placeholder="Category" value={category} onChangeText={setCategory} />
      <TextInput placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <Button title="Add Expense" onPress={handleAddExpense} />
    </View>
  );
};

export default ExpensesScreen;
