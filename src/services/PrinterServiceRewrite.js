// Updated printXReport function that uses the safePrinterOperation utility

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
    
    // Generate report data for either printer method
    const startDate = new Date(startTime);
    const endDate = new Date(endTime || Date.now());
    
    // Plain text version for BLEPrinter fallback
    let plainTextReport = '';
    plainTextReport += `${storeInfo.name}\n`;
    plainTextReport += `${storeInfo.address || ''}\n`;
    if (storeInfo.phone) {
      plainTextReport += `Tel: ${storeInfo.phone}\n`;
    }
    plainTextReport += '--------------------------------\n';
    plainTextReport += 'X REPORT (SHIFT SUMMARY)\n';
    plainTextReport += '--------------------------------\n';
    plainTextReport += `Report Time: ${new Date().toLocaleString()}\n`;
    plainTextReport += `Period: ${startDate.toLocaleString()} - ${endDate.toLocaleString()}\n`;
    plainTextReport += `Cashier: ${cashierName || 'All'}\n`;
    plainTextReport += '--------------------------------\n';
    
    // Calculate sales summary
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
    
    // Summary data
    plainTextReport += 'SALES SUMMARY\n';
    plainTextReport += `Total Sales: ₱${totalSales.toFixed(2)}\n`;
    plainTextReport += `Total Items: ${totalItems}\n`;
    plainTextReport += `Total Transactions: ${totalTransactions}\n`;
    plainTextReport += '--------------------------------\n';
    
    // Payment methods summary
    plainTextReport += 'PAYMENT METHODS\n';
    
    const paymentMethods = {};
    transactions.forEach(trx => {
      if (trx.payments && Array.isArray(trx.payments)) {
        trx.payments.forEach(payment => {
          const method = payment.method || 'CASH';
          paymentMethods[method] = (paymentMethods[method] || 0) + payment.amount;
        });
      }
    });
    
    // Add each payment method to the report
    for (const [method, amount] of Object.entries(paymentMethods)) {
      plainTextReport += `${method}: ₱${amount.toFixed(2)}\n`;
    }
    
    plainTextReport += '--------------------------------\n';
    plainTextReport += 'X Report - Keep for your records\n';
    plainTextReport += `Printed: ${new Date().toLocaleString()}\n\n\n`;
    
    // Use our safe printer operation utility
    return await safePrinterOperation(
      // ESC/POS operation (prettier formatting)
      async () => {
        // Header with store info
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
        if (storeInfo.phone) {
          await BluetoothEscposPrinter.printText(
            `Tel: ${storeInfo.phone}\n`,
            {},
          );
        }
        
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
        await BluetoothEscposPrinter.printText('SALES SUMMARY\n', {
          encoding: 'GBK',
          codepage: 0,
          widthtimes: 0,
          heigthtimes: 0,
          fonttype: 1,
        });
        
        await BluetoothEscposPrinter.printText(
          `Total Sales: ₱${totalSales.toFixed(2)}\n`,
          {},
        );
        await BluetoothEscposPrinter.printText(
          `Total Items: ${totalItems}\n`,
          {},
        );
        await BluetoothEscposPrinter.printText(
          `Total Transactions: ${totalTransactions}\n`,
          {},
        );
        
        await BluetoothEscposPrinter.printText(
          '--------------------------------\n',
          {},
        );
        
        // Payment methods
        await BluetoothEscposPrinter.printText('PAYMENT METHODS\n', {
          encoding: 'GBK',
          codepage: 0,
          widthtimes: 0,
          heigthtimes: 0,
          fonttype: 1,
        });
        
        // Add each payment method to the report
        for (const [method, amount] of Object.entries(paymentMethods)) {
          await BluetoothEscposPrinter.printText(
            `${method}: ₱${amount.toFixed(2)}\n`,
            {},
          );
        }
        
        // Footer
        await BluetoothEscposPrinter.printText(
          '--------------------------------\n',
          {},
        );
        await BluetoothEscposPrinter.printText('X Report - Keep for your records\n', {});
        await BluetoothEscposPrinter.printText(
          `Printed: ${new Date().toLocaleString()}\n\n\n`,
          {},
        );
      },
      // BLEPrinter operation (plain text fallback)
      async () => {
        await BLEPrinter.printText(plainTextReport);
        await BLEPrinter.printBill('\n\n\n');
      }
    );
  } catch (error) {
    console.error('Error printing X report:', error);
    return false;
  }
};
