import React, {useState, useEffect, useCallback} from 'react';
import { differenceInDays } from 'date-fns';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Modal,
  Portal,
  TextInput,
  Button,
  FAB,
  Searchbar,
  ActivityIndicator as PaperActivityIndicator,
  IconButton,
} from 'react-native-paper';
import DataTable from '../../components/DataTable';
import {Grid, Col, Row} from 'react-native-easy-grid';
import Appbar from '../../components/Appbar';
import colors from '../../themes/colors';
import {generateClient} from 'aws-amplify/api';
import {listWarehouseProducts} from '../../graphql/queries';
import {updateWarehouseProduct} from '../../graphql/mutations';
import WarehouseProductAddScreen from './WarehouseProductAddScreen';

const client = generateClient();
const LOW_STOCK_THRESHOLD = 10;

const WarehouseInventoryScreen = ({navigation, route}) => {
  // Extract filter parameters from route if they exist
  const filterParams = route?.params || {};
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState(filterParams.searchQuery || ''); 
  const [categoryFilter, setCategoryFilter] = useState(filterParams.categoryFilter || '');
  const [filterType, setFilterType] = useState(filterParams.filter || 'all'); // 'all', 'lowStock', 'overstock', 'aging'
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editForm, setEditForm] = useState({name: '', sku: '', sellingPrice: '', availableStock: '', unit: '', reorderPoint: ''});
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!refreshing) setLoading(true);
    try {
      const productsData = await client.graphql({
        query: listWarehouseProducts,
      });
      setProducts(productsData.data.listWarehouseProducts.items || []);
      setError(null);
      
      // Reset filters to what came from route params when re-fetching data
      if (filterParams.searchQuery) {
        setSearchQuery(filterParams.searchQuery);
      }
      if (filterParams.categoryFilter) {
        setCategoryFilter(filterParams.categoryFilter);
      }
      if (filterParams.filter) {
        setFilterType(filterParams.filter);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      if (!refreshing) setLoading(false);
    }
  }, [refreshing, filterParams]);  // Add filterParams to dependency array

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
    });
    return unsubscribe;
  }, [navigation, fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts().finally(() => setRefreshing(false));
  }, [fetchProducts]);

  const handleEditOpen = (product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      sku: product.sku || '',
      sellingPrice: product.sellingPrice.toString(),
      availableStock: product.availableStock.toString(),
      unit: product.unit || '',
      reorderPoint: product.reorderPoint ? product.reorderPoint.toString() : '',
    });
    setIsModalVisible(true);
  };

  const handleEditClose = () => {
    setIsModalVisible(false);
    setSelectedProduct(null);
    setModalError(''); // Clear errors on close
  };

  const handleFormChange = (name, value) => {
    setEditForm(prev => ({...prev, [name]: value}));
  };

  const handleSaveChanges = async () => {
    if (!selectedProduct || isSaving) return;

    setIsSaving(true);
    setModalError('');

    const input = {
      id: selectedProduct.id,
      name: editForm.name,
      sku: editForm.sku,
      sellingPrice: parseFloat(editForm.sellingPrice),
      availableStock: parseInt(editForm.availableStock, 10),
      unit: editForm.unit || 'Units',
      reorderPoint: editForm.reorderPoint ? parseInt(editForm.reorderPoint, 10) : LOW_STOCK_THRESHOLD,
      updatedAt: new Date().toISOString(),
    };

    if (!input.name || isNaN(input.sellingPrice) || isNaN(input.availableStock)) {
      setModalError('Please fill out all fields correctly.');
      setIsSaving(false);
      return;
    }

    try {
      await client.graphql({
        query: updateWarehouseProduct,
        variables: { input },
      });
      // Refresh local data
      setProducts(prevProducts => 
        prevProducts.map(p => p.id === selectedProduct.id ? {...p, ...input} : p)
      );
      handleEditClose();
    } catch (err) {
      console.error('Error updating product:', err);
      setModalError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const applyFilters = (products) => {
    let filtered = products;
    
    // Apply text search
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        product =>
          product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    // Apply type filters
    if (filterType === 'lowStock') {
      filtered = filtered.filter(product => product.availableStock < (product.reorderPoint || LOW_STOCK_THRESHOLD));
    } else if (filterType === 'overstock') {
      filtered = filtered.filter(product => {
        const overstockThreshold = (product.reorderQuantity || 20) * 1.5;
        return product.availableStock > overstockThreshold;
      });
    } else if (filterType === 'aging') {
      const now = new Date();
      filtered = filtered.filter(product => {
        if (product.lastRestockDate) {
          const lastRestockDate = new Date(product.lastRestockDate);
          const daysSinceRestock = differenceInDays(now, lastRestockDate);
          return daysSinceRestock >= 90;
        }
        return false;
      });
    }
    
    return filtered;
  };
  
  const filteredProducts = applyFilters(products);



  return (
    <View style={styles.container}>
      <Appbar title="Inventory" subtitle="Warehouse" hideMenuButton/>
      <Searchbar
        placeholder="Search products by name or SKU"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Active Filter Indicator */}
      {(filterType !== 'all' || categoryFilter) && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFilterText}>
            Filters applied: {filterType !== 'all' && filterType}
            {filterType !== 'all' && categoryFilter ? ' + ' : ''}
            {categoryFilter ? `Category: ${categoryFilter}` : ''}
          </Text>
          <Button
            mode="text"
            compact
            onPress={() => {
              setFilterType('all');
              setCategoryFilter('');
              setSearchQuery('');
            }}>
            Clear
          </Button>
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableContainer}>
            {loading && !refreshing ? (
              <View style={styles.centered}>
                <PaperActivityIndicator
                  animating={true}
                  color={colors.primary}
                />
              </View>
            ) : error ? (
              <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : filteredProducts.length > 0 ? (
              <DataTable
                alignment="center"
                headerTitles={[
                  'Product',
                  'SKU / Barcode',
                  'Qty on Hand',
                  'Low Stock Threshold',
                  'Unit',
                  'Last Updated',
                ]}
                colStyle={[
                  { width: 200 },
                  { width: 150 },
                  { width: 100 },
                  { width: 120 },
                  { width: 100 },
                  { width: 130 }
                ]}
                total={0} // Not using total for inventory
              >
                {filteredProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    onPress={() => handleEditOpen(product)}
                    activeOpacity={0.7}>
                    <Row 
                      style={[
                        styles.dataRow,
                        product.availableStock < (product.reorderPoint || LOW_STOCK_THRESHOLD)
                          ? styles.lowStockRow
                          : null,
                      ]}
                  >
                    <Col style={{ width: 200 }}>
                      <Text style={styles.cellText}>{product.name}</Text>
                    </Col>
                    <Col style={{ width: 150 }}>
                      <Text style={styles.cellText}>{product.sku || 'N/A'}</Text>
                    </Col>
                    <Col style={{ width: 100, alignItems: 'center' }}>
                      <Text style={styles.cellText}>{product.availableStock}</Text>
                    </Col>
                    <Col style={{ width: 120, alignItems: 'center' }}>
                      <Text style={styles.cellText}>{product.reorderPoint || LOW_STOCK_THRESHOLD}</Text>
                    </Col>
                    <Col style={{ width: 100, alignItems: 'center' }}>
                      <Text style={styles.cellText}>{product.unit || 'Units'}</Text>
                    </Col>
                    <Col style={{ width: 130, alignItems: 'center' }}>
                      <Text style={styles.cellText}>
                        {product.updatedAt
                          ? new Date(product.updatedAt).toLocaleDateString()
                          : 'N/A'}
                      </Text>
                    </Col>
                  </Row>
                  </TouchableOpacity>
                ))}
              </DataTable>
            ) : (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>No products found.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollView>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('WarehouseProductAddScreen')}
        label="Add Product"
      />

      {/* <WarehouseProductAddScreen
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onProductAdded={() => {
          setIsAddModalVisible(false);
          fetchProducts();
        }}
      /> */}

      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={handleEditClose}
          contentContainerStyle={styles.modalContainer}
          style={styles.modalStyle}>
          {selectedProduct && (
            <View style={{flex: 1}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Product</Text>
              </View>
              <ScrollView style={styles.modalContent}>
                <TextInput
                  label="Product Name"
                  value={editForm.name}
                  onChangeText={text => handleFormChange('name', text)}
                  style={styles.input}
                  mode="outlined"
                  theme={{colors: {primary: colors.primary}}}
                />
                <TextInput
                  label="SKU"
                  value={editForm.sku}
                  onChangeText={text => handleFormChange('sku', text)}
                  style={styles.input}
                  mode="outlined"
                  theme={{colors: {primary: colors.primary}}}
                />
                <TextInput
                  label="Selling Price"
                  value={editForm.sellingPrice}
                  onChangeText={text => handleFormChange('sellingPrice', text)}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                  theme={{colors: {primary: colors.primary}}}
                />
                <TextInput
                  label="Available Stock"
                  value={editForm.availableStock}
                  onChangeText={text =>
                    handleFormChange('availableStock', text)
                  }
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                  theme={{colors: {primary: colors.primary}}}
                />
                <TextInput
                  label="Unit"
                  value={editForm.unit || ''}
                  onChangeText={text => handleFormChange('unit', text)}
                  style={styles.input}
                  mode="outlined"
                  theme={{colors: {primary: colors.primary}}}
                />
                <TextInput
                  label="Low Stock Threshold"
                  value={editForm.reorderPoint || ''}
                  onChangeText={text => handleFormChange('reorderPoint', text)}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                  theme={{colors: {primary: colors.primary}}}
                />
                {modalError ? (
                  <Text style={styles.modalErrorText}>{modalError}</Text>
                ) : null}
              </ScrollView>
              <View style={styles.modalActions}>
                <Button
                  onPress={handleEditClose}
                  mode="text"
                  disabled={isSaving}
                  textColor={colors.text}>
                  Cancel
                </Button>
                <Button
                  onPress={handleSaveChanges}
                  mode="contained"
                  style={styles.saveButton}
                  loading={isSaving}
                  disabled={isSaving}>
                  Save Changes
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EEF5FF',
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  searchBar: {
    elevation: 0,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  tableContainer: {
    minWidth: 800, // Set a minimum width to ensure horizontal scrolling
    marginTop: 10,
  },
  tableHeader: {
    backgroundColor: '#f1f8ff',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  tableTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 14,
  },
  modalStyle: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginHorizontal: 20,
    borderRadius: 4,
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  modalContent: {
    flexGrow: 1,
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  saveButton: {
    marginLeft: 16,
  },
  dataRow: {
    height: 45,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cellText: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 5,
    textAlign: 'center',
  },
  lowStockRow: {
    backgroundColor: '#ffebee', // Light red background for low stock items
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.textSecondary,
    margin: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accent,
    borderRadius: 28,
  },
});

export default WarehouseInventoryScreen;
