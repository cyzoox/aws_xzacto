import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Pressable
} from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatMoney } from 'accounting-js';
import { dataService } from '../services/dataService';
import Appbar from '../components/Appbar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SignOutButton from '../components/SignOutButton';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';

function HomeScreen({ navigation }) {
  const client = generateClient();
  
  // Redux state selectors
  const { items: stores = [], loading: storeLoading = false } = useSelector(state => state.store || { items: [], loading: false });
  const { items: products = [] } = useSelector(state => state.product || { items: [] });
  const { items: sales = [] } = useSelector(state => state.sales || { items: [] });
  const { items: expenses = [] } = useSelector(state => state.expenses || { items: [] });
  const { items: customers = [] } = useSelector(state => state.customers || { items: [] });
  
  // Local state variables
  const [loading, setLoading] = useState(true);
  const [currentStore, setCurrentStore] = useState(null);
  const [storeName, setStoreName] = useState('Your Store');
  const [productCount, setProductCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [salesTotal, setSalesTotal] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  
  // Fetch data when component mounts
  useEffect(() => {
    // Immediately fetch data for this component
    const loadData = async () => {
      // Force refresh data
      await dataService.invalidateAllCache(); // Clear cache timestamps to force fresh data
      
      // Direct query for ALL products first (same as ProductsScreen)
      try {
        console.log('Directly fetching ALL products without filtering first');
        // Match the simple query approach used in ProductsScreen
        const productsResult = await client.graphql({
          query: `query SimpleListProducts {
            listProducts {
              items {
                id
                name
                brand
                stock
                storeId
                sprice
                img
                isActive
              }
            }
          }`
        });
        
        if (productsResult?.data?.listProducts?.items) {
          // Get all products first
          const allProducts = productsResult.data.listProducts.items;
          console.log(`HomeScreen: Fetched ${allProducts.length} total products`);
          
          // Filter for current store and active products only
          const storeProducts = allProducts.filter(p => 
            p.storeId === storeToUse.id && 
            (p.isActive === undefined || p.isActive === true)
          );
          
          console.log(`HomeScreen: After filtering, found ${storeProducts.length} products for store ${storeToUse.id}`);
          const fetchedProducts = storeProducts;
          
          // Immediately set product count instead of waiting for Redux
          setProductCount(fetchedProducts.length);
          
          // Calculate product statistics
          if (fetchedProducts.length > 0) {
            // Set top products by value (price * stock)
            const sortedProducts = [...fetchedProducts]
              .filter(p => p.stock > 0 && p.sprice > 0)
              .sort((a, b) => (b.stock * b.sprice) - (a.stock * a.sprice))
              .slice(0, 5);
            setTopProducts(sortedProducts);
            
            // Calculate low stock count
            const lowStockThreshold = 5; // Default threshold
            const lowStockItems = fetchedProducts.filter(p => 
              p.stock > 0 && p.stock <= lowStockThreshold
            );
            setLowStockCount(lowStockItems.length);
          }
        }
      } catch (productsError) {
        console.error('Error directly fetching products:', productsError);
      }
      await dataService.fetchSales(true);
      
      // Then call our fetchData function to process the fetched data
      fetchData();
    };
    
    // Run data loading
    loadData();
    
    // Optional debug logs
    console.log('Redux state on mount:', {
      stores: stores.length,
      products: products.length,
      sales: sales.length,
      expenses: expenses.length,
      customers: customers.length
    });
  }, []);
  
  // Update data when Redux store changes
  useEffect(() => {
    if (currentStore && products.length > 0) {
      console.log(`Processing ${products.length} products from Redux for store ID: ${currentStore.id}`);
      
      // Filter products by current store
      const storeProducts = products.filter(p => p.storeId === currentStore.id && !p._deleted);
      console.log(`Found ${storeProducts.length} products for this store after filtering`);
      setProductCount(storeProducts.length);
      
      // Set top products by value (price * stock)
      const sortedProducts = [...storeProducts]
        .filter(p => p.stock > 0 && p.sprice > 0)
        .sort((a, b) => (b.stock * b.sprice) - (a.stock * a.sprice))
        .slice(0, 5);
      setTopProducts(sortedProducts);
      
      // Calculate low stock count (products with stock below threshold)
      const lowStockThreshold = 5; // Default threshold, could be configurable per store
      const lowStockItems = storeProducts.filter(p => p.stock > 0 && p.stock <= lowStockThreshold);
      setLowStockCount(lowStockItems.length);
    }
  }, [products, currentStore]);
  
  // Update sales data when Redux store changes
  useEffect(() => {
    if (currentStore && sales.length > 0) {
      // Filter transactions by current store
      const storeTransactions = sales.filter(t => t.storeId === currentStore.id && !t._deleted);
      
      // Calculate total sales
      const total = storeTransactions.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
      setSalesTotal(total);
      
      // Calculate today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySalesTotal = storeTransactions
        .filter(t => new Date(t.createdAt) >= today)
        .reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
      setTodaySales(todaySalesTotal);
      
      // Set recent transactions (last 5)
      const sortedTransactions = [...storeTransactions]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentTransactions(sortedTransactions);
      
      // Calculate net profit if expenses are loaded
      if (expenses.length > 0) {
        setNetProfit(total - expensesTotal);
      }
    }
  }, [sales, currentStore, expensesTotal]);
  
  // Update expenses when Redux store changes
  useEffect(() => {
    if (currentStore && expenses.length > 0) {
      // Filter expenses by current store
      const storeExpenses = expenses.filter(e => e.storeId === currentStore.id && !e._deleted);
      const expTotal = storeExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      setExpensesTotal(expTotal);
    }
  }, [expenses, currentStore]);
  
  // Update customer count when Redux store changes
  useEffect(() => {
    if (currentStore && customers.length > 0) {
      // Filter customers by current store
      const storeCustomers = customers.filter(c => c.storeId === currentStore.id && !c._deleted);
      setCustomerCount(storeCustomers.length);
    }
  }, [customers, currentStore]);
  
  // Fetch necessary data
  const fetchData = async () => {
    setLoading(true);
    try {
      // First check if we have staff data in AsyncStorage
      let staffData = null;
      let ownerId = null;
      try {
        const staffJson = await AsyncStorage.getItem('staffData');
        if (staffJson) {
          staffData = JSON.parse(staffJson);
          ownerId = staffData.ownerId;
          console.log('Staff data found:', staffData.name, 'Owner ID:', ownerId);
        } else {
          console.warn('No staff data available in AsyncStorage, continuing anyway');
          setLoading(false);
          return; // Exit early if no staff data is available
        }
      } catch (staffError) {
        console.warn('Error reading staff data, continuing anyway:', staffError);
        setLoading(false);
        return; // Exit early if staff data cannot be read
      }
      
      // If ownerId is not available, we cannot filter properly
      if (!ownerId) {
        console.error('Owner ID is missing in staff data, cannot properly filter data');
        setLoading(false);
        return;
      }
      
      // Debug: Show current Redux state
      console.log('Current Redux state before fetching:', {
        storesCount: stores.length,
        productsCount: products.length,
        salesCount: sales.length,
      });

      // Get the store data from Redux or fetch directly if needed
      let storeToUse = null;
      
      // Try to get stores from Redux first
      if (stores && stores.length > 0) {
        // Filter stores by ownerId
        const userStores = stores.filter(store => store.ownerId === ownerId);
        
        if (userStores.length > 0) {
          console.log('Using stores from Redux filtered by ownerId:', userStores[0].name);
          storeToUse = userStores[0];
        } else {
          console.log('No stores found in Redux with matching ownerId');
        }
      }
      
      // If no store was found in Redux, query directly with filter
      if (!storeToUse) {
        console.log(`Fetching stores directly for ownerId: ${ownerId}...`);
        try {
          const response = await client.graphql({
            query: queries.listStores,
            variables: {
              filter: {
                ownerId: { eq: ownerId }
              }
            }
          });
          
          const fetchedStores = response?.data?.listStores?.items || [];
          if (fetchedStores.length > 0) {
            storeToUse = fetchedStores[0];
            console.log('Store fetched directly with ownerId filter:', storeToUse.name);
          } else {
            console.error(`No stores found for ownerId: ${ownerId}`);
            // Create placeholder store to avoid UI errors
            storeToUse = { id: 'unknown', name: 'Default Store', ownerId };
          }
        } catch (storeError) {
          console.error('Error fetching stores directly:', storeError);
          // Create placeholder store to avoid UI errors
          storeToUse = { id: 'unknown', name: 'Error Store', ownerId };
        }
      }
      
      setStoreName(storeToUse.name || 'Your Store');
      setCurrentStore(storeToUse);

      // Directly fetch products if needed
      if (products.length === 0 && storeToUse.id !== 'unknown') {
        console.log('Fetching products directly for store:', storeToUse.id, 'and ownerId:', ownerId);
        try {
          const response = await client.graphql({
            query: queries.listProducts,
            variables: { 
              filter: { 
                and: [
                  { storeId: { eq: storeToUse.id } },
                  { ownerId: { eq: ownerId } }
                ]
              } 
            }
          });
          
          // Manually process products
          const fetchedProducts = response?.data?.listProducts?.items || [];
          console.log(`Fetched ${fetchedProducts.length} products directly`);
          
          // Calculate product stats for UI
          if (fetchedProducts.length > 0) {
            setProductCount(fetchedProducts.length);
            
            // Set top products by value
            const sortedProducts = [...fetchedProducts]
              .filter(p => p.stock > 0 && p.sprice > 0)
              .sort((a, b) => (b.stock * b.sprice) - (a.stock * a.sprice))
              .slice(0, 5);
            setTopProducts(sortedProducts);
            
            // Calculate low stock count
            const lowStockThreshold = 5; 
            const lowStockItems = fetchedProducts.filter(p => 
              p.stock > 0 && p.stock <= lowStockThreshold
            );
            setLowStockCount(lowStockItems.length);
          }
        } catch (productsError) {
          console.error('Error fetching products directly:', productsError);
        }
      }
      
      // Directly fetch sales if needed
      if (sales.length === 0 && storeToUse.id !== 'unknown') {
        console.log('Fetching sales directly for ownerId:', ownerId);
        try {
          // Query sales transactions with proper filtering
          const response = await client.graphql({
            query: queries.listSaleTransactions,
            variables: { 
              filter: { 
                and: [
                  { storeId: { eq: storeToUse.id } },
                  { ownerId: { eq: ownerId } }
                ]
              }
            }
          });
          
          // Process sales - already filtered by GraphQL query
          let fetchedSales = response?.data?.listSaleTransactions?.items || []; 
          
          console.log(`Fetched ${fetchedSales.length} sales for store ${storeToUse.name}`);
          
          if (fetchedSales.length > 0) {
            // Calculate total sales
            const total = fetchedSales.reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
            setSalesTotal(total);
            
            // Calculate today's sales
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todaySalesTotal = fetchedSales
              .filter(t => new Date(t.createdAt) >= today)
              .reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
            setTodaySales(todaySalesTotal);
            
            // Set recent transactions (last 5)
            const recentTxns = [...fetchedSales]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5);
            setRecentTransactions(recentTxns);
          }
        } catch (salesError) {
          console.error('Error fetching sales:', salesError);
        }
      }
      
      // Fetch customers filtered by ownerId
      if (customers.length === 0 && storeToUse.id !== 'unknown') {
        console.log('Fetching customers for ownerId:', ownerId);
        try {
          const response = await client.graphql({
            query: queries.listCustomers,
            variables: { 
              filter: { 
                and: [
                  { storeId: { eq: storeToUse.id } },
                  { ownerId: { eq: ownerId } }
                ]
              } 
            }
          });
          
          // Extract data with proper null checks
          const fetchedCustomers = response?.data?.listCustomers?.items || [];
          console.log(`Fetched ${fetchedCustomers.length} customers for owner ${ownerId}`);
          setCustomerCount(fetchedCustomers.length);
        } catch (customerError) {
          console.error('Error fetching customers:', customerError);
          setCustomerCount(0);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Log more information about the error to help with debugging
      if (error.message) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      // Ensure the UI is still usable by setting defaults
      if (!currentStore) setCurrentStore({id: 'unknown', name: 'Store'});
      if (!productCount) setProductCount(0);
      if (!customerCount) setCustomerCount(0);
      if (!expensesTotal) setExpensesTotal(0);
      if (!salesTotal) setSalesTotal(0);
      if (!topProducts.length) setTopProducts([]);
      if (!recentTransactions.length) setRecentTransactions([]);
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

  // Calculate profit margin percentage
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
            onProfilePress={() => navigation.navigate('Profile')}
            rightComponent={<SignOutButton 
              iconProps={{ color: '#fff', size: 22 }}
              textStyle={{ display: 'none' }}
              style={{ padding: 0, marginRight: 8 }}
            />}
          />
        </View>
        
        {/* Quick Actions Bar */}
     
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
          {recentTransactions.map((transaction) => (
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

export default HomeScreen;
