import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  createStoreSettings,
  updateStoreSettings,
  selectStoreSettings,
  selectIsLoading,
  selectError,
  selectHasPendingChanges,
  selectIsNetworkConnected,
} from '../../redux/slices/storeSettingsSlice';
import NetworkStatus from '../ui/NetworkStatus';

/**
 * StoreSettingsForm - Editable form for store settings
 *
 * This component demonstrates offline-first editing with:
 * 1. Immediate UI updates regardless of connectivity
 * 2. Network status indicator
 * 3. Visual feedback for pending changes
 * 4. Error handling and validation
 */
const StoreSettingsForm = ({storeId}) => {
  const dispatch = useDispatch();
  const settings = useSelector(selectStoreSettings);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const hasPendingChanges = useSelector(selectHasPendingChanges);
  const isNetworkConnected = useSelector(selectIsNetworkConnected);

  // Local form state
  const [formValues, setFormValues] = useState({
    address: '',
    phone: '',
    email: '',
    logoUrl: '',
    vatPercentage: '0',
    lowStockThreshold: '10',
    allowCashierSalesView: false,
    allowCreditSales: false,
    currencySymbol: '$',
    receiptFooterText: '',
    businessHours: '',
  });

  // Initialize form with settings when they load
  useEffect(() => {
    if (settings) {
      setFormValues({
        address: settings.address || '',
        phone: settings.phone || '',
        email: settings.email || '',
        logoUrl: settings.logoUrl || '',
        vatPercentage: settings.vatPercentage
          ? String(settings.vatPercentage)
          : '0',
        lowStockThreshold: settings.lowStockThreshold
          ? String(settings.lowStockThreshold)
          : '10',
        allowCashierSalesView: settings.allowCashierSalesView || false,
        allowCreditSales: settings.allowCreditSales || false,
        currencySymbol: settings.currencySymbol || '$',
        receiptFooterText: settings.receiptFooterText || '',
        businessHours: settings.businessHours || '',
      });
    }
  }, [settings]);

  // Handle text input changes
  const handleChange = (field, value) => {
    setFormValues({
      ...formValues,
      [field]: value,
    });
  };

  // Handle toggle switch changes
  const handleToggle = field => {
    setFormValues({
      ...formValues,
      [field]: !formValues[field],
    });
  };

  // Validate form before submission
  const validateForm = () => {
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if email is valid when provided
    if (formValues.email && !emailRegex.test(formValues.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    // Check if VAT percentage is valid
    const vatValue = parseFloat(formValues.vatPercentage);
    if (isNaN(vatValue) || vatValue < 0 || vatValue > 100) {
      Alert.alert('Invalid VAT', 'VAT percentage must be between 0 and 100.');
      return false;
    }

    // Check if lowStockThreshold is valid
    const thresholdValue = parseInt(formValues.lowStockThreshold, 10);
    if (isNaN(thresholdValue) || thresholdValue < 0) {
      Alert.alert(
        'Invalid Threshold',
        'Low stock threshold must be a positive number.',
      );
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    // Convert string values to appropriate types
    const settingsData = {
      ...formValues,
      vatPercentage: parseFloat(formValues.vatPercentage),
      lowStockThreshold: parseInt(formValues.lowStockThreshold, 10),
      storeId: storeId,
    };

    // Create or update settings based on whether they already exist
    if (settings?.id) {
      dispatch(
        updateStoreSettings({
          ...settingsData,
          id: settings.id,
        }),
      );
    } else {
      dispatch(createStoreSettings(settingsData));
    }
  };

  if (isLoading && !settings) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2089dc" />
        <Text style={styles.loadingText}>Loading store settings...</Text>
      </View>
    );
  }

  // Show a network status indicator if there are pending changes
  const renderNetworkStatus = () => {
    if (hasPendingChanges) {
      return (
        <NetworkStatus
          isConnected={isNetworkConnected}
          pendingChanges={hasPendingChanges}
        />
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {renderNetworkStatus()}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={formValues.address}
              onChangeText={text => handleChange('address', text)}
              placeholder="Store Address"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formValues.phone}
              onChangeText={text => handleChange('phone', text)}
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formValues.email}
              onChangeText={text => handleChange('email', text)}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Logo URL</Text>
            <TextInput
              style={styles.input}
              value={formValues.logoUrl}
              onChangeText={text => handleChange('logoUrl', text)}
              placeholder="Logo URL"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Hours</Text>
            <TextInput
              style={styles.input}
              value={formValues.businessHours}
              onChangeText={text => handleChange('businessHours', text)}
              placeholder="e.g., Mon-Fri: 9AM-5PM"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales Configuration</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>VAT Percentage</Text>
            <TextInput
              style={[styles.input, styles.numberInput]}
              value={formValues.vatPercentage}
              onChangeText={text => handleChange('vatPercentage', text)}
              placeholder="0"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Low Stock Threshold</Text>
            <TextInput
              style={[styles.input, styles.numberInput]}
              value={formValues.lowStockThreshold}
              onChangeText={text => handleChange('lowStockThreshold', text)}
              placeholder="10"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Currency Symbol</Text>
            <TextInput
              style={[styles.input, styles.currencyInput]}
              value={formValues.currencySymbol}
              onChangeText={text => handleChange('currencySymbol', text)}
              placeholder="$"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receipt Footer Text</Text>
            <TextInput
              style={styles.input}
              value={formValues.receiptFooterText}
              onChangeText={text => handleChange('receiptFooterText', text)}
              placeholder="Thank you for your business!"
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>

          <View style={styles.switchGroup}>
            <Text style={styles.label}>Allow Cashier Sales View</Text>
            <Switch
              value={formValues.allowCashierSalesView}
              onValueChange={() => handleToggle('allowCashierSalesView')}
              trackColor={{false: '#767577', true: '#2089dc'}}
              thumbColor={
                formValues.allowCashierSalesView ? '#f5f5f5' : '#f4f3f4'
              }
            />
          </View>
          <View style={styles.switchGroup}>
            <Text style={styles.label}>Allow Credit Sales</Text>
            <Switch
              value={formValues.allowCreditSales}
              onValueChange={() => handleToggle('allowCreditSales')}
              trackColor={{false: '#767577', true: '#2089dc'}}
              thumbColor={formValues.allowCreditSales ? '#f5f5f5' : '#f4f3f4'}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {hasPendingChanges ? 'Save Changes (Offline)' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#2089dc',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2089dc',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  numberInput: {
    maxWidth: 120,
  },
  currencyInput: {
    maxWidth: 80,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  saveButton: {
    backgroundColor: '#2089dc',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#aaa',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});

export default StoreSettingsForm;
