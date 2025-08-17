import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {generateClient} from 'aws-amplify/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Appbar from '../../components/Appbar';
import colors from '../../themes/colors';

const client = generateClient();

const ReportsScreen = ({navigation, route}) => {
  const {store} = route.params;

  return (
    <View style={styles.container}>
      <Appbar
        title="Reports"
        onBack={() => navigation.goBack()}
        subtitle={store.name}
      />

      <ScrollView style={styles.scrollContainer}>
        <TouchableOpacity
          style={styles.reportCard}
          onPress={() => navigation.navigate('SummaryReport', {store})}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="document-text-outline"
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.reportText}>Reports Summary</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={styles.reportCard}
          onPress={() => navigation.navigate('DeliveryStockReport', {store})}>
          <View style={styles.iconContainer}>
            <Ionicons name="cube-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.reportText}>Delivery Stock Report</Text>
        </TouchableOpacity> */}

        {/* <TouchableOpacity
          style={styles.reportCard}
          onPress={() => navigation.navigate('PulloutReport', {store})}>
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.reportText}>Pullout / Expired Report</Text>
        </TouchableOpacity> */}
        {/*
        <TouchableOpacity
          style={styles.reportCard}
          onPress={() => navigation.navigate('RemainingStockReport', {store})}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="bar-chart-outline"
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.reportText}>Remaining Stock Report</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.reportCard}
          onPress={() => navigation.navigate('SalesAnalytics', {store})}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="analytics-outline"
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.reportText}>Sales Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportCard}
          onPress={() => navigation.navigate('RemainingStock', {store})}>
          <View style={styles.iconContainer}>
            <Ionicons name="cube-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.reportText}>Remaining Stock</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportCard}
          onPress={() =>
            navigation.navigate('BillsAndReceiptReports', {store})
          }>
          <View style={styles.iconContainer}>
            <Ionicons name="cube-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.reportText}>Cashiers Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportCard}
          onPress={() =>
            navigation.navigate('BillsAndReceiptItemsReport', {store})
          }>
          <View style={styles.iconContainer}>
            <Ionicons name="cube-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.reportText}>Items Reports</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f6ff',
    borderRadius: 8,
  },
  reportText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default ReportsScreen;
