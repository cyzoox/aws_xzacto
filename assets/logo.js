import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

/**
 * SVG would be better, but for simplicity we'll use a text-based logo component
 * This can be replaced with an actual image later
 */
const Logo = ({size = 100, color = '#007AFF'}) => {
  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <Text style={[styles.letter, {color, fontSize: size * 0.6}]}>X</Text>
      <Text style={[styles.text, {color, fontSize: size * 0.25}]}>ZACTO</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: 'bold',
  },
  text: {
    fontWeight: 'bold',
    marginTop: -10,
  },
});

export default Logo;
