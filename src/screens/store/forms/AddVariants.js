import React, { Children, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  Dimensions,
  TouchableOpacity
} from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from "../../../../src/themes/colors";
const { width, height } = Dimensions.get("window");
import EvilIcons from 'react-native-vector-icons/EvilIcons'
const AddVariants = ({ visible, onProceed, onCancel,title,  confirmTitle, children, onPressAddbtn }) => {
    

    
  return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onCancel}
      >
        <View style={styles.centeredView}>
            <View style={styles.modalView}>
                <View style={{paddingBottom: 10}}>
                  <View style={{flexDirection: 'row', justifyContent:"space-between", margin: 15}}>

                    <Text style={styles.modalText}>{title}</Text>
                    <TouchableOpacity onPress={onPressAddbtn} style={{justifyContent:'center'}}>
                    <EvilIcons name={'plus'} size={26} color={colors.red}/>
                    </TouchableOpacity>
                  </View>
          
                    {children}        
                </View>
                <View style={{flexDirection: 'row', justifyContent:'space-between',marginHorizontal: 15}}>
                    <TouchableHighlight
                    style={{ ...styles.openButton, backgroundColor: colors.red }}
                    onPress={onCancel}
                    >
                    <Text style={styles.textStyle}> Cancel </Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                    style={{ ...styles.openButton, backgroundColor: colors.accent }}
                    onPress={onProceed}
                    >
                    <Text style={styles.textStyle}> {confirmTitle} </Text>
                    </TouchableHighlight>
                    </View>
            </View>
        </View>
      </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    marginBottom: 50
  },
  modalView: {
    width : width /1.1,
    paddingHorizontal: 15,
    backgroundColor: "white",
    borderRadius: 20,
    paddingBottom: 15,
    paddingTop: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  openButton: {
    backgroundColor: "#F194FF",
    borderRadius: 20,
    padding: 8,
    elevation: 2
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalText: {
    textAlign: 'left',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    paddingVertical: 5,
    textAlign:'center'
  },
  closeBtn: {
      justifyContent : 'flex-end',
      alignItems: 'flex-end'
  },
  contentText: {
      paddingVertical: 10,
      marginBottom: 10,
      textAlign:'center'
  }
});

export default AddVariants;