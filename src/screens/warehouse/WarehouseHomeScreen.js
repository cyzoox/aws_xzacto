import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {Card, Title, Paragraph, Button} from 'react-native-paper';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Appbar from '../../components/Appbar';
import SummaryCard from '../../components/SummaryCard'; // Import the new component
import {generateClient} from 'aws-amplify/api';
import {
  listWarehouseProducts,
  listInventoryRequests,
} from '../../graphql/queries';
import colors from '../../themes/colors';

const WarehouseHomeScreen = () => {
  const navigation = useNavigation();
  const [summary, setSummary] = useState({
    PENDING: 0,
    PARTIALLY_FULFILLED: 0,
    FULFILLED: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const client = generateClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all products to get count and filter for low stock
      const productsData = await client.graphql({
        query: listWarehouseProducts,
      });
      const allProducts = productsData.data.listWarehouseProducts.items;
      setProductCount(allProducts.length);

      const lowStock = allProducts.filter(p => p.availableStock < 10);
      setLowStockProducts(lowStock);

      // Fetch all inventory requests for summary
      const allRequestsData = await client.graphql({
        query: listInventoryRequests,
      });
      const requests = allRequestsData.data.listInventoryRequests.items;
      const summaryData = requests.reduce(
        (acc, req) => {
          if (acc[req.status] !== undefined) {
            acc[req.status]++;
          }
          return acc;
        },
        {PENDING: 0, PARTIALLY_FULFILLED: 0, FULFILLED: 0},
      );
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().finally(() => setRefreshing(false));
  }, [fetchData]);

  return (
    <View style={styles.container}>
      <Appbar title="Dashboard" subtitle="Warehouse" hideMenuButton />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Quick Summary</Text>
          <View style={styles.summaryContainer}>
            <Card style={styles.card}>
              <Card.Content>
                <Title>{productCount}</Title>
                <Paragraph>Total Products</Paragraph>
              </Card.Content>
            </Card>
            <Card style={styles.card}>
              <Card.Content>
                <Title>{lowStockProducts.length}</Title>
                <Paragraph>Low Stock</Paragraph>
              </Card.Content>
            </Card>
          </View>

          <Text style={styles.sectionTitle}>Request Summaries</Text>
          <View style={styles.summaryContainer}>
            <SummaryCard
              title="Pending"
              count={summary.PENDING}
              icon="alert-circle-outline"
              color="#FFA000"
              onPress={() =>
                navigation.navigate('StoreRequests', {statusFilter: 'PENDING'})
              }
            />
            <SummaryCard
              title="Partial"
              count={summary.PARTIALLY_FULFILLED}
              icon="progress-check"
              color="#2196F3"
              onPress={() =>
                navigation.navigate('StoreRequests', {
                  statusFilter: 'PARTIALLY_FULFILLED',
                })
              }
            />
            <SummaryCard
              title="Completed"
              count={summary.FULFILLED}
              icon="check-circle-outline"
              color="#4CAF50"
              onPress={() =>
                navigation.navigate('StoreRequests', {
                  statusFilter: 'FULFILLED',
                })
              }
            />
          </View>

          <Card
            style={styles.reportCard}
            onPress={() => navigation.navigate('Reports')}>
            <Card.Content style={styles.reportCardContent}>
              <View style={styles.reportCardTextContainer}>
                <Title>Inventory Health Reports</Title>
                <Paragraph>
                  View detailed inventory metrics and stock value analysis
                </Paragraph>
              </View>
              <Button
                mode="contained"
                icon="chart-box"
                color={colors.primary}
                style={styles.reportButton}
                onPress={() => navigation.navigate('Reports')}>
                View Reports
              </Button>
            </Card.Content>
          </Card>

          <Text style={styles.sectionTitle}>Low Stock Items</Text>
          {lowStockProducts.length > 0 ? (
            lowStockProducts.slice(0, 5).map(product => (
              <Card key={product.id} style={styles.listCard}>
                <Card.Content>
                  <Title>{product.name}</Title>
                  <Paragraph>
                    Available Stock: {product.availableStock}
                  </Paragraph>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text style={styles.noItemsText}>No low stock items.</Text>
          )}

          {lowStockProducts.length > 5 && (
            <Button
              mode="text"
              onPress={() => navigation.navigate('WarehouseInventory')}
              style={styles.viewMoreButton}>
              View All Low Stock Items
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
export default WarehouseHomeScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    alignItems: 'center',
  },
  listCard: {
    marginBottom: 8,
  },
  noItemsText: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 16,
  },
  viewMoreButton: {
    marginTop: 8,
  },
  reportCard: {
    marginBottom: 24,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  reportCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportCardTextContainer: {
    flex: 2,
  },
  reportButton: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: colors.secondary,
  },
});
