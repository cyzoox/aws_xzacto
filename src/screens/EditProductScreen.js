import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {generateClient} from 'aws-amplify/api';
import {
  updateProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  createAddon,
  updateAddon,
  deleteAddon,
} from '../graphql/mutations';
import {useStore} from '../context/StoreContext';
import {uploadData} from 'aws-amplify/storage';
import {Button, Card, Divider, Menu} from 'react-native-paper';
import Appbar from '../components/Appbar';
import * as ImagePicker from 'react-native-image-picker';
import {v4 as uuidv4} from 'uuid';

const EditProductScreen = ({navigation, route}) => {
  const {product} = route.params;
  const {currentStore} = useStore();
  const client = generateClient();

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [activeSection, setActiveSection] = useState('basic');
  // Initialize form state from product data
  const [formState, setFormState] = useState({
    name: product.name || '',
    description: product.description || '',
    brand: product.brand || '',
    oprice: product.oprice?.toString() || '',
    sprice: product.sprice?.toString() || '',
    stock: product.stock?.toString() || '',
    categoryId: product.categoryId || '',
    subcategory: product.subcategory || '',
    image: product.img || null,
    sku: product.sku || '',
    variants: [],
    addons: [],
  });

  // Load variants and addons
  useEffect(() => {
    console.log('Loading variants and addons for product:', product.id);
    console.log('Raw variants:', product.variants?.items);
    console.log('Raw addons:', product.addons?.items);

    const variants =
      product.variants?.items
        ?.filter(item => !item._deleted)
        ?.map(variant => ({
          id: variant.id,
          name: variant.name,
          price: variant.price?.toString() || '0',
        })) || [];

    const addons =
      product.addons?.items
        ?.filter(item => !item._deleted)
        ?.map(addon => ({
          id: addon.id,
          name: addon.name,
          price: addon.price?.toString() || '0',
        })) || [];

    console.log('Processed variants:', variants);
    console.log('Processed addons:', addons);

    setFormState(prev => ({
      ...prev,
      variants,
      addons,
    }));
  }, [product.id]);

  // Variant and Addon state
  const [newVariant, setNewVariant] = useState({name: '', price: ''});
  const [newAddon, setNewAddon] = useState({name: '', price: ''});
  const [deletedVariantIds, setDeletedVariantIds] = useState([]);
  const [deletedAddonIds, setDeletedAddonIds] = useState([]);

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formState.name?.trim()) {
      errors.name = 'Product name is required';
    }

    if (!formState.sprice || isNaN(parseFloat(formState.sprice))) {
      errors.sprice = 'Valid selling price is required';
    } else if (parseFloat(formState.sprice) <= 0) {
      errors.sprice = 'Selling price must be greater than 0';
    }

    if (!formState.oprice || isNaN(parseFloat(formState.oprice))) {
      errors.oprice = 'Valid original price is required';
    } else if (parseFloat(formState.oprice) <= 0) {
      errors.oprice = 'Original price must be greater than 0';
    }

    if (!currentStore?.id) {
      errors.store = 'Store information is missing';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Upload image helper
  const uploadImage = async () => {
    try {
      const imageKey = `products/${currentStore.id}/${uuidv4()}`;
      const result = await uploadData({
        key: imageKey,
        data: formState.image,
        options: {
          contentType: 'image/jpeg',
        },
      });
      return result.key;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setIsLoading(true);

      // Upload image if exists and is different from original
      let imageUrl = formState.image;
      if (formState.image && formState.image !== product.img) {
        imageUrl = await uploadImage();
      }

      // Update product basic info
      const productData = {
        id: product.id,
        name: formState.name,
        description: formState.description || '',
        brand: formState.brand || '',
        oprice: parseFloat(formState.oprice),
        sprice: parseFloat(formState.sprice),
        stock: parseFloat(formState.stock),
        categoryId: formState.categoryId,
        subcategory: formState.subcategory || '',
        sku: formState.sku || '',
        img: imageUrl,
        storeId: currentStore.id,
        isActive: true,
      };

      // Update the main product
      const updatedProduct = await client.graphql({
        query: updateProduct,
        variables: {input: productData},
      });

      console.log('Updated product:', updatedProduct.data.updateProduct);

      // Handle variants
      const variantPromises = formState.variants.map(async variant => {
        try {
          // If variant has an ID, it already exists
          if (variant.id) {
            // Update existing variant
            return client.graphql({
              query: updateVariant,
              variables: {
                input: {
                  id: variant.id,
                  name: variant.name,
                  price: parseFloat(variant.price),
                  productId: product.id,
                },
              },
            });
          } else {
            // Create new variant
            return client.graphql({
              query: createVariant,
              variables: {
                input: {
                  name: variant.name,
                  price: parseFloat(variant.price),
                  productId: product.id,
                },
              },
            });
          }
        } catch (error) {
          console.error('Error handling variant:', error);
          return null;
        }
      });

      // Handle addons
      const addonPromises = formState.addons.map(async addon => {
        try {
          // If addon has an ID, it already exists
          if (addon.id) {
            // Update existing addon
            return client.graphql({
              query: updateAddon,
              variables: {
                input: {
                  id: addon.id,
                  name: addon.name,
                  price: parseFloat(addon.price),
                  productId: product.id,
                },
              },
            });
          } else {
            // Create new addon
            return client.graphql({
              query: createAddon,
              variables: {
                input: {
                  name: addon.name,
                  price: parseFloat(addon.price),
                  productId: product.id,
                },
              },
            });
          }
        } catch (error) {
          console.error('Error handling addon:', error);
          return null;
        }
      });

      // Delete removed variants
      const deleteVariantPromises = deletedVariantIds.map(id =>
        client.graphql({
          query: deleteVariant,
          variables: {input: {id}},
        }),
      );

      // Delete removed addons
      const deleteAddonPromises = deletedAddonIds.map(id =>
        client.graphql({
          query: deleteAddon,
          variables: {input: {id}},
        }),
      );

      // Wait for all operations to complete
      await Promise.all([
        ...variantPromises,
        ...addonPromises,
        ...deleteVariantPromises,
        ...deleteAddonPromises,
      ]);

      // Clear deleted IDs
      setDeletedVariantIds([]);
      setDeletedAddonIds([]);

      Alert.alert('Success', 'Product updated successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Form handlers
  const handleInputChange = (field, value) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Image picker
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        handleInputChange('image', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Variant handlers
  const addVariant = () => {
    if (
      !newVariant.name ||
      !newVariant.price ||
      isNaN(parseFloat(newVariant.price))
    ) {
      Alert.alert('Error', 'Please enter valid variant name and price');
      return;
    }

    setFormState(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {...newVariant, price: parseFloat(newVariant.price)},
      ],
    }));
    setNewVariant({name: '', price: ''});
  };

  const removeVariant = index => {
    setFormState(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  // Addon handlers
  const addAddon = () => {
    if (
      !newAddon.name ||
      !newAddon.price ||
      isNaN(parseFloat(newAddon.price))
    ) {
      Alert.alert('Error', 'Please enter valid addon name and price');
      return;
    }

    setFormState(prev => ({
      ...prev,
      addons: [
        ...prev.addons,
        {...newAddon, price: parseFloat(newAddon.price)},
      ],
    }));
    setNewAddon({name: '', price: ''});
  };

  const removeAddon = index => {
    setFormState(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index),
    }));
  };

  // Render form sections
  const renderBasicInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>

      <TextInput
        style={[styles.input, formErrors.name && styles.inputError]}
        placeholder="Product Name"
        value={formState.name}
        onChangeText={value => handleInputChange('name', value)}
      />
      {formErrors.name && (
        <Text style={styles.errorText}>{formErrors.name}</Text>
      )}

      <TextInput
        style={[styles.input, formErrors.brand && styles.inputError]}
        placeholder="Brand"
        value={formState.brand}
        onChangeText={value => handleInputChange('brand', value)}
      />

      <TextInput
        style={[styles.input, formErrors.description && styles.inputError]}
        placeholder="Description"
        value={formState.description}
        onChangeText={value => handleInputChange('description', value)}
        multiline
      />

      <TextInput
        style={[styles.input, formErrors.oprice && styles.inputError]}
        placeholder="Original Price"
        value={formState.oprice}
        onChangeText={value => handleInputChange('oprice', value)}
        keyboardType="decimal-pad"
      />
      {formErrors.oprice && (
        <Text style={styles.errorText}>{formErrors.oprice}</Text>
      )}

      <TextInput
        style={[styles.input, formErrors.sprice && styles.inputError]}
        placeholder="Selling Price"
        value={formState.sprice}
        onChangeText={value => handleInputChange('sprice', value)}
        keyboardType="decimal-pad"
      />
      {formErrors.sprice && (
        <Text style={styles.errorText}>{formErrors.sprice}</Text>
      )}

      <TextInput
        style={[styles.input, formErrors.stock && styles.inputError]}
        placeholder="Stock"
        value={formState.stock}
        onChangeText={value => handleInputChange('stock', value)}
        keyboardType="decimal-pad"
      />

      <TextInput
        style={[styles.input, formErrors.sku && styles.inputError]}
        placeholder="SKU"
        value={formState.sku}
        onChangeText={value => handleInputChange('sku', value)}
      />

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Text>Change Product Image</Text>
      </TouchableOpacity>
      {formState.image && (
        <Image source={{uri: formState.image}} style={styles.previewImage} />
      )}
    </View>
  );

  const renderVariantsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Variants</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, {flex: 2}]}
          placeholder="Variant Name"
          value={newVariant.name}
          onChangeText={value =>
            setNewVariant(prev => ({...prev, name: value}))
          }
        />
        <TextInput
          style={[styles.input, {flex: 1, marginLeft: 8}]}
          placeholder="Price"
          value={newVariant.price}
          onChangeText={value =>
            setNewVariant(prev => ({...prev, price: value}))
          }
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={styles.addButton} onPress={addVariant}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      {formState.variants.map((variant, index) => (
        <View key={index} style={styles.itemRow}>
          <Text style={styles.itemName}>{variant.name}</Text>
          <Text style={styles.itemPrice}>₱{variant.price}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeVariant(index)}>
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderAddonsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Add-ons</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, {flex: 2}]}
          placeholder="Add-on Name"
          value={newAddon.name}
          onChangeText={value => setNewAddon(prev => ({...prev, name: value}))}
        />
        <TextInput
          style={[styles.input, {flex: 1, marginLeft: 8}]}
          placeholder="Price"
          value={newAddon.price}
          onChangeText={value => setNewAddon(prev => ({...prev, price: value}))}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={styles.addButton} onPress={addAddon}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      {formState.addons.map((addon, index) => (
        <View key={index} style={styles.itemRow}>
          <Text style={styles.itemName}>{addon.name}</Text>
          <Text style={styles.itemPrice}>₱{addon.price}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeAddon(index)}>
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar title="Edit Product" onBack={() => navigation.goBack()} />
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'basic' && styles.activeTab]}
          onPress={() => setActiveSection('basic')}>
          <Text
            style={[
              styles.tabText,
              activeSection === 'basic' && styles.activeTabText,
            ]}>
            Basic
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'variants' && styles.activeTab]}
          onPress={() => setActiveSection('variants')}>
          <Text
            style={[
              styles.tabText,
              activeSection === 'variants' && styles.activeTabText,
            ]}>
            Variants
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'addons' && styles.activeTab]}
          onPress={() => setActiveSection('addons')}>
          <Text
            style={[
              styles.tabText,
              activeSection === 'addons' && styles.activeTabText,
            ]}>
            Add-ons
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {activeSection === 'basic' && renderBasicInfoSection()}
        {activeSection === 'variants' && renderVariantsSection()}
        {activeSection === 'addons' && renderAddonsSection()}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}>
          Update Product
        </Button>
      </View>
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
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  imageButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
});

export default EditProductScreen;
