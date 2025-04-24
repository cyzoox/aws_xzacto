import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, DataTable, Portal, Modal, IconButton } from 'react-native-paper';
import { createProductWithDetails } from '../redux/slices/productSlice';
import { fetchCategories } from '../redux/slices/categorySlice';
import { useStore } from '../context/StoreContext';
import Appbar from '../components/Appbar';
import colors from '../themes/colors';

const INITIAL_ROWS = 5; // Initial number of empty rows

const BatchAddScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { items: categories } = useSelector(state => state.categories);
  const { currentStore } = useStore();

  // State for products table with initial empty rows
  const [products, setProducts] = useState(Array(INITIAL_ROWS).fill().map(() => ({
    id: Date.now().toString() + Math.random(),
    name: '',
    brand: '',
    oprice: '',
    sprice: '',
    stock: '',
    category: '',
    sku: '',
  })));
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;

  // State for saving
  const [saving, setSaving] = useState(false);

  // Columns configuration
  const columns = [
    { key: 'name', title: 'Name', numeric: false },
    { key: 'brand', title: 'Brand', numeric: false },
    { key: 'oprice', title: 'Original Price', numeric: true },
    { key: 'sprice', title: 'Selling Price', numeric: true },
    { key: 'stock', title: 'Stock', numeric: true },
    { key: 'category', title: 'Category', numeric: false },
    { key: 'sku', title: 'SKU', numeric: false },
    { key: 'actions', title: 'Actions', numeric: false },
  ];

  // Load categories on mount
  useEffect(() => {
    if (currentStore?.id) {
      dispatch(fetchCategories());
    }
  }, [dispatch, currentStore?.id]);

  // Add a new empty row
  const addRow = () => {
    setProducts(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      name: '',
      brand: '',
      oprice: '',
      sprice: '',
      stock: '',
      category: '',
      sku: '',
    }]);
  };

  // Update product data
  const updateProduct = (id, field, value) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, [field]: value } : product
    ));
  };

  // Remove product from table
  const removeProduct = (id) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  // Save all valid products
  const saveProducts = async () => {
    // Filter out empty rows and validate
    const validProducts = products.filter(product => 
      product.name && 
      product.oprice && 
      product.sprice && 
      product.stock && 
      product.category
    );

    if (validProducts.length === 0) {
      Alert.alert('Error', 'No valid products to save');
      return;
    }
    try {
      setSaving(true);

      // Validate if there are products to save
      if (products.length === 0) {
        Alert.alert('Error', 'No products to save');
        return;
      }

      // Create all valid products
      for (const product of validProducts) {
        const productData = {
          product: {
            name: product.name,
            brand: product.brand || '',
            description: product.description || '',
            oprice: parseFloat(product.oprice),
            sprice: parseFloat(product.sprice),
            stock: parseFloat(product.stock),
            categoryId: product.category,
            sku: product.sku || '',
            storeId: currentStore.id,
            isActive: true
          },
          variants: [],
          addons: []
        };

        await dispatch(createProductWithDetails(productData));
      }

      Alert.alert('Success', 'All products have been created');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving products:', error);
      Alert.alert('Error', 'Failed to save products. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Render cell content
  const renderCell = (product, column) => {
    switch (column.key) {
      case 'actions':
        return (
          <IconButton
            icon="delete"
            onPress={() => removeProduct(product.id)}
            size={20}
            iconColor={colors.error}
          />
        );
      default:
        return product[column.key];
    }
  };

  return (
    <View style={styles.container}>
      <Appbar
        title="Batch Add Products"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <ScrollView horizontal>
          <DataTable>
            <DataTable.Header>
              {columns.map(column => (
                <DataTable.Title
                  key={column.key}
                  numeric={column.numeric}
                  style={styles.cell}
                >
                  {column.title}
                </DataTable.Title>
              ))}
            </DataTable.Header>

            <ScrollView>
              {products
                .slice(page * itemsPerPage, (page + 1) * itemsPerPage)
                .map(product => (
                  <DataTable.Row key={product.id}>
                    {columns.map(column => {
                      if (column.key === 'name') {
                        return (
                          <DataTable.Cell key={column.key} style={styles.cell}>
                            <TextInput
                              style={styles.cellInput}
                              value={product.name}
                              onChangeText={(text) => updateProduct(product.id, 'name', text)}
                              placeholder="Name"
                            />
                          </DataTable.Cell>
                        );
                      }
                      if (column.key === 'brand') {
                        return (
                          <DataTable.Cell key={column.key} style={styles.cell}>
                            <TextInput
                              style={styles.cellInput}
                              value={product.brand}
                              onChangeText={(text) => updateProduct(product.id, 'brand', text)}
                              placeholder="Brand"
                            />
                          </DataTable.Cell>
                        );
                      }
                      if (column.key === 'oprice') {
                        return (
                          <DataTable.Cell key={column.key} numeric={column.numeric} style={styles.cell}>
                            <TextInput
                              style={styles.cellInput}
                              value={product.oprice}
                              onChangeText={(text) => updateProduct(product.id, 'oprice', text)}
                              placeholder="0.00"
                              keyboardType="decimal-pad"
                            />
                          </DataTable.Cell>
                        );
                      }
                      if (column.key === 'sprice') {
                        return (
                          <DataTable.Cell key={column.key} numeric={column.numeric} style={styles.cell}>
                            <TextInput
                              style={styles.cellInput}
                              value={product.sprice}
                              onChangeText={(text) => updateProduct(product.id, 'sprice', text)}
                              placeholder="0.00"
                              keyboardType="decimal-pad"
                            />
                          </DataTable.Cell>
                        );
                      }
                      if (column.key === 'stock') {
                        return (
                          <DataTable.Cell key={column.key} numeric={column.numeric} style={styles.cell}>
                            <TextInput
                              style={styles.cellInput}
                              value={product.stock}
                              onChangeText={(text) => updateProduct(product.id, 'stock', text)}
                              placeholder="0"
                              keyboardType="decimal-pad"
                            />
                          </DataTable.Cell>
                        );
                      }
                      if (column.key === 'sku') {
                        return (
                          <DataTable.Cell key={column.key} style={styles.cell}>
                            <TextInput
                              style={styles.cellInput}
                              value={product.sku}
                              onChangeText={(text) => updateProduct(product.id, 'sku', text)}
                              placeholder="SKU"
                            />
                          </DataTable.Cell>
                        );
                      }
                      if (column.key === 'category') {
                        return (
                          <DataTable.Cell key={column.key} style={styles.cell}>
                            <View style={styles.categoryPicker}>
                              {categories
                                .filter(cat => cat.storeId === currentStore.id)
                                .map(category => (
                                  <TouchableOpacity
                                    key={category.id}
                                    style={[
                                      styles.categoryChip,
                                      product.category === category.id && styles.selectedCategoryChip
                                    ]}
                                    onPress={() => updateProduct(product.id, 'category', category.id)}
                                  >
                                    <Text style={[
                                      styles.categoryChipText,
                                      product.category === category.id && styles.selectedCategoryChipText
                                    ]}>
                                      {category.name}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                            </View>
                          </DataTable.Cell>
                        );
                      }
                      return (
                        <DataTable.Cell
                          key={column.key}
                          numeric={column.numeric}
                          style={styles.cell}
                        >
                          {renderCell(product, column)}
                        </DataTable.Cell>
                      );
                    })}
                  </DataTable.Row>
                ))}
            </ScrollView>
          </DataTable>
        </ScrollView>

        <View style={styles.actions}>
          <Button 
            mode="outlined" 
            onPress={addRow} 
            icon="plus"
          >
            Add Row
          </Button>
        </View>

        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(products.length / itemsPerPage)}
          onPageChange={page => setPage(page)}
          label={`${page + 1} of ${Math.ceil(products.length / itemsPerPage)}`}
        />

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={saveProducts}
            loading={saving}
            disabled={saving || products.length === 0}
            style={styles.saveButton}
          >
            Save All Products
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cellInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginRight: 4,
    marginBottom: 4,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    color: '#666',
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  form: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  selectedCategory: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  addButton: {
    marginTop: 8,
  },
  cell: {
    minWidth: 120,
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    marginTop: 8,
  },
});

export default BatchAddScreen;
