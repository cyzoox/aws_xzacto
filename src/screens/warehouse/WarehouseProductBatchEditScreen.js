import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Divider, 
  Button, 
  Checkbox, 
  TextInput, 
  Switch,
  ActivityIndicator,
  HelperText,
  Chip
} from 'react-native-paper';
import Appbar from '../../components/Appbar';
import { colors } from '../../constants/theme';
import { API, graphqlOperation } from 'aws-amplify';
import { getWarehouseProduct } from '../../graphql/queries';
import { updateWarehouseProduct } from '../../graphql/mutations';

const WarehouseProductBatchEditScreen = ({ navigation, route }) => {
  const { selectedProducts = [] } = route.params || {};
  
  // State
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Batch edit options
  const [editSellingPrice, setEditSellingPrice] = useState(false);
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [sellingPriceAdjustmentType, setSellingPriceAdjustmentType] = useState('fixed'); // fixed, percentage
  
  const [editPurchasePrice, setEditPurchasePrice] = useState(false);
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [purchasePriceAdjustmentType, setPurchasePriceAdjustmentType] = useState('fixed'); // fixed, percentage
  
  const [editCategory, setEditCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  const [editReorderPoint, setEditReorderPoint] = useState(false);
  const [newReorderPoint, setNewReorderPoint] = useState('');
  
  const [editReorderQuantity, setEditReorderQuantity] = useState(false);
  const [newReorderQuantity, setNewReorderQuantity] = useState('');
  
  const [editActive, setEditActive] = useState(false);
  const [newActive, setNewActive] = useState(true);
  
  const [errors, setErrors] = useState({});
  
  // Fetch products data
  useEffect(() => {
    const fetchProducts = async () => {
      if (selectedProducts.length === 0) {
        setLoading(false);
        return;
      }
      
      try {
        const productsData = await Promise.all(
          selectedProducts.map(async (productId) => {
            try {
              const result = await API.graphql(graphqlOperation(getWarehouseProduct, { id: productId }));
              return result.data.getWarehouseProduct;
            } catch (error) {
              console.error(`Error fetching product ${productId}:`, error);
              return null;
            }
          })
        );
        
        // Filter out null values
        const validProducts = productsData.filter(p => p !== null);
        setProducts(validProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        Alert.alert('Error', 'Failed to load products data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [selectedProducts]);
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (editSellingPrice) {
      if (!newSellingPrice) {
        newErrors.sellingPrice = 'New selling price is required';
      } else if (isNaN(parseFloat(newSellingPrice)) || parseFloat(newSellingPrice) < 0) {
        newErrors.sellingPrice = 'Enter a valid selling price';
      }
    }
    
    if (editPurchasePrice) {
      if (!newPurchasePrice) {
        newErrors.purchasePrice = 'New purchase price is required';
      } else if (isNaN(parseFloat(newPurchasePrice)) || parseFloat(newPurchasePrice) < 0) {
        newErrors.purchasePrice = 'Enter a valid purchase price';
      }
    }
    
    if (editCategory && !newCategory) {
      newErrors.category = 'New category is required';
    }
    
    if (editReorderPoint) {
      if (!newReorderPoint) {
        newErrors.reorderPoint = 'New reorder point is required';
      } else if (isNaN(parseFloat(newReorderPoint)) || parseFloat(newReorderPoint) < 0) {
        newErrors.reorderPoint = 'Enter a valid reorder point';
      }
    }
    
    if (editReorderQuantity) {
      if (!newReorderQuantity) {
        newErrors.reorderQuantity = 'New reorder quantity is required';
      } else if (isNaN(parseFloat(newReorderQuantity)) || parseFloat(newReorderQuantity) < 0) {
        newErrors.reorderQuantity = 'Enter a valid reorder quantity';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Apply batch edit
  const applyBatchEdit = async () => {
    if (!validateForm()) return;
    
    if (!editSellingPrice && !editPurchasePrice && !editCategory && 
        !editReorderPoint && !editReorderQuantity && !editActive) {
      Alert.alert('No Changes', 'Please select at least one field to update');
      return;
    }
    
    const confirmMessage = `Are you sure you want to update ${products.length} products?`;
    
    Alert.alert(
      'Confirm Batch Edit',
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Update', onPress: processBatchUpdate }
      ]
    );
  };
  
  // Process batch update
  const processBatchUpdate = async () => {
    setSubmitting(true);
    
    try {
      const updatePromises = products.map(async (product) => {
        const updateData = { id: product.id };
        
        if (editSellingPrice) {
          if (sellingPriceAdjustmentType === 'fixed') {
            updateData.sellingPrice = parseFloat(newSellingPrice);
          } else { // percentage
            const adjustmentPercent = parseFloat(newSellingPrice) / 100;
            updateData.sellingPrice = product.sellingPrice * (1 + adjustmentPercent);
          }
        }
        
        if (editPurchasePrice) {
          if (purchasePriceAdjustmentType === 'fixed') {
            updateData.purchasePrice = parseFloat(newPurchasePrice);
          } else { // percentage
            const adjustmentPercent = parseFloat(newPurchasePrice) / 100;
            updateData.purchasePrice = product.purchasePrice * (1 + adjustmentPercent);
          }
        }
        
        if (editCategory) {
          updateData.category = newCategory;
        }
        
        if (editReorderPoint) {
          updateData.reorderPoint = parseFloat(newReorderPoint);
        }
        
        if (editReorderQuantity) {
          updateData.reorderQuantity = parseFloat(newReorderQuantity);
        }
        
        if (editActive) {
          updateData.isActive = newActive;
        }
        
        return API.graphql(graphqlOperation(updateWarehouseProduct, { input: updateData }));
      });
      
      await Promise.all(updatePromises);
      
      Alert.alert(
        'Success',
        `Successfully updated ${products.length} products`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating products:', error);
      Alert.alert('Error', 'Failed to update products. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setEditSellingPrice(false);
    setNewSellingPrice('');
    setSellingPriceAdjustmentType('fixed');
    
    setEditPurchasePrice(false);
    setNewPurchasePrice('');
    setPurchasePriceAdjustmentType('fixed');
    
    setEditCategory(false);
    setNewCategory('');
    
    setEditReorderPoint(false);
    setNewReorderPoint('');
    
    setEditReorderQuantity(false);
    setNewReorderQuantity('');
    
    setEditActive(false);
    setNewActive(true);
    
    setErrors({});
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Appbar 
          title="Batch Edit Products" 
          hasBackButton 
          onBack={() => navigation.goBack()}
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }
  
  if (products.length === 0) {
    return (
      <View style={styles.container}>
        <Appbar 
          title="Batch Edit Products" 
          hasBackButton 
          onBack={() => navigation.goBack()}
        />
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.errorTitle}>No Products Selected</Title>
              <Paragraph style={styles.errorText}>
                Please go back and select products to edit.
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                Go Back
              </Button>
            </Card.Content>
          </Card>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Appbar 
        title="Batch Edit Products" 
        hasBackButton 
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.content}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Selected Products</Title>
            <Paragraph>You've selected {products.length} products for batch editing</Paragraph>
            <ScrollView horizontal style={styles.chipsContainer}>
              {products.map(product => (
                <Chip key={product.id} style={styles.chip}>
                  {product.name}
                </Chip>
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title>Batch Edit Options</Title>
            <Paragraph style={styles.subtitle}>
              Select the fields you want to update for all selected products
            </Paragraph>
            
            <Divider style={styles.divider} />
            
            {/* Selling Price */}
            <View style={styles.optionContainer}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  status={editSellingPrice ? 'checked' : 'unchecked'}
                  onPress={() => setEditSellingPrice(!editSellingPrice)}
                />
                <Text style={styles.optionLabel}>Update Selling Price</Text>
              </View>
              
              {editSellingPrice && (
                <View style={styles.optionContent}>
                  <View style={styles.radioRow}>
                    <Checkbox
                      status={sellingPriceAdjustmentType === 'fixed' ? 'checked' : 'unchecked'}
                      onPress={() => setSellingPriceAdjustmentType('fixed')}
                    />
                    <Text style={styles.radioLabel}>Set Fixed Price</Text>
                    
                    <Checkbox
                      status={sellingPriceAdjustmentType === 'percentage' ? 'checked' : 'unchecked'}
                      onPress={() => setSellingPriceAdjustmentType('percentage')}
                    />
                    <Text style={styles.radioLabel}>Adjust by Percentage</Text>
                  </View>
                  
                  <TextInput
                    label={sellingPriceAdjustmentType === 'fixed' ? 'New Selling Price' : 'Percentage Adjustment'}
                    value={newSellingPrice}
                    onChangeText={setNewSellingPrice}
                    keyboardType="numeric"
                    style={styles.input}
                    mode="outlined"
                    error={!!errors.sellingPrice}
                    left={
                      <TextInput.Affix 
                        text={sellingPriceAdjustmentType === 'fixed' ? '$' : ''} 
                      />
                    }
                    right={
                      <TextInput.Affix 
                        text={sellingPriceAdjustmentType === 'percentage' ? '%' : ''} 
                      />
                    }
                  />
                  {errors.sellingPrice && <HelperText type="error">{errors.sellingPrice}</HelperText>}
                  
                  {sellingPriceAdjustmentType === 'percentage' && (
                    <Text style={styles.helpText}>
                      Use positive values to increase prices (e.g., 10 for +10%) or negative values to decrease (e.g., -10 for -10%).
                    </Text>
                  )}
                </View>
              )}
            </View>
            
            <Divider style={styles.divider} />
            
            {/* Purchase Price */}
            <View style={styles.optionContainer}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  status={editPurchasePrice ? 'checked' : 'unchecked'}
                  onPress={() => setEditPurchasePrice(!editPurchasePrice)}
                />
                <Text style={styles.optionLabel}>Update Purchase Price</Text>
              </View>
              
              {editPurchasePrice && (
                <View style={styles.optionContent}>
                  <View style={styles.radioRow}>
                    <Checkbox
                      status={purchasePriceAdjustmentType === 'fixed' ? 'checked' : 'unchecked'}
                      onPress={() => setPurchasePriceAdjustmentType('fixed')}
                    />
                    <Text style={styles.radioLabel}>Set Fixed Price</Text>
                    
                    <Checkbox
                      status={purchasePriceAdjustmentType === 'percentage' ? 'checked' : 'unchecked'}
                      onPress={() => setPurchasePriceAdjustmentType('percentage')}
                    />
                    <Text style={styles.radioLabel}>Adjust by Percentage</Text>
                  </View>
                  
                  <TextInput
                    label={purchasePriceAdjustmentType === 'fixed' ? 'New Purchase Price' : 'Percentage Adjustment'}
                    value={newPurchasePrice}
                    onChangeText={setNewPurchasePrice}
                    keyboardType="numeric"
                    style={styles.input}
                    mode="outlined"
                    error={!!errors.purchasePrice}
                    left={
                      <TextInput.Affix 
                        text={purchasePriceAdjustmentType === 'fixed' ? '$' : ''} 
                      />
                    }
                    right={
                      <TextInput.Affix 
                        text={purchasePriceAdjustmentType === 'percentage' ? '%' : ''} 
                      />
                    }
                  />
                  {errors.purchasePrice && <HelperText type="error">{errors.purchasePrice}</HelperText>}
                  
                  {purchasePriceAdjustmentType === 'percentage' && (
                    <Text style={styles.helpText}>
                      Use positive values to increase prices (e.g., 10 for +10%) or negative values to decrease (e.g., -10 for -10%).
                    </Text>
                  )}
                </View>
              )}
            </View>
            
            <Divider style={styles.divider} />
            
            {/* Category */}
            <View style={styles.optionContainer}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  status={editCategory ? 'checked' : 'unchecked'}
                  onPress={() => setEditCategory(!editCategory)}
                />
                <Text style={styles.optionLabel}>Update Category</Text>
              </View>
              
              {editCategory && (
                <View style={styles.optionContent}>
                  <TextInput
                    label="New Category"
                    value={newCategory}
                    onChangeText={setNewCategory}
                    style={styles.input}
                    mode="outlined"
                    error={!!errors.category}
                  />
                  {errors.category && <HelperText type="error">{errors.category}</HelperText>}
                </View>
              )}
            </View>
            
            <Divider style={styles.divider} />
            
            {/* Reorder Point */}
            <View style={styles.optionContainer}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  status={editReorderPoint ? 'checked' : 'unchecked'}
                  onPress={() => setEditReorderPoint(!editReorderPoint)}
                />
                <Text style={styles.optionLabel}>Update Reorder Point</Text>
              </View>
              
              {editReorderPoint && (
                <View style={styles.optionContent}>
                  <TextInput
                    label="New Reorder Point"
                    value={newReorderPoint}
                    onChangeText={setNewReorderPoint}
                    keyboardType="numeric"
                    style={styles.input}
                    mode="outlined"
                    error={!!errors.reorderPoint}
                  />
                  {errors.reorderPoint && <HelperText type="error">{errors.reorderPoint}</HelperText>}
                </View>
              )}
            </View>
            
            <Divider style={styles.divider} />
            
            {/* Reorder Quantity */}
            <View style={styles.optionContainer}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  status={editReorderQuantity ? 'checked' : 'unchecked'}
                  onPress={() => setEditReorderQuantity(!editReorderQuantity)}
                />
                <Text style={styles.optionLabel}>Update Reorder Quantity</Text>
              </View>
              
              {editReorderQuantity && (
                <View style={styles.optionContent}>
                  <TextInput
                    label="New Reorder Quantity"
                    value={newReorderQuantity}
                    onChangeText={setNewReorderQuantity}
                    keyboardType="numeric"
                    style={styles.input}
                    mode="outlined"
                    error={!!errors.reorderQuantity}
                  />
                  {errors.reorderQuantity && <HelperText type="error">{errors.reorderQuantity}</HelperText>}
                </View>
              )}
            </View>
            
            <Divider style={styles.divider} />
            
            {/* Active Status */}
            <View style={styles.optionContainer}>
              <View style={styles.checkboxRow}>
                <Checkbox
                  status={editActive ? 'checked' : 'unchecked'}
                  onPress={() => setEditActive(!editActive)}
                />
                <Text style={styles.optionLabel}>Update Active Status</Text>
              </View>
              
              {editActive && (
                <View style={styles.switchContainer}>
                  <Text>Set all products to:</Text>
                  <View style={styles.switchRow}>
                    <Text style={newActive ? styles.activeText : styles.inactiveText}>
                      {newActive ? 'Active' : 'Inactive'}
                    </Text>
                    <Switch
                      value={newActive}
                      onValueChange={setNewActive}
                      color={colors.primary}
                    />
                  </View>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.buttonsContainer}>
          <Button 
            mode="contained" 
            onPress={applyBatchEdit}
            style={styles.applyButton}
            loading={submitting}
            disabled={submitting}
          >
            Apply Changes
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={resetForm}
            style={styles.resetButton}
            disabled={submitting}
          >
            Reset Form
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

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
  summaryCard: {
    marginBottom: 16,
  },
  chipsContainer: {
    marginTop: 12,
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
  },
  divider: {
    marginVertical: 16,
  },
  optionContainer: {
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  optionContent: {
    marginLeft: 40,
    marginTop: 12,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    marginLeft: 8,
    marginRight: 16,
  },
  input: {
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  switchContainer: {
    marginLeft: 40,
    marginTop: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    width: 150,
  },
  activeText: {
    color: '#4CAF50',
  },
  inactiveText: {
    color: '#F44336',
  },
  buttonsContainer: {
    marginBottom: 24,
  },
  applyButton: {
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary,
  },
  resetButton: {
    paddingVertical: 8,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 16,
    backgroundColor: colors.primary,
  },
});

export default WarehouseProductBatchEditScreen;
