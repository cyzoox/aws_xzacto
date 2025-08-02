import React, {useState} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {authService} from '../services/authService';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * Button component for signing out
 * @param {Object} props Component props
 * @param {string} props.style Additional styles for the button
 * @param {boolean} props.showIcon Whether to show the logout icon
 * @param {boolean} props.showText Whether to show the logout text
 * @param {Object} props.iconProps Additional props for the icon
 * @param {string} props.iconName Optional custom icon name
 */
const SignOutButton = ({
  style,
  showIcon = true,
  showText = true,
  iconProps = {},
  iconName = 'log-out-outline',
  textStyle = {},
  onPress = null,
}) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    // Allow custom onPress handler if provided
    if (onPress) {
      onPress();
      return;
    }

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const success = await authService.logout();

              if (success) {
                // Navigate back to RoleSelection screen
                navigation.reset({
                  index: 0,
                  routes: [{name: 'RoleSelection'}],
                });
              } else {
                Alert.alert('Error', 'Failed to sign out. Please try again.');
              }
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'An unexpected error occurred.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  if (loading) {
    return (
      <TouchableOpacity style={[styles.button, style]} disabled>
        <ActivityIndicator size="small" color="#fff" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleSignOut}
      activeOpacity={0.7}>
      {showIcon && (
        <Icon
          name={iconName}
          size={iconProps.size || 18}
          color={iconProps.color || '#fff'}
          style={styles.icon}
          {...iconProps}
        />
      )}
      {showText && <Text style={[styles.text, textStyle]}>Sign Out</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default SignOutButton;
