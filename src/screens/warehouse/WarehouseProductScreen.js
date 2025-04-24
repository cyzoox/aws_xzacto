import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Image
} from 'react-native';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/api';
import { createProduct, createWarehouseProduct } from '../../graphql/mutations';
import { listCategories } from '../../graphql/queries';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../../constants/theme';
import { launchImageLibrary } from 'react-native-image-picker';
import { Storage } from 'aws-amplify/storage';

// Define styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.primary,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: colors.black,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 12,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderText: {
    color: '#888',
    fontSize: 12,
  },
  imageButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default function WarehouseProductScreen({ navigation, route }) {
  const { user } = useAuthenticator();
  const client = generateClient();
  
  const [formState, setFormState] = useState({
    name: '',
    brand: '',
    description: '',
    oprice: '',
    sprice: '',
    stock: '',
    category: '',
    sku: '',
    img: '',
    source: 'warehouse'
  });
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Safe getter for categories to prevent length of undefined errors
  const getCategories = () => categories || [];
  
  // We're not fetching categories from API anymore
  // Using direct text input for category instead

  // Function to pick an image from device gallery
  const pickImage = async () => {
    try {
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 800,
        maxWidth: 800,
        quality: 0.8
      };
      
      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.error('ImagePicker Error:', response.error);
          Alert.alert('Error', 'Failed to pick image');
        } else if (response.assets && response.assets.length > 0) {
          setSelectedImage(response.assets[0].uri);
        }
      });
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Function to upload image to S3
  const uploadImage = async () => {
    if (!selectedImage) return null;
    
    try {
      setUploadingImage(true);
      
      // Create a unique filename
      const filename = `warehouse-products/${Date.now()}-${Math.floor(Math.random() * 1000000)}.jpg`;
      
      // Get the extension
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      
      // Upload to S3
      await Storage.put(filename, blob, {
        contentType: 'image/jpeg',
        progressCallback: progress => {
          console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
        },
      });
      
      // Return the S3 URL
      return filename;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!formState.name || !formState.oprice || !formState.sprice || !formState.stock) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    // Debug step - log what we're trying to submit
    console.log('Submitting product:', formState);

    try {
      setLoading(true);
      
      // Upload image if selected
      let imageUrl = formState.img;
      if (selectedImage) {
        const uploadedImageKey = await uploadImage();
        if (uploadedImageKey) {
          imageUrl = uploadedImageKey;
        }
      }
      
      // Create warehouse product directly without creating store product first
      await client.graphql({
        query: createWarehouseProduct,
        variables: {
          input: {
            name: formState.name,
            brand: formState.brand || null,
            description: formState.description || null,
            purchasePrice: parseFloat(formState.oprice),
            sellingPrice: parseFloat(formState.sprice),
            totalStock: parseFloat(formState.stock),
            availableStock: parseFloat(formState.stock), // Initially available stock equals total stock
            sku: formState.sku || '',
            barcode: null,
            img: imageUrl,
            category: formState.category || null,
            subcategory: null,
            supplier: null,
            supplierContact: null,
            reorderPoint: null,
            reorderQuantity: null,
            location: null,
            isActive: true,
            lastRestockDate: new Date().toISOString()
          }
        }
      });

      Alert.alert('Success', 'Product added to warehouse successfully');
      setFormState({
        name: '',
        brand: '',
        description: '',
        oprice: '',
        sprice: '',
        stock: '',
        category: '',
        sku: '',
        img: '',
        source: 'warehouse'
      });
      setSelectedImage(null);
      navigation.goBack();
    } catch (error) {
      console.error('Error details:', error);
      Alert.alert(
        'Error',
        error?.errors?.[0]?.message || 
        error?.message || 
        'Failed to add product to warehouse. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Text style={styles.heading}>Add Warehouse Product</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Name*</Text>
          <TextInput
            placeholder="Enter product name"
            value={formState.name}
            onChangeText={(text) => setFormState({ ...formState, name: text })}
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand</Text>
          <TextInput
            placeholder="Enter brand name"
            value={formState.brand}
            onChangeText={(text) => setFormState({ ...formState, brand: text })}
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder="Enter product description"
            value={formState.description}
            onChangeText={(text) => setFormState({ ...formState, description: text })}
            style={[styles.input, styles.textArea]}
            multiline={true}
            numberOfLines={4}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
            <Text style={styles.label}>Original Price*</Text>
            <TextInput
              placeholder="0.00"
              value={formState.oprice}
              onChangeText={(text) => setFormState({ ...formState, oprice: text })}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
            <Text style={styles.label}>Selling Price*</Text>
            <TextInput
              placeholder="0.00"
              value={formState.sprice}
              onChangeText={(text) => setFormState({ ...formState, sprice: text })}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
            <Text style={styles.label}>Initial Stock*</Text>
            <TextInput
              placeholder="0"
              value={formState.stock}
              onChangeText={(text) => setFormState({ ...formState, stock: text })}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
            <Text style={styles.label}>SKU</Text>
            <TextInput
              placeholder="Enter SKU"
              value={formState.sku}
              onChangeText={(text) => setFormState({ ...formState, sku: text })}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            placeholder="Enter Category"
            value={formState.category}
            onChangeText={(text) => setFormState({...formState, category: text})}
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Image</Text>
          <View style={styles.imageUploadContainer}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.imageButton} 
              onPress={pickImage}
              disabled={uploadingImage}
            >
              <Text style={styles.imageButtonText}>
                {selectedImage ? 'Change Image' : 'Select Image'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || uploadingImage}
            style={[styles.button, styles.primaryButton]}
          >
            {loading || uploadingImage ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.buttonText}>Add Product</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.button, styles.secondaryButton]}
            disabled={loading || uploadingImage}
          >
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
