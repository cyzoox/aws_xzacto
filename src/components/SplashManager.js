import React, {useState, useEffect} from 'react';
import {
  View,
  Platform,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import LoadingScreen from './LoadingScreen';
import Logo from './Logo';

/**
 * SplashManager component handles the splash screen and loading states
 * This replaces the native splash screen with our custom loading implementation
 */
const SplashManager = ({
  children,
  initialLoading = false,
  loadingText = 'Setting things up...',
}) => {
  // Simplified approach - use a single state to determine if we show splash or content
  const [showApp, setShowApp] = useState(!initialLoading);

  // Initialize component
  useEffect(() => {
    console.log('SplashManager initialized');

    // If initialLoading is true, we need to wait for it to become false
    if (initialLoading) {
      console.log('Waiting for initial loading to complete');
    } else {
      // If not loading, show the app immediately
      setShowApp(true);
    }
  }, [initialLoading]);

  // When initialLoading changes to false, we can show the app
  useEffect(() => {
    if (!initialLoading && !showApp) {
      console.log('Initial loading complete, showing app');
      setShowApp(true);
    }
  }, [initialLoading, showApp]);

  // Force show the app after a timeout to prevent getting stuck
  useEffect(() => {
    const forceTimer = setTimeout(() => {
      if (!showApp) {
        console.log('Force showing app after timeout');
        setShowApp(true);
      }
    }, 3000);

    return () => clearTimeout(forceTimer);
  }, [showApp]);

  // Simple loading screen for when we're still loading
  if (!showApp) {
    return (
      <View style={styles.loadingContainer}>
        <Logo size={100} color="#007AFF" />
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={styles.spinner}
        />
        <Text style={styles.loadingText}>{loadingText}</Text>
      </View>
    );
  }

  // Render app content directly
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  spinner: {
    marginTop: 20,
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333333',
  },
});

export default SplashManager;
