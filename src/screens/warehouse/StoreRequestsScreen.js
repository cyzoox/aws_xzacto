import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  DataTable,
  Searchbar,
  Menu,
  Provider,
} from 'react-native-paper';
import Appbar from '../../components/Appbar';
import {colors} from '../../constants/theme';
import {API, graphqlOperation} from 'aws-amplify';
import {listInventoryRequests, getStore} from '../../graphql/queries';

// Constants for status values
const REQUEST_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PARTIALLY_FULFILLED: 'PARTIALLY_FULFILLED',
  FULFILLED: 'FULFILLED',
  CANCELLED: 'CANCELLED',
};

const PRIORITY_LEVELS = {
  HIGH: 'HIGH',
  NORMAL: 'NORMAL',
  LOW: 'LOW',
};

const StoreRequestsScreen = ({navigation, route}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  // Fetch all inventory requests
  const fetchInventoryRequests = async () => {
    try {
      // Get all inventory requests
      const requestsData = await API.graphql(
        graphqlOperation(listInventoryRequests),
      );
      let inventoryRequests = requestsData.data.listInventoryRequests.items;

      // Fetch store details for each request
      const requestsWithStoreNames = await Promise.all(
        inventoryRequests.map(async request => {
          try {
            const storeData = await API.graphql(
              graphqlOperation(getStore, {id: request.storeId}),
            );
            const store = storeData.data.getStore;

            // Count request items
            const itemCount = request.requestItems
              ? request.requestItems.items.length
              : 0;

            // Calculate total quantity requested
            const totalQuantity = request.requestItems
              ? request.requestItems.items.reduce(
                  (total, item) => total + item.requestedQuantity,
                  0,
                )
              : 0;

            return {
              ...request,
              storeName: store ? store.name : 'Unknown Store',
              items: itemCount,
              totalQuantity,
            };
          } catch (error) {
            console.error('Error fetching store details:', error);
            return {
              ...request,
              storeName: 'Unknown Store',
              items: 0,
              totalQuantity: 0,
            };
          }
        }),
      );

      setRequests(requestsWithStoreNames);
      return requestsWithStoreNames;
    } catch (error) {
      console.error('Error fetching inventory requests:', error);
      return [];
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchInventoryRequests();
      setLoading(false);
    };

    loadData();
  }, []);

  // Filter requests based on search and status
  const filteredRequests = requests
    .filter(
      request =>
        (request.storeName &&
          request.storeName
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        request.id.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter(request => !statusFilter || request.status === statusFilter);

  // Get status chip color
  const getStatusColor = status => {
    switch (status) {
      case 'PENDING':
        return '#FFA000';
      case 'PARTIALLY_FULFILLED':
        return '#2196F3';
      case 'COMPLETED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  // Get priority icon
  const getPriorityIcon = priority => {
    switch (priority) {
      case 'HIGH':
        return '🔴';
      case 'NORMAL':
        return '🟠';
      case 'LOW':
        return '🟢';
      default:
        return '';
    }
  };

  // Format date
  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString();
  };

  // Refresh data
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchInventoryRequests().finally(() => {
      setRefreshing(false);
    });
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Appbar title="Store Requests" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading inventory requests...</Text>
      </View>
    );
  }

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar title="Store Requests" />

        <View style={styles.content}>
          <Searchbar
            placeholder="Search by store or order ID"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />

          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filter by status:</Text>
            <View style={styles.chipGroup}>
              <Chip
                selected={statusFilter === ''}
                onPress={() => setStatusFilter('')}
                style={styles.filterChip}>
                All
              </Chip>
              <Chip
                selected={statusFilter === 'PENDING'}
                onPress={() => setStatusFilter('PENDING')}
                style={styles.filterChip}>
                Pending
              </Chip>
              <Chip
                selected={statusFilter === 'PARTIALLY_FULFILLED'}
                onPress={() => setStatusFilter('PARTIALLY_FULFILLED')}
                style={styles.filterChip}>
                Partial
              </Chip>
              <Chip
                selected={statusFilter === 'COMPLETED'}
                onPress={() => setStatusFilter('COMPLETED')}
                style={styles.filterChip}>
                Completed
              </Chip>
            </View>
          </View>

          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }>
            {filteredRequests.length > 0 ? (
              filteredRequests.map(request => (
                <Card
                  key={request.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('RequestDetails', {
                      requestId: request.id,
                    })
                  }>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <View>
                        <Title>
                          {request.storeName}{' '}
                          {getPriorityIcon(request.priority || 'NORMAL')}
                        </Title>
                        <Paragraph>
                          Request #{request.id.slice(-6)} -{' '}
                          {formatDate(request.requestDate)}
                        </Paragraph>
                      </View>
                      <Chip
                        style={[
                          styles.statusChip,
                          {backgroundColor: getStatusColor(request.status)},
                        ]}>
                        {request.status}
                      </Chip>
                    </View>

                    <View style={styles.itemInfo}>
                      <Text style={styles.infoText}>
                        Items: {request.items}
                      </Text>
                      <Text style={styles.infoText}>
                        Quantity: {request.totalQuantity}
                      </Text>
                    </View>
                  </Card.Content>

                  <Card.Actions>
                    <Button
                      mode="contained"
                      onPress={() =>
                        navigation.navigate('RequestDetails', {
                          requestId: request.id,
                        })
                      }
                      style={styles.actionButton}
                      disabled={
                        request.status === REQUEST_STATUS.FULFILLED ||
                        request.status === REQUEST_STATUS.CANCELLED
                      }>
                      {request.status === REQUEST_STATUS.PENDING
                        ? 'Process'
                        : 'View Details'}
                    </Button>
                  </Card.Actions>
                </Card>
              ))
            ) : (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.emptyText}>
                    No requests match your filters
                  </Text>
                </Card.Content>
              </Card>
            )}
          </ScrollView>
        </View>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchbar: {
    marginBottom: 16,
    elevation: 2,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
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
  itemInfo: {
    flexDirection: 'row',
    marginTop: 8,
  },
  infoText: {
    marginRight: 16,
  },
  actionButton: {
    backgroundColor: colors.primary,
  },
  emptyCard: {
    marginTop: 32,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 16,
  },
});

export default StoreRequestsScreen;
