import React, {useState, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import {Card, Title, Searchbar} from 'react-native-paper';
import {generateClient} from 'aws-amplify/api';
import {getCurrentUser} from 'aws-amplify/auth';
import {listProducts} from '../../graphql/queries';
import Appbar from '../../components/Appbar';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import colors from '../../themes/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DataTable from '../../components/DataTable';
import {Col, Row} from 'react-native-easy-grid';

const client = generateClient();

const RemainingStockScreen = ({navigation, route}) => {
  const {store} = route.params;
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // Default sort by name
  const [sortOrder, setSortOrder] = useState('asc'); // Default ascending order

  // Stock level thresholds
  const stockThresholds = {
    low: 10,
    medium: 30,
    high: 50,
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchProducts = useCallback(async () => {
    if (!store?.id) {
      return;
    }

    setLoading(true);
    try {
      const response = await client.graphql({
        query: listProducts,
        variables: {
          filter: {
            storeId: {eq: store.id},
            // Note: We're not filtering by ownerId as it might not be part of the Product model
          },
          limit: 1000,
        },
      });

      const fetchedProducts = response.data.listProducts.items || [];

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(
          fetchedProducts.map(
            product =>
              product.category?.name || product.subcategory || 'Uncategorized',
          ),
        ),
      ].filter(Boolean);

      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
      setCategories(uniqueCategories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  }, [store?.id]);

  // Search products
  const onChangeSearch = query => {
    setSearchQuery(query);
    filterProducts(query, selectedCategory);
  };

  // Filter products by category
  const selectCategory = category => {
    const newCategory = category === selectedCategory ? null : category;
    setSelectedCategory(newCategory);
    filterProducts(searchQuery, newCategory);
  };

  // Apply all filters
  const filterProducts = (query, category) => {
    let filtered = [...products];

    // Apply search filter
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(lowerCaseQuery) ||
          product.brand?.toLowerCase().includes(lowerCaseQuery) ||
          product.sku?.toLowerCase().includes(lowerCaseQuery),
      );
    }

    // Apply category filter
    if (category) {
      filtered = filtered.filter(
        product =>
          product.category?.name === category ||
          product.subcategory === category ||
          (category === 'Uncategorized' &&
            !product.category &&
            !product.subcategory),
      );
    }

    // Apply current sort
    sortProducts(filtered, sortBy, sortOrder);
  };

  // Sort products
  const sortProducts = (
    productsToSort = filteredProducts,
    sortField = sortBy,
    order = sortOrder,
  ) => {
    const sorted = [...productsToSort].sort((a, b) => {
      if (sortField === 'name') {
        return order === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === 'stock') {
        const stockA = a.stock || 0;
        const stockB = b.stock || 0;
        return order === 'asc' ? stockA - stockB : stockB - stockA;
      } else if (sortField === 'price') {
        const priceA = a.sprice || 0;
        const priceB = b.sprice || 0;
        return order === 'asc' ? priceA - priceB : priceB - priceA;
      }
      return 0;
    });

    setFilteredProducts(sorted);
  };

  // Toggle sort order and field
  const toggleSort = field => {
    const newOrder = field === sortBy && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    sortProducts(filteredProducts, field, newOrder);
  };

  // Get stock level category (low, medium, high)
  const getStockLevel = stock => {
    if (stock === undefined || stock === null) {
      return 'unknown';
    }
    if (stock <= stockThresholds.low) {
      return 'low';
    }
    if (stock <= stockThresholds.medium) {
      return 'medium';
    }
    return 'high';
  };

  // Render stock indicator with appropriate color
  const renderStockIndicator = stock => {
    const level = getStockLevel(stock);

    const colors = {
      low: '#FF5252',
      medium: '#FFC107',
      high: '#4CAF50',
      unknown: '#9E9E9E',
    };

    return (
      <View style={[styles.stockIndicator, {backgroundColor: colors[level]}]}>
        <Text style={styles.stockIndicatorText}>
          {level === 'low'
            ? 'Low'
            : level === 'medium'
            ? 'Med'
            : level === 'high'
            ? 'High'
            : 'N/A'}
        </Text>
      </View>
    );
  };

  // Count products by stock level
  const getStockSummary = () => {
    const summary = {
      low: 0,
      medium: 0,
      high: 0,
      unknown: 0,
      total: filteredProducts.length,
    };

    filteredProducts.forEach(product => {
      const level = getStockLevel(product.stock);
      summary[level]++;
    });

    return summary;
  };

  const stockSummary = getStockSummary();

  // Render each product row
  const renderItem = ({item}) => (
    <Row style={styles.tableRow}>
      <Col style={styles.nameCol}>
        <Text style={styles.productName}>{item.name}</Text>
        {item.brand && <Text style={styles.brandText}>{item.brand}</Text>}
      </Col>
      <Col style={styles.categoryCol}>
        <Text style={styles.tableCellText}>
          {item.category?.name || item.subcategory || 'Uncategorized'}
        </Text>
      </Col>
      <Col style={styles.stockCol}>
        <View style={styles.stockContainer}>
          {renderStockIndicator(item.stock)}
          <Text style={styles.tableCellText}>{item.stock || 0}</Text>
        </View>
      </Col>
      <Col style={styles.priceCol}>
        <Text style={styles.tableCellText}>
          {formatMoney(item.sprice || 0, {symbol: '₱', precision: 2})}
        </Text>
      </Col>
    </Row>
  );

  return (
    <View style={styles.container}>
      <Appbar
        title="Remaining Stock Report"
        onBack={() => navigation.goBack()}
      />

      <View style={styles.contentContainer}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.summaryTitle}>Stock Summary</Title>

            <View style={styles.summaryRow}>
              <View style={[styles.summaryItem, {backgroundColor: '#E3F2FD'}]}>
                <Text style={styles.summaryValue}>{stockSummary.total}</Text>
                <Text style={styles.summaryLabel}>Total Products</Text>
              </View>

              <View style={[styles.summaryItem, {backgroundColor: '#E8F5E9'}]}>
                <Text style={styles.summaryValue}>{stockSummary.high}</Text>
                <Text style={styles.summaryLabel}>High Stock</Text>
              </View>

              <View style={[styles.summaryItem, {backgroundColor: '#FFF8E1'}]}>
                <Text style={styles.summaryValue}>{stockSummary.medium}</Text>
                <Text style={styles.summaryLabel}>Medium Stock</Text>
              </View>

              <View style={[styles.summaryItem, {backgroundColor: '#FFEBEE'}]}>
                <Text style={styles.summaryValue}>{stockSummary.low}</Text>
                <Text style={styles.summaryLabel}>Low Stock</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.filtersContainer}>
          <Searchbar
            placeholder="Search products..."
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={styles.searchBar}
          />

          {/* <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(category => (
              <Chip
                key={category}
                selected={selectedCategory === category}
                onPress={() => selectCategory(category)}
                style={styles.categoryChip}
                selectedColor={colors.primary}
              >
                {category}
              </Chip>
            ))}
          </ScrollView> */}

          <View style={styles.sortButtonsContainer}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => toggleSort('name')}>
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'name' && styles.activeSortText,
                ]}>
                Name
              </Text>
              {sortBy === 'name' && (
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => toggleSort('stock')}>
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'stock' && styles.activeSortText,
                ]}>
                Stock
              </Text>
              {sortBy === 'stock' && (
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => toggleSort('price')}>
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === 'price' && styles.activeSortText,
                ]}>
                Price
              </Text>
              {sortBy === 'price' && (
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color={colors.primary}
          />
        ) : filteredProducts.length > 0 ? (
          <View style={styles.tableContainer}>
            <DataTable
              headerTitles={['Product', 'Category', 'Stock', 'Price']}
              colStyle={[
                styles.nameCol,
                styles.categoryCol,
                styles.stockCol,
                styles.priceCol,
              ]}
              alignment="flex-start">
              <ScrollView>
                {filteredProducts.map(item => renderItem({item}))}
              </ScrollView>
            </DataTable>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#9E9E9E" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    padding: 12,
  },
  summaryCard: {
    marginBottom: 10,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 15,
    marginBottom: 5,
    color: colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  searchBar: {
    marginBottom: 8,
    elevation: 2,
    backgroundColor: 'white',
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  sortButtonText: {
    marginRight: 4,
    fontSize: 14,
  },
  activeSortText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  tableContainer: {
    flex: 1,
  },
  tableRow: {
    height: 60,
    marginHorizontal: 5,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nameCol: {
    width: '40%',
    paddingLeft: 10,
    justifyContent: 'center',
  },
  categoryCol: {
    width: '25%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockCol: {
    width: '15%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceCol: {
    width: '20%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
  },
  brandText: {
    fontSize: 12,
    color: '#757575',
  },
  stockContainer: {
    alignItems: 'center',
  },
  stockIndicator: {
    width: 36,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  stockIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableCellText: {
    fontSize: 14,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9E9E9E',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 4,
  },
});

export default RemainingStockScreen;
