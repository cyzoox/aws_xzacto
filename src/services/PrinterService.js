import RNBluetoothClassic from 'react-native-bluetooth-classic';
import {PermissionsAndroid, Platform} from 'react-native';
import { BLEPrinter, NetPrinter, USBPrinter } from 'react-native-thermal-receipt-printer';



// Printer connection instance
let printerConnection = null;

// Helper function to check if BLEPrinter is available
const isBLEPrinterAvailable = () => {
  return (
    typeof BLEPrinter !== 'undefined' &&
    BLEPrinter !== null &&
    typeof BLEPrinter.printText === 'function'
  );
};

// Helper functions to check if other printer types are available
const isNetPrinterAvailable = () => {
  return (
    typeof NetPrinter !== 'undefined' &&
    NetPrinter !== null &&
    typeof NetPrinter.printText === 'function'
  );
};

const isUSBPrinterAvailable = () => {
  return (
    typeof USBPrinter !== 'undefined' &&
    USBPrinter !== null &&
    typeof USBPrinter.printText === 'function'
  );
};

// Utility function for safe printer operations in reports
const safePrinterOperation = async (operation) => {
  try {
    if (!printerConnection || !printerConnection.blePrinterAvailable) {
      throw new Error('BLE printer is not available');
    }
    
    // Use BLEPrinter for all printing operations
    console.log('Executing BLE printing operation...');
    await operation();
    console.log('BLE printing completed successfully');
    return true;
  } catch (error) {
    console.error('Printer operation failed:', error);
    throw error;
  }
};

// Request Bluetooth permissions on Android
export const requestBluetoothPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      ]);

      if (
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        return true;
      } else {
        console.log('Bluetooth permission denied');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true; // iOS doesn't need this permission request
};

// Flag to track if discovery is in progress
let isDiscoveryInProgress = false;

// Scan for available Bluetooth devices
export const scanBluetoothDevices = async (options = {}) => {
  // Default scan time is 12 seconds, longer scan for better results
  const scanTime = options.scanTime || 12000;
  
  try {
    // Handle concurrent scanning attempts
    if (isDiscoveryInProgress) {
      console.log('Discovery already in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait briefly
      throw new Error('Scanning already in progress. Please wait.');
    }
    
    isDiscoveryInProgress = true;
    
    // First ensure we have Bluetooth permissions
    await requestBluetoothPermission();
    
    console.log('Starting device scan...');
    
    // Get paired devices from RNBluetoothClassic first
    let bondedDevices = [];
    try {
      // Enable Bluetooth if it's not enabled
      const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!isEnabled) {
        await RNBluetoothClassic.requestBluetoothEnabled();
      }
      
      bondedDevices = await RNBluetoothClassic.getBondedDevices();
      console.log('Found paired devices:', bondedDevices.length);
    } catch (error) {
      console.log('Error getting paired devices:', error);
      // Continue even if this fails
    }
    
    // Now try using the BLEPrinter library for scanning
    try {
      console.log('Initializing BLE printer scanning...');
      await BLEPrinter.init();
      
      // Try to scan for Bluetooth LE devices
      console.log(`Scanning for BLE devices for ${scanTime/1000} seconds...`);
      
      // For BLE scanning we rely on the BluetoothManager
      const bleDevices = await new Promise((resolve) => {
        try {
          // Get devices that are available now
          BLEPrinter.getDeviceList().then(devices => {
            console.log('Initial BLE devices:', devices?.length || 0);
            
            // Schedule resolution after scanTime
            setTimeout(async () => {
              try {
                const finalDevices = await BLEPrinter.getDeviceList();
                console.log('Final BLE scan results:', finalDevices?.length || 0);
                resolve(finalDevices || []);
              } catch (e) {
                console.log('Error getting final device list:', e);
                resolve([]);
              }
            }, scanTime);
          }).catch(error => {
            console.log('Error getting initial device list:', error);
            // Still wait for the scan time
            setTimeout(() => resolve([]), scanTime);
          });
        } catch (error) {
          console.log('Error in BLE scan setup:', error);
          setTimeout(() => resolve([]), scanTime);
        }
      });
      
      // Combine the results, formatting BLE devices to match the format expected
      const combinedDevices = [...bondedDevices];
      
      // Add BLE devices if they exist and aren't already in the list
      if (bleDevices && Array.isArray(bleDevices)) {
        const existingIds = new Set(bondedDevices.map(d => d.id || d.address));
        
        bleDevices.forEach(bleDevice => {
          // Format BLE device to match the expected format
          const formattedDevice = {
            id: bleDevice.address,
            address: bleDevice.address,
            name: bleDevice.name || `Printer ${bleDevice.address}`,
            // Add additional properties BLEPrinter might need
            device_name: bleDevice.name,
            isBLE: true
          };
          
          // Only add if not already in the list
          if (!existingIds.has(formattedDevice.id)) {
            combinedDevices.push(formattedDevice);
          }
        });
      }
      
      console.log(`Total devices found: ${combinedDevices.length}`);
      return combinedDevices;
      
    } catch (bleError) {
      console.error('Error in BLE scanning:', bleError);
      // If BLE scanning fails, return whatever classic devices we found
      return bondedDevices;
    }
  } catch (error) {
    console.error('Error in Bluetooth scanning:', error);
    throw error;
  } finally {
    // Reset the scanning flag after a delay to prevent rapid rescanning
    setTimeout(() => {
      isDiscoveryInProgress = false;
    }, 2000);
  }
};

