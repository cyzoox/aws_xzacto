import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';

import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  FAB,
  Portal,
  Modal,
} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import Appbar from '../../components/Appbar';
import {useStore} from '../../context/StoreContext';
import colors from '../../themes/colors';
import {generateClient} from 'aws-amplify/api';
import {
  listInventoryRequests,
  listRequestItems,
  getWarehouseProduct,
} from '../../graphql/queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getCurrentUser} from 'aws-amplify/auth';
import {updateInventoryRequest} from '../../graphql/mutations';
import Cards from '../../components/Cards';

// Initialize API client
const client = generateClient();

const StoreRequestsScreen = ({navigation, route}) => {
  const STORE = route.params.store;

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [requests, setRequests] = useState([]);
  const [requestItems, setRequestItems] = useState({});
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Load requests when component mounts
  useEffect(() => {
    fetchRequests();

    return () => {};
  }, [fetchRequests]);

  // Fetch requests from the API
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {userId: ownerId} = await getCurrentUser();
      console.log('Using owner ID for fetching requests:', ownerId);
      console.log('Current store ID:', STORE.id);

      // Fetch inventory requests for this store
      const response = await client.graphql({
        query: listInventoryRequests,
        variables: {
          filter: {
            and: [
              {storeId: {eq: STORE.id}},
              // { ownerId: { eq: ownerId } }
            ],
          },
        },
      });

      const fetchedRequests = response.data.listInventoryRequests.items || [];
      console.log('Fetched requests:', fetchedRequests.length);
      setRequests(fetchedRequests);

      // Fetch request items for all requests
      if (fetchedRequests.length > 0) {
        try {
          await fetchRequestItems(fetchedRequests.map(req => req.id));
        } catch (itemErr) {
          console.error('Error fetching request items:', itemErr);
          // Continue execution even if item fetching fails
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests. Please try again.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [STORE.id]);

  // Fetch request items for inventory requests
  const fetchRequestItems = async requestIds => {
    if (!requestIds || requestIds.length === 0) {
      return;
    }

    try {
      console.log('Fetching items for requests:', requestIds);

      // For each request ID, fetch its items directly with product information
      const requestItemPromises = requestIds.map(async requestId => {
        try {
          const response = await client.graphql({
            query: listRequestItems,
            variables: {
              filter: {
                requestId: {eq: requestId},
              },
            },
          });

          const items = response.data.listRequestItems.items || [];
          console.log(`Found ${items.length} items for request ${requestId}`);

          // For each item, get the associated warehouse product
          const itemsWithProducts = await Promise.all(
            items.map(async item => {
              try {
                if (item.warehouseProductId) {
                  // Fetch the warehouse product details
                  const productResponse = await client.graphql({
                    query: getWarehouseProduct,
                    variables: {id: item.warehouseProductId},
                  });

                  const product = productResponse.data.getWarehouseProduct;
                  return {
                    id: item.id,
                    name: product?.name || 'Unknown Product',
                    quantity: item.requestedQuantity || 0,
                    fulfilled: item.fulfilledQuantity || 0,
                    status: item.status || 'PENDING',
                  };
                } else {
                  return {
                    id: item.id,
                    name: 'Unknown Product',
                    quantity: item.requestedQuantity || 0,
                    fulfilled: item.fulfilledQuantity || 0,
                    status: item.status || 'PENDING',
                  };
                }
              } catch (productErr) {
                console.error('Error fetching product details:', productErr);
                return {
                  id: item.id,
                  name: 'Error Loading Product',
                  quantity: item.requestedQuantity || 0,
                  fulfilled: item.fulfilledQuantity || 0,
                  status: item.status || 'PENDING',
                };
              }
            }),
          );

          return {requestId, items: itemsWithProducts};
        } catch (err) {
          console.error(`Error fetching items for request ${requestId}:`, err);
          return {requestId, items: []};
        }
      });

      // Use Promise.allSettled instead of Promise.all to handle any rejected promises
      const results = await Promise.allSettled(requestItemPromises);

      // Group items by request ID (handle both fulfilled and rejected promises)
      const groupedItems = {};
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          groupedItems[result.value.requestId] = result.value.items;
        }
      });

      console.log(
        'Setting request items:',
        Object.keys(groupedItems).length,
        'requests',
      );
      setRequestItems(groupedItems);
    } catch (err) {
      console.error('Error fetching request items:', err);
    }
  };

  // Filter requests based on status
  const getFilteredRequests = () => {
    if (!requests) {
      return [];
    }

    if (selectedFilter === 'ALL') {
      return requests;
    } else {
      return requests.filter(request => request.status === selectedFilter);
    }
  };

  const filteredRequests = getFilteredRequests();

  // Get status chip color
  const getStatusColor = status => {
    switch (status) {
      case 'PENDING':
        return colors.warning;
      case 'PARTIAL':
        return colors.partial;
      case 'FULFILLED':
        return colors.success;
      case 'REJECTED':
        return colors.danger;
      default:
        return colors.grey;
    }
  };

  // Get item status style
  const getItemStatusStyle = status => {
    switch (status) {
      case 'FULFILLED':
        return {backgroundColor: '#4CAF5044'};
      case 'PARTIALLY_FULFILLED':
        return {backgroundColor: '#FF980044'};
      case 'OUT_OF_STOCK':
        return {backgroundColor: '#F4433644'};
      case 'PENDING':
      default:
        return {backgroundColor: '#9E9E9E44'};
    }
  };

  // Format item status for display
  const formatItemStatus = status => {
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
  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString();
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRequests();
    } finally {
      setRefreshing(false);
    }
  }, [fetchRequests]);

  const showModal = request => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setSelectedRequest(null);
  };

  // Mark a fulfilled request as received
  const markAsReceived = async request => {
    if (request.status !== 'FULFILLED') {
      Alert.alert(
        'Error',
        'Only fulfilled requests can be marked as received.',
      );
      return;
    }

    try {
      const input = {
        id: request.id,
        status: 'FULFILLED', // Status remains FULFILLED
        isReceived: true, // Mark as received/verified by store
      };

      await client.graphql({
        query: updateInventoryRequest,
        variables: {input},
      });

      // Update local state
      setRequests(
        requests.map(req =>
          req.id === request.id ? {...req, isReceived: true} : req,
        ),
      );

      Alert.alert('Success', 'Delivery has been marked as received.');
    } catch (error) {
      console.error('Error marking request as received:', error);
      Alert.alert(
        'Error',
        'Failed to mark request as received. Please try again.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar
        title="Inventory Requests"
        subtitle={STORE?.name || ''}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <Cards>
          <Text style={styles.filterLabel}>Filter</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}>
            {['ALL', 'PENDING', 'PARTIAL', 'FULFILLED', 'REJECTED'].map(
              filter => (
                <Chip
                  key={filter}
                  selected={selectedFilter === filter}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter && styles.selectedChip,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                  mode="flat">
                  <Text style={styles.filterText}>{filter}</Text>
                </Chip>
              ),
            )}
          </ScrollView>
        </Cards>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
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
                contentStyle={{height: 40}}
                labelStyle={{color: 'white'}}>
                <Text>Try Again</Text>
              </Button>
            </View>
          ) : filteredRequests.length > 0 ? (
            filteredRequests.map(request => (
              <Card key={request.id} style={styles.requestCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Title style={styles.requestId}>
                      #{request.id.slice(-6)}
                    </Title>
                    <View style={styles.chipContainer}>
                      <Chip
                        style={[
                          styles.statusChip,
                          {backgroundColor: getStatusColor(request.status)},
                        ]}>
                        <Text>{request.status}</Text>
                      </Chip>
                      {request.isReceived && (
                        <Chip
                          style={[
                            styles.statusChip,
                            {backgroundColor: '#4CAF50', marginLeft: 5},
                          ]}>
                          <Text>RECEIVED</Text>
                        </Chip>
                      )}
                    </View>
                  </View>
                </Card.Content>

                <Card.Actions>
                  <View style={styles.actionContainer}>
                    <Text style={styles.dashText}>-</Text>
                    <Button
                      mode="contained"
                      onPress={() => showModal(request)}
                      style={styles.detailsButton}
                      contentStyle={{height: 36}}
                      labelStyle={{color: 'white'}}>
                      <Text>View Request</Text>
                    </Button>
                  </View>
                </Card.Actions>
              </Card>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No requests found</Text>
            </View>
          )}
        </ScrollView>

        {/* Using FAB component instead of Button */}
        {/* <FAB
          icon="plus"
          label="New Request"
          onPress={() =>
            navigation.navigate('DeliveryRequest', {
              storeId: currentStore?.id,
              storeName: currentStore?.name,
            })
          }
          style={styles.fab}
          color="white"
        /> */}
      </View>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}>
          {selectedRequest && (
            <ScrollView>
              <Title>Order #{selectedRequest.id.slice(-6)}</Title>
              <Paragraph>
                Requested on{' '}
                {formatDate(
                  selectedRequest.requestDate || selectedRequest.createdAt,
                )}
              </Paragraph>
              <View style={styles.chipRow}>
                <Chip
                  style={[
                    styles.statusChip,
                    {backgroundColor: getStatusColor(selectedRequest.status)},
                  ]}>
                  <Text style={styles.chipText}>{selectedRequest.status}</Text>
                </Chip>

                {selectedRequest.isReceived && (
                  <Chip
                    style={[styles.statusChip, {backgroundColor: '#4CAF50'}]}>
                    <Text style={styles.chipText}>RECEIVED</Text>
                  </Chip>
                )}
              </View>

              <Divider style={styles.divider} />

              <Text style={styles.itemsTitle}>Requested Items:</Text>
              {requestItems[selectedRequest.id] &&
              requestItems[selectedRequest.id].length > 0 ? (
                requestItems[selectedRequest.id].map(item => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemQty}>
                        {item.quantity} requested
                      </Text>
                      {item.fulfilled > 0 && (
                        <Text style={styles.itemQty}>
                          {item.fulfilled} fulfilled
                        </Text>
                      )}
                      <Chip
                        size="small"
                        style={[
                          styles.statusChip,
                          getItemStatusStyle(item.status),
                        ]}>
                        <Text>{formatItemStatus(item.status)}</Text>
                      </Chip>
                    </View>
                  </View>
                ))
              ) : (
                <Text>No items found for this request.</Text>
              )}

              <View style={styles.buttonContainer}>
                {selectedRequest.status === 'FULFILLED' &&
                  !selectedRequest.isReceived && (
                    <Button
                      mode="contained"
                      onPress={() => {
                        markAsReceived(selectedRequest);
                        hideModal();
                      }}
                      style={{
                        marginRight: 10,
                        backgroundColor: colors.success,
                      }}>
                      Mark as Received
                    </Button>
                  )}
                <Button
                  mode="outlined"
                  onPress={hideModal}
                  style={{marginTop: 20}}>
                  Close
                </Button>
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  requestCard: {
    marginVertical: 5,
    marginHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  filterText: {
    color: colors.white,
  },
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
    marginBottom: 80,
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
    backgroundColor: colors.boldGrey,
    marginRight: 8,
    height: 32,
  },
  selectedChip: {
    backgroundColor: colors.secondary,
  },
  scrollView: {
    flex: 1,
    position: 'relative',
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
    marginLeft: 8,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  dashText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#757575',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginBottom: 60, // Add space for FAB
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 70, // Added margin for bottom tab navigation
    backgroundColor: colors.primary,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  chipRow: {
    flexDirection: 'row',
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  chipText: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});

export default StoreRequestsScreen;
