import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  Title,
  Card,
  Paragraph,
  Button,
  FAB,
  Portal,
  Modal,
  TextInput,
  DataTable,
  IconButton,
  Chip,
} from 'react-native-paper';
import Appbar from '../../components/Appbar';

import {generateClient} from 'aws-amplify/api';
import {listWarehouseProducts, listRequestItems} from '../../graphql/queries';
import {
  createInventoryRequest,
  createRequestItem,
} from '../../graphql/mutations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../themes/colors';

// Initialize API client
const client = generateClient();

const DeliveryRequestScreen = ({navigation, route}) => {
 const STORE = route.params.store;
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
  const [modalVisible, setModalVisible] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Fetch warehouse products when the component mounts
  useEffect(() => {
    fetchWarehouseProducts();
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    try {
      const staffDataString = await AsyncStorage.getItem('staffData');
      if (staffDataString) {
        const parsedData = JSON.parse(staffDataString);
        setStaffData(parsedData);
      }
    } catch (e) {
      console.error('Error loading staff data:', e);
    }
  };

  // Fetch warehouse products
  const fetchWarehouseProducts = async () => {
    setLoadingProducts(true);
    setError(null);

    try {
      const response = await client.graphql({
        query: listWarehouseProducts,
        variables: {
          filter: {
            // Add any filtering if needed
          },
        },
      });

      const fetchedProducts = response.data.listWarehouseProducts.items;
      console.log('Fetched products:', fetchedProducts.length);
      setProducts(fetchedProducts);
      setLoadingProducts(false);
    } catch (err) {
      console.error('Error fetching warehouse products:', err);
      setError('Failed to load products. Please try again.');
      setLoadingProducts(false);
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(
    product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Add product to request
  const addToRequest = product => {
    const existingItem = requestItems.find(
      item => item.productId === product.id,
    );

    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + 1);
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

  // Remove product from request
  const removeFromRequest = productId => {
    setRequestItems(requestItems.filter(item => item.productId !== productId));
  };

  // Update quantity of product in request
  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromRequest(productId);
      return;
    }

    setRequestItems(
      requestItems.map(item =>
        item.productId === productId ? {...item, quantity} : item,
      ),
    );
  };

  // Submit request
  const submitRequest = async () => {
    if (requestItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item to your request.');
      return;
    }

    setSubmitting(true);
    try {
      if (!staffData || !STORE.id) {
        throw new Error('Missing staff or store data');
      }

      // Create inventory request
      const requestInput = {
        storeId: STORE.id,
        ownerId: staffData.userId,
        requestDate: new Date().toISOString(),
        status: 'PENDING',
        priority: priority,
        notes: notes,
      };

      console.log('Creating inventory request:', requestInput);

      const createResponse = await client.graphql({
        query: createInventoryRequest,
        variables: {input: requestInput},
      });

      const requestId = createResponse.data.createInventoryRequest.id;
      console.log('Created request with ID:', requestId);

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
      <Appbar
        title="Request Stock"
        subtitle={STORE.name}
        onBack={() => navigation.goBack()}
      />
      
      {/* Cute Top Navigation Buttons */}
      <View style={styles.topNavContainer}>
        {/* Request Summary with Icon */}
        <View style={styles.requestSummary}>
          <IconButton 
            icon="package-variant" 
            size={16} 
            color={colors.secondary} 
            style={styles.summaryIcon} 
          />
          <Text style={styles.requestSummaryText}>
            Items in request: <Text style={styles.requestSummaryCount}>{requestItems.length}</Text>
          </Text>
        </View>

        {/* Button Container */}
        <View style={styles.topButtonsRow}>
          {/* Cart Button with Badge */}
          <TouchableOpacity 
            style={[styles.topNavButton, requestItems.length > 0 ? styles.activeButton : styles.disabledButton]}
            onPress={() => setRequestModalVisible(true)}
            disabled={requestItems.length === 0}
            activeOpacity={0.7}>
            <LinearGradient 
              colors={requestItems.length > 0 ? [colors.secondary,colors.secondary] : ['#f0f0f0', '#e5e5e5']} 
              style={styles.gradientButton}>
              <View style={styles.topNavButtonContent}>
                <IconButton 
                  icon="cart-outline" 
                  size={19} 
                  color={requestItems.length === 0 ? colors.white : 'white'} 
                  style={styles.topNavIcon} 
                />
                <Text style={[styles.topNavText, requestItems.length === 0 ? styles.disabledText : styles.activeText]}>View List</Text>
                {requestItems.length > 0 && (
                  <View style={styles.topBadge}>
                    <Text style={styles.topBadgeText}>{requestItems.length}</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* View All Requests Button */}
          <TouchableOpacity 
            style={[styles.topNavButton]}
            onPress={() => {
              console.log('Navigating to StoreRequests with:', { STORE });
            
              navigation.navigate('StoreRequests', { 
                store: { STORE }
              });
            }}
            activeOpacity={0.7}>
            <LinearGradient 
              colors={[colors.secondary, colors.secondary]} 
              style={styles.gradientButton}>
              <View style={styles.topNavButtonContent}>
                <IconButton 
                  icon="clipboard-text-outline" 
                  size={19} 
                  color="white" 
                  style={styles.topNavIcon} 
                />
                <Text style={[styles.topNavText, styles.activeText]}>View Requests</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
                        <DataTable.Cell numeric>{product.availableStock || 0}</DataTable.Cell>
                        <DataTable.Cell numeric style={styles.actionCell}>
                          <Button
                            mode="contained"
                            onPress={() => addToRequest(product)}
                            style={styles.addButton}
                            disabled={product.availableStock <= 0}>
                            <Text style={{color: 'white'}}>Add</Text>
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

         

        </ScrollView>
      </View>
      
      {/* Request Form Modal */}
      <Portal>
        <Modal
          visible={requestModalVisible}
          onDismiss={() => setRequestModalVisible(false)}
          contentContainerStyle={styles.modalContainer}>
                <ScrollView>
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
                              <Button
                                mode="outlined"
                                onPress={() => removeFromRequest(item.productId)}
                                style={{marginHorizontal: 4}}>
                                <Text>Remove</Text>
                              </Button>
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
                      
                      <View style={styles.buttonContainer}>
                        <Button
                          mode="contained"
                          onPress={() => {
                            submitRequest();
                            setRequestModalVisible(false);
                          }}
                          style={styles.submitButton}
                          disabled={requestItems.length === 0 || submitting}>
                          {submitting ? (
                            <ActivityIndicator color="white" size="small" />
                          ) : (
                            <Text style={{color: 'white'}}>Submit Request</Text>
                          )}
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => {
                            setRequestModalVisible(false);
                            setModalVisible(true);
                          }}
                          style={styles.viewButton}
                          disabled={requestItems.length === 0}>
                          <Text>View Summary</Text>
                        </Button>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.emptyText}>
                      No items added yet. Search and add products from above.
                    </Text>
                  )}
                </ScrollView>
        </Modal>
      </Portal>
      
      {/* Request Details Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}>
          <ScrollView>
            <Title>Request Details</Title>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Store</Text>
              <Text style={styles.sectionContent}>{STORE.name || 'Unknown Store'}</Text>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Priority</Text>
              <Chip style={[styles.priorityChip, {backgroundColor: getPriorityColor(priority)}]}>
                <Text style={styles.chipText}>{priority}</Text>
              </Chip>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.sectionContent}>{notes || '-'}</Text>
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.sectionTitle}>Items ({requestItems.length})</Text>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Product</DataTable.Title>
                  <DataTable.Title numeric>Quantity</DataTable.Title>
                </DataTable.Header>
                
                {requestItems.map(item => (
                  <DataTable.Row key={item.productId}>
                    <DataTable.Cell>{item.name}</DataTable.Cell>
                    <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </View>
            
            <Button
              mode="outlined"
              onPress={() => setModalVisible(false)}
              style={styles.closeModalButton}>
              <Text>Close</Text>
            </Button>
          </ScrollView>
        </Modal>
      </Portal>
      
      {/* Request Form Modal */}
      <Portal>
        <Modal
          visible={requestModalVisible}
          onDismiss={() => setRequestModalVisible(false)}
          contentContainerStyle={styles.modalContainer}>
          <ScrollView>
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
                        <Button
                          mode="outlined"
                          onPress={() => removeFromRequest(item.productId)}
                          style={{marginHorizontal: 4}}>
                          <Text>Remove</Text>
                        </Button>
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
                
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={() => {
                      submitRequest();
                      setRequestModalVisible(false);
                    }}
                    style={styles.submitButton}
                    disabled={requestItems.length === 0 || submitting}>
                    {submitting ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={{color: 'white'}}>Submit Request</Text>
                    )}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setRequestModalVisible(false);
                      setModalVisible(true);
                    }}
                    style={styles.viewButton}
                    disabled={requestItems.length === 0}>
                    <Text>View Summary</Text>
                  </Button>
                </View>
              </>
            ) : (
              <Text style={styles.emptyText}>
                No items added yet. Search and add products from above.
              </Text>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

// Helper function to get color based on priority
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'HIGH':
      return colors.red;
    case 'NORMAL':
      return colors.green;
    case 'LOW':
      return colors.blue;
    default:
      return '#757575';
  }
};

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: colors.secondary,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topNavContainer: {
    flexDirection: 'column',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 18,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f2f2f2',
  },
  requestSummary: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  summaryIcon: {
    margin: 0,
    padding: 0,
    marginRight: -5,
  },
  requestSummaryText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  requestSummaryCount: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  topButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topNavButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 25,
    overflow: 'hidden',
    height: 44,
  },
  gradientButton: {
    flex: 1,
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeButton: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  disabledButton: {
    elevation: 0,
    shadowOpacity: 0,
  },
  topNavButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topNavIcon: {
    margin: 0,
    paddingRight: 0,
    width: 22,
    height: 22,
  },
  topNavText: {
    fontSize: 13.5,
    fontWeight: '600',
    marginLeft: 5,
  },
  activeText: {
    color: 'white',
  },
  disabledText: {
    color: '#aaa',
  },
  topBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'white',
    zIndex: 999,
  },
  topBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 5,
    height: 40,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  summaryContainer: {
    marginVertical: 8,
    padding: 10,
    backgroundColor: colors.surface,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productCard: {
    marginBottom: 10,
  },
  notesInput: {
    marginVertical: 10,
  },
  priorityContainer: {
    marginVertical: 10,
  },
  priorityLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 5,
  },
  chip: {
    margin: 4,
    backgroundColor: '#e0e0e0',
  },
  selectedChip: {
    backgroundColor: colors.secondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    width: '80%',
    marginBottom: 10,
  },
  viewButton: {
    flex: 1,
    marginLeft: 10,
    
    width: '80%',
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'grey',
  },
  quantityActionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cardContent: {
    paddingTop: 8,
  },
  modalContainer: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 16,
  },
  priorityChip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    color: 'white',
  },
  closeModalButton: {
    marginTop: 16,
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
  errorButton: {
    backgroundColor: colors.primary,
  },

});

export default DeliveryRequestScreen;