// Helper function to initialize and reconnect BLEPrinter
export const reconnectBLEPrinter = async (deviceAddress) => {
  if (!deviceAddress && printerConnection) {
    deviceAddress = printerConnection.address || printerConnection.id;
  }
  
  if (!deviceAddress) {
    console.error('No device address available for BLEPrinter reconnection');
    return false;
  }
  
  try {
    console.log('Attempting to reconnect BLEPrinter with address:', deviceAddress);
    
    // Clear any existing connections first
    try {
      await BLEPrinter.closeConn();
      console.log('Closed existing BLEPrinter connections');
    } catch (closeError) {
      // Ignore errors when closing non-existent connections
      console.log('No existing connections to close or error:', closeError);
    }
    
    // Make sure BLEPrinter is initialized
    await BLEPrinter.init();
    console.log('BLEPrinter initialized');
    
    // Try to connect with a timeout
    const connectPromise = BLEPrinter.connectPrinter(deviceAddress);
    const connectTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('BLEPrinter connection timeout')), 5000);
    });
    
    await Promise.race([connectPromise, connectTimeout]);
    
    console.log('BLEPrinter successfully reconnected');
    
    // Update the printer connection status
    if (printerConnection) {
      printerConnection.blePrinterAvailable = true;
      printerConnection.thermalPrinterFailed = false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to reconnect BLEPrinter:', error);
    
    // Update the printer connection status
    if (printerConnection) {
      printerConnection.blePrinterAvailable = false;
      printerConnection.thermalPrinterFailed = true;
    }
    
    return false;
  }
};

// Connect to a Bluetooth device by address
export const connectBluetoothDevice = async (deviceOrAddress) => {
  try {
    // Check if we received a device object or just an address string
    let deviceAddress;
    let deviceObj;
    
    if (typeof deviceOrAddress === 'string') {
      // If just address was provided
      deviceAddress = deviceOrAddress;
      deviceObj = { address: deviceAddress, id: deviceAddress };
    } else if (deviceOrAddress && (deviceOrAddress.id || deviceOrAddress.address)) {
      // If device object was provided
      deviceAddress = deviceOrAddress.id || deviceOrAddress.address;
      deviceObj = deviceOrAddress;
    } else {
      throw new Error('Invalid device information provided');
    }
    
    console.log('Connecting to device address:', deviceAddress);
    
    // Connect with RNBluetoothClassic for general device connection
    const connectedDevice = await RNBluetoothClassic.connectToDevice(deviceAddress);
    console.log('Connected to device:', connectedDevice?.name || deviceAddress);
    
    // Connect with the thermal printer library
    try {
      // Check if BLEPrinter API is available first
      if (typeof BLEPrinter !== 'undefined' && BLEPrinter !== null) {
        // Try to reconnect using our helper function
        const bleConnected = await reconnectBLEPrinter(deviceAddress);
        
        if (bleConnected) {
          console.log('Successfully connected printer with BLEPrinter');
          deviceObj.blePrinterAvailable = true;
          deviceObj.thermalPrinterFailed = false;
        } else {
          // If reconnection failed, try the old way as a fallback
          console.log('Reconnection failed, trying direct connection...');
          await BLEPrinter.init();
          await BLEPrinter.connectPrinter(deviceAddress);
          console.log('Direct BLEPrinter connection successful');
          deviceObj.blePrinterAvailable = true;
          deviceObj.thermalPrinterFailed = false;
        }
      } else {
        throw new Error('BLEPrinter API not available');
      }
    } catch (bleError) {
      console.log('Error connecting with thermal printer library:', bleError);
      deviceObj.blePrinterAvailable = false;
      deviceObj.thermalPrinterFailed = true;
    }
    
    // Store the connection information
    printerConnection = deviceObj;
    
    return connectedDevice;
  } catch (error) {
    console.error('Error connecting to device:', error);
    throw error;
  }
};

