import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Appbar from '../components/Appbar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  withAuthenticator,
  useAuthenticator
} from '@aws-amplify/ui-react-native';
export default function HomeScreen({ navigation }) {
  const userSelector = (context) => [context.user];

  const [productCount, setProductCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [salesTotal, setSalesTotal] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [supplierCount, setSupplierCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('Your Store');
  const [topProducts, setTopProducts] = useState([]);
  const [latestTransactions, setLatestTransactions] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);

  const client = generateClient();

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get staff data from session storage
      const staffJson = await AsyncStorage.getItem('staffData');
      if (!staffJson) {
        console.error('No staff data found');
        setLoading(false);
        return;
      }
      
      const staffData = JSON.parse(staffJson);
      
      // Get the store data - for simplicity, fetch the first available store
      let storeId = null;
      let storeToUse = null;
      
      // Fetch stores for this staff
      const storeResponse = await client.graphql({
        query: queries.listStores,
        variables: {}
      });
      
      // Use the first store as the current store
      const firstStore = storeResponse.data.listStores.items[0];
      if (!firstStore) {
        console.error('No stores found for this staff');
        setLoading(false);
        return;
      }
      
      storeId = firstStore.id;
      storeToUse = firstStore;
      setStoreName(firstStore.name || 'Your Store');
      
      // Store the store data for navigation
      setCurrentStore(storeToUse);

      // Fetch products for this store
      const { data: productData } = await client.graphql({
        query: queries.listProducts,
        variables: { 
          filter: { 
            storeId: { eq: storeId } 
          } 
        }
      });
      const products = productData.listProducts.items;
      setProductCount(products.length);
      
      // Check for low stock items (less than 10 units)
      const lowStockItems = products.filter(product => product.stock < 10);
      setLowStockCount(lowStockItems.length);
      
      // Find top 5 products by stock value
      const topProductsByValue = [...products]
        .sort((a, b) => (b.stock * b.sprice) - (a.stock * a.sprice))
        .slice(0, 5);
      setTopProducts(topProductsByValue);

      // Get today's date at midnight for filtering today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Fetch all sales transactions
      const { data: salesData } = await client.graphql({
        query: queries.listSaleTransactions,
        variables: { 
          filter: { 
            storeID: { eq: storeId } 
          } 
        }
      });
      const allTransactions = salesData.listSaleTransactions.items;
      
      // Calculate total sales
      const salesAmount = allTransactions.reduce(
        (total, sale) => total + sale.total,
        0
      );
      setSalesTotal(salesAmount);
      setTransactionCount(allTransactions.length);
      
      // Calculate today's sales
      const todayTransactions = allTransactions.filter(transaction => {
        const transDate = new Date(transaction.createdAt);
        return transDate >= today;
      });
      
      const todaySalesAmount = todayTransactions.reduce(
        (total, sale) => total + sale.total,
        0
      );
      setTodaySales(todaySalesAmount);
      
      // Get 5 most recent transactions
      const recentTransactions = [...allTransactions]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setLatestTransactions(recentTransactions);

      // Fetch expenses for this store
      const { data: expensesData } = await client.graphql({
        query: queries.listExpenses,
        variables: { 
          filter: { 
            storeId: { eq: storeId } 
          } 
        }
      });
      const expensesAmount = expensesData.listExpenses.items.reduce(
        (total, expense) => total + expense.amount,
        0
      );
      setExpensesTotal(expensesAmount);

      // Fetch suppliers for this store
      const { data: supplierData } = await client.graphql({
        query: queries.listSuppliers,
        variables: { 
          filter: { 
            storeId: { eq: storeId } 
          } 
        }
      });
      setSupplierCount(supplierData.listSuppliers.items.length);
      
      // Fetch customers for this store
      const { data: customerData } = await client.graphql({
        query: queries.listCustomers,
        variables: { 
          filter: { 
            storeId: { eq: storeId } 
          } 
        }
      });
      setCustomerCount(customerData.listCustomers.items.length);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Just call fetchData, which now handles getting the store name
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

  // Calculate business metrics
  const netProfit = salesTotal - expensesTotal;
  const profitMargin = salesTotal > 0 ? (netProfit / salesTotal) * 100 : 0;
  
  return (
    <View style={styles.container}>
      {/* Enhanced AppBar */}
      <View style={styles.enhancedAppbar}>
        <View style={styles.appbarTop}>
          <Appbar
            title={`${storeName}`}
            onMenuPress={() => console.log("Menu pressed")}
            onSearchPress={() => console.log("Search pressed")}
            onNotificationPress={() => console.log("Notifications pressed")}
            onProfilePress={() => SignOutButton()}
          />
        </View>
        
        {/* Key Metrics Bar */}
        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Total Sales</Text>
            <Text style={styles.infoValue}>PHP {formatMoney(salesTotal, { symbol: '', precision: 2 })}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Net Profit</Text>
            <Text style={styles.infoValue}>PHP {formatMoney(netProfit, { symbol: '', precision: 2 })}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Margin</Text>
            <Text style={styles.infoValue}>{profitMargin.toFixed(1)}%</Text>
          </View>
        </View>
        
        {/* Quick Actions Bar */}
        <View style={styles.shortcutsBar}>
          <TouchableOpacity 
            style={styles.shortcutButton}
            onPress={() => navigation.navigate('Inventory')}
          >
            <Ionicons name="cube-outline" size={22} color="#fff" />
            <Text style={styles.shortcutText}>Inventory</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.shortcutButton}
            onPress={() => navigation.navigate('BillsAndReceipt')}
          >
            <Ionicons name="receipt-outline" size={22} color="#fff" />
            <Text style={styles.shortcutText}>Bills & Receipts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.shortcutButton}
            onPress={() => navigation.navigate('SummaryReport')}
          >
            <Ionicons name="stats-chart-outline" size={22} color="#fff" />
            <Text style={styles.shortcutText}>Reports</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.header}>Business Performance</Text>
        
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Ionicons name="cube-outline" size={28} color="#3A6EA5" />
            <Text style={styles.summaryText}>Products</Text>
            <Text style={styles.summaryNumber}>{productCount}</Text>
            {lowStockCount > 0 && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningText}>{lowStockCount} low stock</Text>
              </View>
            )}
          </View>
          
          <View style={styles.summaryBox}>
            <Ionicons name="cash-outline" size={28} color="#28a745" />
            <Text style={styles.summaryText}>Today's Sales</Text>
            <Text style={styles.summaryNumber}>PHP {formatMoney(todaySales, { symbol: '', precision: 2 })}</Text>
          </View>
          
          <View style={styles.summaryBox}>
            <Ionicons name="wallet-outline" size={28} color="#dc3545" />
            <Text style={styles.summaryText}>Total Expenses</Text>
            <Text style={styles.summaryNumber}>PHP {formatMoney(expensesTotal, { symbol: '', precision: 2 })}</Text>
          </View>
          
          <View style={styles.summaryBox}>
            <Ionicons name="people-outline" size={28} color="#6c757d" />
            <Text style={styles.summaryText}>Customers</Text>
            <Text style={styles.summaryNumber}>{customerCount}</Text>
          </View>
        </View>
        
        {/* Top Inventory Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Top Inventory Value</Text>
          {topProducts.map((product, index) => (
            <View key={product.id} style={styles.listItem}>
              <Text style={styles.listRank}>{index + 1}</Text>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{product.name}</Text>
                <Text style={styles.listSubtitle}>{product.stock} units · PHP {formatMoney(product.sprice, { symbol: '', precision: 2 })} each</Text>
              </View>
              <Text style={styles.listValue}>PHP {formatMoney(product.stock * product.sprice, { symbol: '', precision: 2 })}</Text>
            </View>
          ))}
        </View>
        
        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {latestTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.listItem}>
              <Ionicons name="receipt-outline" size={24} color="#3A6EA5" style={styles.listIcon} />
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>Sale #{transaction.id.slice(-4)}</Text>
                <Text style={styles.listSubtitle}>
                  {new Date(transaction.createdAt).toLocaleString()} · {transaction.staffName || 'Staff'}
                </Text>
              </View>
              <Text style={styles.listValue}>PHP {formatMoney(transaction.total, { symbol: '', precision: 2 })}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.quickLinks}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.linksContainer}>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => {
                if (currentStore) {
                  navigation.navigate('ProductDashboard', { store: currentStore });
                } else {
                  Alert.alert('Error', 'Store data not available. Please try again.');
                }
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#3A6EA5" />
              <Text style={styles.linkText}>New Sale</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => {
                if (currentStore) {
                  navigation.navigate('Customers', { store: currentStore });
                } else {
                  Alert.alert('Error', 'Store data not available. Please try again.');
                }
              }}
            >
              <Ionicons name="people-outline" size={24} color="#3A6EA5" />
              <Text style={styles.linkText}>Customers</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => {
                if (currentStore) {
                  navigation.navigate('ProductDashboard', { store: currentStore });
                } else {
                  Alert.alert('Error', 'Store data not available. Please try again.');
                }
              }}
            >
              <Ionicons name="list-outline" size={24} color="#3A6EA5" />
              <Text style={styles.linkText}>Inventory</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => {
                if (currentStore) {
                  navigation.navigate('BillsAndReceipt', { store: currentStore });
                } else {
                  Alert.alert('Error', 'Store data not available. Please try again.');
                }
              }}
            >
              <Ionicons name="receipt-outline" size={24} color="#3A6EA5" />
              <Text style={styles.linkText}>Bills & Receipts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  enhancedAppbar: {
    backgroundColor: '#3A6EA5',
    paddingBottom: 10,
  },
  appbarTop: {
    flexDirection: 'row',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    color: '#E0E0E0',
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shortcutsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 5,
  },
  shortcutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  shortcutText: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    color: '#333',
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryBox: {
    width: '48%',
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  summaryText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#343a40',
    marginTop: 5,
  },
  warningBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 5,
  },
  warningText: {
    fontSize: 10,
    color: '#212529',
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listRank: {
    width: 25,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3A6EA5',
  },
  listIcon: {
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  listSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  listValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#28a745',
  },
  quickLinks: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#495057',
  },
  linksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  linkText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
});
