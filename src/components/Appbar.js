import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Appbar = ({ title, onMenuPress, onSearchPress, onNotificationPress, onProfilePress }) => {
  const navigation = useNavigation();
  
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              // Clear any relevant session data
              await AsyncStorage.removeItem('staffData');
              console.log('User logged out successfully');
              
              // Navigate to the RoleSelectionScreen
              navigation.reset({
                index: 0,
                routes: [{ name: 'RoleSelection' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };
  return (
    <View style={styles.appbar}>
      {/* Left: Menu Icon */}
      <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
        <Icon name="menu" size={28} color="#fff" />
      </TouchableOpacity>
      
      {/* Center: Title */}
      <Text style={styles.title}>{title}</Text>
      
      {/* Right: Action Icons */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onSearchPress} style={styles.iconButton}>
          <Icon name="search-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
          <Icon name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onProfilePress} style={styles.iconButton}>
          <Icon name="person-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Icon name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3A6EA5', // Customizable color
    height: 56,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 12,
  },
  logoutButton: {
    marginLeft: 12,
    paddingLeft: 5,
  },
});

export default Appbar;
