import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const slides = [
  {
    key: 'one',
    title: 'Welcome to XZACTO',
    text: 'Manage your business operations seamlessly with our comprehensive solution.',
    // image: require('../assets/onboarding1.png'),
    backgroundColor: '#007AFF',
  },
  {
    key: 'two',
    title: 'Point of Sale',
    text: 'Efficiently handle transactions with our intuitive cashier interface.',
    // image: require('../assets/onboarding2.png'),
    backgroundColor: '#0055BB',
  },
  {
    key: 'three',
    title: 'Inventory Management',
    text: 'Keep track of your warehouse products and stock levels with ease.',
    // image: require('../assets/onboarding3.png'),
    backgroundColor: '#003377',
  },
];

const OnboardingScreen = () => {
  const navigation = useNavigation();

  // Called when user completes or skips the intro
  const _onDone = async () => {
    try {
      // Mark that the user has seen the onboarding
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      // Navigate to the RoleSelection screen
      navigation.replace('RoleSelection');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      // Navigate anyway in case of error
      navigation.replace('RoleSelection');
    }
  };
  
  // Render each slide
  const _renderItem = ({item}) => {
    return (
      <View style={[styles.slide, {backgroundColor: item.backgroundColor}]}>
        <Text style={styles.title}>{item.title}</Text>
        {item.image && (
          <View style={styles.imageContainer}>
            <Image source={item.image} style={styles.image} />
          </View>
        )}
        <Text style={styles.text}>{item.text}</Text>
      </View>
    );
  };
  
  // Custom button components
  const _renderNextButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <Ionicons name="arrow-forward" color="rgba(255, 255, 255, .9)" size={24} />
      </View>
    );
  };
  
  const _renderDoneButton = () => {
    return (
      <View style={styles.buttonCircle}>
        <Ionicons name="checkmark" color="rgba(255, 255, 255, .9)" size={24} />
      </View>
    );
  };

  const _renderSkipButton = () => {
    return (
      <View style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </View>
    );
  };
  
  return (
    <AppIntroSlider
      data={slides}
      renderItem={_renderItem}
      onDone={_onDone}
      onSkip={_onDone}
      showSkipButton
      renderDoneButton={_renderDoneButton}
      renderNextButton={_renderNextButton}
      renderSkipButton={_renderSkipButton}
      dotStyle={styles.dot}
      activeDotStyle={styles.activeDot}
    />
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  text: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  buttonCircle: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, .2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  imageContainer: {
    width: '80%',
    height: 300,
    marginVertical: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  dot: {
    backgroundColor: 'rgba(255, 255, 255, .3)',
  },
  activeDot: {
    backgroundColor: 'white',
  },
});

export default OnboardingScreen;
