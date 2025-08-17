import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  fetchStoreSettings,
  selectStoreSettings,
  selectIsLoading,
} from '../../redux/slices/storeSettingsSlice';

/**
 * StoreSettingsDisplay - Read-only display component for store settings
 *
 * This component demonstrates:
 * 1. Loading store settings from Redux
 * 2. Displaying settings in a read-only format for POS screens
 * 3. Handling loading states and empty data
 */
const StoreSettingsDisplay = ({storeId}) => {
  const dispatch = useDispatch();
  const settings = useSelector(selectStoreSettings);
  const isLoading = useSelector(selectIsLoading);

  // Fetch store settings on component mount
  useEffect(() => {
    if (storeId) {
      dispatch(fetchStoreSettings(storeId));
    }
  }, [dispatch, storeId]);

  // Display a loading indicator while fetching data
  if (isLoading && !settings) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#2089dc" />
        <Text style={styles.loadingText}>Loading store information...</Text>
      </View>
    );
  }

  // Display a message if no settings are found
  if (!settings) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No store settings available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {settings.logoUrl ? (
          <Image
            source={{uri: settings.logoUrl}}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.placeholderLogo}>
            <Text style={styles.placeholderLogoText}>
              {settings.storeId?.substring(0, 2).toUpperCase() || 'ST'}
            </Text>
          </View>
        )}

        <View style={styles.headerInfo}>
          <Text style={styles.storeName}>{settings.storeName || 'Store'}</Text>
          {settings.address && (
            <Text style={styles.storeAddress}>{settings.address}</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>
            {settings.phone || 'Not provided'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>
            {settings.email || 'Not provided'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Business Hours:</Text>
          <Text style={styles.infoValue}>
            {settings.businessHours || 'Not specified'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sales Configuration</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>VAT Percentage:</Text>
          <Text style={styles.infoValue}>
            {settings.vatPercentage !== undefined
              ? `${settings.vatPercentage}%`
              : '0%'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Currency Symbol:</Text>
          <Text style={styles.infoValue}>{settings.currencySymbol || '$'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Low Stock Threshold:</Text>
          <Text style={styles.infoValue}>
            {settings.lowStockThreshold || '10'} units
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Settings</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Allow Cashier Sales View:</Text>
          <Text
            style={[
              styles.infoValue,
              {color: settings.allowCashierSalesView ? '#4caf50' : '#f44336'},
            ]}>
            {settings.allowCashierSalesView ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Allow Credit Sales:</Text>
          <Text
            style={[
              styles.infoValue,
              {color: settings.allowCreditSales ? '#4caf50' : '#f44336'},
            ]}>
            {settings.allowCreditSales ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      {settings.receiptFooterText && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt Information</Text>

          <View style={styles.receiptFooter}>
            <Text style={styles.receiptFooterLabel}>Receipt Footer:</Text>
            <Text style={styles.receiptFooterText}>
              "{settings.receiptFooterText}"
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#2089dc',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: '#f9f9f9',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  placeholderLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2089dc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2089dc',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  receiptFooter: {
    paddingVertical: 8,
  },
  receiptFooterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  receiptFooterText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2089dc',
  },
});

export default StoreSettingsDisplay;
