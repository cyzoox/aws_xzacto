import React from "react";
import { Text, StyleSheet, View, TextInput } from "react-native";
import Feather from 'react-native-vector-icons/Feather'

const SearchBar = ({term , onTermChange, onTermSubmit, children}) => {
  return (
      <View style={styles.backgroundStyle}>
          <Feather name="search" style={styles.iconStyle}/>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.inputStyle}
            placeholder="Type your seach here"
            value={term}
            onChangeText={onTermChange}
  
          />
          {children}
      </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 30
  },
  backgroundStyle: {
      backgroundColor: '#FFFFFF',
      height: 50,
      borderRadius: 3,
      marginHorizontal: 15,
      flexDirection: 'row',
      marginTop: 10,
      marginBottom: 2,
      shadowColor: "#EBECF0",
      shadowOffset: {
        width: 0,
        height: 5,
       
      },
      shadowOpacity: 0.89,
      shadowRadius: 2,
      elevation: 5,
  },
  inputStyle: {
      flex: 1,
      fontSize: 15
  },
  iconStyle: {
      fontSize: 23,
      alignSelf: 'center',
      color: "#dddddd",
      marginHorizontal: 15
  }
});

export default SearchBar;
