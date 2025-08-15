import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  StatusBar,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';

const Appbar = ({
  title,
  subtitle,
  onBack,
  onMenuPress,
  onSearchPress,
  onNotificationPress,
  onProfilePress,
  hideBackButton = false,
  hideMenuButton = false,
}) => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            // Clear any relevant session data
            await AsyncStorage.removeItem('staffData');
            console.log('User logged out successfully');

            // Navigate to the RoleSelectionScreen
            navigation.reset({
              index: 0,
              routes: [{name: 'RoleSelection'}],
            });
          } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        },
      },
    ]);
  };
  
  return (
    <>
      {/* Status bar uses translucent background to show gradient behind it */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <LinearGradient
        colors={['#00A7D5', '#007A9B', '#00708F']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.container}>
        <SafeAreaView style={styles.safeAreaWrapper}>
          <View style={styles.appbarWrapper}>
            {/* Main App Bar */}
            <View style={styles.appbar}>
              {/* Left Icon */}
              {onBack && !hideBackButton ? (
                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                  <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              ) : !hideMenuButton ? (
                <TouchableOpacity
                  onPress={onMenuPress}
                  style={styles.iconButton}>
                  <Icon name="menu" size={28} color="#fff" />
                </TouchableOpacity>
              ) : (
                <View style={styles.emptySpace} />
              )}

              {/* Title Area */}
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>

              {/* Right: Action Icons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleLogout}
                  style={styles.logoutButton}>
                  <Icon name="log-out-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            {onSearchPress && (
              <TouchableOpacity
                style={styles.searchBar}
                onPress={onSearchPress}
                activeOpacity={0.7}>
                <Icon
                  name="search"
                  size={22}
                  color="#777"
                  style={styles.searchIcon}
                />
                <Text style={styles.searchPlaceholder}>Search</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  emptySpace: {
    width: 28,
    marginLeft: 12,
  },
  container: {
    flex: 0,
    paddingTop: 30, // Add padding for status bar since we're using translucent
  },
  safeAreaWrapper: {
    backgroundColor: 'transparent',
  },
  appbarWrapper: {
    backgroundColor: 'transparent',
    paddingBottom: 12,
  },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent', 
    height: 56,
    paddingHorizontal: 16,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#E0E0E0', // Light color for subtitle
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
  },
  logoutButton: {
    marginLeft: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#777777',
  },
  profileIcon: {
    marginLeft: 12,
    paddingLeft: 5,
  },
});

export default Appbar;
