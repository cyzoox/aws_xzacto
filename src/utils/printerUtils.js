import AsyncStorage from '@react-native-async-storage/async-storage';

// Get all printer settings
export const getPrinterSettings = async () => {
  try {
    const printerSettingsStr = await AsyncStorage.getItem('printerSettings');
    return printerSettingsStr ? JSON.parse(printerSettingsStr) : {};
  } catch (error) {
    console.error('Error loading printer settings:', error);
    return {};
  }
};

// Get just the autoPrint setting
export const getAutoPrintSetting = async () => {
  const settings = await getPrinterSettings();
  return settings.autoPrint || false;
};

// Save printer settings
export const savePrinterSettings = async (settings) => {
  try {
    // Get existing settings first
    const printerSettingsStr = await AsyncStorage.getItem('printerSettings');
    const printerSettings = printerSettingsStr
      ? JSON.parse(printerSettingsStr)
      : {};

    // Update with new settings
    const updatedSettings = { ...printerSettings, ...settings };

    // Save back to storage
    await AsyncStorage.setItem(
      'printerSettings',
      JSON.stringify(updatedSettings),
    );
    return true;
  } catch (error) {
    console.error('Error saving printer settings:', error);
    return false;
  }
};

// Update just the autoPrint setting
export const saveAutoPrintSetting = async (autoPrintEnabled) => {
  return await savePrinterSettings({ autoPrint: autoPrintEnabled });
};