// Check if a device is connected
export const isBluetoothDeviceConnected = async () => {
  try {
    const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();

    // If Bluetooth is not enabled, then obviously no device is connected
    if (!isEnabled) {
      return false;
    }

    // Get a list of bonded devices
    const bondedDevices = await RNBluetoothClassic.getBondedDevices();

    // If no printer is connected from our app's perspective, try to get one from bonded devices
    if (!printerConnection) {
      // No printer is actively connected from our app
      return false;
    }

    // Check if our stored connected printer is still bonded
    const isStillBonded = bondedDevices.some(
      device => device.address === printerConnection.address,
    );

    // If still bonded, also check BLEPrinter status
    if (isStillBonded) {
      try {
        // Try to initialize BLEPrinter if needed
        if (typeof BLEPrinter !== 'undefined' && BLEPrinter !== null) {
          await BLEPrinter.init();
          
          // Get the device list to verify printer is there
          const devices = await BLEPrinter.getDeviceList();
          
          // Check if our device is in the list
          const bleDeviceFound = devices.some(
            device => device.address === printerConnection.address ||
                     device.id === printerConnection.address
          );
          
          if (bleDeviceFound) {
            // Update our connection status
            printerConnection.blePrinterAvailable = true;
          } else {
            console.log('Device not found in BLEPrinter device list');
            // Don't set blePrinterAvailable to false yet, will try to connect first
          }
        }
      } catch (bleError) {
        console.log('Error checking BLEPrinter status:', bleError);
        // Don't change blePrinterAvailable status yet
      }
    }

    return isStillBonded ? printerConnection.address : false;
  } catch (error) {
    console.error('Error checking Bluetooth connection:', error);
    return false;
  }
};

