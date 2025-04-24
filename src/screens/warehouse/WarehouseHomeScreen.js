import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Button, FAB, Divider, ActivityIndicator } from 'react-native-paper';
import Appbar from '../../components/Appbar';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { colors } from '../../constants/theme';
import { generateClient } from 'aws-amplify/api';
import { listWarehouseProducts, listInventoryRequests } from '../../graphql/queries';

// Define styles first
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
  },
  listCard: {
    marginBottom: 8,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardColumn: {
    flex: 2,
  },
  stockIndicator: {
    backgroundColor: '#ffecb3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stockText: {
    color: '#e65100',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: colors.primary,
  },
  emptyCard: {
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
  },
  viewMoreButton: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});

// Constants for status values
const REQUEST_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PARTIALLY_FULFILLED: 'PARTIALLY_FULFILLED',
  FULFILLED: 'FULFILLED',
  CANCELLED: 'CANCELLED'
};

const LOW_STOCK_THRESHOLD = 10;

const WarehouseHomeScreen = ({ navigation, route }) => {
  const { staffData } = route.params || {};
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isOnline, hasPendingChanges } = useNetworkStatus();
  const client = generateClient();
  
  // State for warehouse data
  const [warehouseProducts, setWarehouseProducts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [productCount, setProductCount] = useState(0);

  // Fetch warehouse products
  const fetchWarehouseProducts = async () => {
    try {
      const productsData = await client.graphql({
        query: listWarehouseProducts,
        variables: {
          filter: { isActive: { eq: true } }
        }
      });
      
      const products = productsData.data.listWarehouseProducts.items;
      setWarehouseProducts(products);
      setProductCount(products.length);
      
      // Filter low stock products
      const lowStock = products.filter(product => 
        product.availableStock <= (product.reorderPoint || LOW_STOCK_THRESHOLD)
      );
      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error fetching warehouse products:', error);
    }
  };

  // Fetch inventory requests
  const fetchInventoryRequests = async () => {
    try {
      const requestsData = await client.graphql({
        query: listInventoryRequests,
        variables: {
          filter: { status: { eq: REQUEST_STATUS.PENDING } }
        }
      });
      
      const requests = requestsData.data.listInventoryRequests.items;
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error fetching inventory requests:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchWarehouseProducts(),
        fetchInventoryRequests()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchWarehouseProducts(),
      fetchInventoryRequests()
    ]).finally(() => setRefreshing(false));
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Appbar
          title="Warehouse Dashboard"
          subtitle={`Welcome, ${staffData?.name || 'Warehouse Staff'}`}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading warehouse data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar
        title="Warehouse Dashboard"
        subtitle={`Welcome, ${staffData?.name || 'Warehouse Staff'}`}
      />
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.sectionTitle}>Quick Summary</Text>
        
        <View style={styles.cardsContainer}>
          <Card style={styles.card}>
            <Card.Content>
              <Title>{productCount}</Title>
              <Paragraph>Total Products</Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={styles.card}>
            <Card.Content>
              <Title>{lowStockProducts.length}</Title>
              <Paragraph>Low Stock Items</Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={styles.card}>
            <Card.Content>
              <Title>{pendingRequests.length}</Title>
              <Paragraph>Pending Requests</Paragraph>
            </Card.Content>
          </Card>
        </View>
        
        <Text style={styles.sectionTitle}>Low Stock Products</Text>
        {lowStockProducts.length > 0 ? (
          lowStockProducts.slice(0, 5).map(product => (
            <Card key={product.id} style={styles.listCard}>
              <Card.Content>
                <View style={styles.cardRow}>
                  <View style={styles.cardColumn}>
                    <Title>{product.name}</Title>
                    <Paragraph>{product.brand || 'No Brand'}</Paragraph>
                  </View>
                  <View style={styles.stockIndicator}>
                    <Text style={styles.stockText}>Stock: {product.availableStock}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph style={styles.emptyText}>No low stock products</Paragraph>
            </Card.Content>
          </Card>
        )}
        
        {lowStockProducts.length > 5 && (
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('WarehouseInventory')}
            style={styles.viewMoreButton}
          >
            View All Low Stock Items
          </Button>
        )}
        
        <Text style={styles.sectionTitle}>Pending Store Requests</Text>
        {pendingRequests.length > 0 ? (
          pendingRequests.slice(0, 5).map(request => (
            <Card key={request.id} style={styles.listCard}>
              <Card.Content>
                <View style={styles.cardRow}>
                  <View style={styles.cardColumn}>
                    <Title>Request #{request.id.slice(-6)}</Title>
                    <Paragraph>
                      {new Date(request.requestDate).toLocaleDateString()}
                    </Paragraph>
                  </View>
                  <Button 
                    mode="contained" 
                    compact 
                    onPress={() => navigation.navigate('RequestDetails', { requestId: request.id })} 
                    style={styles.actionButton}
                  >
                    Process
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph style={styles.emptyText}>No pending orders</Paragraph>
            </Card.Content>
          </Card>
        )}
        
        {pendingRequests.length > 5 && (
          <Button 
            mode="text" 
            onPress={() => navigation.navigate('StoreRequests')}
            style={styles.viewMoreButton}
          >
            View All Store Requests
          </Button>
        )}
      </ScrollView>
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('WarehouseProductAdd')}
        label="Add Product"
      />
    </View>
  );
};

export default WarehouseHomeScreen;
