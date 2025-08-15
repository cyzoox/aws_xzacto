import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Switch,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  createProductWithDetails,
  syncOfflineActions,
} from '../redux/slices/productSlice';
import {fetchCategories} from '../redux/slices/categorySlice';
import NetInfo from '@react-native-community/netinfo';
import {generateClient} from 'aws-amplify/api';

import {useStore} from '../context/StoreContext';
import {uploadData} from 'aws-amplify/storage';
import {Button, Card, Divider, IconButton, Menu} from 'react-native-paper';
import Appbar from '../components/Appbar';
import * as ImagePicker from 'react-native-image-picker';

import {v4 as uuidv4} from 'uuid';

const CreateProductScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const {loading: reduxLoading, error: reduxError} = useSelector(
    state => state.products,
  );
  const {items: categories} = useSelector(state => state.categories);

  // Get store directly from route params if available
  const storeFromParams = route.params?.store;

  // Still use StoreContext as fallback
  const {
    currentStore: contextStore,
    currentStaff,
    staffStores,
    fetchStores,
  } = useStore();

  // Use store from params if available, otherwise fall back to context
  const currentStore = storeFromParams || contextStore;

  const {loading: storeLoading} = useSelector(state => state.store) || {
    loading: false,
  };

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [activeSection, setActiveSection] = useState('basic'); // 'basic', 'variants', 'addons'
  const [initialized, setInitialized] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    brand: '',
    description: '',
    oprice: '',
    sprice: '',
    stock: '',
    category: '',
    subcategory: '',
    sku: '',
    image: null,
    variants: [],
    addons: [],
  });

  // Variant and Addon state
  const [newVariant, setNewVariant] = useState({name: '', price: ''});
  const [newAddon, setNewAddon] = useState({name: '', price: ''});

  // Initialize client
  const client = generateClient();

  // Check connection and sync on mount
  useEffect(() => {
    const checkConnectionAndSync = async () => {
      const {isConnected} = await NetInfo.fetch();
      if (isConnected) {
        dispatch(syncOfflineActions());
      }
    };
    checkConnectionAndSync();
  }, [dispatch]);

  // Initialize store context and fetch categories
  useEffect(() => {
    const initialize = async () => {
      try {
        if (currentStore?.id) {
          // Pass the store ID when fetching categories
          console.log('Fetching categories for store:', currentStore.id);
          dispatch(fetchCategories(currentStore.id));
        } else {
          console.log('No store ID available, cannot fetch categories');
        }
        setInitialized(true);
      } catch (error) {
        console.error('Error in initialization:', error);
        Alert.alert('Error', 'Failed to initialize. Please try again.');
      }
    };

    initialize();
  }, [currentStore?.id, dispatch]);

  // Subscribe to network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        dispatch(syncOfflineActions());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Form validation
  const validateForm = () => {
    const errors = {};

    // Required fields
    if (!formState.name?.trim()) {
      errors.name = 'Product name is required';
    }

    // Original price validation
    if (!formState.oprice || isNaN(parseFloat(formState.oprice))) {
      errors.oprice = 'Valid original price is required';
    } else if (parseFloat(formState.oprice) <= 0) {
      errors.oprice = 'Original price must be greater than 0';
    }

    // Selling price validation
    if (!formState.sprice || isNaN(parseFloat(formState.sprice))) {
      errors.sprice = 'Valid selling price is required';
    } else if (parseFloat(formState.sprice) <= 0) {
      errors.sprice = 'Selling price must be greater than 0';
    }

    // Stock validation
    if (!formState.stock || isNaN(parseFloat(formState.stock))) {
      errors.stock = 'Valid stock quantity is required';
    } else if (parseFloat(formState.stock) < 0) {
      errors.stock = 'Stock cannot be negative';
    }

    // Category validation
    if (!formState.category) {
      errors.category = 'Category is required';
    }

    if (!currentStore?.id) {
      errors.store = 'Store information is missing';
    }

    // Optional fields validation (if provided)
    if (formState.sku && formState.sku.trim().length === 0) {
      errors.sku = 'SKU cannot be empty if provided';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Upload image helper
  const uploadImage = async () => {
    try {
      if (!formState.image) {
        return null;
      }

      const response = await fetch(formState.image);
      const blob = await response.blob();
      const imageKey = `products/${currentStore.id}/${uuidv4()}.jpg`;

      await uploadData({
        key: imageKey,
        data: blob,
        options: {
          contentType: 'image/jpeg',
        },
      });

      return imageKey;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setActiveSection('basic'); // Switch to basic section to show errors
      return;
    }

    setIsLoading(true);
    try {
      // Log store information for debugging
      console.log(
        'Creating product for store:',
        currentStore?.name,
        'with ID:',
        currentStore?.id,
      );

      // Upload image if exists
      let imageKey = null;
      if (formState.image) {
        imageKey = await uploadImage(formState.image);
      }

      // Structure product data to match API requirements
      const productData = {
        // Main product must be nested under 'product' key to match productSlice expectations
        product: {
          name: formState.name,
          brand: formState.brand || '',
          description: formState.description || '',
          oprice: parseFloat(formState.oprice),
          sprice: parseFloat(formState.sprice),
          stock: parseInt(formState.stock, 10),
          categoryId: formState.category || '',
          subcategory: formState.subcategory || '',
          sku: formState.sku || '',
          img: imageKey || '',
          storeId: currentStore?.id || '', // Link to store
          isActive: true,
        },
        // Prepare variants array with proper structure
        variants: formState.variants.map(variant => ({
          name: variant.name,
          price: parseFloat(variant.price),
          productId: '', // Will be set after product creation
        })),
        // Prepare addons array with proper structure
        addons: formState.addons.map(addon => ({
          name: addon.name,
          price: parseFloat(addon.price),
          productId: '', // Will be set after product creation
        })),
      };

      console.log(
        'Creating product with data:',
        JSON.stringify(productData, null, 2),
      );
      await dispatch(createProductWithDetails(productData));
      
      // Skip the alert and navigate back immediately to avoid header flashing
      navigation.navigate('ProductDashboard', {
        store: currentStore,
        refresh: true, // Add this flag to trigger refresh
        timestamp: new Date().getTime() // Add timestamp to force refresh
      });
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to create product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial categories fetch
  useEffect(() => {
    if (currentStore?.id) {
      dispatch(fetchCategories());
    }
  }, [dispatch, currentStore?.id]);

  // State for category menu
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  if (!currentStore) {
    return null;
  }

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
        includeBase64: false,
        maxHeight: 800,
        maxWidth: 800,
      });

      if (!result.didCancel && result.assets?.[0]?.uri) {
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
        placeholder="Product Name *"
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
        placeholder="Original Price *"
        value={formState.oprice}
        onChangeText={value => handleInputChange('oprice', value)}
        keyboardType="decimal-pad"
      />
      {formErrors.oprice && (
        <Text style={styles.errorText}>{formErrors.oprice}</Text>
      )}

      <TextInput
        style={[styles.input, formErrors.sprice && styles.inputError]}
        placeholder="Selling Price *"
        value={formState.sprice}
        onChangeText={value => handleInputChange('sprice', value)}
        keyboardType="decimal-pad"
      />
      {formErrors.sprice && (
        <Text style={styles.errorText}>{formErrors.sprice}</Text>
      )}

      <TextInput
        style={[styles.input, formErrors.stock && styles.inputError]}
        placeholder="Initial Stock *"
        value={formState.stock}
        onChangeText={value => handleInputChange('stock', value)}
        keyboardType="decimal-pad"
      />
      {formErrors.stock && (
        <Text style={styles.errorText}>{formErrors.stock}</Text>
      )}

      <TextInput
        style={[styles.input, formErrors.sku && styles.inputError]}
        placeholder="SKU"
        value={formState.sku}
        onChangeText={value => handleInputChange('sku', value)}
      />

      <View style={styles.categoryContainer}>
        <Text style={styles.label}>Category *</Text>
        <Menu
          visible={showCategoryMenu}
          onDismiss={() => setShowCategoryMenu(false)}
          anchor={
            <TouchableOpacity
              style={[
                styles.categoryButton,
                formErrors.category && styles.inputError,
              ]}
              onPress={() => setShowCategoryMenu(true)}>
              <Text>{formState.category || 'Select Category'}</Text>
            </TouchableOpacity>
          }>
          {categories
            .filter(cat => cat.storeId === currentStore.id)
            .map(category => (
              <Menu.Item
                key={category.id}
                onPress={() => {
                  handleInputChange('category', category.id); // Use category ID instead of name
                  setShowCategoryMenu(false);
                }}
                title={category.name}
              />
            ))}
        </Menu>
      </View>
      {formErrors.category && (
        <Text style={styles.errorText}>{formErrors.category}</Text>
      )}

      <TextInput
        style={[styles.input, formErrors.subcategory && styles.inputError]}
        placeholder="Subcategory"
        value={formState.subcategory}
        onChangeText={value => handleInputChange('subcategory', value)}
      />

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Text>Select Product Image</Text>
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

  // Show loading indicator when categories are still loading
  if (reduxLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Appbar title="Create Product" onBack={() => navigation.goBack()} />
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading product form...</Text>
      </View>
    );
  }

  // Show debug info about store
  console.log(
    'CreateProduct using store:',
    currentStore?.name,
    'id:',
    currentStore?.id,
  );

  // Simplified error handling - only show error if we can't continue
  if (!currentStore?.id) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Appbar title="Create Product" onBack={() => navigation.goBack()} />
        <Text style={styles.errorText}>No store information available.</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar title="Create Product" onBack={() => navigation.goBack()} />
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
          Create Product
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
    marginBottom: 8,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  imageButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    marginTop: 8,
    borderRadius: 4,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4a90e2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  disabledDropdown: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  menu: {
    marginTop: 8,
    width: '90%',
    maxHeight: 300,
    elevation: 8,
    backgroundColor: '#fff',
  },
  imagePickerButton: {
    width: '100%',
    height: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#4a90e2',
  },
  formCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#4a90e2',
  },
  list: {
    marginTop: 8,
  },
  listCard: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '500',
  },
  cardPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
  },
});

export default CreateProductScreen;
