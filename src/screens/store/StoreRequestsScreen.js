import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useStore } from '../../context/StoreContext';
import colors from '../../themes/colors';
import { generateClient } from 'aws-amplify/api';
import { listInventoryRequests, listRequestItems, getWarehouseProduct } from '../../graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize API client
const client = generateClient();

const StoreRequestsScreen = ({ navigation, route }) => {
  const { currentStore } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [requests, setRequests] = useState([]);
  const [requestItems, setRequestItems] = useState({});
  const [error, setError] = useState(null);
  
  // Load requests when component mounts
  useEffect(() => {
    fetchRequests();
  }, [currentStore]);

  // Fetch requests from the API
  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Get staff data from AsyncStorage
      const staffJson = await AsyncStorage.getItem('staffData');
      if (!staffJson) {
        setError('No staff data found. Please log in again.');
        setLoading(false);
        return;
      }
      
      const staffData = JSON.parse(staffJson);
      console.log('Using staff data for fetching requests:', staffData.id);
      
      // Get store ID from current store or staff data
      const storeId = currentStore?.id || staffData.store_id;
      
      if (!storeId) {
        setError('No store selected. Please select a store first.');
        setLoading(false);
        return;
      }
      
      // Fetch inventory requests for this store
      const response = await client.graphql({
        query: listInventoryRequests,
        variables: {
          filter: {
            storeId: { eq: storeId }
          }
        }
      });
      
      const fetchedRequests = response.data.listInventoryRequests.items || [];
      console.log('Fetched requests:', fetchedRequests.length);
      setRequests(fetchedRequests);
      
      // Fetch request items for all requests
      await fetchRequestItems(fetchedRequests.map(req => req.id));
      
      setError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch request items for inventory requests
  const fetchRequestItems = async (requestIds) => {
    if (!requestIds || requestIds.length === 0) return;
    
    try {
      console.log('Fetching items for requests:', requestIds);
      
      // For each request ID, fetch its items directly with product information
      const requestItemPromises = requestIds.map(async (requestId) => {
        try {
          const response = await client.graphql({
            query: listRequestItems,
            variables: {
              filter: {
                requestId: { eq: requestId }
              }
            }
          });
          
          const items = response.data.listRequestItems.items || [];
          console.log(`Found ${items.length} items for request ${requestId}`);
          
          // For each item, get the associated warehouse product
          const itemsWithProducts = await Promise.all(items.map(async (item) => {
            try {
              if (item.warehouseProductId) {
                // Fetch the warehouse product details
                const productResponse = await client.graphql({
                  query: getWarehouseProduct,
                  variables: { id: item.warehouseProductId }
                });
                
                const product = productResponse.data.getWarehouseProduct;
                return {
                  id: item.id,
                  name: product?.name || 'Unknown Product',
                  quantity: item.requestedQuantity || 0,
                  fulfilled: item.fulfilledQuantity || 0,
                  status: item.status || 'PENDING'
                };
              } else {
                return {
                  id: item.id,
                  name: 'Unknown Product',
                  quantity: item.requestedQuantity || 0,
                  fulfilled: item.fulfilledQuantity || 0,
                  status: item.status || 'PENDING'
                };
              }
            } catch (productErr) {
              console.error('Error fetching product details:', productErr);
              return {
                id: item.id,
                name: 'Error Loading Product',
                quantity: item.requestedQuantity || 0,
                fulfilled: item.fulfilledQuantity || 0,
                status: item.status || 'PENDING'
              };
            }
          }));
          
          return { requestId, items: itemsWithProducts };
        } catch (err) {
          console.error(`Error fetching items for request ${requestId}:`, err);
          return { requestId, items: [] };
        }
      });
      
      const results = await Promise.all(requestItemPromises);
      
      // Group items by request ID
      const groupedItems = {};
      results.forEach(result => {
        groupedItems[result.requestId] = result.items;
      });
      
      console.log('Setting request items:', Object.keys(groupedItems).length, 'requests');
      setRequestItems(groupedItems);
    } catch (err) {
      console.error('Error fetching request items:', err);
    }
  };
  
  // Filter requests based on status
  const getFilteredRequests = () => {
    if (!requests) return [];
    
    if (selectedFilter === 'ALL') {
      return requests;
    } else {
      return requests.filter(request => request.status === selectedFilter);
    }
  };
  
  const filteredRequests = getFilteredRequests();
  
  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return colors.warning;
      case 'PROCESSING':
        return colors.info;
      case 'PARTIALLY_FULFILLED':
        return colors.partial;
      case 'FULFILLED':
        return colors.success;
      case 'CANCELLED':
        return colors.danger;
      default:
        return colors.grey;
    }
  };
  
  // Get item status style
  const getItemStatusStyle = (status) => {
    switch (status) {
      case 'FULFILLED':
        return { backgroundColor: '#4CAF5044' };
      case 'PARTIALLY_FULFILLED':
        return { backgroundColor: '#FF980044' };
      case 'OUT_OF_STOCK':
        return { backgroundColor: '#F4433644' };
      case 'PENDING':
      default:
        return { backgroundColor: '#9E9E9E44' };
    }
  };
  
  // Format item status for display
  const formatItemStatus = (status) => {
    switch (status) {
      case 'FULFILLED':
        return 'Fulfilled';
      case 'PARTIALLY_FULFILLED':
        return 'Partial';
      case 'OUT_OF_STOCK':
        return 'Out of Stock';
      case 'PENDING':
      default:
        return 'Pending';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Handle refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [currentStore]);
  
  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'HIGH': return '🔴';
      case 'NORMAL': return '🟠';
      case 'LOW': return '🟢';
      default: return '';
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Simple header with only back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory Requests</Text>
        <View style={{width: 40}} /> {/* Empty view for balance */}
      </View>

      <View style={styles.content}>
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['ALL', 'PENDING', 'APPROVED', 'PARTIAL', 'FULFILLED', 'REJECTED'].map(filter => (
              <Chip
                selected={selectedFilter === filter}
                style={[styles.filterChip, selectedFilter === filter && styles.selectedChip]}
                key={filter}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text style={{color: selectedFilter === filter ? 'white' : '#444'}}>
                  {filter}
                </Text>
              </Chip>
            ))}
          </ScrollView>
        </View>
        
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Button 
                mode="contained" 
                onPress={fetchRequests}
                style={styles.createButton}
              >
                <Text style={{color: 'white'}}>Try Again</Text>
              </Button>
            </View>
          ) : filteredRequests.length > 0 ? (
            filteredRequests.map(request => (
              <Card key={request.id} style={styles.card}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View>
                      <Title>{getPriorityIcon(request.priority)} Order #{request.id.slice(-6)}</Title>
                      <Paragraph>Requested on {formatDate(request.createdAt)}</Paragraph>
                    </View>
                    <Chip 
                      style={[styles.statusChip, { backgroundColor: getStatusColor(request.status) }]}
                    >
                      <Text style={{color: 'white'}}>{request.status}</Text>
                    </Chip>
                  </View>
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.itemsContainer}>
                    <Text style={styles.itemsTitle}>Requested Items:</Text>
                    {loading ? (
                      <ActivityIndicator size="small" color={colors.primary} style={{marginVertical: 10}} />
                    ) : requestItems[request.id] && requestItems[request.id].length > 0 ? (
                      requestItems[request.id].map((item, index) => (
                        <View key={item.id} style={styles.itemRow}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <View style={styles.itemDetails}>
                            <Text style={styles.itemQty}>
                              {item.fulfilled}/{item.quantity}
                            </Text>
                            <Chip 
                              size="small" 
                              style={[styles.statusChip, getItemStatusStyle(item.status)]}
                            >
                              <Text>{formatItemStatus(item.status)}</Text>
                            </Chip>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>Loading request items...</Text>
                    )}
                  </View>
                </Card.Content>
                
                <Card.Actions>
                  {request.status === 'PENDING' && (
                    <Button 
                      mode="outlined" 
                      onPress={() => {
                        // Handle cancellation logic
                        console.log('Cancel request', request.id);
                      }}
                    >
                      <Text>Cancel Request</Text>
                    </Button>
                  )}
                  
                  <Button 
                    mode="contained" 
                    onPress={() => {
                      // Navigate to request details
                      console.log('View details', request.id);
                      navigation.navigate('RequestDetail', { requestId: request.id });
                    }}
                    style={styles.detailsButton}
                  >
                    <Text style={{color: 'white'}}>View Details</Text>
                  </Button>
                </Card.Actions>
              </Card>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No requests found</Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('DeliveryRequest', { 
                  storeId: currentStore?.id, 
                  storeName: currentStore?.name 
                })}
                style={styles.createButton}
              >
                <Text style={{color: 'white'}}>Create New Request</Text>
              </Button>
            </View>
          )}
        </ScrollView>
        
        <Button 
          mode="contained" 
          icon="plus" 
          onPress={() => navigation.navigate('DeliveryRequest', { 
            storeId: currentStore?.id, 
            storeName: currentStore?.name 
          })}
          style={styles.fab}
          labelStyle={{color: 'white'}}
        >
          <Text style={{color: 'white'}}>New Request</Text>
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 10,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: colors.primary,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusChip: {
    height: 30,
  },
  divider: {
    marginVertical: 12,
  },
  itemsContainer: {
    marginTop: 8,
  },
  itemsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemName: {
    flex: 1,
  },
  itemQty: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButton: {
    backgroundColor: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
});

export default StoreRequestsScreen;
