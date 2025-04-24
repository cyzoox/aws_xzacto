import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Chip, 
  DataTable, 
  ActivityIndicator,
  Divider,
  TextInput,
  Dialog,
  Portal
} from 'react-native-paper';
import Appbar from '../../components/Appbar';
import { colors } from '../../constants/theme';
import { generateClient } from 'aws-amplify/api';
import { 
  getInventoryRequest, 
  getStore, 
  getWarehouseProduct, 
  getRequestItem,
  listRequestItems
} from '../../graphql/queries';
import { 
  updateInventoryRequest, 
  updateRequestItem, 
  updateWarehouseProduct,
  createProduct
} from '../../graphql/mutations';

// Constants for status values
const REQUEST_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PARTIALLY_FULFILLED: 'PARTIALLY_FULFILLED',
  FULFILLED: 'FULFILLED',
  CANCELLED: 'CANCELLED'
};

const ITEM_STATUS = {
  PENDING: 'PENDING',
  FULFILLED: 'FULFILLED',
  PARTIALLY_FULFILLED: 'PARTIALLY_FULFILLED',
  OUT_OF_STOCK: 'OUT_OF_STOCK'
};

// Initialize API client
const client = generateClient();

const RequestDetailsScreen = ({ navigation, route }) => {
  const { requestId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [request, setRequest] = useState(null);
  const [store, setStore] = useState(null);
  const [requestItems, setRequestItems] = useState([]);
  const [processingItemId, setProcessingItemId] = useState(null);
  const [fulfillQuantity, setFulfillQuantity] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  // Fetch request details
  const fetchRequestDetails = async () => {
    if (!requestId) return;

    try {
      console.log('Fetching request details for ID:', requestId);
      
      // Get inventory request
      const requestData = await client.graphql({
        query: getInventoryRequest,
        variables: { id: requestId }
      });
      const inventoryRequest = requestData.data.getInventoryRequest;
      
      if (!inventoryRequest) {
        console.error('Request not found');
        return;
      }
      
      console.log('Retrieved inventory request:', JSON.stringify(inventoryRequest, null, 2));
      setRequest(inventoryRequest);
      setNotes(inventoryRequest.notes || '');
      
      // Get store details
      if (inventoryRequest.storeId) {
        const storeData = await client.graphql({
          query: getStore,
          variables: { id: inventoryRequest.storeId }
        });
        setStore(storeData.data.getStore);
      }
      
      // Get request items directly using a separate query
      try {
        console.log('Fetching request items for request ID:', requestId);
        const requestItemsData = await client.graphql({
          query: listRequestItems,
          variables: {
            filter: {
              requestId: { eq: requestId }
            }
          }
        });
        
        const items = requestItemsData.data.listRequestItems.items || [];
        console.log(`Found ${items.length} request items`);
        
        // Load all product data for these items
        const loadedItems = await Promise.all(
          items.map(async (item) => {
            try {
              if (!item.warehouseProductId) {
                console.warn('Request item missing warehouseProductId:', item);
                return {
                  ...item,
                  product: { name: 'Unknown Product' }
                };
              }
              
              // Get associated warehouse product
              const productData = await client.graphql({
                query: getWarehouseProduct,
                variables: { id: item.warehouseProductId }
              });
              const product = productData.data.getWarehouseProduct;
              
              return {
                ...item,
                product
              };
            } catch (error) {
              console.error('Error fetching product for item:', error);
              return {
                ...item,
                product: { name: 'Error Loading Product' }
              };
            }
          })
        );
        
        console.log('Processed request items:', loadedItems.length);
        setRequestItems(loadedItems);
      } catch (itemsError) {
        console.error('Error fetching request items:', itemsError);
      }
    } catch (error) {
      console.error('Error fetching request details:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchRequestDetails();
      setLoading(false);
    };
    
    loadData();
  }, [requestId]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequestDetails();
    setRefreshing(false);
  };

  // Open fulfill dialog for an item
  const handleProcessItem = (item) => {
    setCurrentItem(item);
    setFulfillQuantity(item.fulfilledQuantity?.toString() || '0');
    setDialogVisible(true);
  };

  // Submit fulfilled quantity for an item
  const handleSubmitFulfill = async () => {
    if (!currentItem) return;
    
    // Validate the input
    const quantity = parseInt(fulfillQuantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    // Check if there's enough stock
    if (quantity > currentItem.product?.availableStock) {
      Alert.alert('Error', 'Not enough stock available');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Update request item with fulfilled quantity
      const newFulfilledQty = parseInt(fulfillQuantity, 10);
      const totalFulfilled = currentItem.fulfilledQuantity ? currentItem.fulfilledQuantity + newFulfilledQty : newFulfilledQty;
      
      // Determine item status
      let itemStatus;
      if (totalFulfilled === 0) {
        itemStatus = ITEM_STATUS.PENDING;
      } else if (totalFulfilled >= currentItem.requestedQuantity) {
        itemStatus = ITEM_STATUS.FULFILLED;
      } else {
        itemStatus = ITEM_STATUS.PARTIALLY_FULFILLED;
      }
      
      // Prepare update
      const updatedItem = {
        id: currentItem.id,
        fulfilledQuantity: totalFulfilled,
        status: itemStatus
      };
      
      await client.graphql({
        query: updateRequestItem,
        variables: {
          input: updatedItem
        }
      });
      
      // Update warehouse product stock if quantity is greater than 0
      if (quantity > 0 && currentItem.product) {
        const product = currentItem.product;
        const newAvailableStock = Math.max(0, product.availableStock - quantity);
        
        await client.graphql({
          query: updateWarehouseProduct,
          variables: {
            input: {
              id: product.id,
              availableStock: newAvailableStock
            }
          }
        });
        
        // Create a very simple product entry in the store with minimal required fields
        if (request.storeId && quantity > 0) {
          try {
            console.log(`Transferring ${quantity} units of ${product.name} to store ${request.storeId}`);
            
            // Using the exact field names from the GraphQL schema
            await client.graphql({
              query: createProduct,
              variables: {
                input: {
                  storeId: request.storeId,
                  name: product.name || 'Transferred Product',
                  brand: product.brand || 'Warehouse',
                  description: product.description || ' ', // Empty space to avoid null
                  oprice: product.purchasePrice || 0, // Original price (cost price)
                  sprice: product.sellingPrice || 0,  // Selling price
                  stock: quantity,
                  subcategory: product.subcategory || 'Warehouse Products',
                  sku: product.sku || `WH-${product.id.substring(0, 8)}`,
                  warehouseProductId: product.id, // Link to the warehouse product
                  isActive: true // Required boolean field
                }
              }
            });
            
            console.log('Successfully transferred product to store');
          } catch (transferError) {
            console.error('Error transferring product to store:', transferError);
            // Continue with fulfillment even if transfer fails
          }
        }
      }
      
      // Check and update overall request status
      await updateRequestStatus();
      
      // Close dialog and refresh
      setDialogVisible(false);
      setFulfillQuantity('');
      await fetchRequestDetails();
    } catch (error) {
      console.error('Error updating fulfillment:', error);
      Alert.alert('Error', 'Failed to update quantity');
    } finally {
      setSubmitting(false);
    }
  };

  // Update the overall request status based on items
  const updateRequestStatus = async () => {
    try {
      // Get fresh items data
      const requestData = await client.graphql({
        query: getInventoryRequest,
        variables: { id: requestId }
      });
      const items = requestData.data.getInventoryRequest.requestItems.items;
      
      if (!items || items.length === 0) return;
      
      // Determine overall status
      const allFulfilled = items.every(item => item.status === ITEM_STATUS.FULFILLED);
      const allPending = items.every(item => item.status === ITEM_STATUS.PENDING);
      const hasPartial = items.some(item => 
        item.status === ITEM_STATUS.PARTIALLY_FULFILLED || 
        (item.status === ITEM_STATUS.FULFILLED && !allFulfilled)
      );
      
      let newStatus = REQUEST_STATUS.PENDING;
      
      if (allFulfilled) {
        newStatus = REQUEST_STATUS.FULFILLED;
      } else if (allPending) {
        newStatus = REQUEST_STATUS.PENDING;
      } else if (hasPartial) {
        newStatus = REQUEST_STATUS.PARTIALLY_FULFILLED;
      }
      
      // Only update if status changed
      if (newStatus !== request.status) {
        const fulfillmentDate = newStatus === REQUEST_STATUS.FULFILLED 
          ? new Date().toISOString() 
          : null;
        
        await client.graphql({
          query: updateInventoryRequest,
          variables: {
            input: {
              id: requestId,
              status: newStatus,
              fulfillmentDate
            }
          }
        });
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  // Save notes
  const saveNotes = async () => {
    try {
      await client.graphql({
        query: updateInventoryRequest,
        variables: {
          input: {
            id: requestId,
            notes
          }
        }
      });
      Alert.alert('Success', 'Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes');
    }
  };

  // Mark request as fulfilled/completed
  const completeRequest = async () => {
    // Check if all items have been processed
    const incomplete = requestItems.filter(item => {
      return item.status !== ITEM_STATUS.FULFILLED && 
             item.requestedQuantity > (item.fulfilledQuantity || 0);
    });
    
    if (incomplete.length > 0) {
      Alert.alert(
        'Incomplete Fulfillment',
        'Some items have not been fully processed. Are you sure you want to mark this request as fulfilled?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Proceed Anyway', 
            onPress: () => finalizeRequestFulfillment() 
          }
        ]
      );
    } else {
      finalizeRequestFulfillment();
    }
  };
  
  // Final step to mark request as fulfilled
  const finalizeRequestFulfillment = async () => {
    try {
      // Update all pending items to OUT_OF_STOCK if they weren't fulfilled
      const itemUpdates = requestItems
        .filter(item => item.status === ITEM_STATUS.PENDING)
        .map(item => {
          return client.graphql({
            query: updateRequestItem,
            variables: {
              input: {
                id: item.id,
                status: ITEM_STATUS.OUT_OF_STOCK
              }
            }
          });
        });
      
      if (itemUpdates.length > 0) {
        await Promise.all(itemUpdates);
      }
      
      // Mark the overall request as fulfilled
      await client.graphql({
        query: updateInventoryRequest,
        variables: {
          input: {
            id: requestId,
            status: REQUEST_STATUS.FULFILLED,
            fulfillmentDate: new Date().toISOString()
          }
        }
      });
      
      Alert.alert('Success', 'Request marked as fulfilled');
      await fetchRequestDetails();
    } catch (error) {
      console.error('Error marking request as fulfilled:', error);
      Alert.alert('Error', 'Failed to update request status');
    }
  };

  // Cancel request
  const cancelRequest = async () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: async () => {
            try {
              await client.graphql({
                query: updateInventoryRequest,
                variables: {
                  input: {
                    id: requestId,
                    status: REQUEST_STATUS.CANCELLED,
                    cancellationDate: new Date().toISOString()
                  }
                }
              });
              Alert.alert('Success', 'Request has been cancelled');
              await fetchRequestDetails();
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert('Error', 'Failed to cancel request');
            }
          } 
        }
      ]
    );
  };

  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case REQUEST_STATUS.PENDING: return '#FFA000'; // Orange
      case REQUEST_STATUS.PROCESSING: return '#2196F3'; // Blue
      case REQUEST_STATUS.PARTIALLY_FULFILLED: return '#8BC34A'; // Light Green
      case REQUEST_STATUS.FULFILLED: return '#4CAF50'; // Green
      case REQUEST_STATUS.CANCELLED: return '#F44336'; // Red
      case ITEM_STATUS.OUT_OF_STOCK: return '#F44336'; // Red
      default: return '#757575'; // Grey
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Format priority
  const formatPriority = (priority) => {
    switch (priority) {
      case 'HIGH': return '🔴 High';
      case 'NORMAL': return '🟠 Normal';
      case 'LOW': return '🟢 Low';
      default: return '🟠 Normal';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Appbar title="Request Details" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading request details...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Appbar title="Request Details" />
        <Text style={styles.errorText}>Request not found</Text>
        <Button 
          mode="contained" 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar 
        title="Request Details" 
        subtitle={`Request #${requestId.slice(-6)}`}
        hasBackButton
        onBack={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View>
                <Title>Request Information</Title>
                <Paragraph>Status: 
                  <Chip 
                    style={[styles.statusChip, { backgroundColor: getStatusColor(request.status) }]}
                  >
                    {request.status}
                  </Chip>
                </Paragraph>
              </View>
              
              <Chip 
                style={styles.priorityChip}
              >
                {formatPriority(request.priority)}
              </Chip>
            </View>

            <Divider style={styles.divider} />
            
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Store:</Text>
                <Text style={styles.infoValue}>{store?.name || 'Unknown'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Request Date:</Text>
                <Text style={styles.infoValue}>{formatDate(request.requestDate)}</Text>
              </View>
              
              {request.fulfillmentDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fulfillment Date:</Text>
                  <Text style={styles.infoValue}>{formatDate(request.fulfillmentDate)}</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Items:</Text>
                <Text style={styles.infoValue}>{requestItems.length}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Text style={styles.sectionTitle}>Requested Items</Text>
        
        {requestItems.length > 0 ? (
          requestItems.map(item => (
            <Card key={item.id} style={styles.itemCard}>
              <Card.Content>
                <View style={styles.itemHeader}>
                  <View>
                    <Title>{item.product?.name || 'Unknown Product'}</Title>
                    <Paragraph>{item.product?.sku || 'No SKU'} {item.product?.brand ? `- ${item.product.brand}` : ''}</Paragraph>
                  </View>
                  <Chip 
                    style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                  >
                    {item.status}
                  </Chip>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.itemDetails}>
                  <View style={styles.quantityRow}>
                    <Text style={styles.detailLabel}>Requested:</Text>
                    <Text style={styles.detailValue}>{item.requestedQuantity}</Text>
                  </View>
                  
                  <View style={styles.quantityRow}>
                    <Text style={styles.detailLabel}>Fulfilled:</Text>
                    <Text style={styles.detailValue}>{item.fulfilledQuantity || 0}</Text>
                  </View>
                  
                  <View style={styles.quantityRow}>
                    <Text style={styles.detailLabel}>Available Stock:</Text>
                    <Text style={styles.detailValue}>{item.product?.availableStock || 0}</Text>
                  </View>
                </View>
                
                {request.status !== REQUEST_STATUS.FULFILLED && 
                 request.status !== REQUEST_STATUS.CANCELLED && (
                  <Button 
                    mode="contained"
                    onPress={() => handleProcessItem(item)}
                    style={styles.processButton}
                    disabled={!item.product || submitting}
                  >
                    {item.status === ITEM_STATUS.PENDING ? 'Process Item' : 'Update Fulfillment'}
                  </Button>
                )}
              </Card.Content>
            </Card>
          ))
        ) : loading ? (
          <Card>
            <Card.Content style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading request items...</Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No items found for this request</Text>
              <Text style={styles.emptyDetailText}>Request ID: {requestId}</Text>
            </Card.Content>
          </Card>
        )}

        <Text style={styles.sectionTitle}>Notes</Text>
        <Card style={styles.notesCard}>
          <Card.Content>
            <TextInput
              mode="outlined"
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              disabled={request.status === REQUEST_STATUS.FULFILLED || request.status === REQUEST_STATUS.CANCELLED}
            />
            
            {request.status !== REQUEST_STATUS.FULFILLED && 
             request.status !== REQUEST_STATUS.CANCELLED && (
              <Button 
                mode="contained" 
                onPress={saveNotes}
                style={styles.saveButton}
              >
                Save Notes
              </Button>
            )}
          </Card.Content>
        </Card>

        {request.status !== REQUEST_STATUS.FULFILLED && 
         request.status !== REQUEST_STATUS.CANCELLED && (
          <View style={styles.actionContainer}>
            <Button 
              mode="contained" 
              style={styles.completeButton}
              onPress={completeRequest}
            >
              Mark as Fulfilled
            </Button>
            
            <Button 
              mode="outlined" 
              style={styles.cancelButton}
              onPress={cancelRequest}
            >
              Cancel Request
            </Button>
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Process Item</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              {currentItem?.product?.name || 'Product'}
            </Text>
            <Text style={styles.dialogSubtext}>
              Requested: {currentItem?.requestedQuantity || 0}
            </Text>
            <Text style={styles.dialogSubtext}>
              Available: {currentItem?.product?.availableStock || 0}
            </Text>
            <TextInput
              mode="outlined"
              label="Quantity to Fulfill"
              value={fulfillQuantity}
              onChangeText={setFulfillQuantity}
              keyboardType="numeric"
              style={styles.quantityInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleSubmitFulfill} 
              loading={submitting}
              disabled={submitting}
            >
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    marginBottom: 16,
  },
  backButton: {
    marginTop: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statusChip: {
    marginLeft: 8,
    height: 28,
  },
  priorityChip: {
    height: 28,
  },
  divider: {
    marginVertical: 12,
  },
  infoContainer: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120,
  },
  infoValue: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  itemCard: {
    marginBottom: 12,
    elevation: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemDetails: {
    marginTop: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  detailValue: {
    flex: 1,
  },
  processButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 16,
    marginBottom: 8,
  },
  emptyDetailText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
  notesCard: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  actionContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  completeButton: {
    marginBottom: 12,
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    borderColor: '#F44336',
    color: '#F44336',
  },
  dialogText: {
    fontSize: 16,
    marginBottom: 8,
  },
  dialogSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  quantityInput: {
    marginTop: 16,
  },
});

export default RequestDetailsScreen;
