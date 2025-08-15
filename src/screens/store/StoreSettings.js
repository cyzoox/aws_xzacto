import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Card,
  Title,
  Divider,
  Button,
  Checkbox,
  HelperText,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  updateStaff,
  createStoreSettings as createStoreSettingsMutation,
  updateStoreSettings as updateStoreSettingsMutation
} from '../../graphql/mutations';
import {listStaff, listStoreSettings} from '../../graphql/queries';
import {generateClient} from 'aws-amplify/api';
import {getCurrentUser} from '@aws-amplify/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../themes/colors';
import {useDispatch, useSelector} from 'react-redux';
import {hashPassword} from '../../utils/PasswordUtils';
import {selectIsLoading} from '../../redux/slices/storeSettingsSlice';
import NetworkStatus from '../../components/ui/NetworkStatus';

const client = generateClient();

export const useTogglePasswordVisibility = () => {
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [rightIcon, setRightIcon] = useState('eye');

  const handlePasswordVisibility = () => {
    setRightIcon(prevIcon => (prevIcon === 'eye' ? 'eye-off' : 'eye'));
    setPasswordVisibility(prevVisibility => !prevVisibility);
  };

  return {passwordVisibility, rightIcon, handlePasswordVisibility};
};

const StoreSettings = ({route, navigation}) => {
  const STORE = route.params.store; // Pass store object from the previous screen
  const {passwordVisibility, rightIcon, handlePasswordVisibility} =
    useTogglePasswordVisibility();

  const dispatch = useDispatch();
  const reduxIsLoading = useSelector(selectIsLoading);

  // Store settings are now loaded directly from GraphQL API
  const [storeSettingsId, setStoreSettingsId] = useState(null);

  // Define states
  const [storeName, setStoreName] = useState('');
  const [vat, setVat] = useState('0'); // Default to 0
  const [lowStock, setLowStock] = useState('0'); // Default to 0
  const [cashierView, setCashierView] = useState(false); // Default to false
  const [allowCredit, setAllowCredit] = useState(false); // Default to false
  const [requireStaffLogin, setRequireStaffLogin] = useState(false); // Default to false
  const [oldPin, setOldPIN] = useState('');
  const [newPin, setNewPIN] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // UI states
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('general'); // general, security, operational
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');

  // Validation states
  const [errors, setErrors] = useState({});

  // Fetch store settings directly from AWS GraphQL API
  useEffect(() => {
    if (STORE.id) {
      console.log('Fetching store settings for ID:', STORE.id);
      
      // Directly fetch store settings from AWS
      fetchStoreSettingsFromAPI(STORE.id);
      
      // Also fetch legacy settings
      fetchLegacySettings();
      
      // Load security settings
      loadSecuritySettings();
    }
  }, [STORE.id]);
  
  // Function to fetch store settings directly from GraphQL API
  const fetchStoreSettingsFromAPI = async (storeId) => {
    try {
      setLoading(true);
      const client = generateClient();
      
      console.log('Fetching store settings from API for store ID:', storeId);
      
      // Query for store settings with the matching storeId
      const response = await client.graphql({
        query: listStoreSettings,
        variables: {
          filter: {
            storeId: { eq: storeId }
          }
        }
      });
      
      const settingsList = response?.data?.listStoreSettings?.items || [];
      console.log('Fetched settings:', settingsList.length > 0 ? 'Found' : 'None found');
      
      if (settingsList.length > 0) {
        // Use the first matching settings
        const settings = settingsList[0];
        
        // Save settings ID for later use in updates
        setStoreSettingsId(settings.id);
        console.log('Set settings ID:', settings.id);
        
        // Update local state from fetched settings
        setStoreName(STORE.name || '');
        setStoreAddress(settings.address || '');
        setStorePhone(settings.phone || '');
        setStoreEmail(settings.email || '');
        setStoreLogoUrl(settings.logoUrl || '');
        setVat(settings.vatPercentage ? settings.vatPercentage.toString() : '0');
        setLowStock(settings.lowStockThreshold ? settings.lowStockThreshold.toString() : '0');
        setCashierView(settings.allowCashierSalesView || false);
        setAllowCredit(settings.allowCreditSales || false);
      } else {
        console.log('No store settings found, using defaults');
        // Set defaults
        setStoreName(STORE.name || '');
        setStoreAddress('');
        setStorePhone('');
        setStoreEmail('');
        setStoreLogoUrl('');
        setVat('0');
        setLowStock('5');
        setCashierView(true);
        setAllowCredit(true);
      }
    } catch (error) {
      console.error('Error fetching store settings from API:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLegacySettings = async () => {
    try {
      setLoading(true);
      // Load security settings from staff record since they're not part of StoreSettings model
      await loadSecuritySettings();
    } catch (error) {
      console.error('Error fetching legacy settings:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalSettings = async () => {
    try {
      // Load general settings
      const generalSettingsStr = await AsyncStorage.getItem(
        `store_general_${STORE.id}`,
      );
      if (generalSettingsStr) {
        const generalSettings = JSON.parse(generalSettingsStr);
        setStoreName(generalSettings.name || STORE.name || '');
        setStoreAddress(generalSettings.address || '');
        setStorePhone(generalSettings.phone || '');
        setStoreEmail(generalSettings.email || '');
        setStoreLogoUrl(generalSettings.logo_url || '');
      } else {
        setStoreName(STORE.name || '');
      }

      // Load operational settings
      const operationalSettingsStr = await AsyncStorage.getItem(
        `store_operational_${STORE.id}`,
      );
      if (operationalSettingsStr) {
        const operationalSettings = JSON.parse(operationalSettingsStr);
        setVat(
          operationalSettings.vat ? operationalSettings.vat.toString() : '0',
        );
        setLowStock(
          operationalSettings.lowStock
            ? operationalSettings.lowStock.toString()
            : '0',
        );
        setCashierView(operationalSettings.cashierView || false);
        setAllowCredit(operationalSettings.allowCredit || false);
        setRequireStaffLogin(operationalSettings.requireStaffLogin || false);
      }
    } catch (error) {
      console.error('Error loading local settings:', error.message);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      // Always use STORE.id directly to ensure consistency with saving
      const storeId = STORE.id;
      
      if (!storeId) {
        console.log('Store ID not found, skipping security settings load');
        return; // Exit if no storeId is available
      }
      
      console.log('Loading security settings for store ID:', storeId);
      
      // First check if we have a logged in user
      try {
        // Get current user to find staff record
        const userInfo = await getCurrentUser();
        if (!userInfo || !userInfo.userId) {
          console.log('No authenticated user found, skipping staff PIN load');
          return;
        }
        const userId = userInfo.userId;
        
        // Create a GraphQL client instance
        const client = generateClient();

        console.log('Fetching staff records for store:', storeId);
        
        // Find staff record by ownerId (user ID) instead of storeId
        // storeId isn't a direct field in Staff model according to schema
        const staffResult = await client.graphql({
          query: listStaff,
          variables: {filter: {ownerId: {eq: userId}}},
        });

        console.log('Staff query result:', JSON.stringify(staffResult?.data?.listStaff || {}));
        
        const staffList = staffResult?.data?.listStaff?.items || [];
        const currentStaff = staffList.find(staff => staff.ownerId === userId);

        if (currentStaff) {
          console.log('Found staff record, setting PIN');
          setOldPIN(currentStaff.password || '');
        } else {
          console.log('No matching staff record found for user ID:', userId);
        }
      } catch (userError) {
        console.error('Error getting user info or staff data:', userError);
        // Continue execution - don't block the whole function for PIN issues
      }
    } catch (error) {
      // Main try/catch to ensure component doesn't crash
      console.error('Error in loadSecuritySettings:', error);
    }
  };

  // Validate settings before saving
  const validateSettings = () => {
    const newErrors = {};

    if (!storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    }

    if (newPin && newPin.length < 4) {
      newErrors.newPin = 'PIN must be at least 4 digits';
    }

    if (newPin && newPin !== confirmPin) {
      newErrors.confirmPin = 'PINs do not match';
    }

    // Validate VAT is a number
    if (vat && isNaN(parseFloat(vat))) {
      newErrors.vat = 'VAT must be a number';
    }

    // Validate low stock is a number
    if (lowStock && isNaN(parseFloat(lowStock))) {
      newErrors.lowStock = 'Low stock must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSaveSettings = async () => {
    if (!validateSettings()) {
      Alert.alert(
        'Validation Error',
        'Please correct the errors before saving.',
      );
      return;
    }

    try {
      setLoading(true);
      
      // Set a timeout to prevent infinite loading
      const saveTimeout = setTimeout(() => {
        setLoading(false);
        Alert.alert(
          'Operation Timeout',
          'The save operation took too long. Please check network connectivity and try again.'
        );
      }, 10000); // 10 second timeout
      
      // Generate a hardcoded storeId if one isn't available
      const defaultStoreId = 'store-' + Date.now().toString();
      
      // Create StoreSettings object
      const storeSettingsData = {
        // Always use STORE.id for consistency with loading
        storeId: STORE.id,
        // name field is not part of StoreSettings schema
        address: storeAddress.trim(),
        phone: storePhone.trim(),
        email: storeEmail.trim(),
        logoUrl: storeLogoUrl.trim(),
        vatPercentage: parseFloat(vat) || 0,
        lowStockThreshold: parseFloat(lowStock) || 0,
        allowCashierSalesView: cashierView,
        allowCreditSales: allowCredit,
        currencySymbol: '$', // TODO: Make this configurable
        receiptFooterText: '', // TODO: Add to UI
        businessHours: '', // TODO: Add to UI
      };
      
      console.log('Saving store settings:', storeSettingsData);

      // Save directly to AWS using GraphQL
      try {
        console.log('Saving store settings directly to AWS...');
        const client = generateClient();
        
        if (storeSettingsId) {
          console.log('Updating existing settings with ID:', storeSettingsId);
          
          // Update existing settings in AWS
          await client.graphql({
            query: updateStoreSettingsMutation,
            variables: {
              input: {
                id: storeSettingsId,
                storeId: STORE.id,
                address: storeSettingsData.address,
                phone: storeSettingsData.phone,
                email: storeSettingsData.email,
                logoUrl: storeSettingsData.logoUrl,
                vatPercentage: storeSettingsData.vatPercentage,
                lowStockThreshold: storeSettingsData.lowStockThreshold,
                allowCashierSalesView: storeSettingsData.allowCashierSalesView,
                allowCreditSales: storeSettingsData.allowCreditSales,
                currencySymbol: storeSettingsData.currencySymbol,
                receiptFooterText: storeSettingsData.receiptFooterText,
                businessHours: storeSettingsData.businessHours
              }
            }
          });
          
          // Also update Redux state for immediate UI updates
          dispatch({
            type: 'storeSettings/updateSuccess',
            payload: {
              id: storeSettingsId, // Use storeSettingsId instead of reduxStoreSettings.id
              ...storeSettingsData
            }
          });
        } else {
          console.log('Creating new settings');
          
          // Create new settings in AWS
          const result = await client.graphql({
            query: createStoreSettingsMutation,
            variables: {
              input: {
                storeId: STORE.id,
                address: storeSettingsData.address,
                phone: storeSettingsData.phone,
                email: storeSettingsData.email,
                logoUrl: storeSettingsData.logoUrl,
                vatPercentage: storeSettingsData.vatPercentage,
                lowStockThreshold: storeSettingsData.lowStockThreshold,
                allowCashierSalesView: storeSettingsData.allowCashierSalesView,
                allowCreditSales: storeSettingsData.allowCreditSales,
                currencySymbol: storeSettingsData.currencySymbol,
                receiptFooterText: storeSettingsData.receiptFooterText,
                businessHours: storeSettingsData.businessHours
              }
            }
          });
          
          const newSettings = result.data.createStoreSettings;
          console.log('New settings created:', newSettings.id);
          
          // Update Redux state for immediate UI updates
          dispatch({
            type: 'storeSettings/createSuccess',
            payload: newSettings
          });
        }
      } catch (graphqlError) {
        console.error('GraphQL error saving settings:', graphqlError);
        throw graphqlError; // Re-throw to be caught by outer try/catch
      }
      
      // Clear the timeout since the operation completed
      clearTimeout(saveTimeout);

      // We no longer need to save to local AsyncStorage separately 
      // as our Redux actions now handle that directly
      
      // Update staff PIN if changed (still using GraphQL API)
      if (newPin && newPin.trim() !== '') {
        await updateStaffPin();
      }

      console.log('Settings saved successfully');
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error updating settings:', error.message);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveGeneralSettings = async () => {
    try {
      const generalSettings = {
        name: storeName.trim(),
        address: storeAddress.trim(),
        phone: storePhone.trim(),
        email: storeEmail.trim(),
        logo_url: storeLogoUrl.trim(),
      };

      await AsyncStorage.setItem(
        `store_general_${STORE.id}`,
        JSON.stringify(generalSettings),
      );

      console.log('General settings saved to local storage');
    } catch (error) {
      console.error('Error saving general settings:', error);
      throw error;
    }
  };

  const saveOperationalSettings = async () => {
    try {
      const operationalSettings = {
        vat: parseFloat(vat) || 0,
        lowStock: parseFloat(lowStock) || 0,
        cashierView,
        allowCredit,
        requireStaffLogin,
      };

      await AsyncStorage.setItem(
        `store_operational_${STORE.id}`,
        JSON.stringify(operationalSettings),
      );

      console.log('Operational settings saved to local storage');
    } catch (error) {
      console.error('Error saving operational settings:', error);
      throw error;
    }
  };

  const updateStaffPin = async () => {
    try {
      // Always use STORE.id for consistency with other operations
      const storeId = STORE.id;
      
      if (!storeId) {
        console.log('Store ID not found, cannot update staff PIN');
        return; // Exit if no storeId is available
      }
      
      // Get current user info
      const userInfo = await getCurrentUser();
      const userId = userInfo.userId;
      
      if (!userId) {
        console.log('User ID not found, cannot update staff PIN');
        return;
      }
      
      // Create a GraphQL client instance
      const client = generateClient();

      // Find staff record by owner ID (userId) as storeId isn't a direct filter field
      const staffResult = await client.graphql({
        query: listStaff,
        variables: {filter: {ownerId: {eq: userId}}},
      });
      
      console.log('Staff query for PIN update result:', JSON.stringify(staffResult?.data?.listStaff || {}));

      const staffList = staffResult?.data?.listStaff?.items || [];
      const currentStaff = staffList.find(staff => staff.ownerId === userId);

      if (currentStaff) {
        // Hash the PIN before updating
        let hashedPin;
        try {
          // Use our custom password hashing utility
          hashedPin = hashPassword(newPin.trim());
          console.log('Created hashed PIN for staff update');
        } catch (hashError) {
          console.error('Error hashing PIN:', hashError);
          // Don't fall back to plain text - security first
          Alert.alert('Error', 'There was a problem securing your PIN. Please try again.');
          throw new Error('PIN hashing failed');
        }
        
        // Update staff PIN with hashed value
        await client.graphql({
          query: updateStaff,
          variables: {
            input: {
              id: currentStaff.id,
              password: hashedPin,
            },
          },
        });
        
        console.log('Updated staff PIN with hash');

        console.log('Staff PIN updated successfully');
      } else {
        console.warn('No staff record found for current user');
      }
    } catch (error) {
      console.error('Error updating staff PIN:', error);
      throw error;
    }
  };

  // Render section tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeSection === 'general' && styles.activeTab]}
        onPress={() => setActiveSection('general')}>
        <MaterialIcons
          name="settings"
          size={20}
          color={activeSection === 'general' ? colors.primary : '#777'}
        />
        <Text
          style={[
            styles.tabText,
            activeSection === 'general' && styles.activeTabText,
          ]}>
          General
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeSection === 'operational' && styles.activeTab,
        ]}
        onPress={() => setActiveSection('operational')}>
        <MaterialIcons
          name="business"
          size={20}
          color={activeSection === 'operational' ? colors.primary : '#777'}
        />
        <Text
          style={[
            styles.tabText,
            activeSection === 'operational' && styles.activeTabText,
          ]}>
          Operational
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeSection === 'security' && styles.activeTab]}
        onPress={() => setActiveSection('security')}>
        <MaterialIcons
          name="security"
          size={20}
          color={activeSection === 'security' ? colors.primary : '#777'}
        />
        <Text
          style={[
            styles.tabText,
            activeSection === 'security' && styles.activeTabText,
          ]}>
          Security
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render general settings
  const renderGeneralSettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Store Information</Title>
        <Divider style={styles.divider} />

        <TextInput
          value={storeName}
          label="Store Name"
          onChangeText={text => setStoreName(text)}
          mode="outlined"
          style={styles.input}
          error={!!errors.storeName}
        />
        {errors.storeName && (
          <HelperText type="error">{errors.storeName}</HelperText>
        )}

        <TextInput
          label="Store Address"
          value={storeAddress}
          onChangeText={text => setStoreAddress(text)}
          mode="outlined"
          style={styles.input}
          multiline
        />

        <TextInput
          label="Phone Number"
          value={storePhone}
          onChangeText={text => setStorePhone(text)}
          mode="outlined"
          style={styles.input}
          keyboardType="phone-pad"
        />

        <TextInput
          label="Email Address"
          value={storeEmail}
          onChangeText={text => setStoreEmail(text)}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          label="Logo URL (Optional)"
          value={storeLogoUrl}
          onChangeText={text => setStoreLogoUrl(text)}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
        />
      </Card.Content>
    </Card>
  );

  // Render operational settings
  const renderOperationalSettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Operational Settings</Title>
        <Divider style={styles.divider} />

        <TextInput
          label="VAT Percentage"
          value={vat}
          onChangeText={text => setVat(text)}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          error={!!errors.vat}
          right={<TextInput.Affix text="%" />}
        />
        {errors.vat && <HelperText type="error">{errors.vat}</HelperText>}

        <TextInput
          label="Low Stock Warning Threshold"
          value={lowStock}
          onChangeText={text => setLowStock(text)}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          error={!!errors.lowStock}
        />
        {errors.lowStock && (
          <HelperText type="error">{errors.lowStock}</HelperText>
        )}

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Cashier Sales View</Text>
            <Text style={styles.settingDescription}>
              Allow cashiers to view sales data and reports
            </Text>
          </View>
          <Switch
            value={cashierView}
            onValueChange={() => setCashierView(!cashierView)}
            color={colors.primary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Allow Credit Sales</Text>
            <Text style={styles.settingDescription}>
              Allow sales on credit to customers
            </Text>
          </View>
          <Switch
            value={allowCredit}
            onValueChange={() => setAllowCredit(!allowCredit)}
            color={colors.primary}
          />
        </View>
      </Card.Content>
    </Card>
  );

  // Render security settings
  const renderSecuritySettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Security Settings</Title>
        <Divider style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Require Staff Login</Text>
            <Text style={styles.settingDescription}>
              Staff must login before accessing the system
            </Text>
          </View>
          <Switch
            value={requireStaffLogin}
            onValueChange={() => setRequireStaffLogin(!requireStaffLogin)}
            color={colors.primary}
          />
        </View>

        <TextInput
          label="Current PIN"
          secureTextEntry={passwordVisibility}
          value={oldPin}
          mode="outlined"
          style={styles.input}
          right={
            <TextInput.Icon
              name={rightIcon}
              onPress={handlePasswordVisibility}
            />
          }
          editable={false} // Ensure old PIN cannot be edited
        />

        <TextInput
          label="New PIN"
          secureTextEntry={passwordVisibility}
          value={newPin}
          onChangeText={text => setNewPIN(text)}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          maxLength={6}
          error={!!errors.newPin}
          right={
            <TextInput.Icon
              name={rightIcon}
              onPress={handlePasswordVisibility}
            />
          }
        />
        {errors.newPin && <HelperText type="error">{errors.newPin}</HelperText>}

        <TextInput
          label="Confirm New PIN"
          secureTextEntry={passwordVisibility}
          value={confirmPin}
          onChangeText={text => setConfirmPin(text)}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          maxLength={6}
          error={!!errors.confirmPin}
        />
        {errors.confirmPin && (
          <HelperText type="error">{errors.confirmPin}</HelperText>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Settings</Text>
        <TouchableOpacity
          onPress={onSaveSettings}
          disabled={loading || reduxIsLoading || saveSuccess}
          style={styles.headerSaveButton}>
          <MaterialIcons name="save" size={24} color="white" />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {renderTabs()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeSection === 'general' && renderGeneralSettings()}
          {activeSection === 'operational' && renderOperationalSettings()}
          {activeSection === 'security' && renderSecuritySettings()}
        </ScrollView>
      )}

      {/* Network Status Indicator */}
      {/* <NetworkStatus /> */}
      
      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={onSaveSettings}
          style={styles.saveButton}
          loading={loading || reduxIsLoading}
          disabled={loading || reduxIsLoading || saveSuccess}
          labelStyle={{color: 'white', fontSize: 18, fontWeight: 'bold'}}
          icon="content-save">  {/* Add an icon to make button more visible */}
          {saveSuccess ? 'SAVED SUCCESSFULLY!' : 'SAVE SETTINGS'}
        </Button>
      </View>

      {/* Success Indicator */}
      {saveSuccess && (
        <View style={styles.successOverlay}>
          <MaterialIcons name="check-circle" size={60} color="white" />
          <Text style={styles.successText}>Settings Saved!</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 70, // Add padding to account for fixed save button
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
  headerSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  saveButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 2,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#777',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  card: {
    margin: 10,
    elevation: 2,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 15,
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#777',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButton: {
    height: 50,
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#777',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 150, 136, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
  },
  inputField: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default StoreSettings;
