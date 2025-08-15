import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Badge,
  Menu,
  Button,
  Provider,
} from 'react-native-paper';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Appbar from '../../components/Appbar';
import {generateClient} from 'aws-amplify/api';
import {listInventoryRequests, getStore} from '../../graphql/queries';
import colors from '../../themes/colors';

const StoreRequestsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING'); // Default to PENDING
  const [menuVisible, setMenuVisible] = useState(false);

  const client = generateClient();

  const fetchInventoryRequests = async () => {
    setLoading(true);
    try {
      const requestsData = await client.graphql({query: listInventoryRequests});
      let inventoryRequests = requestsData.data.listInventoryRequests.items;

      const requestsWithStoreNames = await Promise.all(
        inventoryRequests.map(async request => {
          try {
            const storeData = await client.graphql({
              query: getStore,
              variables: {id: request.storeId},
            });
            const store = storeData.data.getStore;
            const itemCount = request.requestItems?.items?.length || 0;

            return {
              ...request,
              storeName: store ? store.name : 'N/A',
              itemCount,
            };
          } catch (error) {
            console.error('Error fetching store for request:', request.id, error);
            return {
              ...request,
              storeName: 'Error',
              itemCount: 0,
            };
          }
        }),
      );
      setRequests(requestsWithStoreNames);
    } catch (error) {
      console.error('Error fetching inventory requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInventoryRequests();
    }, []),
  );

  const filteredRequests = useMemo(() => {
    return requests
      .filter(
        request =>
          ((request.storeName &&
            request.storeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            request.id.toLowerCase().includes(searchQuery.toLowerCase())) &&
          (!statusFilter || request.status === statusFilter),
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [requests, searchQuery, statusFilter]);

  const getStatusChipColor = status => {
    switch (status) {
      case 'PENDING':
        return '#FFA000';
      case 'PARTIALLY_FULFILLED':
        return '#2196F3';
      case 'FULFILLED':
        return '#4CAF50';
      case 'CANCELLED':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderRequestItem = ({item}) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('RequestDetails', {requestId: item.id})}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>{item.storeName}</Title>
            <Badge style={{backgroundColor: getStatusChipColor(item.status)}}>
              {item.status}
            </Badge>
          </View>
          <Paragraph>Order ID: {item.id}</Paragraph>
          <Paragraph>Items: {item.itemCount}</Paragraph>
          <Paragraph>
            Date: {new Date(item.createdAt).toLocaleDateString()}
          </Paragraph>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <Provider>
      <View style={styles.container}>
        <Appbar title="Delivery Request" subtitle="Warehouse" hideMenuButton/>
        <View style={styles.controlsContainer}>
          <Searchbar
            placeholder="Search by store or order ID"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                onPress={() => setMenuVisible(true)}
                mode="outlined"
                style={styles.filterButton}
                labelStyle={styles.filterButtonLabel}
                icon="filter-variant"
              >
                {statusFilter || 'All'}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => {
                setStatusFilter('');
                setMenuVisible(false);
              }}
              title="All"
            />
            <Menu.Item
              onPress={() => {
                setStatusFilter('PENDING');
                setMenuVisible(false);
              }}
              title="Pending"
            />
            <Menu.Item
              onPress={() => {
                setStatusFilter('PARTIALLY_FULFILLED');
                setMenuVisible(false);
              }}
              title="Partially Fulfilled"
            />
            <Menu.Item
              onPress={() => {
                setStatusFilter('FULFILLED');
                setMenuVisible(false);
              }}
              title="Fulfilled"
            />
          </Menu>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No requests found.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRequests}
            renderItem={renderRequestItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </Provider>
  );
};

export default StoreRequestsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  searchbar: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    justifyContent: 'center',
  },
  filterButtonLabel: {
    textTransform: 'capitalize',
  },
  list: {
    paddingHorizontal: 8,
  },
  card: {
    marginVertical: 8,
    marginHorizontal: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: 'gray',
  },
});
