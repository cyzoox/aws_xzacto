import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const Appbar = ({ title, onMenuPress, onSearchPress, onNotificationPress, onProfilePress }) => {
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
});

export default Appbar;
