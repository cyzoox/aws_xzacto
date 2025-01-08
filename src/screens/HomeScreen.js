import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';


import Appbar from '../components/Appbar';
import {
  withAuthenticator,
  useAuthenticator
} from '@aws-amplify/ui-react-native';
export default function HomeScreen() {
  const userSelector = (context) => [context.user];

  const [productCount, setProductCount] = useState(0);
  const [salesTotal, setSalesTotal] = useState(0);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);
  
 const SignOutButton = () => {
  const { user, signOut } = useAuthenticator(userSelector);
  return (
    <Pressable onPress={signOut} style={styles.buttonContainer}>
      <Text style={styles.buttonText}>
        Hello, {user.username}! Click here to sign out!
      </Text>
    </Pressable>
  );
};


  // const fetchData = async () => {
  //   try {
  //     setLoading(true);

  //     // Fetch products and count
  //     const productData = await API.graphql(graphqlOperation(listProducts));
  //     setProductCount(productData.data.listProducts.items.length);

  //     // Fetch sales and calculate total
  //     const salesData = await API.graphql(graphqlOperation(listSales));
  //     const salesAmount = salesData.data.listSales.items.reduce(
  //       (total, sale) => total + sale.total,
  //       0
  //     );
  //     setSalesTotal(salesAmount);

  //     // Fetch expenses and calculate total
  //     const expensesData = await API.graphql(graphqlOperation(listExpenses));
  //     const expensesAmount = expensesData.data.listExpenses.items.reduce(
  //       (total, expense) => total + expense.amount,
  //       0
  //     );
  //     setExpensesTotal(expensesAmount);

  //     // Fetch suppliers and count
  //     const supplierData = await API.graphql(graphqlOperation(listSuppliers));
  //     setSupplierCount(supplierData.data.listSuppliers.items.length);

  //     setLoading(false);
  //   } catch (error) {
  //     console.log('Error fetching data', error);
  //     setLoading(false);
  //   }
  // };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar
        title="POS Dashboard"
        onMenuPress={() => console.log("Menu pressed")}
        onSearchPress={() => console.log("Search pressed")}
        onNotificationPress={() => console.log("Notifications pressed")}
        onProfilePress={() =>SignOutButton()}
      />
      <Text style={styles.header}>Dashboard</Text>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>Total Products</Text>
          <Text style={styles.summaryNumber}>{productCount}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>Total Sales</Text>
          <Text style={styles.summaryNumber}>${salesTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>Total Expenses</Text>
          <Text style={styles.summaryNumber}>${expensesTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>Total Suppliers</Text>
          <Text style={styles.summaryNumber}>{supplierCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
   
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  summaryBox: {
    width: '45%',
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: '#555',
  },
  summaryNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
});
