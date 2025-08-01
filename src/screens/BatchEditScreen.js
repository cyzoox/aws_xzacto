import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { DataTable, TextInput, Button, Text, Menu, Portal, List, IconButton } from 'react-native-paper';
import { generateClient } from 'aws-amplify/api';
import { listProducts, listCategories, getProduct, listVariants, listAddons } from '../graphql/queries';
import { updateProduct } from '../graphql/mutations';
import { useStore } from '../context/StoreContext';
import Appbar from '../components/Appbar';
import colors from '../themes/colors';

const client = generateClient();

const BatchEditScreen = ({ navigation, route }) => {
  // Get store directly from route params if available
  const storeFromParams = route.params?.store;
  
  // Still use StoreContext as fallback
  const { currentStore: contextStore } = useStore();
  
  // Use store from params if available, otherwise fall back to context
  const currentStore = storeFromParams || contextStore;
  
  // Debug info
  console.log('BatchEdit - Store info:', {
    fromParams: !!storeFromParams,
    storeId: currentStore?.id || 'missing',
    storeName: currentStore?.name || 'unknown'
  });
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [editedProducts, setEditedProducts] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [showAddonsModal, setShowAddonsModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddon, setSelectedAddon] = useState(null);
  const [newVariant, setNewVariant] = useState({ name: '', price: '' });
  const [newAddon, setNewAddon] = useState({ name: '', price: '' });
  const [productVariants, setProductVariants] = useState({});
  const [productAddons, setProductAddons] = useState({});
  const [error, setError] = useState(null);


  // Columns to show in the table
  const columns = [
    { key: 'name', title: 'Name', editable: true },
    { key: 'brand', title: 'Brand', editable: true },
    { key: 'sku', title: 'SKU', editable: true },
    { key: 'categoryId', title: 'Category', editable: true, type: 'dropdown' },
    { key: 'oprice', title: 'Original Price', editable: true, numeric: true },
    { key: 'sprice', title: 'Selling Price', editable: true, numeric: true },
    { key: 'stock', title: 'Stock', editable: true, numeric: true },
    { key: 'variants', title: 'Variants', editable: true, type: 'modal' },
    { key: 'addons', title: 'Addons', editable: true, type: 'modal' },
  ];

  useEffect(() => {
    if (currentStore?.id) {
      fetchProducts();
      fetchCategories();
    } else {
      setError('No store selected. Please select a store first.');
      setLoading(false);
    }
  }, [currentStore?.id]);

  const fetchProducts = async () => {
    if (!currentStore?.id) {
      setError('No store selected. Please select a store first.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use direct query syntax for more reliable results
      console.log('Fetching products for store:', currentStore.id);
      const listResult = await client.graphql({
        query: `query GetProductsByStore($storeId: ID!) {
          listProducts(filter: {storeId: {eq: $storeId}}) {
            items {
              id
              name
              brand
              sku
              stock
              storeId
              sprice
              oprice
              img
              isActive
              categoryId
              description
              subcategory
              createdAt
              updatedAt
            }
          }
        }`,
        variables: {
          storeId: currentStore.id
        }
      });

      const productsList = listResult.data?.listProducts?.items || [];
      console.log('Products:', productsList);

      // Get product details using getProduct
      const productPromises = productsList.map(p => 
        client.graphql({
          query: getProduct,
          variables: { id: p.id }
        })
      );

      const results = await Promise.all(productPromises);
      const productsWithDetails = results.map(r => r.data.getProduct);
      console.log('Products with details:', productsWithDetails);
      setProducts(productsWithDetails);

      // Fetch all variants
      console.log('Fetching variants...');
      const variantsResult = await client.graphql({
        query: listVariants
      });
      const allVariants = variantsResult.data?.listVariants?.items || [];
      console.log('All variants:', allVariants);

      // Fetch all addons
      console.log('Fetching addons...');
      const addonsResult = await client.graphql({
        query: listAddons
      });
      const allAddons = addonsResult.data?.listAddons?.items || [];
      console.log('All addons:', allAddons);

      // Group variants and addons by product ID
      const variantsMap = {};
      const addonsMap = {};

      allVariants.forEach(variant => {
        if (!variant.productId) return;
        
        if (!variantsMap[variant.productId]) {
          variantsMap[variant.productId] = [];
        }
        variantsMap[variant.productId].push({
          id: variant.id,
          name: variant.name,
          price: variant.price,
          productId: variant.productId
        });
      });

      allAddons.forEach(addon => {
        if (!addon.productId) return;
        
        if (!addonsMap[addon.productId]) {
          addonsMap[addon.productId] = [];
        }
        addonsMap[addon.productId].push({
          id: addon.id,
          name: addon.name,
          price: addon.price,
          productId: addon.productId
        });
      });

      console.log('Final variants map:', variantsMap);
      console.log('Final addons map:', addonsMap);
      setProductVariants(variantsMap);
      setProductAddons(addonsMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetails = async (productId) => {
    if (!productId) return;

    setLoadingVariants(true);
    setLoadingAddons(true);
    try {
      console.log('Fetching product details for:', productId);
      const result = await client.graphql({
        query: getProduct,
        variables: { id: productId }
      });

      const product = result.data?.getProduct;
      console.log('Fetched product:', product);
      if (product) {
        // Filter variants and addons
        const variants = (product.variants?.items || []).filter(v => !v._deleted);
        const addons = (product.addons?.items || []).filter(a => !a._deleted);

        console.log('Filtered variants:', variants);
        console.log('Filtered addons:', addons);
        
        // Update variants
        setProductVariants(prev => {
          const updated = {
            ...prev,
            [productId]: variants
          };
          console.log('Updated variants state:', updated);
          return updated;
        });

        // Update addons
        setProductAddons(prev => {
          const updated = {
            ...prev,
            [productId]: addons
          };
          console.log('Updated addons state:', updated);
          return updated;
        });

        setSelectedProduct(product);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoadingVariants(false);
      setLoadingAddons(false);
    }
  };

  const fetchCategories = async () => {
    if (!currentStore?.id) return;

    try {
      const result = await client.graphql({
        query: listCategories,
        variables: {
          filter: {
            storeId: { eq: currentStore.id }
          }
        }
      });
      const fetchedCategories = result.data.listCategories.items || [];
      console.log(`Fetched ${fetchedCategories.length} categories for store ${currentStore.id}`);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to fetch categories');
    }
  };

  const handleInputChange = (productId, field, value) => {
    setEditedProducts(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: value
      }
    }));
  };

  const validateChanges = () => {
    const errors = [];
    Object.entries(editedProducts).forEach(([productId, changes]) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      Object.entries(changes).forEach(([field, value]) => {
        if (['oprice', 'sprice', 'stock'].includes(field)) {
          const numValue = parseFloat(value);
          if (isNaN(numValue) || numValue < 0) {
            errors.push(`Invalid ${field} for product ${product.name}`);
          }
        }
      });
    });
    return errors;
  };

  const saveChanges = async () => {
    const errors = validateChanges();
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      const updatePromises = Object.entries(editedProducts).map(([productId, changes]) => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;

        const input = {
          id: productId,
          ...changes,
          // Convert numeric fields
          ...(changes.oprice && { oprice: parseFloat(changes.oprice) }),
          ...(changes.sprice && { sprice: parseFloat(changes.sprice) }),
          ...(changes.stock && { stock: parseFloat(changes.stock) })
        };

        return client.graphql({
          query: updateProduct,
          variables: { input }
        });
      });

      await Promise.all(updatePromises.filter(Boolean));
      setEditedProducts({});
      Alert.alert('Success', 'Products updated successfully');
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Error updating products:', error);
      Alert.alert('Error', 'Failed to update products');
    } finally {
      setSaving(false);
    }
  };

  const renderCell = (product, column) => {
    const value = editedProducts[product.id]?.[column.key] ?? product[column.key];
    
    if (!column.editable) {
      return <Text>{value}</Text>;
    }

    if (column.type === 'dropdown' && column.key === 'categoryId') {
      const category = categories.find(c => c.id === value);
      return (
        <Menu
          visible={selectedProduct === product.id}
          onDismiss={() => setSelectedProduct(null)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setSelectedProduct(product.id)}
              compact
              style={styles.dropdownButton}
            >
              {category?.name || 'Select Category'}
            </Button>
          }
        >
          {categories.map(cat => (
            <Menu.Item
              key={cat.id}
              onPress={() => {
                handleInputChange(product.id, 'categoryId', cat.id);
                setSelectedProduct(null);
              }}
              title={cat.name}
            />
          ))}
        </Menu>
      );
    }

    if (column.type === 'modal') {
      const items = column.key === 'variants' 
        ? productVariants[product.id] || []
        : productAddons[product.id] || [];
      return (
        <Button
          mode="outlined"
          onPress={() => {
            setSelectedProduct(product);
            if (column.key === 'variants') {
              setShowVariantsModal(true);
            } else {
              setShowAddonsModal(true);
            }
          }}
          compact
          style={styles.dropdownButton}
        >
          {`${items.length} ${column.key}`}
        </Button>
      );
    }

    return (
      <TextInput
        mode="flat"
        dense
        value={value?.toString() || ''}
        keyboardType={column.numeric ? 'numeric' : 'default'}
        onChangeText={(text) => handleInputChange(product.id, column.key, text)}
        style={styles.input}
      />
    );
  };

  const renderVariantsSection = () => {
    if (!selectedProduct) return null;

    const variants = productVariants[selectedProduct.id] || [];

    return (
      <View style={styles.section}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Variant Name"
            value={newVariant.name}
            onChangeText={text => setNewVariant({ ...newVariant, name: text })}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 8 }]}
            placeholder="Price"
            value={newVariant.price}
            onChangeText={text => setNewVariant({ ...newVariant, price: text })}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              if (!newVariant.name || !newVariant.price) return;
              const updatedVariants = [
                ...variants,
                { 
                  ...newVariant, 
                  id: Date.now().toString(),
                  productId: selectedProduct.id
                }
              ];
              setProductVariants(prev => ({
                ...prev,
                [selectedProduct.id]: updatedVariants
              }));
              handleInputChange(selectedProduct.id, 'variants', { items: updatedVariants });
              setNewVariant({ name: '', price: '' });
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {variants.length > 0 ? (
          variants.map((variant, index) => (
            <View key={variant.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{variant.name}</Text>
              <Text style={styles.itemPrice}>₱{variant.price}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  const updatedVariants = variants.filter(v => v.id !== variant.id);
                  setProductVariants(prev => ({
                    ...prev,
                    [selectedProduct.id]: updatedVariants
                  }));
                  handleInputChange(selectedProduct.id, 'variants', { items: updatedVariants });
                }}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No variants found</Text>
        )}
      </View>
    );
  };

  const renderAddonsSection = () => {
    if (!selectedProduct) return null;

    const addons = productAddons[selectedProduct.id] || [];

    return (
      <View style={styles.section}>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Addon Name"
            value={newAddon.name}
            onChangeText={text => setNewAddon({ ...newAddon, name: text })}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 8 }]}
            placeholder="Price"
            value={newAddon.price}
            onChangeText={text => setNewAddon({ ...newAddon, price: text })}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => {
              if (!newAddon.name || !newAddon.price) return;
              const updatedAddons = [
                ...addons,
                { 
                  ...newAddon, 
                  id: Date.now().toString(),
                  productId: selectedProduct.id
                }
              ];
              setProductAddons(prev => ({
                ...prev,
                [selectedProduct.id]: updatedAddons
              }));
              handleInputChange(selectedProduct.id, 'addons', { items: updatedAddons });
              setNewAddon({ name: '', price: '' });
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {addons.length > 0 ? (
          addons.map((addon, index) => (
            <View key={addon.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{addon.name}</Text>
              <Text style={styles.itemPrice}>₱{addon.price}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  const updatedAddons = addons.filter(a => a.id !== addon.id);
                  setProductAddons(prev => ({
                    ...prev,
                    [selectedProduct.id]: updatedAddons
                  }));
                  handleInputChange(selectedProduct.id, 'addons', { items: updatedAddons });
                }}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No addons found</Text>
        )}
      </View>
    );
  };

  const renderVariantsModal = () => {
    if (!selectedProduct) return null;

    const variants = productVariants[selectedProduct.id] || [];

    return (
      <Portal>
        <Modal
          visible={showVariantsModal}
          onDismiss={() => setShowVariantsModal(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Variants</Text>
              <IconButton
                icon="close"
                onPress={() => setShowVariantsModal(false)}
              />
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.section}>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="Variant Name"
                    value={newVariant.name}
                    onChangeText={text => setNewVariant({ ...newVariant, name: text })}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginLeft: 8 }]}
                    placeholder="Price"
                    value={newVariant.price}
                    onChangeText={text => setNewVariant({ ...newVariant, price: text })}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => {
                      if (!newVariant.name || !newVariant.price) return;
                      const updatedVariants = [
                        ...variants,
                        { 
                          ...newVariant, 
                          id: Date.now().toString(),
                          productId: selectedProduct.id
                        }
                      ];
                      setProductVariants(prev => ({
                        ...prev,
                        [selectedProduct.id]: updatedVariants
                      }));
                      handleInputChange(selectedProduct.id, 'variants', { items: updatedVariants });
                      setNewVariant({ name: '', price: '' });
                    }}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                {variants.length > 0 ? (
                  variants.map((variant, index) => (
                    <View key={variant.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>{variant.name}</Text>
                      <Text style={styles.itemPrice}>₱{variant.price}</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => {
                          const updatedVariants = variants.filter(v => v.id !== variant.id);
                          setProductVariants(prev => ({
                            ...prev,
                            [selectedProduct.id]: updatedVariants
                          }));
                          handleInputChange(selectedProduct.id, 'variants', { items: updatedVariants });
                        }}
                      >
                        <Text style={styles.removeButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No variants found</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
      </Portal>
    );
  };

  const renderAddonsModal = () => {
    if (!selectedProduct) return null;

    const addons = productAddons[selectedProduct.id] || [];

    return (
      <Portal>
        <Modal
          visible={showAddonsModal}
          onDismiss={() => setShowAddonsModal(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add-ons</Text>
              <IconButton
                icon="close"
                onPress={() => setShowAddonsModal(false)}
              />
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.section}>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="Add-on Name"
                    value={newAddon.name}
                    onChangeText={text => setNewAddon({ ...newAddon, name: text })}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, marginLeft: 8 }]}
                    placeholder="Price"
                    value={newAddon.price}
                    onChangeText={text => setNewAddon({ ...newAddon, price: text })}
                    keyboardType="decimal-pad"
                  />
                  <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => {
                      if (!newAddon.name || !newAddon.price) return;
                      const updatedAddons = [
                        ...addons,
                        { 
                          ...newAddon, 
                          id: Date.now().toString(),
                          productId: selectedProduct.id
                        }
                      ];
                      setProductAddons(prev => ({
                        ...prev,
                        [selectedProduct.id]: updatedAddons
                      }));
                      handleInputChange(selectedProduct.id, 'addons', { items: updatedAddons });
                      setNewAddon({ name: '', price: '' });
                    }}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                {addons.length > 0 ? (
                  addons.map((addon, index) => (
                    <View key={addon.id} style={styles.itemRow}>
                      <Text style={styles.itemName}>{addon.name}</Text>
                      <Text style={styles.itemPrice}>₱{addon.price}</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => {
                          const updatedAddons = addons.filter(a => a.id !== addon.id);
                          setProductAddons(prev => ({
                            ...prev,
                            [selectedProduct.id]: updatedAddons
                          }));
                          handleInputChange(selectedProduct.id, 'addons', { items: updatedAddons });
                        }}
                      >
                        <Text style={styles.removeButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No addons found</Text>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
      </Portal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={() => fetchProducts()}
          style={{ marginTop: 16 }}
        >
          Retry
        </Button>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No products found for this store</Text>
        <Text style={{ textAlign: 'center', marginTop: 8, marginBottom: 16 }}>Try adding some products first</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('CreateProduct', { store: currentStore })}
        >
          Add Products
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar title="Batch Edit Products" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        {renderVariantsModal()}
        {renderAddonsModal()}
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
                              value={editedProducts[product.id]?.name ?? product.name}
                              onChangeText={(text) => handleInputChange(product.id, 'name', text)}
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
                              value={editedProducts[product.id]?.brand ?? product.brand}
                              onChangeText={(text) => handleInputChange(product.id, 'brand', text)}
                              placeholder="Brand"
                            />
                          </DataTable.Cell>
                        );
                      }
                      if (column.key === 'sku') {
                        return (
                          <DataTable.Cell key={column.key} style={styles.cell}>
                            <TextInput
                              style={styles.cellInput}
                              value={editedProducts[product.id]?.sku ?? product.sku}
                              onChangeText={(text) => handleInputChange(product.id, 'sku', text)}
                              placeholder="SKU"
                            />
                          </DataTable.Cell>
                        );
                      }
                      if (column.key === 'oprice') {
                        return (
                          <DataTable.Cell key={column.key} numeric={column.numeric} style={styles.cell}>
                            <TextInput
                              style={styles.cellInput}
                              value={(editedProducts[product.id]?.oprice ?? product.oprice)?.toString()}
                              onChangeText={(text) => handleInputChange(product.id, 'oprice', text)}
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
                              value={(editedProducts[product.id]?.sprice ?? product.sprice)?.toString()}
                              onChangeText={(text) => handleInputChange(product.id, 'sprice', text)}
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
                              value={(editedProducts[product.id]?.stock ?? product.stock)?.toString()}
                              onChangeText={(text) => handleInputChange(product.id, 'stock', text)}
                              placeholder="0"
                              keyboardType="decimal-pad"
                            />
                          </DataTable.Cell>
                        );
                      }
                      if (column.key === 'categoryId') {
                        const categoryId = editedProducts[product.id]?.categoryId ?? product.categoryId;
                        const category = categories.find(c => c.id === categoryId);
                        return (
                          <DataTable.Cell key={column.key} style={styles.cell}>
                            <View style={styles.categoryPicker}>
                              {categories
                                .filter(cat => cat.storeId === currentStore.id)
                                .map(cat => (
                                  <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                      styles.categoryChip,
                                      categoryId === cat.id && styles.selectedCategoryChip
                                    ]}
                                    onPress={() => handleInputChange(product.id, 'categoryId', cat.id)}
                                  >
                                    <Text style={[
                                      styles.categoryChipText,
                                      categoryId === cat.id && styles.selectedCategoryChipText
                                    ]}>
                                      {cat.name}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                            </View>
                          </DataTable.Cell>
                        );
                      }
                      if (column.type === 'modal') {
                        const items = column.key === 'variants' 
                          ? productVariants[product.id] || []
                          : productAddons[product.id] || [];
                        return (
                          <DataTable.Cell key={column.key} style={styles.cell}>
                            <Button
                              mode="outlined"
                              onPress={() => {
                                setSelectedProduct(product);
                                if (column.key === 'variants') {
                                  setShowVariantsModal(true);
                                } else {
                                  setShowAddonsModal(true);
                                }
                              }}
                              compact
                              style={styles.dropdownButton}
                            >
                              {`${items.length} ${column.key}`}
                            </Button>
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

        <DataTable.Pagination
          page={page}
          numberOfPages={Math.ceil(products.length / itemsPerPage)}
          onPageChange={page => setPage(page)}
          label={`${page + 1} of ${Math.ceil(products.length / itemsPerPage)}`}
        />

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={saveChanges}
            loading={saving}
            disabled={saving || Object.keys(editedProducts).length === 0}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.primary,
    paddingLeft: 4,
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 130,
    justifyContent: 'center',
  },
  cellInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    width: '100%',
    marginVertical: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    flex: 2,
    fontSize: 16,
  },
  itemPrice: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
    marginRight: 16,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  saveButton: {
    borderRadius: 8,
  },
  dropdownButton: {
    height: 40,
    minWidth: 120,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
    maxWidth: '90%',
    alignSelf: 'center',
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    maxHeight: 500,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalContent: {
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  modalScroll: {
    flex: 1,
  },

  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    flex: 2,
    fontSize: 16,
  },
  itemPrice: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
    marginRight: 16,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ff5252',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modal: {
    backgroundColor: '#f5f5f5',
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 8,
  },
  addForm: {
    marginTop: 16,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dropdownButton: {
    marginHorizontal: 4,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cell: {
    minWidth: 120,
    justifyContent: 'center',
  },
  input: {
    height: 35,
    backgroundColor: 'transparent',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  saveButton: {
    marginTop: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});

export default BatchEditScreen;
