import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Image, StyleSheet, View, Text } from 'react-native';
import { FlatGrid } from 'react-native-super-grid';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SearchBar from './SearchBar'; // Importing SearchBar
import colors from '../themes/colors';

export default function Products({ products, store, navigation, categories }) {
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedCategory, setSelectedCategory] = useState('All'); // Default to 'All'
  const [searchTerm, setSearchTerm] = useState(''); // Search query

  // Update filtered products when search term or category changes
  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(
        (product) => product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const onTabChange = (category) => {
    setSelectedCategory(category);
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
        style={[styles.tab, selectedCategory === 'All' && styles.activeTab]}
        onPress={() => onTabChange('All')}
      >
        <Text style={[styles.tabText, selectedCategory === 'All' && styles.activeTabText]}>
          All
        </Text>
      </TouchableOpacity>

      {/* Other Category Tabs */}
      {categories.map((category) => (
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

      {/* Product Grid */}
      <FlatGrid
        itemDimension={120} // Adjust based on screen size as needed
        data={filteredProducts}
        spacing={15}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ProductDetails', { product: item, categories, store })
            }
            style={styles.itemContainer}
          >
            <Image
              source={{ uri: item.img }}
              resizeMode="stretch"
              style={{ flex: 2, height: 70, width: '90%', marginTop: 5 }}
            />
            <View style={{ paddingVertical: 5 }}>
              <Text style={{ textAlign: 'center', fontSize: 10, fontWeight: '700' }}>
                {item.name}
              </Text>
              <Text style={{ textAlign: 'center', fontSize: 9 }}>{item.brand}</Text>
              <Text style={{ textAlign: 'center', fontSize: 9 }}>
                {Math.round(item.stock * 100) / 100} In Stock
              </Text>
            </View>
            {item.stock < 10 && (
              <Text
                style={{
                  paddingHorizontal: 2,
                  paddingVertical: 2,
                  backgroundColor: colors.red,
                  borderRadius: 15,
                  position: 'absolute',
                  right: 10,
                  top: 10,
                }}
              >
                <MaterialCommunityIcons
                  name="alert-octagram-outline"
                  size={20}
                  color={colors.white}
                />
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
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
    height: 150,
    shadowColor: '#EBECF0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
});
