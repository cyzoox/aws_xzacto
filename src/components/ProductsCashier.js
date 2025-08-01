import React, {useState,useEffect} from 'react';
import {
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  View,
  Text,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput
} from 'react-native';
import FlatGrid from 'react-native-super-grid';
import {Button, Input} from 'react-native-elements';
import Modal from 'react-native-modal';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import { listCategories, listCartItems, listProducts, listVariants, listAddons } from '../graphql/queries';
import { createCartItem, updateCartItem } from '../graphql/mutations';
import { calculateFinalPrice, formatPrice, getProductPriceDisplay } from '../utils/priceCalculations';


const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;


import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Alert from './Alert';
import colors from '../themes/colors';
import { generateClient } from 'aws-amplify/api';
import SearchBar from './SearchBar';
const client = generateClient();
export default function ProductsCashier({
  route,
  cart,
  setCart,
  onCartUpdate
}) {
  const { staffData } = route.params;
    
  const [selectedCategory, setSelectedCategory] = useState('All'); // Default to 'All'
  const [searchTerm, setSearchTerm] = useState(''); // Search query
  const [overlay, overlayVisible] = useState(false);
  const [item, setItems] = useState([]);
  const [term, setTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [alerts, alertVisible] = useState(false);
  const [alerts2, alertVisible2] = useState(false);
  const [category, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [variantModal, setVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedAddonId, setSelectedAddonId] = useState(null);
  const [total, setTotal] = useState(0);
  const [bcode, setBarcode] = useState('');

  const setVariables = itemss => {
    setItems(itemss);
    if (stores[0].attendant === '') {
      alertVisible(true);
      setItems([]);
      return;
    }
    if (itemss.unit === 'Kilo' || itemss.unit === 'Gram') {
      overlayVisible(true);
      return;
    }
   
  };

  const onCancelAlert = () => {
    alertVisible(false);
  };



  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []); // Initial fetch only
  
  // We'll use the existing fetchProductDetails function defined below
  
  useEffect(() => {
    let filtered = products;
    
    if (selectedCategory !== 'All') {
      // Find the category object that matches the selected category name
      const matchingCategory = category.find(c => c.name === selectedCategory);
      
      if (matchingCategory) {
        // Filter products by categoryId (this is the correct relation field)
        filtered = filtered.filter(product => product.categoryId === matchingCategory.id);
        console.log(`Filtering by category: ${selectedCategory} (ID: ${matchingCategory.id}), found ${filtered.length} products`);
      } else {
        console.log(`No matching category found for: ${selectedCategory}`);
      }
    }
    
    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm, category]);

  const fetchCategories = async () => {
   try{
    const result = await client.graphql({
        query: listCategories,
        variables: { filter: { storeId: { eq: staffData.store_id } } }
    });
    const categoriesList = result.data.listCategories.items;
    console.log('Categories fetched:', categoriesList.map(c => ({ id: c.id, name: c.name })));
    setCategories(categoriesList);
  }catch (err) {
    console.log('Error fetching category:', err);
  }
};

const fetchList = async () => {
  try {
    const result = await client.graphql({
      query: listCartItems,
      variables: {
        filter: {
          storeId: { eq: staffData.store_id},
          cashierId: { eq: staffData.id }
        },
      },
    });

    // Get the items from the backend
    const serverItems = result.data.listCartItems.items;
    
    // Only update non-pending items to avoid overwriting local changes
    setCart(prevCart => {
      const pendingItems = prevCart.filter(item => item.pending);
      const syncedItems = serverItems.filter(serverItem => 
        !pendingItems.some(pending => pending.productId === serverItem.productId)
      );
      return [...syncedItems, ...pendingItems];
    });
  } catch (err) {
    console.log('Error fetching cart items:', err.message);
  }
};

// Helper function to fetch product details (variants and addons)
const fetchProductDetails = async (productId) => {
  try {
    console.log('Fetching product details for:', productId);
    
    // Fetch variants
    const variantsResult = await client.graphql({
      query: listVariants,
      variables: {
        filter: { productId: { eq: productId } }
      }
    });

    // Fetch addons
    const addonsResult = await client.graphql({
      query: listAddons,
      variables: {
        filter: { productId: { eq: productId } }
      }
    });

    const variants = variantsResult.data?.listVariants?.items || [];
    const addons = addonsResult.data?.listAddons?.items || [];

    console.log(`Found ${variants.length} variants and ${addons.length} addons`);
    console.log('Variants:', JSON.stringify(variants));
    console.log('Addons:', JSON.stringify(addons));

    return {
      variants,
      addons
    };
  } catch (error) {
    console.error('Error fetching product details:', error);
    return { variants: [], addons: [] };
  }
};

const fetchProducts = async () => {
  try {
    // Fetch basic product information first
    const result = await client.graphql({
      query: listProducts,
      variables: { 
        filter: { storeId: { eq: staffData.store_id } }
      },
    });
    
    const productsList = result.data?.listProducts?.items ?? [];
    
    // Log product and category relationship
    console.log('Products category mapping:', productsList.slice(0, 5).map(p => ({
      name: p.name,
      categoryId: p.categoryId
    })));
    
    // Fetch variants and addons for each product
    const productsWithExtras = await Promise.all(
      productsList.map(async (product) => {
        const details = await fetchProductDetails(product.id);
        
        return {
          ...product,
          variants: { items: details.variants },
          addons: { items: details.addons }
        };
      })
    );

    console.log('Products with extras count:', productsWithExtras.length);
    setProducts(productsWithExtras);
    setFilteredProducts(productsWithExtras);
  } catch (err) {
    console.error('Error fetching products:', err);
  }
};



  const addToCart = async (item) => {
  try {
    if (!staffData || !staffData.id) {
      console.error('No staff data available');
      return;
    }

    // Check if product has variants or addons
    const hasVariants = Array.isArray(item.variants?.items) && item.variants.items.length > 0;
    const hasAddons = Array.isArray(item.addons?.items) && item.addons.items.length > 0;
    
    console.log(`Product ${item.name} checking for variants/addons:`, {
      hasVariants,
      hasAddons,
      variants: item.variants,
      addons: item.addons
    });
    
    if ((hasVariants || hasAddons) && !variantModal) {
      console.log('Opening variant modal for product:', item.name);
      
      // Use the product data we already have directly
      try {
        console.log(`Fetching detailed data for product ${item.name} (${item.id})`);
        
        // Fetch the complete product data with variants and addons
        const details = await fetchProductDetails(item.id);
        console.log('Product details:', details);
        
        // Create a complete product object with variants and addons
        const productWithExtras = {
          ...item,
          variants: { items: details.variants },
          addons: { items: details.addons }
        };
        
        console.log('Enhanced product data:', JSON.stringify(productWithExtras));
        
        if (details.variants.length === 0 && details.addons.length === 0) {
          console.log('No variants or addons found for this product. Adding directly to cart.');
          addToCart(item);
          return;
        }
        
        // Now set the selected product and show the modal
        const enhancedProduct = {
          ...productWithExtras,
          variants,
          addons
        };
        
        setSelectedVariantId(null);  // Reset selected variant
        setSelectedAddonId(null);   // Reset selected addon
        setSelectedProduct(enhancedProduct);   // Set the selected product
        setVariantModal(true);      // Open the modal
      } catch (err) {
        console.error('Error fetching product details:', err);
        // Fallback to using the basic product info
        setSelectedVariantId(null);  
        setSelectedAddonId(null);   
        setSelectedProduct(item);   
        setVariantModal(true);      
      }
      return;
    }

    // Get selected variant and addon objects (if any)
    const selectedVariant = selectedVariantId && selectedProduct?.variants?.items
      ? selectedProduct.variants.items.find(v => v.id === selectedVariantId)
      : null;
      
    const selectedAddon = selectedAddonId && selectedProduct?.addons?.items
      ? selectedProduct.addons.items.find(a => a.id === selectedAddonId)
      : null;

    // Check if this exact product+variant+addon combination exists in cart
    const cartItem = cart.find(cartItem => 
      cartItem.productId === item.id && 
      // For variants: Check if IDs match or both are missing
      ((selectedVariant && cartItem.variantData && 
        JSON.parse(cartItem.variantData).id === selectedVariant.id) || 
       (!selectedVariant && !cartItem.variantData)) &&
      // For addons: Check if IDs match or both are missing
      ((selectedAddon && cartItem.addonData && 
        JSON.parse(cartItem.addonData).id === selectedAddon.id) ||
       (!selectedAddon && !cartItem.addonData))
    );

    // Check if enough stock
    const currentQty = cartItem?.quantity || 0;
    if (currentQty + 1 > item.stock) {
      alert('Not enough stock available');
      return;
    }

    // Calculate the final price using our utility function
    // We need to create arrays for the selectedVariant and selectedAddon to match our utility function
    const selectedVariantArray = selectedVariantId && selectedProduct ? 
      [selectedProduct.variants.items.find(v => v.id === selectedVariantId)].filter(Boolean) : 
      [];
    
    const selectedAddonArray = selectedAddonId && selectedProduct ? 
      [selectedProduct.addons.items.find(a => a.id === selectedAddonId)].filter(Boolean) : 
      [];

    // Now calculate the price with the correct variant and addon data
    const totalPrice = calculateFinalPrice(item, selectedVariantArray, selectedAddonArray);
    
    console.log(`Adding product ${item.name} to cart with price ${totalPrice}:`, {
      hasSelections: !!(item.selectedVariants || item.selectedAddons),
      calculatedPrice: item.calculatedPrice,
      finalPrice: totalPrice
    });

    // Optimistically update the UI immediately
    if (cartItem) {
      // Update existing item in local state
      const updatedCart = cart.map(item => 
        item.id === cartItem.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
      setCart(updatedCart);
    } else {
      // We already have selectedVariant and selectedAddon from above
      // Create new item in local state with variant and addon details
      const newCartItem = {
        id: `temp-${Date.now()}`, // Temporary ID for optimistic update
        name: item.name,
        brand: item.brand,
        oprice: item.oprice,
        sprice: totalPrice,
        productId: item.id,
        cashierId: staffData.id,
        category: item.category,
        unit: item.unit || 'PCS',
        storeId: item.storeId,
        quantity: 1,
        
        // Store variant and addon data directly in AWSJSON
        variantData: selectedVariant ? JSON.stringify(selectedVariant) : null,
        addonData: selectedAddon ? JSON.stringify(selectedAddon) : null,
        // Add direct references for UI rendering (single objects, not arrays)
        selectedVariant: selectedVariant,
        selectedAddon: selectedAddon,
        // Legacy field for backward compatibility
        addon: selectedVariant ? selectedVariant.name : (selectedAddon ? selectedAddon.name : null),
        
        pending: true // Flag to identify optimistic updates
      };
      setCart(prevCart => [...prevCart, newCartItem]);
    }

    // Now sync with the backend
    try {
      if (cartItem) {
        // Update existing item in backend (same product + variant + addon combination)
        await client.graphql({
          query: updateCartItem,
          variables: {
            input: {
              id: cartItem.id,
              quantity: cartItem.quantity + 1,
            },
          },
        });
      } else {
        // This is a new product
        // Get selected variant and addon objects (if any)
        const selectedVariant = selectedVariantId && selectedProduct?.variants?.items
          ? selectedProduct.variants.items.find(v => v.id === selectedVariantId)
          : null;
          
        const selectedAddon = selectedAddonId && selectedProduct?.addons?.items
          ? selectedProduct.addons.items.find(a => a.id === selectedAddonId)
          : null;

        // Create new item in backend with variant and addon details
        const newItem = {
          name: item.name,
          brand: item.brand,
          oprice: item.oprice,
          sprice: totalPrice,
          productId: item.id,
          cashierId: staffData.id,
          category: item.category,
          unit: item.unit || 'PCS',
          storeId: item.storeId,
          quantity: 1,
          
          // Store variant and addon data as serialized JSON strings for AWSJSON
          // Note: Even though the field is AWSJSON type, we need to pass it as a string
          variantData: selectedVariant ? JSON.stringify(selectedVariant) : null,
          addonData: selectedAddon ? JSON.stringify(selectedAddon) : null,
          // Legacy field for backward compatibility
          addon: selectedVariant ? selectedVariant.name : (selectedAddon ? selectedAddon.name : null)
        };

        await client.graphql({
          query: createCartItem,
          variables: { 
            input: newItem 
          },
        });
      }

      // Only fetch the full cart after a small delay to avoid unnecessary API calls
      setTimeout(() => {
        onCartUpdate();
      }, 500);

    } catch (err) {
      console.log('Error syncing with backend:', err.message);
      alert('Failed to add item to cart. Please try again.');
      
      // Revert optimistic update on error
      if (cartItem) {
        // Revert to previous cart state
        const originalCart = cart.map(item => 
          item.id === cartItem.id 
            ? { ...item, quantity: cartItem.quantity } 
            : item
        );
        setCart(originalCart);
      } else {
        // Remove the optimistically added item
        setCart(prevCart => prevCart.filter(item => !item.pending));
      }
    }

  } catch (err) {
    console.log('Error adding to cart:', err.message);
  }
};



  const calculateTotal = () => {
    let total = 0;
    cart.forEach(list => {
      total += list.quantity * list.sprice;
    });
    return total;
  };

  const calculateQty = () => {
    let total = 0;
    cart.forEach(list => {
      total += list.quantity;
    });
    return total;
  };


  const onTabChange = sterm => {
    console.log('Changing category to:', sterm);
    setSelectedCategory(sterm);
  };

  const handleInput = () => {
    if (
      isNaN(quantity) ||
      quantity === '.' ||
      quantity === ',' ||
      quantity === 0 ||
      quantity < 0
    ) {
      alertVisible2(true);
      return;
    }


  };


  const withAddtional = item => {
    setWithAdditional(true);
    setProductInfo(item);
  };

  const onselectVariant = item => {
    if (item._id === selectedVariant._id) {
      setSelectedVariant({name: '', price: 0, cost: 0});
      return;
    }
    setSelectedVariant(item);
  };

  const onselectAddon = item => {
    if (item._id === selectedAddon._id) {
      setSelectedAddon({name: '', price: 0, cost: 0});
      return;
    }
    setSelectedAddon(item);
  };

  const onselectOption = item => {
    if (item._id === selectedOption._id) {
      setSelectedOption({opton: ''});
      return;
    }
    setSelectedOption(item);
  };
  const _renderitem = ({item}) => {
    const cartItem = cart.find((cartItem) => cartItem.productId === item.id);
    const remainingStock = item.stock - (cartItem?.quantity || 0);
    const isOutOfStock = remainingStock <= 0;
    const hasLowStock = item.stock <= 10 && !isOutOfStock;
    // Check if product has variants or addons with enhanced detection
    const hasVariants = Array.isArray(item.variants?.items) && item.variants.items.length > 0;
    const hasAddons = Array.isArray(item.addons?.items) && item.addons.items.length > 0;
    const hasExtras = hasVariants || hasAddons;
    
    if (item.name === 'TEST2' || hasExtras) {
      console.log(`Product ${item.name} details:`, {
        id: item.id,
        variants: item.variants?.items || [],
        addons: item.addons?.items || [],
        hasVariants,
        hasAddons,
        hasExtras
      });
    }
  
    return (
      <TouchableOpacity
        onPress={() => !isOutOfStock && addToCart(item)}
        style={styles.itemContainer}
        activeOpacity={0.7}
      >
        <Image
          style={styles.itemImage}
          source={
            item.img 
              ? {uri: item.img, headers: {Authorization: 'auth-token'}}
              : require('../../assets/noproduct.png')
          }
        />
        
        <View style={styles.itemContent}>
          <Text numberOfLines={2} style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>
            {formatMoney(item.sprice, {symbol: '₱', precision: 2})}
          </Text>
          
          {/* Stock Status */}
          {isOutOfStock ? (
            <View style={[styles.statusBadge, styles.outOfStockBadge]}>
              <Text style={styles.statusText}>Out of Stock</Text>
            </View>
          ) : hasLowStock ? (
            <View style={[styles.statusBadge, styles.lowStockBadge]}>
              <Text style={styles.statusText}>Low Stock: {item.stock}</Text>
            </View>
          ) : null}
          
          {/* Cart Quantity */}
          {cartItem && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItem.quantity}</Text>
            </View>
          )}
          
          {/* Variant/Addon Indicator */}
          {hasExtras && (
            <View style={styles.variantBadge}>
              <Ionicons name="options" size={14} color="#fff" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const onCancel = () => {
    alertVisible2(!alerts2);
  };

  const renderVariantModal = () => {
    // Don't render if no selected product
    if (!selectedProduct) return null;
    
    // Get selected variant and addon objects
    const selectedVariant = selectedVariantId && selectedProduct.variants?.items
      ? selectedProduct.variants.items.find(v => v.id === selectedVariantId)
      : null;
      
    const selectedAddon = selectedAddonId && selectedProduct.addons?.items
      ? selectedProduct.addons.items.find(a => a.id === selectedAddonId)
      : null;
    
    // Calculate total price using our utility
    const totalPrice = calculateFinalPrice(
      selectedProduct,
      selectedVariant ? [selectedVariant] : [],
      selectedAddon ? [selectedAddon] : []
    );

    return (
      <Modal
        isVisible={variantModal}
        onBackdropPress={() => setVariantModal(false)}
        backdropOpacity={0.5}
        animationIn="slideInRight"
        animationOut="slideOutRight"
        style={styles.variantModal}
        backdropTransitionOutTiming={0}
        useNativeDriver={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setVariantModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Variants Section */}
            {selectedProduct.variants?.items?.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, {color: '#333', fontWeight: '700', fontSize: 18}]}>Select Size/Variant <Text style={{color: 'red'}}>*</Text></Text>
                {selectedProduct.variants.items.map((variant) => (
                  <TouchableOpacity
                    key={variant.id}
                    style={[styles.optionContainer, 
                      selectedVariantId === variant.id && styles.selectedOption
                    ]}
                    onPress={() => setSelectedVariantId(selectedVariantId === variant.id ? null : variant.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioContainer}>
                      <View style={selectedVariantId === variant.id ? styles.radioOuterSelected : styles.radioOuter}>
                        {selectedVariantId === variant.id && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.optionText, selectedVariantId === variant.id && {fontWeight: '600', color: '#000'}]}>
                        {variant.name}
                      </Text>
                    </View>
                    <Text style={[styles.optionPrice, selectedVariantId === variant.id && {color: '#000'}]}>
                      {formatPrice(parseFloat(variant.price) || 0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Addons Section */}
            {selectedProduct.addons?.items?.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, {color: '#333', fontWeight: '700', fontSize: 18}]}>Add Extras (Pick one)</Text>
                {selectedProduct.addons.items.map((addon) => (
                  <TouchableOpacity
                    key={addon.id}
                    style={[styles.optionContainer,
                      selectedAddonId === addon.id && styles.selectedOption
                    ]}
                    onPress={() => setSelectedAddonId(selectedAddonId === addon.id ? null : addon.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioContainer}>
                      <View style={selectedAddonId === addon.id ? styles.radioOuterSelected : styles.radioOuter}>
                        {selectedAddonId === addon.id && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.optionText, selectedAddonId === addon.id && {fontWeight: '600', color: '#000'}]}>
                        {addon.name}
                      </Text>
                    </View>
                    <Text style={[styles.optionPrice, selectedAddonId === addon.id && {color: '#000'}]}>
                      {formatPrice(parseFloat(addon.price) || 0)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Price:</Text>
              <Text style={styles.totalPrice}>
                {formatPrice(totalPrice)}
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={[styles.addButton, 
              (!selectedVariantId && selectedProduct.variants?.items?.length > 0) ? styles.addButtonDisabled : null
            ]}
            onPress={() => {
              // Validate selections - variant selection is required if variants exist
              if (selectedProduct.variants?.items?.length > 0 && !selectedVariantId) {
                Alert.alert('Selection Required', 'Please select a variant to continue');
                return;
              }

              // Get the selected variant and addon objects
              let selectedVariant = null;
              let selectedAddon = null;
              
              if (selectedVariantId && selectedProduct.variants?.items) {
                selectedVariant = selectedProduct.variants.items.find(v => v.id === selectedVariantId);
              }
              
              if (selectedAddonId && selectedProduct.addons?.items) {
                selectedAddon = selectedProduct.addons.items.find(a => a.id === selectedAddonId);
              }

              // Calculate the total price including all selections
              let totalPrice = selectedProduct.sprice;
              if (selectedVariant) totalPrice += parseFloat(selectedVariant.price) || 0;
              if (selectedAddon) totalPrice += parseFloat(selectedAddon.price) || 0;
              
              console.log('Adding to cart with selections:', {
                product: selectedProduct.name,
                variant: selectedVariant?.name,
                addon: selectedAddon?.name,
                totalPrice
              });
              
              const productWithOptions = {
                ...selectedProduct,
                // Store selected variant and addon information
                selectedVariantId: selectedVariantId,
                selectedAddonId: selectedAddonId,
                selectedVariant: selectedVariant,
                selectedAddon: selectedAddon,
                // Override the original price with the calculated total
                calculatedPrice: totalPrice
              };
              
              addToCart(productWithOptions);
              setVariantModal(false);
              
              // Reset selections after adding to cart
              setSelectedVariantId(null);
              setSelectedAddonId(null);
            }}
            disabled={selectedProduct.variants?.items?.length > 0 && !selectedVariantId}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>Add to Order</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  return (
    <View style={{flex: 1, marginBottom: 80}}>
      <Alert
        visible={alerts}
        onCancel={onCancelAlert}
        onProceed={onCancelAlert}
        title="No Logged In Attendant"
        content="Please logged in first before you proceed."
        confirmTitle="OK"
      />

      <Alert
        visible={alerts2}
        onCancel={onCancel}
        onProceed={onCancel}
        title="Invalid Input"
        content="Input must be a number."
        confirmTitle="OK"
      />

      <SearchBar
        term={searchTerm}
        onTermChange={setSearchTerm}
        onTermSubmit={() => console.log('Search Submitted')}
      />
    
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedCategory === 'All' && styles.activeTab]}
          onPress={() => onTabChange('All')}
        >
          <Text style={[styles.tabText, selectedCategory === 'All' && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>

        {category.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.tab,
              selectedCategory === category.name && styles.activeTab,
            ]}
            onPress={() => onTabChange(category.name)}
          >
            <Text
              style={[
                styles.tabText,
                selectedCategory === category.name && styles.activeTabText,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatGrid
        itemDimension={120}
        data={filteredProducts}
        spacing={10}
        renderItem={_renderitem}
      />

      {renderVariantModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: colors.white,
    height: Dimensions.get('window').height * 0.22, 
    shadowColor: '#EBECF0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 100,
    resizeMode: 'contain'
  },
  itemContent: {
    padding: 8,
    width: '100%'
  },
  itemName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 20
  },
  itemPrice: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700'
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  outOfStockBadge: {
    backgroundColor: '#ff4444'
  },
  lowStockBadge: {
    backgroundColor: '#ffbb33'
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  cartBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  variantBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  variantModal: {
    margin: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    padding: 0,
    width: '85%',
    height: '100%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333'
  },
  closeButton: {
    padding: 5
  },
  modalContent: {
    flex: 1,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 0,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.accent,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa'
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bbb', // Lighter color for unselected radio buttons
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    backgroundColor: '#f8f8f8',
  },
  radioOuterSelected: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    backgroundColor: '#e3f2fd',
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  selectedOption: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    marginVertical: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#333'
  },
  optionPrice: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600'
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 0,
    margin: 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  plusBtn: {
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    height: 30,
    width: 30,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
  },
  minusBtn: {
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    height: 45,
    width: 45,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
  },
  header: {
    backgroundColor: colors.white,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
    borderRadius: 10,
    zIndex: 0,
  },
  itemContainer: {
    marginTop: 0,
    marginHorizontal: 0,
    backgroundColor: colors.white,
    flexDirection: 'column',
    borderRadius: 7,
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  additionalCard: {
    flex: 1,
    marginTop: 5,
    marginHorizontal: 5,
    backgroundColor: colors.white,
    flexDirection: 'column',
    borderRadius: 15,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    color: '#000',
    fontWeight: '400',
    textAlign: 'center',
  },
  itemCode: {
    fontWeight: '600',
    fontSize: 12,
    color: '#fff',
  },
  stretch: {
    width: windowWidth / 3 - 10,

    height: 100,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  stretch2: {
    width: windowWidth - 15,
    height: windowHeight / 3 - 20,
    borderRadius: 10,
  },
  iconStyle: {
    fontSize: 25,
    alignSelf: 'center',
    marginHorizontal: 15,
  },
  text: {
    fontSize: 30,
  },
  iconStyle: {
    fontSize: 25,
    alignSelf: 'center',
    marginHorizontal: 15,
  },
  container: {
    position: 'absolute',
    transform: [{rotate: '40deg'}],
    right: -25,
    top: 13,
    backgroundColor: 'red',
    width: 100,
  },
  modalView: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  containerStyle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  content: {
    width: '100%',
    height: '50%',
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  bottomView: {
    flex: 1,
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', //Here is the trick
    bottom: 0, //Here is the trick
    borderTopColor: colors.primary,
    borderWidth: 1,
  },
  label: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    padding: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iconStyle: {
    padding: 4,
  },
  discountButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
  },
  discountButton2: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  row: {
    flex: 1,
    justifyContent: 'space-around',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Ensure even spacing
    flexWrap: 'wrap', // Allow items to wrap if needed
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5, // Adjust margin to control spacing between tabs
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent, // Change this to your active color
  },
  tabText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.charcoalGrey, // Default text color
  },
  activeTabText: {
    color: colors.accent, // Change this to your active text color
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: colors.white,
    height: Dimensions.get('window').height * 0.25, 
    shadowColor: '#EBECF0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
});
