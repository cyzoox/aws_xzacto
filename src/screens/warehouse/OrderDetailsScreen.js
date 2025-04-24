import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, DataTable, Button, Chip, Divider, List } from 'react-native-paper';
import Appbar from '../../components/Appbar';
import { colors } from '../../constants/theme';

// This would come from your data store in production
const getOrderById = (orderId) => {
  return {
    id: orderId,
    store: {
      id: 'store1',
      name: 'Main Store',
      location: '123 Main St'
    },
    status: 'PENDING',
    createdAt: '2025-04-01T10:30:00Z',
    items: [
      { id: '1', productId: '1', name: 'Coffee Mug', quantity: 10, fulfilled: 0 },
      { id: '2', productId: '2', name: 'Wireless Mouse', quantity: 5, fulfilled: 0 },
      { id: '3', productId: '6', name: 'Bluetooth Speaker', quantity: 3, fulfilled: 0 },
    ],
    notes: 'Please deliver by Wednesday',
    priority: 'NORMAL'
  };
};

const OrderDetailsScreen = ({ navigation, route }) => {
  const { orderId } = route.params || { orderId: 'ord-001' };
  const [order, setOrder] = useState(getOrderById(orderId));
  const [processing, setProcessing] = useState(false);
  
  // Update item fulfillment
  const updateFulfillment = (itemId, value) => {
    setOrder({
      ...order,
      items: order.items.map(item => 
        item.id === itemId 
          ? { ...item, fulfilled: Math.min(value, item.quantity) } 
          : item
      )
    });
  };
  
  // Check if all items are fully fulfilled
  const allFulfilled = order.items.every(item => item.fulfilled === item.quantity);
  
  // Process the order
  const processOrder = () => {
    setProcessing(true);
    // This would interact with your data store in production
    setTimeout(() => {
      setOrder({
        ...order,
        status: allFulfilled ? 'COMPLETED' : 'PARTIALLY_FULFILLED'
      });
      setProcessing(false);
    }, 1000);
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Get status chip color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#FFA000';
      case 'PARTIALLY_FULFILLED': return '#2196F3';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      <Appbar
        title={`Order #${orderId.slice(-6)}`}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <View>
                <Title style={styles.title}>Order Details</Title>
                <Text style={styles.date}>Created: {formatDate(order.createdAt)}</Text>
              </View>
              <Chip 
                style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
              >
                {order.status}
              </Chip>
            </View>
            
            <Divider style={styles.divider} />
            
            <List.Item
              title="Store"
              description={order.store.name}
              left={props => <List.Icon {...props} icon="store" />}
            />
            
            <List.Item
              title="Location"
              description={order.store.location}
              left={props => <List.Icon {...props} icon="map-marker" />}
            />
            
            <List.Item
              title="Priority"
              description={order.priority}
              left={props => <List.Icon {...props} icon="flag" />}
            />
            
            {order.notes && (
              <List.Item
                title="Notes"
                description={order.notes}
                left={props => <List.Icon {...props} icon="note-text" />}
              />
            )}
            
            <Divider style={styles.divider} />
            
            <Title style={styles.subtitle}>Requested Items</Title>
            
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Item</DataTable.Title>
                <DataTable.Title numeric>Requested</DataTable.Title>
                <DataTable.Title numeric>Fulfilled</DataTable.Title>
                <DataTable.Title>Actions</DataTable.Title>
              </DataTable.Header>
              
              {order.items.map(item => (
                <DataTable.Row key={item.id}>
                  <DataTable.Cell>{item.name}</DataTable.Cell>
                  <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                  <DataTable.Cell numeric>{item.fulfilled}</DataTable.Cell>
                  <DataTable.Cell>
                    <View style={styles.actions}>
                      <Button 
                        mode="text" 
                        compact 
                        disabled={item.fulfilled <= 0}
                        onPress={() => updateFulfillment(item.id, item.fulfilled - 1)}
                      >
                        -
                      </Button>
                      <Button 
                        mode="text" 
                        compact 
                        disabled={item.fulfilled >= item.quantity}
                        onPress={() => updateFulfillment(item.id, item.fulfilled + 1)}
                      >
                        +
                      </Button>
                      <Button 
                        mode="text" 
                        compact 
                        disabled={item.fulfilled >= item.quantity}
                        onPress={() => updateFulfillment(item.id, item.quantity)}
                      >
                        Max
                      </Button>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Card.Content>
          
          <Card.Actions style={styles.cardActions}>
            <Button 
              mode="contained" 
              loading={processing}
              disabled={processing || order.status === 'COMPLETED'}
              onPress={processOrder}
              style={styles.processButton}
            >
              {order.status === 'PENDING' ? 'Process Order' : 'Update Order'}
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  date: {
    color: '#757575',
  },
  statusChip: {
    height: 30,
  },
  divider: {
    marginVertical: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  processButton: {
    backgroundColor: colors.primary,
  },
});

export default OrderDetailsScreen;
