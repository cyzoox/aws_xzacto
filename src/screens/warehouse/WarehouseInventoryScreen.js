import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Searchbar,
  Card,
  Title,
  Paragraph,
  FAB,
  Badge,
  Button,
} from 'react-native-paper';
import Appbar from '../../components/Appbar';
import {colors} from '../../constants/theme';
import {generateClient} from 'aws-amplify/api';
import {listWarehouseProducts} from '../../graphql/queries';

// Generate API client
const client = generateClient();

// Simplified for direct rendering without complex data processing
const LOW_STOCK_THRESHOLD = 10;

const WarehouseInventoryScreen = ({navigation, route}) => {
  const {staffData} = route.params || {};
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Fetch products from backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      console.log('Fetching warehouse products...');
      const productsData = await client.graphql({
        query: listWarehouseProducts,
      });
      console.log('Warehouse products fetched:', productsData);
      setProducts(productsData.data.listWarehouseProducts.items || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(
    product =>
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Helper to render stock status
  const renderStockStatus = stock => {
    if (stock <= 0) {
      return <Badge style={styles.outOfStock}>Out of Stock</Badge>;
    } else if (stock <= LOW_STOCK_THRESHOLD) {
      return <Badge style={styles.lowStock}>{stock} left</Badge>;
    } else {
      return <Text>{stock} in stock</Text>;
    }
  };

  const handleLogout = () => {
    // Navigate to role selection screen for switching users
    navigation.reset({
      index: 0,
      routes: [{name: 'RoleSelection'}],
    });
  };

  return (
    <View style={styles.container}>
      <Appbar
        title="Warehouse Inventory"
        subtitle="Manage inventory and stock levels"
        onProfilePress={handleLogout}
      />

      <View style={styles.content}>
        <Searchbar
          placeholder="Search products"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('WarehouseProductAdd')}
            style={styles.actionButton}>
            Add Product
          </Button>
          <Button
            mode="outlined"
            onPress={fetchProducts}
            style={[styles.actionButton, styles.refreshButton]}
            disabled={loading}>
            Refresh
          </Button>
        </View>

        <ScrollView style={styles.productList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : error ? (
            <Card style={styles.errorCard}>
              <Card.Content>
                <Paragraph style={styles.errorText}>{error}</Paragraph>
                <Button
                  mode="contained"
                  onPress={fetchProducts}
                  style={styles.retryButton}>
                  Retry
                </Button>
              </Card.Content>
            </Card>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <Card key={product.id} style={styles.productCard}>
                <Card.Content>
                  <View style={styles.productHeader}>
                    <Title>{product.name}</Title>
                    {renderStockStatus(product.availableStock)}
                  </View>
                  <View style={styles.productDetails}>
                    <View style={styles.detailColumn}>
                      <Paragraph>SKU: {product.sku || 'N/A'}</Paragraph>
                      <Paragraph>
                        Category: {product.category || 'N/A'}
                      </Paragraph>
                      <Paragraph>
                        Location: {product.location || 'N/A'}
                      </Paragraph>
                      <Paragraph>
                        Supplier: {product.supplier || 'N/A'}
                      </Paragraph>
                    </View>
                    <View style={styles.priceColumn}>
                      <Paragraph style={styles.price}>
                        ₱{(product.sellingPrice || 0).toFixed(2)}
                      </Paragraph>
                      <Paragraph style={styles.purchasePrice}>
                        Cost: ₱{(product.purchasePrice || 0).toFixed(2)}
                      </Paragraph>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() =>
                          navigation.navigate('WarehouseProductEdit', {
                            productId: product.id,
                          })
                        }>
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Paragraph style={styles.emptyText}>
                  No products found.
                </Paragraph>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </View>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('WarehouseProductAdd')}
        label="Add Product"
      />

      <FAB
        style={styles.logoutFab}
        icon="logout"
        onPress={handleLogout}
        label="Logout"
        small
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
    gap: 10,
  },
  actionButton: {
    backgroundColor: colors.primary,
  },
  refreshButton: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorCard: {
    padding: 10,
    marginBottom: 16,
    backgroundColor: '#fee',
  },
  errorText: {
    color: '#c00',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  productList: {
    flex: 1,
  },
  productCard: {
    marginBottom: 12,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailColumn: {
    flex: 2,
  },
  priceColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  purchasePrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  outOfStock: {
    backgroundColor: '#ffcdd2',
  },
  lowStock: {
    backgroundColor: '#ffecb3',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
  logoutFab: {
    position: 'absolute',
    margin: 16,
    left: 0,
    bottom: 0,
    backgroundColor: '#e53935',
  },
});

export default WarehouseInventoryScreen;
