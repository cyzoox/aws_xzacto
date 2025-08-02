import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {formatMoney} from 'accounting-js';
import Appbar from '../components/Appbar';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SignOutButton from '../components/SignOutButton';
import {generateClient} from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import {useSelector, useDispatch} from 'react-redux';
import {syncService} from '../services/syncService';
import {getCurrentUser} from '@aws-amplify/auth';
import {LineChart, BarChart, PieChart} from 'react-native-chart-kit';
import {setStoreList} from '../store/slices/storeSlice';

// Simplified Store Summary Card Component with basic store information
const StoreSummaryCard = ({store, onPress}) => {
  const [storeStats, setStoreStats] = useState({
    salesTotal: 0,
    orderCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Fetch real transaction data instead of using placeholders
  useEffect(() => {
    let isMounted = true;
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const client = generateClient();

        // Get transactions for the past 7 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 6); // Past 7 days including today

        // Fetch transactions for this store
        const result = await client.graphql({
          query: queries.listSaleTransactions,
          variables: {
            filter: {
              storeID: {eq: store.id},
              createdAt: {
                between: [startDate.toISOString(), endDate.toISOString()],
              },
            },
          },
        });

        const transactions = result.data.listSaleTransactions.items;

        // Calculate sales total and order count
        const salesTotal = transactions.reduce(
          (sum, t) => sum + (parseFloat(t.total) || 0),
          0,
        );
        const orderCount = transactions.length;

        // Group transactions by day of week
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dailyTotals = Array(7).fill(0);

        transactions.forEach(transaction => {
          const date = new Date(transaction.createdAt);
          const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
          dailyTotals[dayIndex] += parseFloat(transaction.total) || 0;
        });

        // Reorder days to start with Monday
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const amounts = [
          dailyTotals[1], // Monday
          dailyTotals[2], // Tuesday
          dailyTotals[3], // Wednesday
          dailyTotals[4], // Thursday
          dailyTotals[5], // Friday
          dailyTotals[6], // Saturday
          dailyTotals[0], // Sunday
        ];

        if (isMounted) {
          setStoreStats({
            salesTotal: salesTotal,
            orderCount: orderCount,
            dailySales: {
              days,
              amounts,
            },
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
        // Fall back to empty data if there's an error
        if (isMounted) {
          setStoreStats({
            salesTotal: 0,
            orderCount: 0,
            dailySales: {
              days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              amounts: [0, 0, 0, 0, 0, 0, 0],
            },
          });
          setLoading(false);
        }
      }
    };

    fetchStoreData();

    return () => {
      isMounted = false;
    };
  }, [store.id]);

  // We've removed the need for this function by using placeholder data

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const screenWidth = Dimensions.get('window').width - 50;

  const renderCharts = () => {
    if (loading) {
      return (
        <View style={styles.loadingCharts}>
          <ActivityIndicator size="small" color="#3A6EA5" />
          <Text style={styles.loadingText}>Loading store data...</Text>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        {/* Sales Performance Chart */}
        <Text style={styles.chartTitle}>Weekly Sales Performance</Text>
        <LineChart
          data={{
            labels: storeStats.dailySales.days,
            datasets: [
              {
                data: storeStats.dailySales.amounts,
              },
            ],
          }}
          width={screenWidth}
          height={180}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(58, 110, 165, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#3A6EA5',
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  return (
    <View style={styles.storeCardContainer}>
      <TouchableOpacity style={styles.storeCard} onPress={onPress}>
        <View style={styles.storeIconContainer}>
          <Text style={styles.storeIcon}>{store.name?.charAt(0) || 'S'}</Text>
        </View>

        <View style={styles.storeContent}>
          <Text style={styles.storeName}>{store.name}</Text>

          <View style={styles.locationContainer}>
            <Ionicons
              name="location-outline"
              size={14}
              color="#6c757d"
              style={{marginRight: 5}}
            />
            <Text style={styles.locationText}>
              {store.location || 'No location set'}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Sales</Text>
              <Text style={styles.statValue}>
                {formatMoney(storeStats.salesTotal, {
                  symbol: '₱',
                  precision: 2,
                })}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Orders</Text>
              <Text style={styles.statValue}>{storeStats.orderCount}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.expandButton} onPress={toggleExpand}>
          <Ionicons
            name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={20}
            color="#3A6EA5"
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && renderCharts()}
    </View>
  );
};

const HomeScreen = ({navigation}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState(null);
  const [filteredStores, setFilteredStores] = useState([]);
  const client = generateClient();
  const dispatch = useDispatch();

  // Get all stores from Redux store
  const {items: allStores, loading: storeLoading} = useSelector(
    state => state.store,
  );

  // Do NOT rely on Redux state - we'll use direct API calls instead
  // This is the pattern used in StoreScreen that is known to work
  useEffect(() => {
    console.log(
      `Redux store has ${allStores.length} total stores, but we'll use direct API call instead`,
    );
  }, [allStores]);

  // Fetch user's stores when component mounts
  useEffect(() => {
    loadUserData();
    // Initialize the sync service which will handle keeping data updated
    syncService.init();

    return () => {
      // Clean up sync service when component unmounts
      syncService.destroy();
    };
  }, []);

  // Load user data and directly fetch stores - using EXACT pattern from StoreScreen.js
  const loadUserData = async () => {
    try {
      setLoading(true);

      // Get the current authenticated user - EXACT same code as StoreScreen.js
      const userInfo = await getCurrentUser();
      // Correctly extract the username (which is our userId in the system)
      const userId = userInfo.userId;
      console.log('Authenticated user ID (username):', userId);
      setOwnerId(userId);

      if (!userId) {
        console.error('User not authenticated');
        setLoading(false);
        return;
      }

      // Get staff data to determine role (from StoreScreen.js)
      const staffJson = await AsyncStorage.getItem('staffData');
      if (!staffJson) {
        console.log('No staff data found in AsyncStorage');
        setLoading(false);
        return;
      }

      // Make direct GraphQL call to fetch stores - EXACT same code as StoreScreen.js
      console.log('Fetching stores directly with ownerId filter:', userId);
      const {data: storeData} = await client.graphql({
        query: queries.listStores,
        variables: {filter: {ownerId: {eq: userId}}},
      });

      // Log what we got from the database
      const directStores = storeData.listStores.items.filter(s => !s._deleted);
      console.log(
        `Directly fetched ${directStores.length} stores for user ${userId}`,
      );

      // Set the stores directly from the query result
      setFilteredStores(directStores);
      console.log('Stores after direct fetch:', directStores);

      // Also update Redux store to be consistent
      dispatch(setStoreList(directStores));

      console.log('Initialization complete - data should be loaded');
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh when user pulls down
  const onRefresh = async () => {
    setRefreshing(true);
    await syncService.fetchInitialData();
    setRefreshing(false);
  };

  // Handle store selection to view detailed dashboard
  const handleStoreSelect = store => {
    // If StoreDashboard exists in the navigation, use it
    if (navigation.getState().routeNames.includes('StoreDashboard')) {
      navigation.navigate('StoreDashboard', {store});
    } else {
      // Otherwise, just show an alert with store details
      Alert.alert(
        `${store.name} Details`,
        `Location: ${
          store.location || 'Not specified'
        }\nMore detailed metrics coming soon!`,
      );
    }
  };

  // Render list of store cards
  const renderStores = () => {
    // Debug info to see what's happening
    console.log('Rendering stores. Available stores:', filteredStores.length);
    filteredStores.forEach(store => {
      console.log(`- Store: ${store.name}, ID: ${store.id}`);
    });

    if (!filteredStores || filteredStores.length === 0) {
      console.log('No stores to display, showing empty state');
      return (
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={60} color="#adb5bd" />
          <Text style={styles.emptyStateText}>No Stores Found</Text>
          <Text style={styles.emptyStateSubtext}>
            {allStores.length > 0
              ? `Found ${allStores.length} stores in Redux but none match filtering criteria.`
              : "You don't have any stores yet. Create one to get started."}
          </Text>
          <TouchableOpacity
            style={styles.addStoreButton}
            onPress={() => navigation.navigate('AddStore')}>
            <Text style={styles.addStoreButtonText}>Create Store</Text>
          </TouchableOpacity>
        </View>
      );
    }

    console.log('Rendering store list with', filteredStores.length, 'stores');
    return (
      <View style={styles.storesList}>
        {filteredStores.map(store => {
          console.log(`Rendering store card for: ${store.name}`);
          return (
            <StoreSummaryCard
              key={store.id}
              store={store}
              onPress={() => handleStoreSelect(store)}
            />
          );
        })}
      </View>
    );
  };

  if (loading || storeLoading) {
    return (
      <View style={styles.container}>
        <Appbar title="Store Dashboard" rightComponent={<SignOutButton />} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3A6EA5" />
          <Text style={styles.loadingText}>Loading your stores...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar title="Store Dashboard" rightComponent={<SignOutButton />} />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3A6EA5']}
            tintColor="#3A6EA5"
          />
        }>
        {renderStores()}

        <View style={styles.managementContainer}>
          <Text style={styles.managementTitle}>Management</Text>
          <TouchableOpacity
            style={styles.managementButton}
            onPress={() => navigation.navigate('CustomerScreen')}>
            <Ionicons name="people-outline" size={22} color="white" />
            <Text style={styles.managementButtonText}>Manage Customers</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  managementContainer: {
    marginTop: 30,
    paddingHorizontal: 5,
    marginBottom: 20,
  },
  managementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 15,
  },
  managementButton: {
    backgroundColor: '#3A6EA5',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  managementButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  signOutButton: {
    padding: 8,
  },
  // Empty state styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  addStoreButton: {
    backgroundColor: '#3A6EA5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
  },
  addStoreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Store list styles
  storesList: {
    marginTop: 10,
  },
  storeCardContainer: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'white',
    padding: 15,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statItem: {
    marginRight: 15,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#343a40',
  },
  chartContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginTop: 5,
    marginBottom: 5,
  },
  loadingCharts: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6c757d',
    fontSize: 14,
  },
  expandButton: {
    padding: 5,
  },
  addStoreCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoreText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3A6EA5',
    fontWeight: '500',
  },
  storeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  storeIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3A6EA5',
  },
  storeContent: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  locationText: {
    fontSize: 14,
    color: '#6c757d',
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3A6EA5',
    marginBottom: 5,
  },
  storeLocation: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40',
  },
  addStoreCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#dee2e6',
    height: 100,
  },
  addStoreText: {
    marginTop: 5,
    color: '#3A6EA5',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6c757d',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#adb5bd',
    marginBottom: 30,
    textAlign: 'center',
  },
  addStoreButton: {
    backgroundColor: '#3A6EA5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addStoreButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  warningBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  warningText: {
    fontSize: 10,
    color: '#212529',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
