import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import colors from '../../themes/colors';

import {generateClient} from 'aws-amplify/api';
import {createCustomer} from '../../graphql/mutations';
const client = generateClient();

const AddCustomerScreen = ({navigation, route}) => {
  const {onAddCustomer} = route.params || {}; // Callback function to refresh customer list

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return false;
    }

    if (phone && !/^[0-9+\-\s]{6,15}$/.test(phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const customerInput = {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        creditLimit: parseFloat(creditLimit) || 0,
        points: 0, // New customers start with 0 points
      };

      const result = await client.graphql({
        query: createCustomer,
        variables: {input: customerInput},
      });

      console.log('Customer created:', result.data.createCustomer);

      // Call the callback function to refresh customer list
      if (onAddCustomer && typeof onAddCustomer === 'function') {
        onAddCustomer();
      }

      Alert.alert('Success', 'Customer added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating customer:', error);
      Alert.alert('Error', `Failed to add customer: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <EvilIcons name={'arrow-left'} size={35} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Customer</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.formContainer}>
            {/* Customer Name - Required */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Customer Name*</Text>
              <TextInput
                mode="outlined"
                theme={{
                  colors: {
                    primary: colors.accent,
                    underlineColor: 'transparent',
                  },
                }}
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Enter customer name"
                autoCapitalize="words"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                mode="outlined"
                theme={{
                  colors: {
                    primary: colors.accent,
                    underlineColor: 'transparent',
                  },
                }}
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                mode="outlined"
                theme={{
                  colors: {
                    primary: colors.accent,
                    underlineColor: 'transparent',
                  },
                }}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                mode="outlined"
                theme={{
                  colors: {
                    primary: colors.accent,
                    underlineColor: 'transparent',
                  },
                }}
                value={address}
                onChangeText={setAddress}
                style={styles.input}
                placeholder="Enter address"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Credit Limit */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Credit Limit</Text>
              <TextInput
                mode="outlined"
                theme={{
                  colors: {
                    primary: colors.accent,
                    underlineColor: 'transparent',
                  },
                }}
                value={creditLimit}
                onChangeText={setCreditLimit}
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                left={<TextInput.Affix text="₱" />}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Adding Customer...' : 'Add Customer'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    marginLeft: 15,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
  },
  submitButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddCustomerScreen;
