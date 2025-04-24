import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, View, ActivityIndicator, Alert } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { generateClient } from 'aws-amplify/api';
import { listProducts, listVariants, listAddons, getWarehouseProduct } from '../../graphql/queries';
import { createCategoryWithDetails, fetchCategories, syncOfflineActions, setOfflineMode } from '../../redux/slices/categorySlice';
import { useStore } from '../../context/StoreContext';
import Appbar from '../../components/Appbar';
import SearchBar from '../../components/SearchBar';
import ModalInputForm from '../../components/ModalInputForm';
import Products from '../../components/Products';
import colors from '../../themes/colors';

const client = generateClient();

const ProductsScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { currentStore, currentStaff, staffStores, fetchStores } = useStore();
  const [term, setTerm] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  
  // Get categories from Redux store
  const { 
    items: categories,
    loading: categoryLoading,
    error: categoryError,
    offlineMode 
  } = useSelector(state => state.categories);

  // Check connection and sync on mount
  useEffect(() => {
    const checkConnectionAndSync = async () => {
      const { isConnected } = await NetInfo.fetch();
      dispatch(setOfflineMode(!isConnected));
      if (isConnected) {
        dispatch(syncOfflineActions());
      }
    };
    checkConnectionAndSync();
  }, [dispatch]);

  // Subscribe to network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      dispatch(setOfflineMode(!state.isConnected));
      if (state.isConnected) {
        dispatch(syncOfflineActions());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Initialize store context and fetch data
  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        // First ensure we have the latest store data
        if (!initialized) {
          console.log('Fetching stores...');
          await fetchStores();
          setInitialized(true);
        }

        // Wait for store context to be initialized
        if (!currentStore) {
          console.log('Waiting for store initialization...');
          return;
        }

        console.log('Current store:', currentStore);

        // Fetch categories and products
        dispatch(fetchCategories());
        await fetchProducts();
      } catch (error) {
        console.error('Error in initialization:', error);
        setError('Failed to initialize. Please try again.');
      }
    };

    initializeAndFetch();
  }, [dispatch, currentStore, fetchStores, initialized]);



  const fetchProductDetails = async (productId) => {
    try {
      // Fetch variants
      const variantsResult = await client.graphql({
        query: listVariants,
        variables: {
          filter: { productId: { eq: productId } }
        }
      });

      // Fetch addons
      const addonsResult = await client.graphql({
        query: listAddons,
        variables: {
          filter: { productId: { eq: productId } }
        }
      });

      return {
        variants: variantsResult.data?.listVariants?.items || [],
        addons: addonsResult.data?.listAddons?.items || []
      };
    } catch (error) {
      console.error('Error fetching product details:', error);
      return { variants: [], addons: [] };
    }
  };

  const fetchProducts = async () => {
    if (!currentStore?.id) {
      console.log('No store selected, skipping product fetch');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching store products for store ID:', currentStore.id);
      const result = await client.graphql({
        query: listProducts,
        variables: {
          filter: {
            storeId: { eq: currentStore.id },
            isActive: { eq: true }
          }
        }
      });
      
      const productItems = result.data.listProducts.items || [];
      console.log(`Fetched ${productItems.length} products for store`);
      
      // Split products into regular and warehouse-sourced
      const regularProducts = productItems.filter(product => !product.warehouseProductId);
      const warehouseProducts = productItems.filter(product => product.warehouseProductId);
      
      console.log(`Found ${regularProducts.length} regular products and ${warehouseProducts.length} warehouse-sourced products`);
      
      if (productItems.length === 0) {
        console.log('No products found for this store');
        setProducts([]);
        setError('No products found for this store. Try requesting items from the warehouse.');
      } else {
        // Process all products to get additional details
        const productsWithDetails = await Promise.all(
          productItems.map(async (product) => {
            // Get variants and addons for all products
            const details = await fetchProductDetails(product.id);
            
            // For warehouse products, fetch additional details from warehouse
            if (product.warehouseProductId) {
              try {
                // Get the warehouse product details to ensure complete information
                const productResult = await client.graphql({
                  query: getWarehouseProduct,
                  variables: { id: product.warehouseProductId }
                });
                
                const warehouseProduct = productResult.data.getWarehouseProduct;
                if (warehouseProduct) {
                  // Enhance with warehouse data if available
                  return {
                    ...product,
                    // These fields might be more up-to-date from warehouse
                    brand: product.brand || warehouseProduct.brand || '',
                    sku: product.sku || warehouseProduct.sku || '',
                    categoryId: product.categoryId || warehouseProduct.categoryId,
                    // Keep original store stock but mark as warehouse product
                    isWarehouseProduct: true,
                    variants: details.variants,
                    addons: details.addons
                  };
                }
              } catch (err) {
                console.log('Error fetching warehouse details, using store product data:', err);
              }
            }
            
            // Return product with variants and addons
            return {
              ...product,
              variants: details.variants,
              addons: details.addons
            };
          })
        );
        
        console.log(`Processed ${productsWithDetails.length} products with details`);
        setProducts(productsWithDetails);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const saveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Error', 'Category name is required!');
      return;
    }

    if (!currentStore?.id) {
      Alert.alert('Error', 'Store information is missing');
      return;
    }

    try {
      const newCategory = {
        name: categoryName.trim(),
        storeId: currentStore.id
      };

      await dispatch(createCategoryWithDetails(newCategory));
      setCategoryName('');
      
      if (!offlineMode) {
        Alert.alert('Success', 'Category created successfully');
      } else {
        Alert.alert('Offline Mode', 'Category will be synced when online');
      }
    } catch (err) {
      console.log('Category save error:', err);
      Alert.alert('Error', 'Failed to save category. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar
        title="Products Dashboard"
        onMenuPress={() => navigation.toggleDrawer()}
        onSearchPress={() => console.log('Search pressed')}
        onNotificationPress={() => console.log('Notifications pressed')}
        onProfilePress={() => console.log('Profile pressed')}
      />

      <View style={styles.content}>
        {/* Quick Actions Deck */}
        <View style={styles.deck}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateProduct')}>
            <Image
              source={require('../../../assets/add_product.png')}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('BatchEdit')}>
            <Image
              source={require('../../../assets/edit.png')}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Batch Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('DeliveryRequest', {
                storeId: currentStore?.id,
                storeName: currentStore?.name,
              })
            }>
            <Image
              source={require('../../../assets/add_product.png')}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Request Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('StoreRequests')}>
            <Image
              source={
                require('../../../assets/add_product.png') ||
                require('../../../assets/add_cat.png')
              }
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>View Requests</Text>
          </TouchableOpacity>

          <ModalInputForm
            displayComponent={
              <View style={styles.actionButton}>
                <Image
                  source={require('../../../assets/add_cat.png')}
                  style={styles.actionIcon}
                />
                <Text style={styles.actionText}>Add Category</Text>
              </View>
            }
            title="Add Category"
            onSave={saveCategory}>
            <TextInput
              mode="outlined"
              label="Category"
              placeholder="Category Name"
              value={categoryName}
              onChangeText={text => setCategoryName(text)}
            />
          </ModalInputForm>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('BatchAdd')}>
            <Image
              source={require('../../../assets/batch_add.png')}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Batch Add</Text>
          </TouchableOpacity>
        </View>

        {/* Products Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : categoryError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{categoryError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                dispatch(fetchCategories());
                fetchProducts();
              }}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Products
            products={products}
            navigation={navigation}
            categories={categories}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    padding: 16
  },
  deck: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10
  },
  actionIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain'
  },
  actionText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
    color: colors.text
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    marginBottom: 10
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default ProductsScreen;
