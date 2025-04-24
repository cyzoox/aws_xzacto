import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title, 
  Divider, 
  Switch, 
  ActivityIndicator,
  HelperText,
  Portal,
  Dialog,
  List
} from 'react-native-paper';
import Appbar from '../../components/Appbar';
import { colors } from '../../constants/theme';
import { generateClient } from 'aws-amplify/api';
import { createWarehouseProduct } from '../../graphql/mutations';
import { listWarehouseProducts } from '../../graphql/queries';

const WarehouseProductAddScreen = ({ navigation, route }) => {
  // Initialize Amplify client
  const client = generateClient();
  
  // Form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [totalStock, setTotalStock] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [reorderQuantity, setReorderQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [skuLoading, setSkuLoading] = useState(false);
  const [skuExists, setSkuExists] = useState(false);
  const [categoriesDialogVisible, setCategoriesDialogVisible] = useState(false);
  const [uniqueCategories, setUniqueCategories] = useState([]);

  // Check if SKU exists
  const checkSku = async (skuValue) => {
    if (!skuValue) return;
    
    setSkuLoading(true);
    try {
      const result = await client.graphql({
        query: listWarehouseProducts,
        variables: {
          filter: { sku: { eq: skuValue } }
        }
      });
      
      const exists = result.data.listWarehouseProducts.items.length > 0;
      setSkuExists(exists);
      
      if (exists) {
        setErrors({
          ...errors,
          sku: 'This SKU already exists'
        });
      } else {
        const newErrors = {...errors};
        delete newErrors.sku;
        setErrors(newErrors);
      }
    } catch (error) {
      console.error('Error checking SKU:', error);
    } finally {
      setSkuLoading(false);
    }
  };

  // Load unique categories for suggestions
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await client.graphql({
          query: listWarehouseProducts
        });
        const products = result.data.listWarehouseProducts.items;
        
        // Extract unique categories
        const categories = new Set();
        products.forEach(product => {
          if (product.category) {
            categories.add(product.category);
          }
        });
        
        setUniqueCategories(Array.from(categories));
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!name) newErrors.name = 'Product name is required';
    if (!sku) {
      newErrors.sku = 'SKU is required';
    } else if (skuExists) {
      newErrors.sku = 'This SKU already exists';
    }
    
    if (!purchasePrice) {
      newErrors.purchasePrice = 'Purchase price is required';
    } else if (isNaN(parseFloat(purchasePrice)) || parseFloat(purchasePrice) < 0) {
      newErrors.purchasePrice = 'Enter a valid purchase price';
    }
    
    if (!sellingPrice) {
      newErrors.sellingPrice = 'Selling price is required';
    } else if (isNaN(parseFloat(sellingPrice)) || parseFloat(sellingPrice) < 0) {
      newErrors.sellingPrice = 'Enter a valid selling price';
    }
    
    if (!totalStock) {
      newErrors.totalStock = 'Total stock is required';
    } else if (isNaN(parseFloat(totalStock)) || parseFloat(totalStock) < 0) {
      newErrors.totalStock = 'Enter a valid stock quantity';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const productData = {
        name,
        brand: brand || null,
        description: description || null,
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: parseFloat(sellingPrice),
        totalStock: parseFloat(totalStock),
        availableStock: parseFloat(totalStock), // Initially available stock equals total stock
        sku,
        barcode: barcode || null,
        category: category || null,
        subcategory: subcategory || null,
        supplier: supplier || null,
        supplierContact: supplierContact || null,
        reorderPoint: reorderPoint ? parseFloat(reorderPoint) : null,
        reorderQuantity: reorderQuantity ? parseFloat(reorderQuantity) : null,
        location: location || null,
        isActive,
        lastRestockDate: new Date().toISOString()
      };
      
      const response = await client.graphql({
        query: createWarehouseProduct,
        variables: { input: productData }
      });
      console.log('Product created successfully:', response);
      
      Alert.alert(
        'Success',
        'Product added to warehouse successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Select category from dialog
  const selectCategory = (selectedCategory) => {
    setCategory(selectedCategory);
    setCategoriesDialogVisible(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Appbar 
        title="Add Warehouse Product" 
        hasBackButton 
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content}>
        <Card style={styles.formCard}>
          <Card.Content>
            <Title>Basic Information</Title>
            
            <TextInput
              label="Product Name *"
              value={name}
              onChangeText={setName}
              style={styles.input}
              error={!!errors.name}
              mode="outlined"
            />
            {errors.name && <HelperText type="error">{errors.name}</HelperText>}
            
            <TextInput
              label="Brand"
              value={brand}
              onChangeText={setBrand}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
              mode="outlined"
            />
            
            <Divider style={styles.divider} />
            <Title>Pricing & Inventory</Title>
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  label="Purchase Price *"
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  keyboardType="numeric"
                  style={styles.input}
                  error={!!errors.purchasePrice}
                  mode="outlined"
                  left={<TextInput.Affix text="$" />}
                />
                {errors.purchasePrice && <HelperText type="error">{errors.purchasePrice}</HelperText>}
              </View>
              
              <View style={styles.halfInput}>
                <TextInput
                  label="Selling Price *"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  keyboardType="numeric"
                  style={styles.input}
                  error={!!errors.sellingPrice}
                  mode="outlined"
                  left={<TextInput.Affix text="$" />}
                />
                {errors.sellingPrice && <HelperText type="error">{errors.sellingPrice}</HelperText>}
              </View>
            </View>
            
            <TextInput
              label="Initial Stock *"
              value={totalStock}
              onChangeText={setTotalStock}
              keyboardType="numeric"
              style={styles.input}
              error={!!errors.totalStock}
              mode="outlined"
            />
            {errors.totalStock && <HelperText type="error">{errors.totalStock}</HelperText>}
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <TextInput
                  label="Reorder Point"
                  value={reorderPoint}
                  onChangeText={setReorderPoint}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                />
              </View>
              
              <View style={styles.halfInput}>
                <TextInput
                  label="Reorder Quantity"
                  value={reorderQuantity}
                  onChangeText={setReorderQuantity}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                />
              </View>
            </View>
            
            <Divider style={styles.divider} />
            <Title>Product Details</Title>
            
            <TextInput
              label="SKU *"
              value={sku}
              onChangeText={(value) => {
                setSku(value);
                if (value.length > 2) {
                  checkSku(value);
                }
              }}
              style={styles.input}
              error={!!errors.sku}
              mode="outlined"
              right={
                skuLoading ? 
                <TextInput.Icon icon="loading" /> : 
                skuExists ? 
                <TextInput.Icon icon="alert" color="#F44336" /> :
                sku.length > 2 ? 
                <TextInput.Icon icon="check-circle" color="#4CAF50" /> : 
                null
              }
            />
            {errors.sku && <HelperText type="error">{errors.sku}</HelperText>}
            
            <TextInput
              label="Barcode"
              value={barcode}
              onChangeText={setBarcode}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Category"
              value={category}
              onChangeText={setCategory}
              style={styles.input}
              mode="outlined"
              right={
                <TextInput.Icon 
                  icon="menu-down" 
                  onPress={() => setCategoriesDialogVisible(true)} 
                />
              }
            />
            
            <TextInput
              label="Subcategory"
              value={subcategory}
              onChangeText={setSubcategory}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Location in Warehouse"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Aisle 5, Shelf 3"
            />
            
            <Divider style={styles.divider} />
            <Title>Supplier Information</Title>
            
            <TextInput
              label="Supplier"
              value={supplier}
              onChangeText={setSupplier}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Supplier Contact"
              value={supplierContact}
              onChangeText={setSupplierContact}
              style={styles.input}
              mode="outlined"
              placeholder="Phone or email"
            />
            
            <Divider style={styles.divider} />
            
            <View style={styles.switchContainer}>
              <Text>Product Active</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                color={colors.primary}
              />
            </View>
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={loading}
              disabled={loading}
            >
              Add Product
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
      
      <Portal>
        <Dialog
          visible={categoriesDialogVisible}
          onDismiss={() => setCategoriesDialogVisible(false)}
        >
          <Dialog.Title>Select Category</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.dialogContent}>
              {uniqueCategories.length > 0 ? (
                uniqueCategories.map((cat, index) => (
                  <List.Item
                    key={index}
                    title={cat}
                    onPress={() => selectCategory(cat)}
                    style={styles.listItem}
                    right={props => 
                      category === cat ? 
                      <List.Icon {...props} icon="check" color={colors.primary} /> : 
                      null
                    }
                  />
                ))
              ) : (
                <Text style={styles.noCategories}>No categories found</Text>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCategoriesDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
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
  formCard: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  divider: {
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
  },
  dialogContent: {
    maxHeight: 300,
  },
  listItem: {
    paddingVertical: 8,
  },
  noCategories: {
    textAlign: 'center',
    color: '#757575',
    paddingVertical: 16,
  }
});

export default WarehouseProductAddScreen;
