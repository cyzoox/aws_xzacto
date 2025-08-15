import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Button, Card, Title, DataTable } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTopSellingProducts, getLeastSellingProducts } from '../../services/SalesAnalyticsService';
import Appbar from '../../components/Appbar';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import colors from '../../themes/colors';

const SalesAnalyticsScreen = ({ navigation, route }) => {
  const { store } = route.params;
  const [loading, setLoading] = useState(false);
  const [topProducts, setTopProducts] = useState([]);
  const [leastProducts, setLeastProducts] = useState([]);
  
  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate]);
  
  const fetchAnalyticsData = async () => {
    if (!store?.id) return;
    
    setLoading(true);
    try {
      const top = await getTopSellingProducts(store.id, startDate, endDate, 10);
      const least = await getLeastSellingProducts(store.id, startDate, endDate, 10);
      
      setTopProducts(top);
      setLeastProducts(least);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar title="Sales Analytics" onBack={() => navigation.goBack()} />
      
      <View style={styles.dateFilterContainer}>
        <View style={styles.datePickerRow}>
          <Text style={styles.dateLabel}>Start Date:</Text>
          <Button 
            mode="outlined" 
            onPress={() => setShowStartDatePicker(true)}
          >
            {startDate.toLocaleDateString()}
          </Button>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              onChange={(event, date) => {
                setShowStartDatePicker(false);
                if (date) setStartDate(date);
              }}
            />
          )}
        </View>
        
        <View style={styles.datePickerRow}>
          <Text style={styles.dateLabel}>End Date:</Text>
          <Button 
            mode="outlined" 
            onPress={() => setShowEndDatePicker(true)}
          >
            {endDate.toLocaleDateString()}
          </Button>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              onChange={(event, date) => {
                setShowEndDatePicker(false);
                if (date) setEndDate(date);
              }}
            />
          )}
        </View>
      </View>
      
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.primary} />
      ) : (
        <ScrollView style={styles.scrollView}>
          {/* Top Products */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Top Selling Products</Title>
              
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Product</DataTable.Title>
                  <DataTable.Title numeric>Qty Sold</DataTable.Title>
                  <DataTable.Title numeric>Total Sales</DataTable.Title>
                </DataTable.Header>
                
                {topProducts.length > 0 ? (
                  topProducts.map((product) => (
                    <DataTable.Row key={product.productID}>
                      <DataTable.Cell>{product.productName}</DataTable.Cell>
                      <DataTable.Cell numeric>{product.totalQuantity}</DataTable.Cell>
                      <DataTable.Cell numeric>
                        {formatMoney(product.totalSales, {symbol: '₱', precision: 2})}
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))
                ) : (
                  <DataTable.Row>
                    <DataTable.Cell>No data available</DataTable.Cell>
                    <DataTable.Cell numeric>-</DataTable.Cell>
                    <DataTable.Cell numeric>-</DataTable.Cell>
                  </DataTable.Row>
                )}
              </DataTable>
            </Card.Content>
          </Card>
          
          {/* Least Selling Products */}
          <Card style={styles.card}>
            <Card.Content>
              <Title>Least Selling Products</Title>
              
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Product</DataTable.Title>
                  <DataTable.Title numeric>Qty Sold</DataTable.Title>
                  <DataTable.Title numeric>Total Sales</DataTable.Title>
                </DataTable.Header>
                
                {leastProducts.length > 0 ? (
                  leastProducts.map((product) => (
                    <DataTable.Row key={product.productID}>
                      <DataTable.Cell>{product.productName}</DataTable.Cell>
                      <DataTable.Cell numeric>{product.totalQuantity}</DataTable.Cell>
                      <DataTable.Cell numeric>
                        {formatMoney(product.totalSales, {symbol: '₱', precision: 2})}
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))
                ) : (
                  <DataTable.Row>
                    <DataTable.Cell>No data available</DataTable.Cell>
                    <DataTable.Cell numeric>-</DataTable.Cell>
                    <DataTable.Cell numeric>-</DataTable.Cell>
                  </DataTable.Row>
                )}
              </DataTable>
            </Card.Content>
          </Card>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dateFilterContainer: {
    backgroundColor: 'white',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    marginRight: 10,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  card: {
    marginBottom: 15,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SalesAnalyticsScreen;
