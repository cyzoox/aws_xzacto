import RNBluetoothClassic from 'react-native-bluetooth-classic';
import {PermissionsAndroid, Platform} from 'react-native';

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

// Scan for available Bluetooth devices
export const scanBluetoothDevices = () => {
  return new Promise((resolve, reject) => {
    BluetoothManager.scanDevices()
      .then(s => {
        const devices = JSON.parse(s);
        resolve(devices.paired);
      })
      .catch(err => {
        reject(err);
      });
  });
};

// Connect to a Bluetooth device by address
export const connectBluetoothDevice = address => {
  return BluetoothManager.connect(address);
};

// Check if a device is connected
export const isBluetoothDeviceConnected = () => {
  return BluetoothManager.isBluetoothEnabled().then(() =>
    BluetoothManager.getConnectedDeviceAddress(),
  );
};

// Print a receipt for a transaction
export const printReceipt = async (
  transaction,
  cartItems,
  storeInfo,
  payments = [],
  returnAmount = 0,
) => {
  try {
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER,
    );
    await BluetoothEscposPrinter.printText(`${storeInfo.name}\n`, {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1,
    });

    await BluetoothEscposPrinter.printText(`${storeInfo.address || ''}\n`, {});
    await BluetoothEscposPrinter.printText(
      `Tel: ${storeInfo.phone || ''}\n`,
      {},
    );

    // Invoice header
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );
    await BluetoothEscposPrinter.printText('SALES INVOICE\n', {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1,
    });

    // Transaction details
    const date = new Date(transaction.date || Date.now());
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    await BluetoothEscposPrinter.printText(`Date: ${formattedDate}\n`, {});
    await BluetoothEscposPrinter.printText(
      `Invoice #: ${transaction.id || ''}\n`,
      {},
    );
    await BluetoothEscposPrinter.printText(
      `Cashier: ${transaction.cashierName || ''}\n`,
      {},
    );

    // Items header
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.LEFT,
    );

    await BluetoothEscposPrinter.printColumn(
      [30, 6, 12],
      [
        BluetoothEscposPrinter.ALIGN.LEFT,
        BluetoothEscposPrinter.ALIGN.RIGHT,
        BluetoothEscposPrinter.ALIGN.RIGHT,
      ],
      ['Item', 'Qty', 'Amount'],
      {},
    );

    // Items
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );

    for (const item of cartItems) {
      // Handle item with variants/addons by adding them to the item name
      let itemName = item.name;

      // Add variant information if present
      if (item.parsedVariantData) {
        itemName += ` (${item.parsedVariantData.name})`;
      }

      // Print item name
      await BluetoothEscposPrinter.printColumn(
        [30, 6, 12],
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        [
          itemName.length > 30 ? itemName.substring(0, 27) + '...' : itemName,
          item.quantity.toString(),
          (item.sprice * item.quantity).toFixed(2),
        ],
        {},
      );

      // If there's an addon, print it as a separate line with indent
      if (item.parsedAddonData) {
        await BluetoothEscposPrinter.printColumn(
          [30, 6, 12],
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [`  + ${item.parsedAddonData.name}`, '', ''],
          {},
        );
      }
    }

    // Totals
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );

    // Subtotal
    const subtotal = cartItems.reduce(
      (total, item) => total + item.sprice * item.quantity,
      0,
    );
    await BluetoothEscposPrinter.printColumn(
      [24, 24],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['SUBTOTAL:', `₱${subtotal.toFixed(2)}`],
      {},
    );

    // Discount
    if (transaction.discount && transaction.discount > 0) {
      const discountAmount = subtotal * (transaction.discount / 100);
      await BluetoothEscposPrinter.printColumn(
        [24, 24],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [
          `DISCOUNT (${transaction.discount}%):`,
          `-₱${discountAmount.toFixed(2)}`,
        ],
        {},
      );
    }

    // Total
    const totalAmount = transaction.totalAmount || subtotal;
    await BluetoothEscposPrinter.printColumn(
      [24, 24],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['TOTAL:', `₱${totalAmount.toFixed(2)}`],
      {},
    );

    // Payment details
    if (payments && payments.length > 0) {
      for (const payment of payments) {
        await BluetoothEscposPrinter.printColumn(
          [24, 24],
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          [`${payment.method || 'CASH'}:`, `₱${payment.amount.toFixed(2)}`],
          {},
        );
      }

      // Change/return amount
      if (returnAmount > 0) {
        await BluetoothEscposPrinter.printColumn(
          [24, 24],
          [
            BluetoothEscposPrinter.ALIGN.LEFT,
            BluetoothEscposPrinter.ALIGN.RIGHT,
          ],
          ['CHANGE:', `₱${returnAmount.toFixed(2)}`],
          {},
        );
      }
    }

    // Footer
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER,
    );
    await BluetoothEscposPrinter.printText(
      'Thank you for your purchase!\n',
      {},
    );
    await BluetoothEscposPrinter.printText('Please come again\n\n', {});

    // Cut paper
    await BluetoothEscposPrinter.printText('\n\n\n\n', {});

    return true;
  } catch (error) {
    console.error('Print error:', error);
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
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER,
    );
    await BluetoothEscposPrinter.printText(`${storeInfo.name}\n`, {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1,
    });

    await BluetoothEscposPrinter.printText(`${storeInfo.address || ''}\n`, {});
    await BluetoothEscposPrinter.printText(
      `Tel: ${storeInfo.phone || ''}\n`,
      {},
    );

    // Report header
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );
    await BluetoothEscposPrinter.printText('X REPORT (SHIFT SUMMARY)\n', {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1,
    });

    // Time period
    const startDate = new Date(startTime);
    const endDate = new Date(endTime || Date.now());

    await BluetoothEscposPrinter.printText(
      `Report Time: ${new Date().toLocaleString()}\n`,
      {},
    );
    await BluetoothEscposPrinter.printText(
      `Period: ${startDate.toLocaleString()} - ${endDate.toLocaleString()}\n`,
      {},
    );
    await BluetoothEscposPrinter.printText(
      `Cashier: ${cashierName || 'All'}\n`,
      {},
    );

    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );

    // Sales summary
    const totalSales = transactions.reduce(
      (total, t) => total + (t.totalAmount || 0),
      0,
    );
    const totalItems = transactions.reduce((total, t) => {
      // Assume each transaction has an items array with quantities
      return (
        total + (t.items?.reduce((sum, item) => sum + item.quantity, 0) || 0)
      );
    }, 0);

    const countTransactions = transactions.length;

    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.LEFT,
    );

    await BluetoothEscposPrinter.printColumn(
      [24, 24],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['TOTAL SALES:', `₱${totalSales.toFixed(2)}`],
      {},
    );

    await BluetoothEscposPrinter.printColumn(
      [24, 24],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['TRANSACTIONS:', countTransactions.toString()],
      {},
    );

    await BluetoothEscposPrinter.printColumn(
      [24, 24],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['ITEMS SOLD:', totalItems.toString()],
      {},
    );

    // Payment Methods Summary
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );
    await BluetoothEscposPrinter.printText('PAYMENT METHODS\n', {});

    // Calculate by payment method
    const paymentMethods = {};
    transactions.forEach(transaction => {
      if (transaction.payments && transaction.payments.length > 0) {
        transaction.payments.forEach(payment => {
          const method = payment.method || 'CASH';
          if (!paymentMethods[method]) {
            paymentMethods[method] = 0;
          }
          paymentMethods[method] += payment.amount || 0;
        });
      } else {
        // Default to CASH if no payment methods specified
        if (!paymentMethods.CASH) {
          paymentMethods.CASH = 0;
        }
        paymentMethods.CASH += transaction.totalAmount || 0;
      }
    });

    // Print payment methods
    for (const [method, amount] of Object.entries(paymentMethods)) {
      await BluetoothEscposPrinter.printColumn(
        [24, 24],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [method + ':', `₱${amount.toFixed(2)}`],
        {},
      );
    }

    // Footer
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER,
    );
    await BluetoothEscposPrinter.printText('*** X Report ***\n', {});
    await BluetoothEscposPrinter.printText('This is not a Z Report\n', {});
    await BluetoothEscposPrinter.printText(
      'Registers are still active\n\n',
      {},
    );

    // Cut paper
    await BluetoothEscposPrinter.printText('\n\n\n\n', {});

    return true;
  } catch (error) {
    console.error('Print error:', error);
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
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER,
    );
    await BluetoothEscposPrinter.printText(`${storeInfo.name}\n`, {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1,
    });

    await BluetoothEscposPrinter.printText(`${storeInfo.address || ''}\n`, {});
    await BluetoothEscposPrinter.printText(
      `Tel: ${storeInfo.phone || ''}\n`,
      {},
    );

    // Report header
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );
    await BluetoothEscposPrinter.printText('Z REPORT (END OF DAY)\n', {
      encoding: 'GBK',
      codepage: 0,
      widthtimes: 1,
      heigthtimes: 1,
      fonttype: 1,
    });

    // Time period
    const startDate = new Date(startTime);
    const endDate = new Date(endTime || Date.now());

    await BluetoothEscposPrinter.printText(
      `Report Time: ${new Date().toLocaleString()}\n`,
      {},
    );
    await BluetoothEscposPrinter.printText(
      `Period: ${startDate.toLocaleString()} - ${endDate.toLocaleString()}\n`,
      {},
    );
    await BluetoothEscposPrinter.printText(
      `Cashier: ${cashierName || 'All'}\n`,
      {},
    );

    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );

    // Sales summary
    const totalSales = transactions.reduce(
      (total, t) => total + (t.totalAmount || 0),
      0,
    );
    const totalItems = transactions.reduce((total, t) => {
      // Assume each transaction has an items array with quantities
      return (
        total + (t.items?.reduce((sum, item) => sum + item.quantity, 0) || 0)
      );
    }, 0);

    const countTransactions = transactions.length;

    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.LEFT,
    );

    await BluetoothEscposPrinter.printColumn(
      [24, 24],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['TOTAL SALES:', `₱${totalSales.toFixed(2)}`],
      {},
    );

    await BluetoothEscposPrinter.printColumn(
      [24, 24],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['TRANSACTIONS:', countTransactions.toString()],
      {},
    );

    await BluetoothEscposPrinter.printColumn(
      [24, 24],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['ITEMS SOLD:', totalItems.toString()],
      {},
    );

    // Category summary
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );
    await BluetoothEscposPrinter.printText('CATEGORY SUMMARY\n', {});

    // Calculate by category
    const categories = {};
    transactions.forEach(transaction => {
      if (transaction.items && transaction.items.length > 0) {
        transaction.items.forEach(item => {
          if (!item.category) {
            return;
          }

          if (!categories[item.category]) {
            categories[item.category] = {
              count: 0,
              amount: 0,
            };
          }
          categories[item.category].count += item.quantity || 1;
          categories[item.category].amount +=
            item.sprice * (item.quantity || 1);
        });
      }
    });

    // Print categories
    for (const [category, data] of Object.entries(categories)) {
      await BluetoothEscposPrinter.printColumn(
        [24, 8, 16],
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        [
          category.substring(0, 22) + ':',
          data.count.toString(),
          `₱${data.amount.toFixed(2)}`,
        ],
        {},
      );
    }

    // Payment Methods Summary
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );
    await BluetoothEscposPrinter.printText('PAYMENT METHODS\n', {});

    // Calculate by payment method
    const paymentMethods = {};
    transactions.forEach(transaction => {
      if (transaction.payments && transaction.payments.length > 0) {
        transaction.payments.forEach(payment => {
          const method = payment.method || 'CASH';
          if (!paymentMethods[method]) {
            paymentMethods[method] = 0;
          }
          paymentMethods[method] += payment.amount || 0;
        });
      } else {
        // Default to CASH if no payment methods specified
        if (!paymentMethods.CASH) {
          paymentMethods.CASH = 0;
        }
        paymentMethods.CASH += transaction.totalAmount || 0;
      }
    });

    // Print payment methods
    for (const [method, amount] of Object.entries(paymentMethods)) {
      await BluetoothEscposPrinter.printColumn(
        [24, 24],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [method + ':', `₱${amount.toFixed(2)}`],
        {},
      );
    }

    // Footer
    await BluetoothEscposPrinter.printText(
      '--------------------------------\n',
      {},
    );
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER,
    );
    await BluetoothEscposPrinter.printText('*** Z REPORT ***\n', {});
    await BluetoothEscposPrinter.printText('This is the final summary\n', {});
    await BluetoothEscposPrinter.printText(
      'Register data has been reset\n\n',
      {},
    );

    // Cut paper
    await BluetoothEscposPrinter.printText('\n\n\n\n', {});

    return true;
  } catch (error) {
    console.error('Print error:', error);
    return false;
  }
};

export default {
  requestBluetoothPermission,
  scanBluetoothDevices,
  connectBluetoothDevice,
  isBluetoothDeviceConnected,
  printReceipt,
  printXReport,
  printZReport,
};
