import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';

const CheckSubscriptionsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [error, setError] = useState(null);
  
  // Access subscription data from Redux
  const subscription = useSelector(state => state.subscription);
  
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        setLoading(true);
        
        // Get subscription data from AsyncStorage
        const storedSubscription = await AsyncStorage.getItem('subscriptionPlan');
        
        if (storedSubscription) {
          const parsedSubscription = JSON.parse(storedSubscription);
          setSubscriptionPlan(parsedSubscription);
          
          // Validate subscription and redirect accordingly
          setTimeout(() => {
            navigation.replace('MainApp');
          }, 1500);
        } else {
          // No subscription data found
          setError('No active subscription found');
          
          // Redirect to SuperAdmin screen to set up subscription
          setTimeout(() => {
            navigation.replace('SuperAdmin');
          }, 1500);
        }
      } catch (err) {
        console.error('Error checking subscription:', err);
        setError('Error verifying subscription status');
        
        // Fall back to SuperAdmin on error
        setTimeout(() => {
          navigation.replace('SuperAdmin');
        }, 1500);
      } finally {
        setLoading(false);
      }
    };
    
    checkSubscription();
  }, [navigation]);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>XZACTO</Text>
      
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          <Text style={styles.message}>Checking subscription plan...</Text>
        </>
      ) : error ? (
        <>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.replace('SuperAdmin')}
          >
            <Text style={styles.buttonText}>Go to Admin</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.message}>Subscription verified!</Text>
          <Text style={styles.planInfo}>
            {subscriptionPlan?.name || 'Standard Plan'}
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.replace('MainApp')}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 30,
  },
  loader: {
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
  },
  planInfo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 20,
  },
  errorMessage: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckSubscriptionsScreen;
