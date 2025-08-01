import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Logo component for XZACTO app
 * Used in splash screen, loading screens, and throughout the app
 */
const Logo = ({ size = 100, color = '#007AFF', subtitleColor = '#555' }) => {
  // Scale various elements based on the requested size
  const xFontSize = size * 0.6;
  const zactoFontSize = size * 0.25;
  const subtitleFontSize = size * 0.12;
  const zactoMarginTop = -size * 0.1;
  const subtitleMarginTop = size * 0.05;
  
  return (
    <View style={styles.container}>
      <Text style={[styles.letterX, { color, fontSize: xFontSize, lineHeight: size * 0.8 }]}>X</Text>
      <Text style={[styles.textZacto, { color, fontSize: zactoFontSize, marginTop: zactoMarginTop }]}>ZACTO</Text>
      <Text style={[styles.subtitle, { color: subtitleColor, fontSize: subtitleFontSize, marginTop: subtitleMarginTop }]}>POS SYSTEM</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterX: {
    fontWeight: 'bold',
    // lineHeight will be dynamically set in the component
  },
  textZacto: {
    fontWeight: 'bold',
  },
  subtitle: {
    fontWeight: '500',
  }
});

export default Logo;
