import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  DataTable,
  ActivityIndicator,
  TextInput,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import Appbar from '../../components/Appbar';
import {generateClient} from 'aws-amplify/api';
import {
  getInventoryRequest,
  listRequestItems,
  listWarehouseProducts,
} from '../../graphql/queries';
import {
  updateRequestItem,
  updateWarehouseProduct,
  updateInventoryRequest,
} from '../../graphql/mutations';
import colors from '../../themes/colors';

const client = generateClient();

const RequestDetailsScreen = ({navigation, route}) => {
  const {requestId} = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [requestItems, setRequestItems] = useState([]);
  const [fulfilledQuantities, setFulfilledQuantities] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequestDetails = async () => {
    if (!refreshing) {
      setLoading(true);
    }
    try {
      // Step 1: Fetch the core inventory request details
      const requestResponse = await client.graphql({
        query: getInventoryRequest,
        variables: {id: requestId},
      });
      const fetchedRequest = requestResponse.data.getInventoryRequest;
      setRequest(fetchedRequest);

      // Step 2: Fetch the request items associated with this request
      const itemsResponse = await client.graphql({
        query: listRequestItems,
        variables: {
          filter: {requestId: {eq: requestId}},
        },
      });
      const requestItems = itemsResponse.data.listRequestItems.items;

      if (requestItems.length === 0) {
        setRequestItems([]);
        setLoading(false);
        return;
      }

      // Step 3: Batch fetch all warehouse products for these items
      const productIds = requestItems.map(item => ({
        id: {eq: item.warehouseProductId},
      }));
      const productsResponse = await client.graphql({
        query: listWarehouseProducts,
        variables: {
          filter: {or: productIds},
        },
      });
      const warehouseProducts =
        productsResponse.data.listWarehouseProducts.items;
      const productMap = warehouseProducts.reduce((map, product) => {
        map[product.id] = product;
        return map;
      }, {});

      // Step 4: Combine request items with their product details
      const combinedItems = requestItems.map(item => ({
        ...item,
        quantity: item.requestedQuantity, // Use the correct field
        product: productMap[item.warehouseProductId],
      }));

      const initialQuantities = {};
      combinedItems.forEach(item => {
        initialQuantities[item.id] =
          item.fulfilledQuantity?.toString() || item.quantity.toString();
      });
      setFulfilledQuantities(initialQuantities);

      const sortedItems = [...combinedItems].sort((a, b) =>
        (a.product?.name || '').localeCompare(b.product?.name || ''),
      );

      setRequestItems(sortedItems);
    } catch (err) {
      console.error('Error fetching request details:', err);
      setError('Failed to load request details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequestDetails();
  };

  const handleQuantityChange = (itemId, quantity, requestedQty) => {
    const num = parseInt(quantity, 10);
    if (quantity === '') {
      setFulfilledQuantities(prev => ({...prev, [itemId]: ''}));
    } else if (!isNaN(num)) {
      const clampedQty = Math.max(0, Math.min(num, requestedQty));
      setFulfilledQuantities(prev => ({
        ...prev,
        [itemId]: clampedQty.toString(),
      }));
    }
  };

  const handleIncrement = (itemId, requestedQty) => {
    setFulfilledQuantities(prev => {
      const currentQty = parseInt(prev[itemId] || '0', 10);
      const newQty = Math.min(currentQty + 1, requestedQty);
      return {...prev, [itemId]: newQty.toString()};
    });
  };

  const handleDecrement = itemId => {
    setFulfilledQuantities(prev => {
      const currentQty = parseInt(prev[itemId] || '0', 10);
      const newQty = Math.max(currentQty - 1, 0);
      return {...prev, [itemId]: newQty.toString()};
    });
  };

  const submitFulfillment = async finalStatus => {
    setIsSubmitting(true);
    try {
      for (const item of requestItems) {
        const fulfilledQty = parseInt(fulfilledQuantities[item.id] || 0, 10);

        if (isNaN(fulfilledQty) || fulfilledQty < 0) {
          Alert.alert(
            'Invalid Quantity',
            `Please enter a valid quantity for ${item.product.name}.`,
          );
          setIsSubmitting(false);
          return;
        }

        if (item.fulfilledQuantity !== fulfilledQty) {
          await client.graphql({
            query: updateRequestItem,
            variables: {
              input: {
                id: item.id,
                fulfilledQuantity: fulfilledQty,
                status: fulfilledQty >= item.quantity ? 'FULFILLED' : 'PENDING',
              },
            },
          });

          const stockChange = fulfilledQty - (item.fulfilledQuantity || 0);
          if (item.product && stockChange !== 0) {
            await client.graphql({
              query: updateWarehouseProduct,
              variables: {
                input: {
                  id: item.product.id,
                  availableStock:
                    (item.product.availableStock || 0) - stockChange,
                },
              },
            });
          }
        }
      }

      await client.graphql({
        query: updateInventoryRequest,
        variables: {input: {id: requestId, status: finalStatus}},
      });

      Alert.alert('Success', `Request status updated to ${finalStatus}.`, [
        {text: 'OK', onPress: () => fetchRequestDetails()},
      ]);
    } catch (err) {
      console.error('Error updating fulfillment:', err);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          animating={true}
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={handleRefresh}>Try Again</TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar title="Request Details" onBack={() => navigation.goBack()} />
      <ScrollView
        style={{flex: 1}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.title}>Request Details</Title>
            <Text style={styles.subtitle}>Status: {request?.status}</Text>
            <Text style={styles.subtitle}>
              From Store: {request?.store.name}
            </Text>
            <Text style={styles.subtitle}>
              Created:{' '}
              {request?.createdAt
                ? new Date(request.createdAt).toLocaleDateString()
                : 'N/A'}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.title}>Items to Fulfill</Title>
            <DataTable style={styles.dataTable}>
              <DataTable.Header style={styles.dataTableHeader}>
                <DataTable.Title style={{flex: 2.5}}>
                  <Text style={styles.dataTableHeaderTitle}>Product</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={styles.numericHeader}>
                  <Text style={styles.dataTableHeaderTitle}>Req.</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={styles.numericHeader}>
                  <Text style={styles.dataTableHeaderTitle}>Avail.</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={styles.fulfillHeader}>
                  <Text style={styles.dataTableHeaderTitle}>Fulfill</Text>
                </DataTable.Title>
              </DataTable.Header>

              {requestItems.map(item => (
                <DataTable.Row key={item.id} style={styles.dataTableRow}>
                  <DataTable.Cell style={{flex: 2.5}}>
                    <Text numberOfLines={1}>{item.product?.name}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.numericCell}>
                    {item.quantity}
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.numericCell}>
                    {item.product?.availableStock ?? 'N/A'}
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={styles.quantityInputCell}>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity
                        onPress={() => handleDecrement(item.id)}
                        style={styles.quantityButton}>
                        <Icon name="remove" size={22} color={colors.primary} />
                      </TouchableOpacity>
                      <TextInput
                        style={styles.quantityInput}
                        keyboardType="numeric"
                        value={fulfilledQuantities[item.id]}
                        onChangeText={text =>
                          handleQuantityChange(item.id, text, item.quantity)
                        }
                        underlineColorAndroid="transparent"
                      />
                      <TouchableOpacity
                        onPress={() => handleIncrement(item.id, item.quantity)}
                        style={styles.quantityButton}>
                        <Icon name="add" size={22} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        {request?.status === 'FULFILLED' ? (
          <View style={styles.fulfilledContainer}>
            <Icon name="checkmark-circle" size={24} color={colors.green} />
            <Text style={styles.fulfilledText}>Request Fulfilled</Text>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            {request?.status === 'PENDING' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.partialButton]}
                onPress={() => submitFulfillment('PARTIALLY_FULFILLED')}
                disabled={isSubmitting}>
                <Text style={styles.buttonText}>Save as Partial</Text>
              </TouchableOpacity>
            )}
            {(request?.status === 'PENDING' ||
              request?.status === 'PARTIALLY_FULFILLED') && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => submitFulfillment('FULFILLED')}
                disabled={isSubmitting}>
                <Text style={styles.buttonText}>Mark as Fulfilled</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: colors.bgRoot, // Themed
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partialButton: {
    backgroundColor: colors.primary, // Or another color like orange
  },
  completeButton: {
    backgroundColor: colors.green,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fulfilledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: colors.bgLighter, // Themed
  },
  fulfilledText: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.green, // Themed
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgRoot, // Themed
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.red, // Themed
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  card: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: colors.white, // Themed
    elevation: 2,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text, // Themed
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary, // Themed
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dataTable: {
    borderTopWidth: 1,
    borderTopColor: colors.border, // Themed
  },
  dataTableHeader: {
    backgroundColor: colors.bgRoot, // Themed
    borderBottomWidth: 1,
    borderBottomColor: colors.border, // Themed
  },
  dataTableHeaderTitle: {
    fontWeight: 'bold',
    color: colors.textSecondary, // Themed
    fontSize: 12,
    textTransform: 'uppercase',
  },
  numericHeader: {
    flex: 0.8,
    justifyContent: 'center',
  },
  fulfillHeader: {
    flex: 1.5,
    justifyContent: 'center',
  },
  dataTableRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border, // Themed
    minHeight: 60,
  },
  numericCell: {
    flex: 0.8,
    justifyContent: 'center',
  },
  quantityInputCell: {
    flex: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white, // Themed
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border, // Themed
    height: 40,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgRoot, // Themed
  },
  quantityInput: {
    width: 50,
    height: 40,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary, // Themed
    backgroundColor: colors.white, // Themed
  },
  footer: {
    padding: 16,
    backgroundColor: colors.white, // Themed
    borderTopWidth: 1,
    borderTopColor: colors.border, // Themed
  },
  completeButton: {
    backgroundColor: colors.primary, // Themed
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: colors.grey, // Themed
  },
  completeButtonText: {
    color: colors.white, // Themed
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RequestDetailsScreen;
