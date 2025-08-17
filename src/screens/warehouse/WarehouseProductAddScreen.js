import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Switch,
  HelperText,
  Portal,
  Dialog,
  List,
} from 'react-native-paper';
import {colors} from '../../constants/theme';
import Appbar from '../../components/Appbar';
import {generateClient} from 'aws-amplify/api';
import {createWarehouseProduct} from '../../graphql/mutations';
import {listWarehouseProducts} from '../../graphql/queries';

const WarehouseProductAddScreen = ({navigation}) => {
  const client = generateClient();

  // Simplified form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [totalStock, setTotalStock] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [skuLoading, setSkuLoading] = useState(false);
  const [skuExists, setSkuExists] = useState(false);
  const [categoriesDialogVisible, setCategoriesDialogVisible] = useState(false);
  const [uniqueCategories, setUniqueCategories] = useState([]);

  const checkSku = async skuValue => {
    if (!skuValue) {
      return;
    }
    setSkuLoading(true);
    try {
      const result = await client.graphql({
        query: listWarehouseProducts,
        variables: {filter: {sku: {eq: skuValue}}},
      });
      const exists = result.data.listWarehouseProducts.items.length > 0;
      setSkuExists(exists);
      if (exists) {
        setErrors(prev => ({...prev, sku: 'This SKU already exists'}));
      } else {
        setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.sku;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking SKU:', error);
    } finally {
      setSkuLoading(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await client.graphql({query: listWarehouseProducts});
        const products = result.data.listWarehouseProducts.items;
        const categories = [
          ...new Set(products.map(p => p.category).filter(Boolean)),
        ];
        setUniqueCategories(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, [client]);

  const validateForm = () => {
    const newErrors = {};
    if (!name) {
      newErrors.name = 'Product name is required';
    }
    if (!sku) {
      newErrors.sku = 'SKU is required';
    } else if (skuExists) {
      newErrors.sku = 'This SKU already exists';
    }
    if (!purchasePrice) {
      newErrors.purchasePrice = 'Purchase price is required';
    }
    if (!sellingPrice) {
      newErrors.sellingPrice = 'Selling price is required';
    }
    if (!totalStock) {
      newErrors.totalStock = 'Total stock is required';
    }

    const pPrice = parseFloat(purchasePrice);
    const sPrice = parseFloat(sellingPrice);

    if (isNaN(pPrice) || pPrice < 0) {
      newErrors.purchasePrice = 'Enter a valid purchase price';
    }

    if (isNaN(sPrice) || sPrice < 0) {
      newErrors.sellingPrice = 'Enter a valid selling price';
    } else if (!isNaN(pPrice) && sPrice <= pPrice) {
      newErrors.sellingPrice =
        'Selling price must be greater than purchase price';
    }

    if (isNaN(parseFloat(totalStock)) || parseFloat(totalStock) < 0) {
      newErrors.totalStock = 'Enter a valid stock quantity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name,
        description: description || null,
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: parseFloat(sellingPrice),
        totalStock: parseFloat(totalStock),
        availableStock: parseFloat(totalStock), // availableStock is same as totalStock on creation
        sku,
        barcode: barcode || null,
        category: category || null,
        isActive,
        lastRestockDate: new Date().toISOString(),
      };

      await client.graphql({
        query: createWarehouseProduct,
        variables: {input: productData},
      });

      Alert.alert('Success', 'Product added successfully!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Appbar title="Add New Product" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
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
              {errors.name && (
                <HelperText type="error">{errors.name}</HelperText>
              )}

              <TextInput
                label="SKU *"
                value={sku}
                onChangeText={text => {
                  setSku(text);
                  checkSku(text);
                }}
                onBlur={() => checkSku(sku)}
                style={styles.input}
                error={!!errors.sku}
                mode="outlined"
                right={skuLoading && <TextInput.Icon icon="timer-sand-empty" />}
              />
              {errors.sku && <HelperText type="error">{errors.sku}</HelperText>}
            </Card.Content>
          </Card>

          <Card style={styles.formCard}>
            <Card.Content>
              <Title>Description</Title>
              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
            </Card.Content>
          </Card>

          <Card style={styles.formCard}>
            <Card.Content>
              <Title>Pricing & Stock</Title>
              <View style={styles.row}>
                <TextInput
                  label="Purchase Price *"
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  style={[styles.input, styles.halfWidth]}
                  keyboardType="numeric"
                  error={!!errors.purchasePrice}
                  mode="outlined"
                />
                <TextInput
                  label="Selling Price *"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  style={[styles.input, styles.halfWidth]}
                  keyboardType="numeric"
                  error={!!errors.sellingPrice}
                  mode="outlined"
                />
              </View>
              {errors.purchasePrice && (
                <HelperText type="error">{errors.purchasePrice}</HelperText>
              )}
              {errors.sellingPrice && (
                <HelperText type="error">{errors.sellingPrice}</HelperText>
              )}

              <TextInput
                label="Total Stock *"
                value={totalStock}
                onChangeText={setTotalStock}
                style={styles.input}
                keyboardType="numeric"
                error={!!errors.totalStock}
                mode="outlined"
              />
              {errors.totalStock && (
                <HelperText type="error">{errors.totalStock}</HelperText>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.formCard}>
            <Card.Content>
              <Title>Organization</Title>
              <TextInput
                label="Category"
                value={category}
                onChangeText={setCategory}
                style={styles.input}
                mode="outlined"
                right={
                  <TextInput.Icon
                    name="chevron-down"
                    onPress={() => setCategoriesDialogVisible(true)}
                  />
                }
              />
              <TextInput
                label="Barcode (ISBN, UPC, etc.)"
                value={barcode}
                onChangeText={setBarcode}
                style={styles.input}
                mode="outlined"
              />
            </Card.Content>
          </Card>

          <Card style={styles.formCard}>
            <Card.Content>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Product is Active</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  color={colors.primary}
                />
              </View>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
            disabled={loading}>
            Add Product
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
      <Portal>
        <Dialog
          visible={categoriesDialogVisible}
          onDismiss={() => setCategoriesDialogVisible(false)}>
          <Dialog.Title>Select a Category</Dialog.Title>
          <Dialog.Content>
            <ScrollView>
              {uniqueCategories.map((cat, index) => (
                <List.Item
                  key={index}
                  title={cat}
                  onPress={() => {
                    setCategory(cat);
                    setCategoriesDialogVisible(false);
                  }}
                />
              ))}
            </ScrollView>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    padding: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 1,
    marginHorizontal: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: colors.background,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default WarehouseProductAddScreen;
