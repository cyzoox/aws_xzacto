import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Title,
  TextInput,
  Button,
  Card,
  DataTable,
  IconButton,
  FAB,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {colors} from '../../constants/theme';
import {generateClient} from 'aws-amplify/api';
import {listWarehouseProducts, listRequestItems} from '../../graphql/queries';
import {
  createInventoryRequest,
  createRequestItem,
} from '../../graphql/mutations';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize API client
const client = generateClient();

const DeliveryRequestScreen = ({navigation, route}) => {
  const {storeId, storeName} = route.params || {};
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestItems, setRequestItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [staffData, setStaffData] = useState(null);

  // Fetch warehouse products when the component mounts
  useEffect(() => {
    fetchWarehouseProducts();
    loadStaffData();
  }, []);

  // Load staff data from AsyncStorage
  const loadStaffData = async () => {
    try {
      const staffJson = await AsyncStorage.getItem('staffData');
      if (staffJson) {
        const data = JSON.parse(staffJson);
        setStaffData(data);
        console.log('Staff data loaded:', data.id);
      } else {
        console.log('No staff data found in AsyncStorage');
      }
    } catch (err) {
      console.error('Error loading staff data:', err);
    }
  };

  // Fetch warehouse products
  const fetchWarehouseProducts = async () => {
    setLoadingProducts(true);
    setError(null);
    try {
      const result = await client.graphql({
        query: listWarehouseProducts,
        variables: {
          filter: {
            isActive: {eq: true},
          },
        },
      });

      const warehouseProducts = result.data.listWarehouseProducts.items || [];
      console.log('Fetched warehouse products:', warehouseProducts.length);

      // Map warehouse products to the format expected by the UI
      const formattedProducts = warehouseProducts.map(product => ({
        id: product.id,
        name: product.name || 'Unnamed Product',
        brand: product.brand || '',
        stock: product.availableStock || 0,
        category: product.category || '',
        sku: product.sku || '',
        selling_price: product.sellingPrice || 0,
      }));

      setProducts(formattedProducts);
    } catch (err) {
      console.error('Error fetching warehouse products:', err);
      setError('Failed to load warehouse products. Please try again.');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku &&
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Add product to request
  const addToRequest = product => {
    const existingItem = requestItems.find(
      item => item.productId === product.id,
    );

    if (existingItem) {
      setRequestItems(
        requestItems.map(item =>
          item.productId === product.id
            ? {...item, quantity: item.quantity + 1}
            : item,
        ),
      );
    } else {
      setRequestItems([
        ...requestItems,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: 1,
        },
      ]);
    }
  };

  // Update quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setRequestItems(
        requestItems.filter(item => item.productId !== productId),
      );
    } else {
      setRequestItems(
        requestItems.map(item =>
          item.productId === productId ? {...item, quantity} : item,
        ),
      );
    }
  };

  // Submit request
  const submitRequest = async () => {
    if (requestItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item to your request');
      return;
    }

    setSubmitting(true);

    try {
      // Get staff data from AsyncStorage
      if (!staffData) {
        const staffJson = await AsyncStorage.getItem('staffData');
        if (!staffJson) {
          setSubmitting(false);
          Alert.alert('Error', 'No staff data found. Please log in again.');
          return;
        }

        const data = JSON.parse(staffJson);
        setStaffData(data);
      }

      // Create inventory request
      const now = new Date().toISOString();
      const requestInput = {
        storeId: storeId,
        status: 'PENDING',
        requestDate: now,
        requestedBy: staffData.id, // Using staff ID
        priority: priority,
        notes: notes.trim(),
        ownerId: staffData.ownerId, // Using owner ID for permissions
      };

      console.log('Creating inventory request with:', requestInput);

      const requestResponse = await client.graphql({
        query: createInventoryRequest,
        variables: {input: requestInput},
      });

      const requestId = requestResponse.data.createInventoryRequest.id;
      console.log('Created inventory request with ID:', requestId);

      // Create request items
      const itemPromises = requestItems.map(async item => {
        const itemInput = {
          requestId: requestId,
          warehouseProductId: item.productId,
          requestedQuantity: item.quantity,
          fulfilledQuantity: 0,
          status: 'PENDING',
        };

        console.log('Creating request item:', itemInput);

        return client.graphql({
          query: createRequestItem,
          variables: {input: itemInput},
        });
      });

      await Promise.all(itemPromises);
      console.log('Created all request items');

      // Verify items were created
      try {
        const verifyResponse = await client.graphql({
          query: listRequestItems,
          variables: {
            filter: {
              requestId: {eq: requestId},
            },
          },
        });

        const createdItems = verifyResponse.data.listRequestItems.items;
        console.log(`Verification found ${createdItems.length} created items`);
      } catch (verifyErr) {
        console.error('Error verifying created items:', verifyErr);
      }

      setSubmitting(false);
      Alert.alert(
        'Success',
        'Your delivery request has been sent to the warehouse',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (err) {
      console.error('Error submitting request:', err);
      setSubmitting(false);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    }
  };

  // Calculate total items
  const totalItems = requestItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Simple header with only back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory Request</Text>
        <View style={{width: 40}} /> {/* Empty view for balance */}
      </View>
      <View style={styles.content}>
        <ScrollView>
          <Card style={styles.card}>
            <Card.Content>
              <Title>New Stock Request</Title>

              <View style={styles.searchContainer}>
                <TextInput
                  label="Search Products"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  placeholder="Enter product name or SKU"
                />
              </View>

              {loadingProducts ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>
                    Loading warehouse products...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Button
                    mode="contained"
                    onPress={fetchWarehouseProducts}
                    style={styles.retryButton}>
                    <Text style={{color: 'white'}}>Retry</Text>
                  </Button>
                </View>
              ) : (
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Product</DataTable.Title>
                    <DataTable.Title numeric>Stock</DataTable.Title>
                    <DataTable.Title numeric>Action</DataTable.Title>
                  </DataTable.Header>

                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <DataTable.Row key={product.id}>
                        <DataTable.Cell>{product.name}</DataTable.Cell>
                        <DataTable.Cell numeric>{product.stock}</DataTable.Cell>
                        <DataTable.Cell numeric style={styles.actionCell}>
                          <Button
                            mode="contained"
                            onPress={() => addToRequest(product)}
                            style={styles.addButton}
                            disabled={product.stock <= 0}>
                            Add
                          </Button>
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))
                  ) : (
                    <DataTable.Row>
                      <DataTable.Cell>No products found</DataTable.Cell>
                      <DataTable.Cell numeric />
                      <DataTable.Cell numeric />
                    </DataTable.Row>
                  )}
                </DataTable>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>Your Request</Title>

              {requestItems.length > 0 ? (
                <>
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>Product</DataTable.Title>
                      <DataTable.Title numeric>Quantity</DataTable.Title>
                      <DataTable.Title>Actions</DataTable.Title>
                    </DataTable.Header>

                    {requestItems.map(item => (
                      <DataTable.Row key={item.productId}>
                        <DataTable.Cell>{item.name}</DataTable.Cell>
                        <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                        <DataTable.Cell style={styles.quantityActionCell}>
                          <IconButton
                            icon="minus"
                            size={20}
                            onPress={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                          />
                          <IconButton
                            icon="plus"
                            size={20}
                            onPress={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                          />
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>

                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryText}>
                      Total Items: {totalItems}
                    </Text>
                  </View>

                  <TextInput
                    label="Notes (optional)"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    style={styles.notesInput}
                    placeholder="Add any special instructions or notes"
                  />

                  <View style={styles.priorityContainer}>
                    <Text style={styles.priorityLabel}>Priority:</Text>
                    <View style={styles.chipsContainer}>
                      <Chip
                        selected={priority === 'LOW'}
                        onPress={() => setPriority('LOW')}
                        style={[
                          styles.chip,
                          priority === 'LOW' && styles.selectedChip,
                        ]}>
                        <Text
                          style={{
                            color: priority === 'LOW' ? 'white' : 'black',
                          }}>
                          Low
                        </Text>
                      </Chip>
                      <Chip
                        selected={priority === 'NORMAL'}
                        onPress={() => setPriority('NORMAL')}
                        style={[
                          styles.chip,
                          priority === 'NORMAL' && styles.selectedChip,
                        ]}>
                        <Text
                          style={{
                            color: priority === 'NORMAL' ? 'white' : 'black',
                          }}>
                          Normal
                        </Text>
                      </Chip>
                      <Chip
                        selected={priority === 'HIGH'}
                        onPress={() => setPriority('HIGH')}
                        style={[
                          styles.chip,
                          priority === 'HIGH' && styles.selectedChip,
                        ]}>
                        <Text
                          style={{
                            color: priority === 'HIGH' ? 'white' : 'black',
                          }}>
                          High
                        </Text>
                      </Chip>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>
                  No items added yet. Search and add products from above.
                </Text>
              )}
            </Card.Content>

            {requestItems.length > 0 && (
              <Card.Actions style={styles.cardActions}>
                <Button
                  mode="contained"
                  onPress={submitRequest}
                  loading={submitting}
                  disabled={submitting}
                  style={styles.submitButton}>
                  <Text style={{color: 'white'}}>Submit Request</Text>
                </Button>
              </Card.Actions>
            )}
          </Card>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 10,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'white',
  },
  actionCell: {
    justifyContent: 'flex-end',
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  quantityActionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryContainer: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesInput: {
    marginTop: 16,
    backgroundColor: 'white',
  },
  priorityContainer: {
    marginTop: 16,
  },
  priorityLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: colors.primary,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 24,
    color: '#757575',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#c00',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
});

export default DeliveryRequestScreen;
