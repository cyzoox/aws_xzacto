import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { selectStoreSettings } from '../../redux/slices/storeSettingsSlice';
import { DataStore } from '@aws-amplify/datastore';
import { FontAwesome } from '@expo/vector-icons';

/**
 * LowStockAlert - Component for displaying products with low stock
 * based on the store settings lowStockThreshold value
 * 
 * Demonstrates:
 * 1. Integration of store settings with product inventory
 * 2. Real-time threshold-based alerts
 * 3. Direct DataStore queries with Redux integration
 */
const LowStockAlert = ({ storeId, onProductPress }) => {
  const dispatch = useDispatch();
  const storeSettings = useSelector(selectStoreSettings);
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  
  // Get threshold from store settings, default to 10 if not set
  const threshold = storeSettings?.lowStockThreshold || 10;

  // Load low stock products when the component mounts or threshold changes
  useEffect(() => {
    const fetchLowStockProducts = async () => {
      if (!storeId) return;
      
      try {
        setLoading(true);
        
        // Fetch all products for this store from DataStore
        // In a real app, you'd want to use a more efficient query that
        // directly filters for low stock items on the server side
        const allProducts = await DataStore.query(Product, p => p.storeId.eq(storeId));
        
        // Filter products with quantity below threshold
        const lowStock = allProducts.filter(product => 
          product.quantity <= threshold && product.quantity > 0
        );
        
        setLowStockProducts(lowStock);
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockProducts();
    
    // Set up a subscription for real-time updates
    const subscription = DataStore.observe(Product).subscribe(msg => {
      // When a product changes, check if it needs to be added/removed from low stock list
      const product = msg.element;
      if (product.storeId === storeId) {
        fetchLowStockProducts();
      }
    });
    
    return () => {
      // Clean up subscription when component unmounts
      subscription.unsubscribe();
    };
  }, [storeId, threshold]);

  // Don't show anything if no low stock products
  if (!loading && lowStockProducts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome name="check-circle" size={22} color="#4caf50" />
        <Text style={styles.emptyText}>All products are above the low stock threshold</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FontAwesome name="exclamation-triangle" size={18} color="#ff9800" />
        <Text style={styles.title}>Low Stock Alert</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{lowStockProducts.length}</Text>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2089dc" />
          <Text style={styles.loadingText}>Checking inventory...</Text>
        </View>
      ) : (
        <FlatList
          data={lowStockProducts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.productItem}
              onPress={() => onProductPress && onProductPress(item)}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.productSku}>
                  {item.sku || 'No SKU'}
                </Text>
              </View>
              
              <View style={styles.stockInfo}>
                <Text style={[
                  styles.stockValue,
                  item.quantity <= threshold / 2 ? styles.criticalStock : styles.warningStock
                ]}>
                  {item.quantity}
                </Text>
                <Text style={styles.stockUnit}>units</Text>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Low Stock Products</Text>
            </TouchableOpacity>
          }
        />
      )}
    </View>
  );
};

// Placeholder for the Product model
// In a real application, this would be imported from your models directory
class Product {
  constructor(init) {
    Object.assign(this, init);
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eaeaea',
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff9800',
    marginLeft: 8,
    flex: 1,
  },
  badge: {
    backgroundColor: '#ff9800',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  emptyContainer: {
    padding: 16,
    backgroundColor: '#f1f8e9',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    marginLeft: 8,
    color: '#4caf50',
    fontWeight: '500',
    flex: 1,
  },
  productItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 13,
    color: '#777',
  },
  stockInfo: {
    alignItems: 'flex-end',
  },
  stockValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningStock: {
    color: '#ff9800',
  },
  criticalStock: {
    color: '#f44336',
  },
  stockUnit: {
    fontSize: 12,
    color: '#777',
  },
  viewAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2089dc',
    fontWeight: '500',
  },
});

export default LowStockAlert;
