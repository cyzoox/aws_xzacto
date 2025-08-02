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
import {listStoreSettings, updateStoreSettings} from '../../graphql/queries';
import {updateStaff} from '../../graphql/mutations';
import {listStaff} from '../../graphql/queries';
import {generateClient} from 'aws-amplify/api';
import {getCurrentUser} from '@aws-amplify/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../themes/colors';

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

  // Fetch store settings
  useEffect(() => {
    fetchSettings();
  }, [STORE.id]);

  const fetchSettings = async () => {
    try {
      setLoading(true);

      // Load general and operational settings from AsyncStorage
      await loadLocalSettings();

      // Load security settings from staff record
      await loadSecuritySettings();
    } catch (error) {
      console.error('Error fetching settings:', error.message);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
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
      // Get current user to find staff record
      const userInfo = await getCurrentUser();
      const userId = userInfo.userId;

      // Find staff record for current user
      const staffResult = await client.graphql({
        query: listStaff,
        variables: {filter: {storeId: {eq: STORE.id}}},
      });

      const staffList = staffResult.data.listStaff.items;
      const currentStaff = staffList.find(staff => staff.ownerId === userId);

      if (currentStaff) {
        setOldPIN(currentStaff.password || '');
      }
    } catch (error) {
      console.error('Error loading security settings:', error.message);
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

      // Save general settings to AsyncStorage
      await saveGeneralSettings();

      // Save operational settings to AsyncStorage
      await saveOperationalSettings();

      // Update staff PIN if changed
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
      // Get current user info
      const userInfo = await getCurrentUser();
      const userId = userInfo.userId;

      // Find staff record for current user
      const staffResult = await client.graphql({
        query: listStaff,
        variables: {filter: {storeId: {eq: STORE.id}}},
      });

      const staffList = staffResult.data.listStaff.items;
      const currentStaff = staffList.find(staff => staff.ownerId === userId);

      if (currentStaff) {
        // Update staff PIN
        await client.graphql({
          query: updateStaff,
          variables: {
            input: {
              id: currentStaff.id,
              password: newPin.trim(),
            },
          },
        });

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
        <View style={{width: 40}} />
        {/* Empty view for balance */}
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

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={onSaveSettings}
          style={styles.saveButton}
          loading={loading}
          disabled={loading || saveSuccess}
          labelStyle={{color: 'white', fontSize: 16}}>
          {saveSuccess ? 'Saved!' : 'Save Settings'}
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
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    elevation: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 6,
    backgroundColor: colors.primary,
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
