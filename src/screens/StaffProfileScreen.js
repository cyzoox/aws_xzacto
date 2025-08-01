import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../themes/colors';
import Appbar from '../components/Appbar';
import { generateClient } from 'aws-amplify/api';
import { updateStaff } from '../graphql/mutations';

const client = generateClient();

const StaffProfileScreen = ({ navigation, route }) => {
  const { staffData } = route.params;
  
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const validateForm = () => {
    if (!currentPin || !newPin || !confirmPin) {
      Alert.alert('Error', 'All fields are required');
      return false;
    }
    
    if (newPin !== confirmPin) {
      Alert.alert('Error', 'New PIN and confirmation PIN do not match');
      return false;
    }
    
    if (newPin.length < 5) {
      Alert.alert('Error', 'PIN must be at least 5 digits');
      return false;
    }
    
    if (currentPin !== staffData.password) {
      Alert.alert('Error', 'Current PIN is incorrect');
      return false;
    }
    
    return true;
  };

  const handleUpdatePin = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      const updateInput = {
        id: staffData.id,
        password: newPin,
      };
      
      const result = await client.graphql({
        query: updateStaff,
        variables: {
          input: updateInput
        }
      });
      
      setIsLoading(false);
      Alert.alert(
        'Success',
        'PIN successfully updated.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to update PIN: ' + error.message);
      console.error('Update PIN error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar
        title="Staff Profile"
        subtitle={staffData?.name || ''}
        onBack={() => navigation.goBack()}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {staffData?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text style={styles.staffName}>{staffData.name}</Text>
          <Text style={styles.staffRole}>{staffData.role}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change PIN</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Current PIN</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={currentPin}
                onChangeText={setCurrentPin}
                keyboardType="numeric"
                maxLength={5}
                secureTextEntry={!showCurrentPin}
                placeholder="Enter current PIN"
              />
              <TouchableOpacity 
                style={styles.visibilityIcon} 
                onPress={() => setShowCurrentPin(!showCurrentPin)}
              >
                <Ionicons 
                  name={showCurrentPin ? 'eye-off-outline' : 'eye-outline'} 
                  size={24} 
                  color={colors.charcoalGrey} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>New PIN</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="numeric"
                maxLength={5}
                secureTextEntry={!showNewPin}
                placeholder="Enter new PIN"
              />
              <TouchableOpacity 
                style={styles.visibilityIcon} 
                onPress={() => setShowNewPin(!showNewPin)}
              >
                <Ionicons 
                  name={showNewPin ? 'eye-off-outline' : 'eye-outline'} 
                  size={24} 
                  color={colors.charcoalGrey} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm New PIN</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="numeric"
                maxLength={5}
                secureTextEntry={!showConfirmPin}
                placeholder="Confirm new PIN"
              />
              <TouchableOpacity 
                style={styles.visibilityIcon} 
                onPress={() => setShowConfirmPin(!showConfirmPin)}
              >
                <Ionicons 
                  name={showConfirmPin ? 'eye-off-outline' : 'eye-outline'} 
                  size={24} 
                  color={colors.charcoalGrey} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.updateButton}
            onPress={handleUpdatePin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.updateButtonText}>Update PIN</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.infoTitle}>PIN Security Tips</Text>
          </View>
          <Text style={styles.infoText}>• Choose a PIN that's easy to remember but hard to guess</Text>
          <Text style={styles.infoText}>• Don't use common sequences like 12345</Text>
          <Text style={styles.infoText}>• Don't share your PIN with others</Text>
          <Text style={styles.infoText}>• Change your PIN periodically for better security</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  staffName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.charcoalGrey,
    marginBottom: 4,
  },
  staffRole: {
    fontSize: 16,
    color: colors.boldGrey,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.charcoalGrey,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.grey,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  visibilityIcon: {
    padding: 10,
  },
  updateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'rgba(0, 67, 105, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.charcoalGrey,
    marginBottom: 6,
  },
});

export default StaffProfileScreen;
