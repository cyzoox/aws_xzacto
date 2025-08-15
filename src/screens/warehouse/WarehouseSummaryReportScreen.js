import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Card, Title, Paragraph, Chip, Searchbar, Menu, Button, DataTable } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { generateClient } from 'aws-amplify/api';
import { listWarehouseProducts, listInventoryRequests, getStore } from '../../graphql/queries';
import { format, subDays, startOfMonth, startOfWeek, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import Appbar from '../../components/Appbar';
import { colors } from '../../constants/theme';
import Cards from '../../components/Cards';

const WarehouseSummaryReportScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today'); // 'today', 'week', 'month'
  const [products, setProducts] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'lowStock', 'overstock', 'aging'
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [customFilters, setCustomFilters] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [branchFulfillment, setBranchFulfillment] = useState([]);
  const [summary, setSummary] = useState({
    totalStockValue: 0,
    totalStockQuantity: 0,
    lowStockCount: 0,
    overstockCount: 0,
    agingStock: 0,
  });

  const client = generateClient();

  const calculateDateRangeFilter = () => {
    const now = new Date();
    let startDate;
    
    switch (dateRange) {
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'today':
      default:
        startDate = startOfDay(now);
        break;
    }
    
    return startDate;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all warehouse products
      const productsData = await client.graphql({
        query: listWarehouseProducts,
      });
      
      // Get date range filter
      const startDate = calculateDateRangeFilter();
      const now = new Date();
      
      // Fetch inventory requests for branch fulfillment section
      const inventoryRequestsResponse = await client.graphql({
        query: listInventoryRequests,
        variables: { filter: { createdAt: { ge: startDate.toISOString() } } }
      });
      const inventoryRequests = inventoryRequestsResponse.data.listInventoryRequests.items;
      
      // Process branch fulfillment data
      const branchMap = new Map();
      
      // First, gather all unique storeIds
      const storeIds = [...new Set(inventoryRequests
        .filter(req => req.storeId) // Filter out requests without storeId
        .map(req => req.storeId))];
      
      // Create a map of storeId to store name for faster lookups
      const storeNameMap = new Map();
      
      // Fetch all store names in parallel
      await Promise.all(storeIds.map(async (storeId) => {
        try {
          const storeData = await client.graphql({
            query: getStore,
            variables: { id: storeId }
          });
          
          if (storeData.data.getStore) {
            storeNameMap.set(storeId, storeData.data.getStore.name);
          }
        } catch (error) {
          console.error(`Error fetching store with ID ${storeId}:`, error);
        }
      }));
      
      // Now process the requests with the store names we've gathered
      for (const request of inventoryRequests) {
        // Get branch name from storeId using our lookup map
        const branchName = request.storeId && storeNameMap.has(request.storeId) 
          ? storeNameMap.get(request.storeId) 
          : 'Unknown Branch';
          
        const isFulfilled = request.status === 'FULFILLED';
        const isPending = request.status === 'PENDING';
        const fulfillmentTime = isFulfilled && request.fulfillmentDate ? 
          differenceInDays(new Date(request.fulfillmentDate), new Date(request.createdAt)) : null;
        
        if (!branchMap.has(branchName)) {
          branchMap.set(branchName, {
            name: branchName,
            requestsSent: 0,
            fulfilled: 0,
            pending: 0,
            totalFulfillmentTime: 0,
            fulfillmentCount: 0
          });
        }
        
        if (!branchMap.has(branchName)) {
          branchMap.set(branchName, {
            name: branchName,
            requestsSent: 0,
            fulfilled: 0,
            pending: 0,
            totalFulfillmentTime: 0,
            fulfillmentCount: 0
          });
        }
        
        const branchData = branchMap.get(branchName);
        branchData.requestsSent++;
        
        if (isFulfilled) {
          branchData.fulfilled++;
          if (fulfillmentTime !== null) {
            branchData.totalFulfillmentTime += fulfillmentTime;
            branchData.fulfillmentCount++;
          }
        }
        
        if (isPending) {
          branchData.pending++;
        }
      }
      
      // Convert map to array and calculate average fulfillment time
      const branchFulfillmentData = Array.from(branchMap.values()).map(branch => ({
        ...branch,
        avgFulfillmentTime: branch.fulfillmentCount > 0 ? 
          Math.round(branch.totalFulfillmentTime / branch.fulfillmentCount) : 0
      }));
      
      setBranchFulfillment(branchFulfillmentData);
      
      let allProducts = productsData.data.listWarehouseProducts.items;
      
      // Extract all unique categories for filter dropdown
      const uniqueCategories = [...new Set(allProducts.map(product => product.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
      // Apply filters to products based on date range
      if (dateRange !== 'all') {
        allProducts = allProducts.filter(product => {
          // Filter based on lastUpdated date if available, otherwise use createdAt
          const productDate = new Date(product.lastUpdated || product.createdAt || product.lastRestockDate);
          return productDate >= startDate && productDate <= now;
        });
      }
      
      // Apply search filter if present
      if (searchQuery.trim() !== '') {
        allProducts = allProducts.filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      // Apply category filter if selected
      if (categoryFilter) {
        allProducts = allProducts.filter(product => 
          product.category === categoryFilter
        );
      }
      
      // Apply type filters
      if (filterType === 'lowStock') {
        allProducts = allProducts.filter(product => 
          product.availableStock < (product.reorderPoint || 10)
        );
      } else if (filterType === 'overstock') {
        allProducts = allProducts.filter(product => {
          const overstockThreshold = (product.reorderQuantity || 20) * 1.5;
          return product.availableStock > overstockThreshold;
        });
      } else if (filterType === 'aging') {
        const now = new Date();
        allProducts = allProducts.filter(product => {
          if (product.lastRestockDate) {
            const lastRestockDate = new Date(product.lastRestockDate);
            const daysSinceRestock = differenceInDays(now, lastRestockDate);
            return daysSinceRestock >= 90;
          }
          return false;
        });
      }
      
      // Apply custom filters if any
      if (customFilters.length > 0) {
        // This would be expanded based on specific custom filter needs
        customFilters.forEach(filter => {
          if (filter.type === 'price' && filter.min !== undefined && filter.max !== undefined) {
            allProducts = allProducts.filter(product => 
              product.purchasePrice >= filter.min && product.purchasePrice <= filter.max
            );
          }
        });
      }
      
      setProducts(allProducts);
      
      // Calculate metrics for all products (not filtered) to maintain overall metrics
      const unfilteredProducts = productsData.data.listWarehouseProducts.items;
      calculateSummary(unfilteredProducts);
      
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, filterType, searchQuery, categoryFilter, customFilters]);

  const calculateSummary = (productsData) => {
    const now = new Date();
    let totalValue = 0;
    let totalQuantity = 0;
    let lowStock = 0;
    let overstock = 0;
    let aging = 0;

    productsData.forEach(product => {
      // Calculate total value (Purchase Price * Available Stock)
      const productValue = (product.purchasePrice || 0) * (product.availableStock || 0);
      totalValue += productValue;
      
      // Total quantity
      totalQuantity += (product.availableStock || 0);
      
      // Low stock items (below reorder point)
      if (product.availableStock < (product.reorderPoint || 10)) {
        lowStock++;
      }
      
      // Overstock items (let's assume overstock is 150% of reorder quantity)
      const overstockThreshold = (product.reorderQuantity || 20) * 1.5;
      if (product.availableStock > overstockThreshold) {
        overstock++;
      }
      
      // Aging stock (items not moved for 90+ days)
      // This assumes lastRestockDate is updated when stock is moved
      if (product.lastRestockDate) {
        const lastRestockDate = new Date(product.lastRestockDate);
        const daysSinceRestock = differenceInDays(now, lastRestockDate);
        if (daysSinceRestock >= 90) {
          aging++;
        }
      }
    });

    setSummary({
      totalStockValue: totalValue,
      totalStockQuantity: totalQuantity,
      lowStockCount: lowStock,
      overstockCount: overstock,
      agingStock: aging,
    });
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);
  
  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    // Re-fetch will happen automatically due to dependency array in useCallback
  };
  
  const onChangeSearch = query => {
    setSearchQuery(query);
  };
  
  const resetFilters = () => {
    setFilterType('all');
    setSearchQuery('');
    setCategoryFilter('');
    setCustomFilters([]);
  };
  
  const viewFilteredInventory = (filter) => {
    navigation.navigate('WarehouseInventory', { 
      filter: filter || filterType,
      searchQuery: searchQuery,
      categoryFilter: categoryFilter,
      customFilters: customFilters
    });
  };

  const formatCurrency = (value) => {
    return '₱' + value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };

  return (
    <View style={styles.container}>
      <Appbar title="Summary Reports" subtitle="Warehouse" hideMenuButton/>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {/* Date Range Selector */}
          <View style={styles.dateRangeContainer}>
            <TouchableOpacity
              style={[styles.dateRangeButton, dateRange === 'today' && styles.activeDateRange]}
              onPress={() => setDateRange('today')}
            >
              <Text style={[styles.dateRangeText, dateRange === 'today' && styles.activeDateRangeText]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateRangeButton, dateRange === 'week' && styles.activeDateRange]}
              onPress={() => setDateRange('week')}
            >
              <Text style={[styles.dateRangeText, dateRange === 'week' && styles.activeDateRangeText]}>This Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateRangeButton, dateRange === 'month' && styles.activeDateRange]}
              onPress={() => setDateRange('month')}
            >
              <Text style={[styles.dateRangeText, dateRange === 'month' && styles.activeDateRangeText]}>This Month</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <Searchbar
            placeholder="Search inventory..."
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
          
          {/* Filter Chips */}
          {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsContainer}>
            <Chip 
              selected={filterType === 'all'}
              onPress={() => handleFilterChange('all')} 
              style={[styles.filterChip, filterType === 'all' && styles.selectedFilterChip]}
              textStyle={filterType === 'all' ? styles.selectedChipText : null}
            >
              All Items
            </Chip>
            <Chip 
              selected={filterType === 'lowStock'}
              onPress={() => handleFilterChange('lowStock')} 
              style={[styles.filterChip, filterType === 'lowStock' && styles.selectedFilterChip]}
              textStyle={filterType === 'lowStock' ? styles.selectedChipText : null}
            >
              Low Stock
            </Chip>
            <Chip 
              selected={filterType === 'overstock'}
              onPress={() => handleFilterChange('overstock')} 
              style={[styles.filterChip, filterType === 'overstock' && styles.selectedFilterChip]}
              textStyle={filterType === 'overstock' ? styles.selectedChipText : null}
            >
              Overstock
            </Chip>
            <Chip 
              selected={filterType === 'aging'}
              onPress={() => handleFilterChange('aging')} 
              style={[styles.filterChip, filterType === 'aging' && styles.selectedFilterChip]}
              textStyle={filterType === 'aging' ? styles.selectedChipText : null}
            >
              Aging (90+ days)
            </Chip>
          </ScrollView> */}
          
          {/* Category Filter - Dropdown */}
          {categories.length > 0 && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Chip 
                  icon="filter-variant" 
                  onPress={() => setMenuVisible(true)} 
                  style={styles.categoryChip}
                >
                  {categoryFilter ? `Category: ${categoryFilter}` : 'Filter by Category'}
                </Chip>
              }
            >
              <Menu.Item onPress={() => {
                setCategoryFilter('');
                setMenuVisible(false);
              }} title="All Categories" />
              {categories.map((category, index) => (
                <Menu.Item 
                  key={index} 
                  onPress={() => {
                    setCategoryFilter(category);
                    setMenuVisible(false);
                  }} 
                  title={category} 
                />
              ))}
            </Menu>
          )}
          
          {/* Reset Filters Button */}
          {(filterType !== 'all' || searchQuery !== '' || categoryFilter !== '') && (
            <Button 
              mode="outlined" 
              onPress={resetFilters}
              style={styles.resetButton}
            >
              Reset Filters
            </Button>
          )}

          {/* Section 1 - Inventory Health Snapshot */}
          <Text style={styles.sectionTitle}>Inventory Health Snapshot</Text>
          
          <View style={styles.cardsRow}>
            <Card style={styles.valueCard}>
              <Card.Content>
                <Title style={styles.cardValueText}>{formatCurrency(summary.totalStockValue)}</Title>
                <Paragraph style={styles.cardLabelText}>Total Stock Value</Paragraph>
              </Card.Content>
            </Card>
            
            <Card style={styles.valueCard}>
              <Card.Content>
                <Title style={styles.cardValueText}>{summary.totalStockQuantity.toLocaleString()}</Title>
                <Paragraph style={styles.cardLabelText}>Total Stock Quantity</Paragraph>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.cardsRow}>
            <Card style={styles.alertCard}>
              <Card.Content>
                <Title style={styles.cardValueText}>{summary.lowStockCount}</Title>
                <Paragraph style={styles.cardLabelText}>Low Stock Items</Paragraph>
              </Card.Content>
            </Card>
            
            <Card style={styles.warningCard}>
              <Card.Content>
                <Title style={styles.cardValueText}>{summary.overstockCount}</Title>
                <Paragraph style={styles.cardLabelText}>Overstock Items</Paragraph>
              </Card.Content>
            </Card>
          </View>

          {/* Stock Aging Summary using Cards component */}
          <Card style={styles.agingStockContainer}>
            <Card.Content>
              <View style={styles.agingStockHeader}>
                <Text style={styles.agingStockTitle}>Stock Aging Summary</Text>
                <Text style={styles.agingStockSubtitle}>
                  Items not moved for 90+ days
                </Text>
              </View>
              <View style={styles.agingStockContent}>
                <Text style={styles.agingStockCount}>{summary.agingStock}</Text>
                <Text style={styles.agingStockLabel}>Items</Text>
              </View>
              {/* <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={() => viewFilteredInventory('aging')}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity> */}
            </Card.Content>
          </Card>
        
          {/* Branch Fulfillment Section */}
          <Card style={styles.sectionContainer}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Branch Fulfillment</Text>
              
              {loading ? (
                <View style={styles.centeredContent}>
                  <Text>Loading branch data...</Text>
                </View>
              ) : branchFulfillment.length === 0 ? (
                <View style={styles.centeredContent}>
                  <Text>No branch fulfillment data available</Text>
                </View>
              ) : (
                <DataTable>
                  <DataTable.Header style={styles.tableHeader}>
                    <DataTable.Title>Branch</DataTable.Title>
                    <DataTable.Title numeric>Requests Sent</DataTable.Title>
                    <DataTable.Title numeric>Fulfilled</DataTable.Title>
                    <DataTable.Title numeric>Pending</DataTable.Title>
                    <DataTable.Title numeric>Avg. Fulfillment Time</DataTable.Title>
                  </DataTable.Header>
                  
                  {branchFulfillment.map((branch, index) => (
                    <DataTable.Row key={index} style={styles.tableRow}>
                      <DataTable.Cell>{branch.name}</DataTable.Cell>
                      <DataTable.Cell numeric>{branch.requestsSent}</DataTable.Cell>
                      <DataTable.Cell numeric>{branch.fulfilled}</DataTable.Cell>
                      <DataTable.Cell numeric>{branch.pending}</DataTable.Cell>
                      <DataTable.Cell numeric>
                        {branch.avgFulfillmentTime > 0 
                          ? `${branch.avgFulfillmentTime} ${branch.avgFulfillmentTime === 1 ? 'day' : 'days'}` 
                          : 'N/A'}
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  centeredContent: {
    alignItems: 'center',
    padding: 16,
  },
  sectionContainer: {
    marginVertical: 16,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeDateRange: {
    backgroundColor: colors.primary,
  },
  dateRangeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeDateRangeText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  searchBar: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#fff',
  },
  filterChipsContainer: {
    marginBottom: 12,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedFilterChip: {
    backgroundColor: colors.primary,
  },
  selectedChipText: {
    color: '#fff',
  },
  categoryChip: {
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  resetButton: {
    marginBottom: 16,
    borderColor: colors.primary,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  valueCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  alertCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    backgroundColor: '#FFF3F0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  warningCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  cardValueText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardLabelText: {
    fontSize: 14,
    color: '#666',
  },
  agingStockContainer: {
    padding: 8,
  },
  agingStockHeader: {
    marginBottom: 16,
  },
  agingStockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  agingStockSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  agingStockContent: {
    alignItems: 'center',
    marginVertical: 16,
  },
  agingStockCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E53935',
  },
  agingStockLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  viewDetailsButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  viewDetailsText: {
    color: '#fff',
    fontWeight: '500',
  },
  filtersAppliedText: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 12,
    fontSize: 12,
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

export default WarehouseSummaryReportScreen;
