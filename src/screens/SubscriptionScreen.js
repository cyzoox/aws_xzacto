import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Button, Overlay } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import Appbar from "../components/Appbar";
import colors from "../themes/colors";
import {
  fetchSubscriptionPlans,
  fetchAccountByOwnerId,
  upgradeSubscription,
  createDefaultFreePlan,
  syncSubscriptionActions
} from '../store/slices/subscriptionSlice';
import { generateClient } from 'aws-amplify/api';
import { listSubscriptionPlans } from '../graphql/queries';
import { createSubscriptionPlan } from '../graphql/mutations';



// Initialize the API client
const client = generateClient();

const SubscriptionScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const subscriptionState = useSelector(state => state.subscription) || { plans: [], loading: false, error: null };
  const { currentAccount = null, loading = false, error = null, syncStatus = 'idle' } = subscriptionState;
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [upgradeOverlayVisible, setUpgradeOverlayVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [staffData, setStaffData] = useState(route.params?.staffData);
  const [offlineChanges, setOfflineChanges] = useState(false);

  // Check if user is SuperAdmin
  const isSuperAdmin = staffData && 
                       staffData.role && 
                       (Array.isArray(staffData.role) 
                        ? staffData.role.includes('SuperAdmin') 
                        : staffData.role === 'SuperAdmin');

  useEffect(() => {
    console.log('SubscriptionScreen mounted - isSuperAdmin:', isSuperAdmin);
    console.log('Initial Redux state:', subscriptionState);
    
  
      const unsubscribe = NetInfo.addEventListener(state => {
        console.log('Network state changed:', state.isConnected);
        setIsConnected(state.isConnected);
        
        // If connection status changes to online and we had offline changes
        if (state.isConnected && offlineChanges) {
          syncOfflineChanges();
        }
      });
      
      loadData();
      
      return () => {
        unsubscribe();
      };
    
  }, [isSuperAdmin]);
  
  // Check for errors
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const loadData = async () => {
    console.log('Loading subscription data...');
    
    try {
      setLoadingPlans(true);
      
      // Fetch subscription plans directly using GraphQL
      console.log('Fetching subscription plans with GraphQL...');
      const plansResult = await client.graphql({
        query: listSubscriptionPlans
      });
      
      let fetchedPlans = plansResult.data.listSubscriptionPlans.items || [];
      console.log('Fetched plans:', fetchedPlans);
      
      // If no plans exist, create temporary subscription plans
      if (fetchedPlans.length === 0 && isConnected) {
        console.log('No plans exist and online - creating temporary plans');
        await createTemporaryPlans();
        
        // Fetch again after creating temporary plans
        const updatedPlansResult = await client.graphql({
          query: listSubscriptionPlans
        });
        fetchedPlans = updatedPlansResult.data.listSubscriptionPlans.items || [];
      }
      
      // Sort plans by price
      fetchedPlans.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      setPlans(fetchedPlans);
      
      // Fetch account by owner ID
      if (staffData && staffData.ownerId) {
        console.log('Fetching account for owner ID:', staffData.ownerId);
        dispatch(fetchAccountByOwnerId(staffData.ownerId));
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setLoadingPlans(false);
    }
  };
  
  // Create a set of temporary subscription plans and save them to AWS
  const createTemporaryPlans = async () => {
    console.log('Creating subscription plans in AWS...');
    try {
      // Define subscription plans
      const subscriptionPlans = [
        {
          name: "Free",
          description: "Basic features for small businesses just starting out",
          price: 0,
          interval: "monthly",
          storeLimit: 2,
          staffPerStoreLimit: 3,
          adminPerStoreLimit: 1,
          features: ["Basic POS", "Basic Inventory", "Single User Reports"],
          isActive: true
        },
        {
          name: "Starter",
          description: "Great for growing businesses that need more functionality",
          price: 29.99,
          interval: "monthly",
          storeLimit: 5,
          staffPerStoreLimit: 10,
          adminPerStoreLimit: 3,
          features: ["Advanced POS", "Full Inventory Management", "Basic Analytics", "Customer Database", "Email Support"],
          isActive: true
        },
        {
          name: "Professional",
          description: "Full-featured solution for established businesses",
          price: 59.99,
          interval: "monthly",
          storeLimit: 10,
          staffPerStoreLimit: 25,
          adminPerStoreLimit: 5,
          features: ["Premium POS", "Advanced Inventory", "Business Analytics", "Customer Loyalty", "Priority Support", "Multi-location"],
          isActive: true
        },
        {
          name: "Enterprise",
          description: "Ultimate solution for large businesses with multiple locations",
          price: 99.99,
          interval: "monthly",
          storeLimit: -1, // Unlimited
          staffPerStoreLimit: -1, // Unlimited
          adminPerStoreLimit: -1, // Unlimited
          features: ["Enterprise POS", "Enterprise Inventory", "Advanced Analytics", "VIP Support", "Custom Integration", "Dedicated Account Manager", "API Access"],
          isActive: true
        },
      ];
      
      // Create each plan in sequence using GraphQL mutations
      for (const plan of subscriptionPlans) {
        console.log(`Creating subscription plan: ${plan.name}...`);
        try {
          // Create plan using GraphQL mutation
          await client.graphql({
            query: createSubscriptionPlan,
            variables: { 
              input: plan 
            }
          });
          console.log(`Successfully created plan: ${plan.name}`);
        } catch (error) {
          if (error.message.includes('The conditional request failed')) {
            console.log(`Plan ${plan.name} already exists, skipping...`);
          } else {
            console.error(`Failed to create plan ${plan.name}:`, error);
          }
        }
      }
      
      // Show success message
      Alert.alert('Success', 'Subscription plans have been created in AWS!');
      
      // Refetch plans after creating them
      dispatch(fetchSubscriptionPlans());
      
      Alert.alert('Success', 'Created temporary subscription plans for testing');
    } catch (error) {
      console.error('Error creating temporary subscription plans:', error);
      Alert.alert('Error', 'Failed to create temporary subscription plans');
    }
  };
  
  const syncOfflineChanges = async () => {
    dispatch(syncSubscriptionActions())
      .unwrap()
      .then(() => {
        setOfflineChanges(false);
        Alert.alert('Sync Complete', 'Your offline changes have been synchronized');
      })
      .catch(err => {
        console.error('Failed to sync offline changes:', err);
      });
  };
  
  const createFreePlan = () => {
    if (!isConnected) {
      Alert.alert('Offline Mode', 'Cannot create new subscription plans while offline.');
      return;
    }
    
    dispatch(createDefaultFreePlan());
  };

  const handleUpgradePress = (plan) => {
    setSelectedPlan(plan);
    setUpgradeOverlayVisible(true);
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan || !currentAccount) return;
    
    // Prepare upgrade data
    const upgradeData = {
      accountId: currentAccount.id,
      currentPlanId: currentAccount.subscriptionPlanId,
      newPlanId: selectedPlan.id,
      staffId: staffData.id
    };
    
    // Dispatch upgrade action
    dispatch(upgradeSubscription(upgradeData))
      .unwrap()
      .then(() => {
        // If we're offline, mark that we have changes to sync
        if (!isConnected) {
          setOfflineChanges(true);
        }
        
        Alert.alert(
          'Success', 
          `Subscription ${isConnected ? 'upgraded' : 'will be upgraded when online'} to ${selectedPlan.name} plan`
        );
      })
      .catch((err) => {
        console.error('Error upgrading subscription:', err);
        Alert.alert('Error', 'Failed to upgrade subscription');
      });
    
    setUpgradeOverlayVisible(false);
  };

  const renderCurrentPlan = () => {
    if (!currentAccount || !currentAccount.subscriptionPlan) return null;
    
    const plan = currentAccount.subscriptionPlan;
    
    return (
      <Card containerStyle={styles.currentPlanCard}>
        <Card.Title h4>Current Plan: {plan.name}</Card.Title>
        <Card.Divider />
        <View style={styles.planDetails}>
          <Text style={styles.planDetailText}>Stores: {plan.storeLimit}</Text>
          <Text style={styles.planDetailText}>Staff per store: {plan.staffPerStoreLimit}</Text>
          <Text style={styles.planDetailText}>Admins per store: {plan.adminPerStoreLimit}</Text>
          <Text style={styles.planDetailText}>
            Status: {currentAccount.subscriptionStatus}
          </Text>
          {currentAccount.subscriptionEndDate && (
            <Text style={styles.planDetailText}>
              Expires: {new Date(currentAccount.subscriptionEndDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </Card>
    );
  };

  const renderPlanItem = ({ item }) => {
    console.log('Rendering plan item:', item);
    const isCurrentPlan = currentAccount && currentAccount.subscriptionPlanId === item.id;
    
    // Format feature names for display
    const formatFeatureName = (feature) => {
      return feature
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    // Get color scheme based on plan type
    const getPlanColors = (planName) => {
      const name = planName.toLowerCase();
      
      if (name.includes('free')) {
        return {
          backgroundColor: '#4CAF50', // Green
          secondaryColor: '#E8F5E9'
        };
      } else if (name.includes('starter')) {
        return {
          backgroundColor: '#2196F3', // Blue
          secondaryColor: '#E3F2FD'
        };
      } else if (name.includes('professional')) {
        return {
          backgroundColor: '#9C27B0', // Purple
          secondaryColor: '#F3E5F5'
        };
      } else if (name.includes('enterprise')) {
        return {
          backgroundColor: '#FF5722', // Orange/Red
          secondaryColor: '#FBE9E7'
        };
      } else {
        return {
          backgroundColor: '#FF9800', // Default Orange
          secondaryColor: '#FFF3E0'
        };
      }
    };
    
    const planColors = getPlanColors(item.name);
    
    return (
      <View style={styles.planCardOuterContainer}>
        {/* Fixed Header */}
        <View style={[styles.planHeader, { backgroundColor: planColors.backgroundColor }]}>
          {isCurrentPlan && (
            <View style={styles.currentPlanBadge}>
              <Text style={styles.currentPlanBadgeText}>CURRENT</Text>
            </View>
          )}
          <Text style={styles.planName}>{item.name}</Text>
          <Text style={styles.planPrice}>
            ${parseFloat(item.price).toFixed(2)}
            <Text style={styles.planInterval}>/{item.interval}</Text>
          </Text>
        </View>

        {/* Limits section */}
        <View style={styles.planLimits}>
          <View style={styles.limitItem}>
            <View style={[styles.limitIconContainer, { backgroundColor: planColors.secondaryColor }]}>
              <Icon name="store" size={18} color={planColors.backgroundColor} />
            </View>
            <View style={styles.limitTextContainer}>
              <Text style={styles.limitValue}>{item.storeLimit === -1 ? '∞' : item.storeLimit}</Text>
              <Text style={styles.limitLabel}>Stores</Text>
            </View>
          </View>
          
          <View style={styles.limitItem}>
            <View style={[styles.limitIconContainer, { backgroundColor: planColors.secondaryColor }]}>
              <Icon name="person" size={18} color={planColors.backgroundColor} />
            </View>
            <View style={styles.limitTextContainer}>
              <Text style={styles.limitValue}>{item.staffPerStoreLimit === -1 ? '∞' : item.staffPerStoreLimit}</Text>
              <Text style={styles.limitLabel}>Staff/Store</Text>
            </View>
          </View>
          
          <View style={styles.limitItem}>
            <View style={[styles.limitIconContainer, { backgroundColor: planColors.secondaryColor }]}>
              <Icon name="supervisor-account" size={18} color={planColors.backgroundColor} />
            </View>
            <View style={styles.limitTextContainer}>
              <Text style={styles.limitValue}>{item.adminPerStoreLimit === -1 ? '∞' : item.adminPerStoreLimit}</Text>
              <Text style={styles.limitLabel}>Admins/Store</Text>
            </View>
          </View>
        </View>

        {/* Scrollable features section */}
        <ScrollView style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What's included:</Text>
          
          {item.features && item.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Icon name="check-circle" size={16} color={planColors.backgroundColor} style={styles.featureIcon} />
              <Text style={styles.featureText}>{typeof feature === 'string' && feature.includes('_') ? formatFeatureName(feature) : feature}</Text>
            </View>
          ))}
          
          <Text style={styles.planDescription}>{item.description}</Text>
        </ScrollView>
        
        {/* Fixed upgrade button */}
        <View style={styles.upgradeButtonContainer}>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: planColors.backgroundColor }]}
            onPress={() => handleUpgradePress(item)}
            disabled={isCurrentPlan}
          >
            <Text style={styles.upgradeButtonText}>
              {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar
        title="Subscription Mgmt"
        subtitle={offlineChanges ? 'Pending changes to sync' : ''}
        onBack={() => navigation.goBack()}
      />
      
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            You are currently offline. Some features may be limited.
          </Text>
        </View>
      )}

      {syncStatus === 'syncing' && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Syncing your changes...
          </Text>
        </View>
      )}
      
      {(loading || loadingPlans) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading subscription data...</Text>
        </View>
      ) : (
        <View style={styles.mainContent}>
          {/* Current Plan Section */}
          
          {renderCurrentPlan()}
{/*           
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Available Plans</Text>
            <Button
              title="Create Plans in AWS"
              onPress={createTemporaryPlans}
              buttonStyle={styles.createButton}
            />
          </View> */}
        
        {/* Horizontal Scrollable Plans */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.horizontalPlansList}
          data={plans}
          keyExtractor={(item) => item.id || item.name}
          renderItem={renderPlanItem}
          snapToAlignment="start"
          snapToInterval={296} // Card width (280) + margins (16)
          decelerationRate="fast"
          pagingEnabled={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews={true}
        />
      </View>
    )}
    
    <Overlay
      isVisible={upgradeOverlayVisible}
      onBackdropPress={() => setUpgradeOverlayVisible(false)}
      overlayStyle={styles.overlay}
    >
      <Text style={styles.overlayTitle}>Confirm Subscription Upgrade</Text>
      {selectedPlan && (
        <>
          <Text style={styles.overlayText}>
            Are you sure you want to upgrade to the {selectedPlan.name} plan?
          </Text>
          <Text style={styles.overlayPrice}>
            Price: ${selectedPlan.price}/{selectedPlan.interval}
          </Text>
          <View style={styles.overlayButtons}>
            <Button
              title="Cancel"
              onPress={() => setUpgradeOverlayVisible(false)}
              buttonStyle={styles.cancelButton}
            />
            <Button
              title="Confirm"
              onPress={confirmUpgrade}
              buttonStyle={styles.confirmButton}
            />
          </View>
        </>
      )}
    </Overlay>
  </View>
);

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 4,
  },
  offlineBanner: {
    backgroundColor: '#ffcc00',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  offlineText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textDark,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    marginLeft: 10,
  },
  plansList: {
    paddingBottom: 20,
  },
  horizontalPlansList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  createButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
  },
  mainContent: {
    flex: 1,
  },
  // New plan card styles
  planCardOuterContainer: {
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width:350, // Fixed width for even card display
    height: 470, // Fixed height for consistent cards
    position: 'relative', // Needed for absolute positioned elements
  },
  featuresContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
    maxHeight: 200, // Give it a max height to ensure it doesn't push the button down
  },
  upgradeButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  currentPlanCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  planHeader: {
    padding: 16,
    alignItems: 'center',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
  },
  planInterval: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  currentPlanBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentPlanBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  // Plan limits section
  planLimits: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  limitItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  limitIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  limitTextContainer: {
    alignItems: 'flex-start',
  },
  limitValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  limitLabel: {
    fontSize: 12,
    color: '#666',
  },
  // Features section
  planFeatures: {
    padding: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#444',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 20,
  },
  // Upgrade button
  upgradeButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentPlanFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  currentPlanText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'red',
  },
  overlay: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  overlayText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  overlayPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  overlayButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cancelButton: {
    backgroundColor: 'gray',
    minWidth: 100,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    minWidth: 100,
  },
});

export default SubscriptionScreen;