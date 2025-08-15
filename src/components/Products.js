import React, {useState, useEffect} from 'react';
import {TouchableOpacity, Image, StyleSheet, View, Text} from 'react-native';
import {FlatGrid} from 'react-native-super-grid';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useStore} from '../context/StoreContext';
import {getUrl} from 'aws-amplify/storage';
import SearchBar from './SearchBar';
import colors from '../themes/colors';

export default function Products({
  products,
  navigation,
  categories,
  activeStore,
}) {
  // Use explicitly passed activeStore instead of context
  const {currentStore} = useStore();
  // For backward compatibility, use activeStore if provided, otherwise fall back to context
  const storeToUse = activeStore || currentStore;
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedCategory, setSelectedCategory] = useState(null); // Default to null (All)
  const [searchTerm, setSearchTerm] = useState(''); // Search query
  const [imageUrls, setImageUrls] = useState({}); // Store resolved image URLs

  // Debug logging when products change
  useEffect(() => {
    console.log('Products component received products:', products?.length || 0);

    if (!products || products.length === 0) {
      console.log('No products received in Products component');
    } else {
      console.log(
        'First product in Products component:',
        JSON.stringify(products[0], null, 2),
      );
    }

    // Load image URLs for all products
    const loadImageUrls = async () => {
      const urls = {};
      if (Array.isArray(products)) {
        for (const product of products) {
          if (product.img) {
            try {
              const { url } = await getUrl({ key: product.img });
              if (url) urls[product.id] = url.toString();
            } catch (error) {
              console.error('Error getting image URL for product', product.id, ':', error);
            }
          }
        }
      }
      setImageUrls(urls);
    };
    
    loadImageUrls();
  }, [products]);

  // Filter products based on category and search term
  useEffect(() => {
    // Ensure products is always an array
    let filtered = Array.isArray(products) ? products : [];

    console.log('Filtering products, count:', filtered.length);

    if (selectedCategory) {
      filtered = filtered.filter(
        product => product.categoryId === selectedCategory.id,
      );
      console.log('After category filter:', filtered.length);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        product =>
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      console.log('After search filter:', filtered.length);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const onTabChange = category => {
    setSelectedCategory(category); // category will be null for 'All' or a category object
  };

  return (
    <>
      {/* Search Bar */}
      <SearchBar
        term={searchTerm}
        onTermChange={setSearchTerm}
        onTermSubmit={() => console.log('Search Submitted')} // Optional
      />

      {/* Category Tabs */}
      <View style={styles.tabsContainer}>
        {/* "All" Category Tab */}
        <TouchableOpacity
          style={[styles.tab, !selectedCategory && styles.activeTab]}
          onPress={() => onTabChange(null)}>
          <Text
            style={[styles.tabText, !selectedCategory && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>

        {/* Other Category Tabs */}
        {categories
          .filter(category => category.storeId === storeToUse?.id) // Only show categories for active store
          .map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.tab,
                selectedCategory?.id === category.id && styles.activeTab,
              ]}
              onPress={() => onTabChange(category)}>
              <Text
                style={[
                  styles.tabText,
                  selectedCategory?.id === category.id && styles.activeTabText,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>
            {searchTerm
              ? 'Try a different search term'
              : selectedCategory
              ? 'Try a different category'
              : 'Add products to get started'}
          </Text>
        </View>
      ) : (
        <FlatGrid
          itemDimension={120} // Adjust based on screen size as needed
          data={filteredProducts}
          spacing={15}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('EditProduct', {product: item})
              }
              style={styles.itemContainer}>
              <Image
                source={
                  imageUrls[item.id] 
                    ? {uri: imageUrls[item.id]} 
                    : item.img 
                      ? {uri: 'https://via.placeholder.com/100x70?text=Loading...'} 
                      : {uri: 'https://via.placeholder.com/100x70?text=No+Image'}
                }
                resizeMode="stretch"
                style={{flex: 2, height: 70, width: '90%', marginTop: 5}}
              />
              <View style={{paddingVertical: 5}}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 10,
                    fontWeight: '700',
                  }}>
                  {item.name}
                </Text>
                <Text style={{textAlign: 'center', fontSize: 9}}>
                  {item.brand}
                </Text>
                <Text style={{textAlign: 'center', fontSize: 9}}>
                  {Math.round(item.stock * 100) / 100} In Stock
                </Text>
                {item.variants?.items?.length > 0 && (
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 8,
                      color: colors.accent,
                    }}>
                    {item.variants.items.length} Variants
                  </Text>
                )}
                {item.addons?.items?.length > 0 && (
                  <Text
                    style={{
                      textAlign: 'center',
                      fontSize: 8,
                      color: colors.accent,
                    }}>
                    {item.addons.items.length} Add-ons
                  </Text>
                )}
              </View>
              {item.stock < 10 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    backgroundColor: 'rgba(255, 59, 48, 0.85)',
                    borderRadius: 4,
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 1,
                    elevation: 2,
                  }}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={12}
                    color={colors.white}
                    style={{ marginRight: 2 }}
                  />
                  <Text style={{ 
                    fontSize: 10, 
                    fontWeight: '600', 
                    color: colors.white 
                  }}>
                    Low Stock
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
    height: 170,
    shadowColor: '#EBECF0',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.charcoalGrey,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
});
