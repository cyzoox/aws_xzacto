import React, {useState, useEffect} from 'react';
import {
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import {useDispatch, useSelector} from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { generateClient } from 'aws-amplify/api';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  listProducts,
  listVariants,
  listAddons,
  getWarehouseProduct,
} from '../../graphql/queries';
import {
  createCategoryWithDetails,
  fetchCategories,
  syncOfflineActions,
  setOfflineMode,
} from '../../redux/slices/categorySlice';
import {useStore} from '../../context/StoreContext';

import ModalInputForm from '../../components/ModalInputForm';
import Products from '../../components/Products';
import colors from '../../themes/colors';
import Appbar from '../../components/Appbar';
import Cards from '../../components/Cards';
import ModalInputFormRevamp from '../../components/ModalInputFormRevamp';

const client = generateClient();

const ProductsScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  // Get store directly from route params if available
   const STORE = route.params.store;

  // Still use StoreContext as fallback
  const {
    currentStore: contextStore,
    currentStaff,
    staffStores,
    fetchStores,
  } = useStore();

  // Use store from params if available, otherwise fall back to context
  const [activeStore, setActiveStore] = useState(
    STORE || contextStore,
  );

  const [term, setTerm] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Get categories from Redux store
  const {
    items: categories,
    loading: categoryLoading,
    error: categoryError,
    offlineMode,
  } = useSelector(state => state.categories);

  // Check connection and sync on mount
  useEffect(() => {
    const checkConnectionAndSync = async () => {
      const {isConnected} = await NetInfo.fetch();
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

  // Initialize data on mount and when store changes
  useEffect(() => {
    console.log('Route params changed:', route.params);
    
    // Check if we need to refresh products (coming from product creation/edit)
    if (route.params?.refresh) {
      console.log('Refresh flag detected, refreshing products');
      fetchProducts();
    }
    
    // Update active store if it comes from navigation params
    if (route.params?.store) {
      console.log(
        'Setting active store from navigation params:',
        route.params.store.name,
      );
      setActiveStore(route.params.store);
    }
    
    // Clear the refresh flag from navigation params to avoid repeated refreshes
    if (route.params?.refresh) {
      navigation.setParams({ refresh: undefined, timestamp: undefined });
    }
  }, [route.params]);

  // Fetch products when active store changes or on initial load
  useEffect(() => {
    if (activeStore?.id) {
      console.log(
        'Active store changed, fetching products for:',
        activeStore.name,
      );
      fetchProducts();
      // Pass storeId when fetching categories
      dispatch(fetchCategories(activeStore.id));
      setInitialized(true);
    } else if (!initialized) {
      // Initialize with whatever store we have
      console.log('No active store, using fallback initialization');
      fetchProducts();
      // No store ID, so categories might not be filtered correctly
      dispatch(fetchCategories(null));
      setInitialized(true);
    }
  }, [activeStore, initialized, dispatch]);

  const fetchProductDetails = async productId => {
    try {
      // Fetch variants
      const variantsResult = await client.graphql({
        query: listVariants,
        variables: {
          filter: {productId: {eq: productId}},
        },
      });

      // Fetch addons
      const addonsResult = await client.graphql({
        query: listAddons,
        variables: {
          filter: {productId: {eq: productId}},
        },
      });

      return {
        variants: variantsResult.data?.listVariants?.items || [],
        addons: addonsResult.data?.listAddons?.items || [],
      };
    } catch (error) {
      console.error('Error fetching product details:', error);
      return {variants: [], addons: []};
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    // Add detailed debugging
    console.log('Debug - Store state:', {
      activeStore: activeStore ? activeStore.name : 'null',
      storeId: activeStore?.id || 'missing',
      storeIdValue: activeStore?.id, // Log the exact value for comparison
      fromParams: !!route.params?.store,
    });

    // Check if the ID matches the one you're having trouble with
    if (activeStore?.id === 'f497bddc-b993-41b0-93e4-671804dbacbb') {
      console.log(
        '📊 MATCHING STORE ID DETECTED - Special handling for problematic store ID',
      );
    }

    try {
      // Simplify to the most direct query possible
      console.log('Attempting direct query for ALL products without filtering');

      try {
        // Use the simplest possible GraphQL query
        const result = await client.graphql({
          query: `query SimpleListProducts {
            listProducts {
              items {
                id
                name
                brand
                stock
                storeId
                sprice
                img
                isActive
                categoryId
              }
            }
          }`,
        });

        // Check if we got a valid response
        if (result?.data?.listProducts?.items) {
          const allProducts = result.data.listProducts.items;
          console.log(
            `SUCCESS: Fetched ${allProducts.length} total products with simple query`,
          );

          // Filter products to only include those belonging to the active store
          if (activeStore?.id) {
            const storeProducts = allProducts.filter(
              product => product.storeId === activeStore.id,
            );
            console.log(
              `After filtering: ${storeProducts.length} products belong to store ${activeStore.name} (ID: ${activeStore.id})`,
            );

            // Debug any mismatched products
            if (storeProducts.length < allProducts.length) {
              const mismatchedProducts = allProducts.filter(
                product => product.storeId !== activeStore.id,
              );
              console.log(
                'Products with mismatched store IDs:',
                mismatchedProducts.map(p => ({
                  name: p.name,
                  storeId: p.storeId,
                })),
              );
            }

            setProducts(storeProducts);
          } else {
            // If no active store, still show all products but with a warning
            console.warn('No active store selected, showing all products');
            setProducts(allProducts);
          }

          setError(null);
          setLoading(false);
          return;
        } else {
          console.error('Direct query returned invalid structure:', result);
        }
      } catch (directQueryError) {
        console.error('Direct query error:', directQueryError);
      }

      // Normal flow with valid activeStore
      if (activeStore?.id) {
        console.log('Fetching store products for store ID:', activeStore.id);

        // Use a more direct and simpler query with explicit filter
        const result = await client.graphql({
          query: `query GetProductsByStore($storeId: ID!) {
            listProducts(filter: {storeId: {eq: $storeId}}) {
              items {
                id
                name
                brand
                stock
                storeId
                sprice
                oprice
                img
                isActive
                categoryId
                subcategory
                sku
                description
                warehouseProductId
                createdAt
                updatedAt
              }
            }
          }`,
          variables: {
            storeId: activeStore.id,
          },
        });

        const productItems = result.data.listProducts.items || [];
        console.log(`Fetched ${productItems.length} products for store`);

        // Split products into regular and warehouse-sourced
        const regularProducts = productItems.filter(
          product => !product.warehouseProductId,
        );
        const warehouseProducts = productItems.filter(
          product => product.warehouseProductId,
        );

        console.log(
          `Found ${regularProducts.length} regular products and ${warehouseProducts.length} warehouse-sourced products`,
        );

        if (productItems.length === 0) {
          console.log('No products found for this store');
          setProducts([]);
          setError(
            'No products found for this store. Try requesting items from the warehouse.',
          );
        } else {
          // Process all products to get additional details
          const productsWithDetails = await Promise.all(
            productItems.map(async product => {
              // Get variants and addons for all products
              const details = await fetchProductDetails(product.id);

              // For warehouse products, fetch additional details from warehouse
              if (product.warehouseProductId) {
                try {
                  // Get the warehouse product details to ensure complete information
                  const productResult = await client.graphql({
                    query: getWarehouseProduct,
                    variables: {id: product.warehouseProductId},
                  });

                  const warehouseProduct =
                    productResult.data.getWarehouseProduct;
                  if (warehouseProduct) {
                    // Enhance with warehouse data if available
                    return {
                      ...product,
                      // These fields might be more up-to-date from warehouse
                      brand: product.brand || warehouseProduct.brand || '',
                      sku: product.sku || warehouseProduct.sku || '',
                      categoryId:
                        product.categoryId || warehouseProduct.categoryId,
                      // Keep original store stock but mark as warehouse product
                      isWarehouseProduct: true,
                      variants: details.variants,
                      addons: details.addons,
                    };
                  }
                } catch (err) {
                  console.log(
                    'Error fetching warehouse details, using store product data:',
                    err,
                  );
                }
              }

              // Return product with variants and addons
              return {
                ...product,
                variants: details.variants,
                addons: details.addons,
              };
            }),
          );

          console.log(
            `Processed ${productsWithDetails.length} products with details`,
          );
          setProducts(productsWithDetails);
        }

        setError(null);
      }
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

    if (!activeStore?.id) {
      Alert.alert('Error', 'Store information is missing');
      return;
    }

    try {
      const newCategory = {
        name: categoryName.trim(),
        storeId: activeStore.id,
      };

      console.log(
        'Creating category for store:',
        activeStore.name,
        'with ID:',
        activeStore.id,
      );

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
      <Appbar title="Products Dashboard" hideMenuButton onBack={() => navigation.goBack()} subtitle={activeStore.name}/>
      <Cards>
        <View style={styles.metricsContainer}>
          <TouchableOpacity
            style={styles.metricItem}
            onPress={() => {
              const storeCategories = categories.filter(
                cat => cat.storeId === activeStore?.id,
              );

              if (!storeCategories || storeCategories.length === 0) {
                Alert.alert(
                  'No Categories',
                  'You need to create at least one category before adding products.',
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'Add Category',
                      onPress: () => {
                        setCategoryName('');
                        setCategoryModalVisible(true);
                      },
                    },
                  ],
                );
              } else {
                navigation.navigate('CreateProduct', {store: activeStore});
              }
            }}>
            <View style={[styles.iconContainer, {backgroundColor: '#FFF3E0'}]}>
              <Icon name="add-shopping-cart" size={24} color="#F57C00" />
            </View>

            <Text style={styles.metricLabel}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricItem}
            onPress={() =>
             setCategoryModalVisible(true)
            }>
            <View style={[styles.iconContainer, {backgroundColor: '#FFF3E0'}]}>
              <Icon name="add-to-photos" size={24} color="#F57C00" />
            </View>

            <Text style={styles.metricLabel}>Add Category</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricItem}
            onPress={() =>
              navigation.navigate('BatchEdit', {store: activeStore})
            }>
            <View style={[styles.iconContainer, {backgroundColor: '#FFF3E0'}]}>
              <Icon name="edit-note" size={24} color="#F57C00" />
            </View>

            <Text style={styles.metricLabel}>Batch Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.metricItem}
            onPress={() =>
              navigation.navigate('BatchAdd', {store: activeStore})
            }>
            <View style={[styles.iconContainer, {backgroundColor: '#FFF3E0'}]}>
              <Icon name="add-shopping-cart" size={24} color="#F57C00" />
            </View>

            <Text style={styles.metricLabel}>Batch Add</Text>
          </TouchableOpacity>
        </View>
      </Cards>
      <View style={styles.content}>
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
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchProducts()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {categories.length === 0 && (
              <View
                style={{
                  padding: 10,
                  backgroundColor: '#f8d7da',
                  margin: 10,
                  borderRadius: 5,
                }}>
                <Text style={{color: '#721c24'}}>
                  No categories found. Try adding a category using the button
                  above.
                </Text>
              </View>
            )}

            <Products
              products={products}
              navigation={navigation}
              categories={categories}
              activeStore={activeStore} // Pass the active store explicitly
            />
          </>
        )}

        <ModalInputFormRevamp
          isVisible={categoryModalVisible}
          onCancel={() => setCategoryModalVisible(false)}
          title="Add Category"
          onSave={category => {
            saveCategory(category);
            setCategoryModalVisible(false);
          }}>
          <TextInput
            mode="outlined"
            label="Category"
            placeholder="Category Name"
            value={categoryName}
            onChangeText={text => setCategoryName(text)}
          />
        </ModalInputFormRevamp>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    marginBottom: 50,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  deck: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  actionIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  actionText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Metrics
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ProductsScreen;