// Print a receipt for a transaction
export const printReceipt = async (transaction, storeInfo) => {
  try {
    console.log('Preparing receipt...');
    
    // Validate the connection
    if (!printerConnection) {
      throw new Error('Printer not connected');
    }

    // Validate receipt data
    if (!transaction) {
      throw new Error('No transaction data provided');
    }
    
    // Try to reconnect BLEPrinter if needed before printing
    if (!printerConnection.blePrinterAvailable) {
      console.log('BLEPrinter not available, attempting reconnection...');
      await reconnectBLEPrinter();
    }
    
    // Extract data
    const cartItems = transaction.items || [];
    const payments = transaction.payments || [];
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const returnAmount = transaction.change_amount || 0;
    
    // Format date for receipt
    const txnDate = transaction.transaction_date ? new Date(transaction.transaction_date) : new Date();
    const formattedDate = txnDate.toLocaleDateString();
    const formattedTime = txnDate.toLocaleTimeString();
    
    // Format the receipt with HTML-like tags for BLEPrinter
    let formattedReceipt = '';
    
    // Create formatted receipt for BLEPrinter
    // BLEPrinter uses HTML-like tags for formatting: <C> for center, <B> for bold
    let receiptContent = '';
    
    // Header
    receiptContent += `<C><B>${storeInfo?.name || 'Store Receipt'}</B></C>\n`;
    receiptContent += `<C>${storeInfo?.address || ''}</C>\n`;
    if (storeInfo?.phone) {
      receiptContent += `<C>Tel: ${storeInfo.phone}</C>\n`;
    }
    receiptContent += '<C>--------------------------------</C>\n';
    receiptContent += '<C><B>SALES INVOICE</B></C>\n';
    receiptContent += '<C>--------------------------------</C>\n';
    
    // Transaction details
    receiptContent += `Date: ${formattedDate || 'N/A'}\n`;
    receiptContent += `Time: ${formattedTime || 'N/A'}\n`;
    receiptContent += `Invoice: ${transaction.transaction_id || 'N/A'}\n`;
    receiptContent += `Cashier: ${transaction.cashier_name || 'Staff'}\n`;
    receiptContent += '--------------------------------\n';
    
    // Item headers
    receiptContent += '<B>Item                          Qty    Amount</B>\n';
    receiptContent += '--------------------------------\n';
    
    // Items
    for (const item of cartItems) {
      // Handle item with variants/addons
      let itemName = item?.name || 'Item';
      if (item?.parsedVariantData?.name) {
        itemName += ` (${item.parsedVariantData.name})`;
      }
      
      const quantity = item?.quantity || 1;
      const price = item?.price || 0;
      const amount = (price * quantity).toFixed(2);
      
      // Format name to fit within column width
      const truncatedName = itemName.length > 26 
        ? itemName.substring(0, 23) + '...'
        : itemName.padEnd(26);
      
      const qtyStr = quantity.toString().padStart(5);
      const amtStr = amount.padStart(9);
      receiptContent += `${truncatedName}${qtyStr}₱${amtStr}\n`;
      
      // If there's an addon, print it as a separate line with indent
      if (item?.parsedAddonData?.name) {
        receiptContent += `  + ${item.parsedAddonData.name}\n`;
      }
    }
    
    // Totals
    receiptContent += '--------------------------------\n';
    receiptContent += `SUBTOTAL:${' '.repeat(23)}₱${subtotal.toFixed(2)}\n`;
    
    // Discount
    if (transaction.discount && transaction.discount > 0) {
      const discountAmount = subtotal * (transaction.discount / 100);
      const discountStr = transaction.discount.toString();
      const spacesCount = Math.max(1, 15 - discountStr.length);
      receiptContent += `DISCOUNT (${transaction.discount}%):${' '.repeat(spacesCount)}₱${discountAmount.toFixed(2)}\n`;
    }

    // Total
    const totalAmount = (typeof transaction.totalAmount === 'number') ? transaction.totalAmount : subtotal;
    receiptContent += `<B>TOTAL:${' '.repeat(27)}₱${totalAmount.toFixed(2)}</B>\n`;

    // Payment details
    if (payments && Array.isArray(payments) && payments.length > 0) {
      for (const payment of payments) {
        if (payment) {
          const method = payment.method || 'CASH';
          const amount = typeof payment.amount === 'number' ? payment.amount : 0;
          receiptContent += `${method}:${' '.repeat(25)}₱${amount.toFixed(2)}\n`;
        }
      }
    }

    // Footer
    receiptContent += '--------------------------------\n';
    receiptContent += '<C>Thank you for your purchase!</C>\n';
    receiptContent += '<C>Please come again</C>\n\n';
    
    try {
      // Check if BLEPrinter is available
      if (!printerConnection.blePrinterAvailable) {
        throw new Error('BLEPrinter is not available');
      }
      
      console.log('Printing with BLEPrinter...');
      await BLEPrinter.printText(receiptContent);
      await BLEPrinter.printBill("\n\n\n"); // Add extra space at the end for cutting
      console.log('Successfully printed receipt with BLEPrinter');
      return true;
    } catch (error) {
      console.error('Error sending to BLEPrinter:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error preparing receipt:', error);
    return false;
  }
};

// Print X Report (Day Summary)
export const printXReport = async (
  transactions,
  storeInfo,
  startTime,
  endTime,
  cashierName,
) => {
  try {
    if (!printerConnection) {
      throw new Error('Printer not connected');
    }
    
    // Validate transactions
    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions to report');
    }
    
    console.log('Printing X Report...');
    
    // Try to reconnect BLEPrinter if needed before printing
    if (!printerConnection.blePrinterAvailable) {
      console.log('BLEPrinter not available for X Report, attempting reconnection...');
      await reconnectBLEPrinter();
    }
    
    // Generate report data for either printer method
    const startDate = new Date(startTime);
    const endDate = new Date(endTime || Date.now());
    
    // Calculate sales summary (used by both printer methods)
    const totalSales = transactions.reduce(
      (sum, trx) => sum + (trx.totalAmount || 0),
      0,
    );
    const totalItems = transactions.reduce(
      (sum, trx) =>
        sum +
        (trx.items
          ? trx.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0)
          : 0),
      0,
    );
    const totalTransactions = transactions.length;
    
    // Process payment methods (used by both printer methods)
    const paymentMethods = {};
    transactions.forEach(trx => {
      if (trx.payments && Array.isArray(trx.payments)) {
        trx.payments.forEach(payment => {
          const method = payment.method || 'CASH';
          paymentMethods[method] = (paymentMethods[method] || 0) + payment.amount;
        });
      }
    });
    
    // Format receipt for BLEPrinter with HTML-like tags for formatting
    let formattedReport = '';
    
    // Header section with formatting tags
    formattedReport += `<C><B>${storeInfo.name}</B></C>\n`;
    formattedReport += `<C>${storeInfo.address || ''}</C>\n`;
    if (storeInfo.phone) {
      formattedReport += `<C>Tel: ${storeInfo.phone}</C>\n`;
    }
    formattedReport += '<C>--------------------------------</C>\n';
    formattedReport += '<C><B>X REPORT (SHIFT SUMMARY)</B></C>\n';
    formattedReport += '<C>--------------------------------</C>\n';
    formattedReport += `Report Time: ${new Date().toLocaleString()}\n`;
    formattedReport += `Period: ${startDate.toLocaleString()} - ${endDate.toLocaleString()}\n`;
    formattedReport += `Cashier: ${cashierName || 'All'}\n`;
    formattedReport += '--------------------------------\n';
    
    // Sales summary with bold headers
    formattedReport += '<B>SALES SUMMARY</B>\n';
    formattedReport += `TOTAL SALES:${' '.repeat(20)}₱${totalSales.toFixed(2)}\n`;
    formattedReport += `TRANSACTIONS:${' '.repeat(19)}${totalTransactions}\n`;
    formattedReport += `ITEMS SOLD:${' '.repeat(21)}${totalItems}\n`;
    formattedReport += '--------------------------------\n';
    
    // Payment methods
    formattedReport += '<B>PAYMENT METHODS</B>\n';
    Object.entries(paymentMethods).forEach(([method, amount]) => {
      const methodLabel = method + ':';
      const spaces = 30 - methodLabel.length - amount.toFixed(2).length - 1; // -1 for the ₱ symbol
      formattedReport += `${methodLabel}${' '.repeat(spaces)}₱${amount.toFixed(2)}\n`;
    });
    
    // Footer
    formattedReport += '--------------------------------\n';
    formattedReport += '<C><B>*** X REPORT ***</B></C>\n';
    formattedReport += '<C>This is not a Z Report</C>\n';
    formattedReport += '<C>Registers are still active</C>\n\n';
    
    // Use BLEPrinter to print the formatted report
    console.log('Printing X Report with BLEPrinter...');
    
    // Check if BLEPrinter is available
    if (!printerConnection.blePrinterAvailable) {
      throw new Error('BLEPrinter is not available');
    }
      
    await BLEPrinter.printText(formattedReport);
    await BLEPrinter.printBill('\n\n\n'); // Add extra space for cutting
    console.log('Successfully printed X Report');
    return true;
  } catch (error) {
    console.error('Error printing X report:', error);
    return false;
  }
};
// Print Z Report (End of Day/Final Report)
export const printZReport = async (
  transactions,
  storeInfo,
  startTime,
  endTime,
  cashierName,
) => {
  try {
    if (!printerConnection) {
      throw new Error('Printer not connected');
    }
    
    // Validate transactions
    if (!transactions || transactions.length === 0) {
      throw new Error('No transactions to report');
    }
    
    console.log('Printing Z Report...');
    
    // Try to reconnect BLEPrinter if needed before printing
    if (!printerConnection.blePrinterAvailable) {
      console.log('BLEPrinter not available for Z Report, attempting reconnection...');
      await reconnectBLEPrinter();
    }
    
    // Generate report data for either printer method
    const startDate = new Date(startTime);
    const endDate = new Date(endTime || Date.now());
    
    // Calculate sales summary (used by both printer methods)
    const totalSales = transactions.reduce(
      (sum, trx) => sum + (trx.totalAmount || 0),
      0,
    );
    const totalItems = transactions.reduce(
      (sum, trx) =>
        sum +
        (trx.items
          ? trx.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0)
          : 0),
      0,
    );
    const totalTransactions = transactions.length;
    
    // Process payment methods (used by both printer methods)
    const paymentMethodsMap = {};
    transactions.forEach(trx => {
      if (trx.payments && Array.isArray(trx.payments)) {
        trx.payments.forEach(payment => {
          const method = payment.method || 'CASH';
          paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + payment.amount;
        });
      } else {
        // Default to CASH if no payment methods specified
        const method = 'CASH';
        paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + (trx.totalAmount || 0);
      }
    });
    
    // Format receipt for BLEPrinter with HTML-like tags for formatting
    let formattedReport = '';
    
    // Header section with formatting tags
    formattedReport += `<C><B>${storeInfo.name}</B></C>\n`;
    formattedReport += `<C>${storeInfo.address || ''}</C>\n`;
    if (storeInfo.phone) {
      formattedReport += `<C>Tel: ${storeInfo.phone}</C>\n`;
    }
    formattedReport += '<C>--------------------------------</C>\n';
    formattedReport += '<C><B>Z REPORT (END OF DAY SUMMARY)</B></C>\n';
    formattedReport += '<C>--------------------------------</C>\n';
    formattedReport += `Report Time: ${new Date().toLocaleString()}\n`;
    formattedReport += `Period: ${startDate.toLocaleString()} - ${endDate.toLocaleString()}\n`;
    formattedReport += `Cashier: ${cashierName || 'All'}\n`;
    formattedReport += '--------------------------------\n';
    
    // Sales summary with bold headers
    formattedReport += '<B>SALES SUMMARY</B>\n';
    formattedReport += `TOTAL SALES:${' '.repeat(20)}₱${totalSales.toFixed(2)}\n`;
    formattedReport += `TRANSACTIONS:${' '.repeat(19)}${totalTransactions}\n`;
    formattedReport += `ITEMS SOLD:${' '.repeat(21)}${totalItems}\n`;
    formattedReport += '--------------------------------\n';
    
    // Payment methods
    formattedReport += '<B>PAYMENT METHODS</B>\n';
    Object.entries(paymentMethodsMap).forEach(([method, amount]) => {
      const methodLabel = method + ':';
      const spaces = 30 - methodLabel.length - amount.toFixed(2).length - 1; // -1 for the ₱ symbol
      formattedReport += `${methodLabel}${' '.repeat(spaces)}₱${amount.toFixed(2)}\n`;
    });
    
    // Footer
    formattedReport += '--------------------------------\n';
    formattedReport += '<C><B>*** Z REPORT ***</B></C>\n';
    formattedReport += '<C>This is the final summary</C>\n';
    formattedReport += '<C>Register data has been reset</C>\n\n';
    
    try {
      // Check if BLEPrinter is available
      if (!printerConnection.blePrinterAvailable) {
        throw new Error('BLEPrinter is not available');
      }
      
      console.log('Printing Z Report with BLEPrinter...');
      await BLEPrinter.printText(formattedReport);
      await BLEPrinter.printBill('\n\n\n'); // Add extra space for cutting
      console.log('Successfully printed Z Report');
      return true;
    } catch (error) {
      console.error('Error printing Z Report with BLEPrinter:', error);
      throw error;
    }
  } catch (error) {
    console.error('Print error:', error);
    return false;
  }
};

export default {
  requestBluetoothPermission,
  scanBluetoothDevices,
  connectBluetoothDevice,
  reconnectBLEPrinter,
  isBluetoothDeviceConnected,
  printReceipt,
  printZReport,
  printXReport,
};
