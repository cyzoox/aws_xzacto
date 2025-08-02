import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {Divider, Card} from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrinterService from '../services/PrinterService';
import colors from '../themes/colors';
import AppHeader from '../components/AppHeader';

const PrinterSettingsScreen = ({route, navigation}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const [staffData] = useState(route.params?.staffData || {});
  const [storeInfo, setStoreInfo] = useState({
    name: 'Store Name',
    address: 'Store Address',
    phone: 'Phone Number',
  });

  // Setup header components for back navigation
  const headerLeftComponent = {
    icon: 'arrow-back',
    color: colors.white,
    onPress: () => navigation.goBack(),
  };

  useEffect(() => {
    loadSettings();
    checkConnectedDevice();
  }, []);

  const loadSettings = async () => {
    try {
      // Load printer settings
      const printerSettingsStr = await AsyncStorage.getItem('printerSettings');
      if (printerSettingsStr) {
        const printerSettings = JSON.parse(printerSettingsStr);
        setAutoPrint(printerSettings.autoPrint !== false);

        if (printerSettings.storeInfo) {
          setStoreInfo(printerSettings.storeInfo);
        }
      }
    } catch (error) {
      console.error('Error loading printer settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(
        'printerSettings',
        JSON.stringify({
          autoPrint,
          storeInfo,
          connectedDevice,
        }),
      );
      Alert.alert('Success', 'Printer settings saved successfully!');
    } catch (error) {
      console.error('Error saving printer settings:', error);
      Alert.alert('Error', 'Failed to save printer settings');
    }
  };

  const checkConnectedDevice = async () => {
    try {
      const permissionGranted =
        await PrinterService.requestBluetoothPermission();
      if (!permissionGranted) {
        Alert.alert(
          'Permission Required',
          'Bluetooth permission is required to use the printer',
        );
        return;
      }

      const deviceAddress = await PrinterService.isBluetoothDeviceConnected();
      if (deviceAddress) {
        // Try to get the stored settings to get the name
        const printerSettingsStr = await AsyncStorage.getItem(
          'printerSettings',
        );
        if (printerSettingsStr) {
          const printerSettings = JSON.parse(printerSettingsStr);
          if (
            printerSettings.connectedDevice &&
            printerSettings.connectedDevice.address === deviceAddress
          ) {
            setConnectedDevice(printerSettings.connectedDevice);
            return;
          }
        }

        // If we can't get the name, just use the address
        setConnectedDevice({
          address: deviceAddress,
          name: `Printer (${deviceAddress})`,
        });
      }
    } catch (error) {
      console.error('Error checking connected device:', error);
    }
  };

  const startScan = async () => {
    try {
      const permissionGranted =
        await PrinterService.requestBluetoothPermission();
      if (!permissionGranted) {
        Alert.alert(
          'Permission Required',
          'Bluetooth permission is required to use the printer',
        );
        return;
      }

      setIsScanning(true);
      const foundDevices = await PrinterService.scanBluetoothDevices();
      setDevices(foundDevices);
    } catch (error) {
      Alert.alert('Error', 'Error scanning for devices: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async device => {
    try {
      setIsConnecting(true);
      await PrinterService.connectBluetoothDevice(device.address);
      setConnectedDevice(device);
      Alert.alert('Success', `Connected to ${device.name}`);

      // Update settings in AsyncStorage
      const printerSettingsStr = await AsyncStorage.getItem('printerSettings');
      const printerSettings = printerSettingsStr
        ? JSON.parse(printerSettingsStr)
        : {};
      printerSettings.connectedDevice = device;
      await AsyncStorage.setItem(
        'printerSettings',
        JSON.stringify(printerSettings),
      );
    } catch (error) {
      Alert.alert('Error', 'Error connecting to device: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const testPrint = async () => {
    if (!connectedDevice) {
      Alert.alert('Error', 'No printer connected');
      return;
    }

    try {
      // Create a sample transaction for test printing
      const testTransaction = {
        id: 'TEST-123',
        date: new Date(),
        cashierName: staffData.name || 'Test Cashier',
        discount: 0,
        totalAmount: 1000,
      };

      const testItems = [
        {
          id: '1',
          name: 'Test Product 1',
          quantity: 2,
          sprice: 250,
        },
        {
          id: '2',
          name: 'Test Product 2 with Long Name That Will Truncate',
          quantity: 1,
          sprice: 500,
          parsedVariantData: {
            name: 'Large',
            price: '50',
          },
        },
      ];

      const testPayments = [
        {
          method: 'CASH',
          amount: 1200,
        },
      ];

      const success = await PrinterService.printReceipt(
        testTransaction,
        testItems,
        storeInfo,
        testPayments,
        200, // Change amount
      );

      if (success) {
        Alert.alert('Success', 'Test receipt printed successfully!');
      } else {
        Alert.alert('Error', 'Failed to print test receipt');
      }
    } catch (error) {
      console.error('Error printing test receipt:', error);
      Alert.alert('Error', 'Failed to print test receipt: ' + error.message);
    }
  };

  const testXReport = async () => {
    if (!connectedDevice) {
      Alert.alert('Error', 'No printer connected');
      return;
    }

    try {
      // Sample transactions for X report
      const testTransactions = [
        {
          id: 'TRX-001',
          date: new Date(),
          cashierName: 'John Doe',
          totalAmount: 2500,
          items: [
            {
              id: '1',
              name: 'Product A',
              quantity: 2,
              sprice: 500,
              category: 'Category 1',
            },
            {
              id: '2',
              name: 'Product B',
              quantity: 3,
              sprice: 500,
              category: 'Category 2',
            },
          ],
          payments: [{method: 'CASH', amount: 2500}],
        },
        {
          id: 'TRX-002',
          date: new Date(),
          cashierName: 'Jane Smith',
          totalAmount: 3000,
          items: [
            {
              id: '3',
              name: 'Product C',
              quantity: 1,
              sprice: 1500,
              category: 'Category 1',
            },
            {
              id: '4',
              name: 'Product D',
              quantity: 3,
              sprice: 500,
              category: 'Category 3',
            },
          ],
          payments: [{method: 'CARD', amount: 3000}],
        },
      ];

      const startTime = new Date();
      startTime.setHours(8, 0, 0, 0); // 8:00 AM

      const success = await PrinterService.printXReport(
        testTransactions,
        storeInfo,
        startTime,
        new Date(),
        staffData.name || 'Test Cashier',
      );

      if (success) {
        Alert.alert('Success', 'X Report printed successfully!');
      } else {
        Alert.alert('Error', 'Failed to print X Report');
      }
    } catch (error) {
      console.error('Error printing X Report:', error);
      Alert.alert('Error', 'Failed to print X Report: ' + error.message);
    }
  };

  const testZReport = async () => {
    if (!connectedDevice) {
      Alert.alert('Error', 'No printer connected');
      return;
    }

    try {
      // Same sample transactions for Z report
      const testTransactions = [
        {
          id: 'TRX-001',
          date: new Date(),
          cashierName: 'John Doe',
          totalAmount: 2500,
          items: [
            {
              id: '1',
              name: 'Product A',
              quantity: 2,
              sprice: 500,
              category: 'Category 1',
            },
            {
              id: '2',
              name: 'Product B',
              quantity: 3,
              sprice: 500,
              category: 'Category 2',
            },
          ],
          payments: [{method: 'CASH', amount: 2500}],
        },
        {
          id: 'TRX-002',
          date: new Date(),
          cashierName: 'Jane Smith',
          totalAmount: 3000,
          items: [
            {
              id: '3',
              name: 'Product C',
              quantity: 1,
              sprice: 1500,
              category: 'Category 1',
            },
            {
              id: '4',
              name: 'Product D',
              quantity: 3,
              sprice: 500,
              category: 'Category 3',
            },
          ],
          payments: [{method: 'CARD', amount: 3000}],
        },
        {
          id: 'TRX-003',
          date: new Date(),
          cashierName: staffData.name || 'Test Cashier',
          totalAmount: 1800,
          items: [
            {
              id: '5',
              name: 'Product E',
              quantity: 2,
              sprice: 400,
              category: 'Category 2',
            },
            {
              id: '6',
              name: 'Product F',
              quantity: 1,
              sprice: 1000,
              category: 'Category 3',
            },
          ],
          payments: [
            {method: 'CASH', amount: 1000},
            {method: 'CARD', amount: 800},
          ],
        },
      ];

      const startTime = new Date();
      startTime.setHours(8, 0, 0, 0); // 8:00 AM

      const success = await PrinterService.printZReport(
        testTransactions,
        storeInfo,
        startTime,
        new Date(),
        'All',
      );

      if (success) {
        Alert.alert('Success', 'Z Report printed successfully!');
      } else {
        Alert.alert('Error', 'Failed to print Z Report');
      }
    } catch (error) {
      console.error('Error printing Z Report:', error);
      Alert.alert('Error', 'Failed to print Z Report: ' + error.message);
    }
  };

  const renderDeviceItem = ({item}) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
      disabled={isConnecting}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
      </View>
      {isConnecting && connectedDevice?.address === item.address ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : connectedDevice?.address === item.address ? (
        <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
      ) : (
        <Ionicons
          name="chevron-forward"
          size={24}
          color={colors.charcoalGrey}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        centerText="Printer Settings"
        leftComponent={headerLeftComponent}
        screen="Cashier"
      />
      <ScrollView style={styles.scrollContainer}>
        <Card style={styles.section}>
          <Card.Title title="Store Information" />
          <Card.Content>
            <Text style={styles.label}>Store Name</Text>
            <TouchableOpacity
              style={styles.editableField}
              onPress={() => {
                Alert.prompt(
                  'Store Name',
                  'Enter store name',
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'OK',
                      onPress: text => {
                        if (text) {
                          setStoreInfo({...storeInfo, name: text});
                        }
                      },
                    },
                  ],
                  'plain-text',
                  storeInfo.name,
                );
              }}>
              <Text style={styles.fieldValue}>{storeInfo.name}</Text>
              <Ionicons
                name="create-outline"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

            <Text style={styles.label}>Store Address</Text>
            <TouchableOpacity
              style={styles.editableField}
              onPress={() => {
                Alert.prompt(
                  'Store Address',
                  'Enter store address',
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'OK',
                      onPress: text => {
                        if (text) {
                          setStoreInfo({...storeInfo, address: text});
                        }
                      },
                    },
                  ],
                  'plain-text',
                  storeInfo.address,
                );
              }}>
              <Text style={styles.fieldValue}>{storeInfo.address}</Text>
              <Ionicons
                name="create-outline"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>

            <Text style={styles.label}>Phone Number</Text>
            <TouchableOpacity
              style={styles.editableField}
              onPress={() => {
                Alert.prompt(
                  'Phone Number',
                  'Enter phone number',
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'OK',
                      onPress: text => {
                        if (text) {
                          setStoreInfo({...storeInfo, phone: text});
                        }
                      },
                    },
                  ],
                  'plain-text',
                  storeInfo.phone,
                );
              }}>
              <Text style={styles.fieldValue}>{storeInfo.phone}</Text>
              <Ionicons
                name="create-outline"
                size={20}
                color={colors.primary}
              />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Title title="Print Settings" />
          <Card.Content>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Auto-print receipts</Text>
              <Switch
                value={autoPrint}
                onValueChange={setAutoPrint}
                trackColor={{false: '#d1d1d1', true: colors.primary}}
                thumbColor={autoPrint ? colors.accent : '#f4f3f4'}
              />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Title title="Connected Printer" />
          <Card.Content>
            {connectedDevice ? (
              <View style={styles.connectedDevice}>
                <View>
                  <Text style={styles.connectedDeviceName}>
                    {connectedDevice.name}
                  </Text>
                  <Text style={styles.connectedDeviceAddress}>
                    {connectedDevice.address}
                  </Text>
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.accent}
                />
              </View>
            ) : (
              <Text style={styles.noDeviceText}>No printer connected</Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Title title="Available Printers" />
          <Card.Content>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={startScan}
              disabled={isScanning}>
              <Text style={styles.scanButtonText}>
                {isScanning ? 'Scanning...' : 'Scan for Printers'}
              </Text>
              {isScanning && (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.scanningIndicator}
                />
              )}
            </TouchableOpacity>

            {devices.length > 0 ? (
              <FlatList
                data={devices}
                renderItem={renderDeviceItem}
                keyExtractor={item => item.address}
                ItemSeparatorComponent={() => <Divider />}
                scrollEnabled={false}
                style={styles.deviceList}
              />
            ) : (
              <Text style={styles.emptyListText}>
                {isScanning
                  ? 'Searching for devices...'
                  : 'No devices found. Tap "Scan for Printers" to search.'}
              </Text>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.section}>
          <Card.Title title="Test Print" />
          <Card.Content>
            <View style={styles.testButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.testButton,
                  !connectedDevice && styles.disabledButton,
                ]}
                onPress={testPrint}
                disabled={!connectedDevice}>
                <Ionicons name="receipt-outline" size={20} color="#fff" />
                <Text style={styles.testButtonText}>Test Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.testButton,
                  !connectedDevice && styles.disabledButton,
                ]}
                onPress={testXReport}
                disabled={!connectedDevice}>
                <Ionicons name="document-text-outline" size={20} color="#fff" />
                <Text style={styles.testButtonText}>Test X Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.testButton,
                  !connectedDevice && styles.disabledButton,
                ]}
                onPress={testZReport}
                disabled={!connectedDevice}>
                <Ionicons name="document-outline" size={20} color="#fff" />
                <Text style={styles.testButtonText}>Test Z Report</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    elevation: 2,
  },
  scanButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  scanningIndicator: {
    marginLeft: 10,
  },
  deviceList: {
    marginTop: 8,
  },
  deviceItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 14,
    color: colors.charcoalGrey,
  },
  emptyListText: {
    textAlign: 'center',
    color: colors.charcoalGrey,
    marginTop: 16,
    marginBottom: 8,
  },
  connectedDevice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  connectedDeviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 4,
  },
  connectedDeviceAddress: {
    fontSize: 14,
    color: colors.charcoalGrey,
  },
  noDeviceText: {
    textAlign: 'center',
    color: colors.charcoalGrey,
    padding: 16,
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.black,
  },
  testButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  testButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '31%',
    flexDirection: 'column',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: colors.charcoalGrey,
    opacity: 0.5,
  },
  label: {
    fontSize: 14,
    color: colors.charcoalGrey,
    marginTop: 8,
  },
  editableField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.black,
    flex: 1,
  },
});

export default PrinterSettingsScreen;
