import React, {useState, useEffect} from 'react';
import {hashPassword} from '../../utils/PasswordUtils';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {generateClient} from 'aws-amplify/api';
import {getStaff} from '../../graphql/queries';
import {updateStaff} from '../../graphql/mutations';
import colors from '../../themes/colors';
import Appbar from '../../components/Appbar';

const StaffProfileScreen = ({route, navigation}) => {
  const client = generateClient();
  const {staffData} = route.params || {};
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [staff, setStaff] = useState(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStaffDetails = async () => {
      if (staffData && staffData.id) {
        try {
          const staffResult = await client.graphql({
            query: getStaff,
            variables: {id: staffData.id},
          });
          const staffDetails = staffResult.data.getStaff;
          setStaff(staffDetails);
          setName(staffDetails.name || '');
          setPhoneNumber(staffDetails.phoneNumber || '');
          setEmail(staffDetails.email || '');
        } catch (error) {
          console.log('Error fetching staff details:', error);
        }
      }
      setLoading(false);
    };

    fetchStaffDetails();
  }, [staffData, client]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (pin && pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    if (pin && pin.length < 4) {
      Alert.alert('Error', 'PIN must be at least 4 digits');
      return;
    }

    setSaving(true);
    try {
      // Create the basic input object
      let input = {
        id: staff.id,
        name,
        phoneNumber: phoneNumber || null,
        email: email || null,
      };

      // Hash the PIN if it's being updated
      if (pin) {
        try {
          // Use our custom password hashing utility
          const hashedPin = hashPassword(pin);
          console.log('Created hashed PIN for staff profile update');

          // Add the hashed password to the input
          input.password = hashedPin;
        } catch (hashError) {
          console.error('Error hashing PIN:', hashError);
          // If hashing fails, don't update the PIN to avoid security issues
          Alert.alert(
            'Error',
            'There was a problem with PIN security. Please try again.',
          );
          setSaving(false);
          return;
        }
      }

      await client.graphql({
        query: updateStaff,
        variables: {input},
      });
      setStaff({...staff, name, phoneNumber, email});
      setEditing(false);
      setPin('');
      setConfirmPin('');
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.log('Error updating staff:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!staff) {
    return (
      <View style={styles.container}>
        <Appbar
          title="Staff Profile"
          onMenuPress={() => navigation.openDrawer()}
          onBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Staff information not available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar
        title="Staff Profile"
        onMenuPress={() => navigation.openDrawer()}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                <Text style={styles.profileInitial}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.roleBadge}>{staff.role}</Text>
              {editing ? (
                <TextInput
                  style={styles.nameInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter name"
                />
              ) : (
                <Text style={styles.nameText}>{name}</Text>
              )}
            </View>
            {!editing ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}>
                <Icon name="pencil" size={20} color={colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.editButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Icon name="checkmark" size={20} color={colors.white} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Staff ID</Text>
              <Text style={styles.detailValue}>{staff.id}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>PIN</Text>
              <Text style={styles.detailValue}>••••••</Text>
            </View>

            {editing && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>New PIN</Text>
                  <TextInput
                    style={styles.detailInput}
                    value={pin}
                    onChangeText={setPin}
                    placeholder="Enter new PIN"
                    keyboardType="numeric"
                    secureTextEntry
                  />
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Confirm PIN</Text>
                  <TextInput
                    style={styles.detailInput}
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    placeholder="Confirm new PIN"
                    keyboardType="numeric"
                    secureTextEntry
                  />
                </View>
              </>
            )}

            {editing ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <TextInput
                    style={styles.detailInput}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <TextInput
                    style={styles.detailInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>
                    {phoneNumber || 'Not provided'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>
                    {email || 'Not provided'}
                  </Text>
                </View>
              </>
            )}

            {editing && (
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditing(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveFullButton}
                  onPress={handleSave}
                  disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 30,
    color: colors.white,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  roleBadge: {
    backgroundColor: colors.lightGrey,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: colors.darkGrey,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.darkText,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.darkText,
    borderBottomWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 4,
  },
  editButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.success,
  },
  detailsSection: {
    backgroundColor: colors.lightGrey,
    borderRadius: 10,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGrey,
  },
  detailLabel: {
    fontSize: 16,
    color: colors.darkGrey,
    fontWeight: '500',
    width: '30%',
  },
  detailValue: {
    fontSize: 16,
    color: colors.darkText,
    flex: 1,
    textAlign: 'right',
  },
  detailInput: {
    fontSize: 16,
    color: colors.darkText,
    borderBottomWidth: 1,
    borderColor: colors.primary,
    padding: 4,
    flex: 1,
    textAlign: 'right',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: colors.lightGrey,
    borderWidth: 1,
    borderColor: colors.borderGrey,
    alignItems: 'center',
  },
  saveFullButton: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: colors.success,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.darkGrey,
  },
  saveButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
});

export default StaffProfileScreen;
