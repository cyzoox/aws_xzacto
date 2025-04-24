import React, { useState, useEffect } from "react";
import { Text, StyleSheet, SafeAreaView, ScrollView, View, ActivityIndicator, Dimensions, TouchableOpacity } from "react-native";
import Appbar from "../../components/Appbar";
import CardTiles from "../../components/CardTiles";
import { useStore } from '../../context/StoreContext';
import colors from '../../themes/colors';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { generateClient } from 'aws-amplify/api';
import { listSaleTransactions, listStaff, listStaffStores } from '../../graphql/queries';
import Ionicons from 'react-native-vector-icons/Ionicons';
import formatMoney from 'accounting-js/lib/formatMoney.js';

const client = generateClient();

const StoreDashboard = ({navigation, route}) => {
  const { store } = route.params;
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'day', 'week', 'month'
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    orderCount: 0,
    averageOrder: 0
  });
  const [topCashiers, setTopCashiers] = useState([]);
  
  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get date range based on selected period
      const { startDate, endDate } = getDateRange(selectedPeriod);
      
      // Fetch sales data
      const salesResult = await client.graphql({
        query: listSaleTransactions,
        variables: {
          filter: {
            storeID: { eq: store.id },
            createdAt: { between: [startDate.toISOString(), endDate.toISOString()] }
          }
        }
      });
      
      // Fetch staff associated with this store
      const staffStoreResult = await client.graphql({
        query: listStaffStores,
        variables: {
          filter: {
            storeId: { eq: store.id }
          }
        }
      });
      
      const staffIds = staffStoreResult.data.listStaffStores.items.map(item => item.staffId);
      
      // Get all staff directly - without filtering by role
      const staffResult = await client.graphql({
        query: listStaff,
        variables: {}
      });
      
      const allStaff = staffResult.data.listStaff.items;
      setStaffData(allStaff);
      
      const salesItems = salesResult.data.listSaleTransactions.items;
      setSalesData(salesItems);
      
      // Calculate sales statistics
      const totalSales = salesItems.reduce((sum, item) => sum + (item.total || 0), 0);
      const orderCount = salesItems.length;
      const averageOrder = orderCount > 0 ? totalSales / orderCount : 0;
      
      setSalesStats({
        totalSales,
        orderCount,
        averageOrder
      });
      
      // Generate real cashier performance data from transactions
      generateCashierPerformanceData(allStaff, salesItems);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getDateRange = (period) => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    return { startDate, endDate };
  };
  
  const generateCashierPerformanceData = (cashiers, transactions) => {
    // Track unique staff IDs from transactions, even if they don't exist in our staff records
    const staffIdsFromTransactions = new Set();
    transactions.forEach(transaction => {
      if (transaction.staffID) {
        staffIdsFromTransactions.add(transaction.staffID);
      }
    });
    
    // Create a map for quick lookup of staff names
    const staffNameMap = {};
    cashiers.forEach(cashier => {
      staffNameMap[cashier.id] = cashier.name;
    });
    
    // Create a map to track sales by cashier
    const cashierSalesMap = {};
    
    // Process transactions and gather performance data
    transactions.forEach(transaction => {
      const { staffID, staffName, total } = transaction;
      
      if (!staffID) return;
      
      // Create entry for this staff if it doesn't exist
      if (!cashierSalesMap[staffID]) {
        cashierSalesMap[staffID] = {
          id: staffID,
          // Use staffName from transaction if available, fall back to staff record, or use 'Unknown' as last resort
          name: staffName || staffNameMap[staffID] || 'Unknown',
          salesCount: 0,
          totalSales: 0
        };
      }
      
      cashierSalesMap[staffID].salesCount += 1;
      cashierSalesMap[staffID].totalSales += total || 0;
    });
    
    // Convert to array and sort by total sales
    const cashierPerformance = Object.values(cashierSalesMap);
    const sorted = [...cashierPerformance].sort((a, b) => b.totalSales - a.totalSales);
    
    // Set top 5 performing cashiers
    setTopCashiers(sorted.slice(0, 5));
  };
  
  // Generate chart data from sales transactions
  const getSalesChartData = () => {
    const labels = [];
    const data = [];
    
    // Create buckets for time periods based on selectedPeriod
    const { startDate, endDate } = getDateRange(selectedPeriod);
    
    if (selectedPeriod === 'day') {
      // Hourly data for today
      for (let hour = 0; hour <= 23; hour += 4) {
        labels.push(`${hour}:00`);
      }
      
      // Initialize data points with zeros
      const hourlyData = Array(6).fill(0); // 6 data points for 4-hour intervals
      
      // Group sales by hour
      salesData.forEach(sale => {
        const saleDate = new Date(sale.createdAt);
        const hourBucket = Math.floor(saleDate.getHours() / 4);
        hourlyData[hourBucket] += sale.total || 0;
      });
      
      data.push(...hourlyData);
    } else if (selectedPeriod === 'week') {
      // Daily data for week
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyData = Array(7).fill(0);
      
      salesData.forEach(sale => {
        const saleDate = new Date(sale.createdAt);
        const dayIndex = saleDate.getDay();
        dailyData[dayIndex] += sale.total || 0;
      });
      
      labels.push(...days);
      data.push(...dailyData);
    } else if (selectedPeriod === 'month') {
      // Weekly data for month
      const weeklyData = Array(4).fill(0); // 4 weeks
      labels.push('Week 1', 'Week 2', 'Week 3', 'Week 4');
      
      salesData.forEach(sale => {
        const saleDate = new Date(sale.createdAt);
        const dayOfMonth = saleDate.getDate();
        const weekOfMonth = Math.min(Math.floor(dayOfMonth / 7), 3); // 0-3
        weeklyData[weekOfMonth] += sale.total || 0;
      });
      
      data.push(...weeklyData);
    }
    
    return {
      labels,
      datasets: [
        {
          data: data.length > 0 ? data : [0],
          color: (opacity = 1) => `rgba(40, 167, 69, ${opacity})`, // green
          strokeWidth: 2
        }
      ],
      legend: ['Sales']
    };
  };

  return (
    <SafeAreaView style={styles.container}>
    <View style={styles.enhancedAppbar}>
      <View style={styles.appbarTop}>
        <Appbar
          title={`${store.name} Dashboard`}
          onBack={() => navigation.goBack()}
        />
      </View>
      
      {/* New Info Bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Daily Sales</Text>
          <Text style={styles.infoValue}>${formatMoney(salesStats.totalSales, { symbol: '', precision: 2 })}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Orders</Text>
          <Text style={styles.infoValue}>{salesStats.orderCount}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Avg. Order</Text>
          <Text style={styles.infoValue}>${formatMoney(salesStats.averageOrder, { symbol: '', precision: 2 })}</Text>
        </View>
      </View>
      
      {/* Shortcuts Bar */}
      <View style={styles.shortcutsBar}>
        <TouchableOpacity 
          style={styles.shortcutButton}
          onPress={() => navigation.navigate('NewOrder', { store })}
        >
          <Ionicons name="cart-outline" size={22} color="#fff" />
          <Text style={styles.shortcutText}>New Sale</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.shortcutButton}
          onPress={() => navigation.navigate('BillsAndReceipt', { store })}
        >
          <Ionicons name="receipt-outline" size={22} color="#fff" />
          <Text style={styles.shortcutText}>Bills & Receipts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.shortcutButton}
          onPress={() => navigation.navigate('SummaryReport', { store })}
        >
          <Ionicons name="stats-chart-outline" size={22} color="#fff" />
          <Text style={styles.shortcutText}>Reports</Text>
        </TouchableOpacity>
      </View>
    </View>
    <ScrollView>
      {/* Time Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity 
          style={[styles.periodButton, selectedPeriod === 'day' ? styles.activePeriod : null]}
          onPress={() => setSelectedPeriod('day')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'day' ? styles.activePeriodText : null]}>Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.periodButton, selectedPeriod === 'week' ? styles.activePeriod : null]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'week' ? styles.activePeriodText : null]}>Week</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.periodButton, selectedPeriod === 'month' ? styles.activePeriod : null]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[styles.periodText, selectedPeriod === 'month' ? styles.activePeriodText : null]}>Month</Text>
        </TouchableOpacity>
      </View>
      
      {/* Sales Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>₱{salesStats.totalSales.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Sales</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{salesStats.orderCount}</Text>
          <Text style={styles.summaryLabel}>Orders</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>₱{salesStats.averageOrder.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Avg. Order</Text>
        </View>
      </View>
      
      {/* Sales Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Sales Performance</Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : salesData.length > 0 ? (
          <LineChart
            data={getSalesChartData()}
            width={Dimensions.get('window').width - 30}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: colors.primary
              }
            }}
            bezier
            style={styles.chart}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>No sales data available</Text>
          </View>
        )}
      </View>
      
      {/* Cashier Performance */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Cashier Performance</Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : topCashiers.length > 0 ? (
          <View>
            {topCashiers.map((cashier, index) => (
              <View key={cashier.id} style={styles.cashierRow}>
                <Text style={styles.cashierRank}>{index + 1}</Text>
                <Text style={styles.cashierName}>{cashier.name}</Text>
                <Text style={styles.cashierSales}>₱{cashier.totalSales.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>No cashier data available</Text>
          </View>
        )}
      </View>
     <CardTiles
          rightTileText="Products"
          leftTileText="Reports"
          iconRightName="md-barcode-outline"
          iconLeftName="../../../assets/xzacto_icons/warehouseicons/report.png"
          leftRouteName="Reports"
          rightRouteName="ProductDashboard"
          centerTileText="Expenses"
          centerRouteName="Expenses"
          iconCenterName="document-text-outline"
          onRightPress={() => navigation.navigate('ProductDashboard', { store })}
          onLeftPress={() => navigation.navigate('Reports', { store })}
          onCenterPress={() => navigation.navigate('Expenses', { store })}
          extraProps={store}
        />
          <CardTiles
          leftTileText="Suppliers"
          iconLeftName="../../../assets/xzacto_icons/warehouseicons/report.png"
          leftRouteName="Supplier"
          centerTileText="Settings"
          centerRouteName="Settings"
          iconCenterName="settings-outline"
          rightTileText="Delivery"
          iconRightName="md-people-circle-outline"
          rightRouteName="DeliveryRequest"
          onRightPress={() => navigation.navigate('DeliveryRequest', { store })}
          onLeftPress={() => navigation.navigate('Supplier', { store })}
          onCenterPress={() => navigation.navigate('Settings', { store })}
          extraProps={store}
        />
          <CardTiles
          rightTileText="Staff"
          leftTileText="Bills"
          iconRightName="md-people-circle-outline"
          iconLeftName="../../../assets/xzacto_icons/warehouseicons/report.png"
          leftRouteName="BillsAndReceipt"
          rightRouteName="Staffs"
          centerTileText="Customers"
          centerRouteName="Customers"
          iconCenterName="md-people-circle-outline"
          onRightPress={() => navigation.navigate('Staffs', { store, staff })}
          onLeftPress={() => navigation.navigate('BillsAndReceipt', { store })}
          onCenterPress={() => navigation.navigate('Customers', { store })}
          extraProps={store}
        />
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  text: {
    fontSize: 30
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 15
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activePeriod: {
    backgroundColor: colors.primary,
  },
  periodText: {
    color: '#555',
    fontWeight: '500',
  },
  activePeriodText: {
    color: '#fff',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666'
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  chart: {
    borderRadius: 10,
    marginVertical: 8,
  },
  loader: {
    marginVertical: 50
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30
  },
  noDataText: {
    color: '#888',
    marginTop: 10,
    fontSize: 14
  },
  cashierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  cashierRank: {
    width: 30,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555'
  },
  cashierName: {
    flex: 1,
    fontSize: 14
  },
  cashierSales: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary
  }
});

export default StoreDashboard;
