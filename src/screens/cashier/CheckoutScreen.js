import React, { useState } from "react";
import { Text, StyleSheet, View, TouchableOpacity, Dimensions, ScrollView, SafeAreaView } from "react-native";
import AppHeader from "../../components/AppHeader";
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import colors from "../../themes/colors";
import AlertwithChild from "../../components/AlertwithChild";
import { Col, Grid, Row } from "react-native-easy-grid";
import List from "../../components/List";
import { TextInput, Checkbox } from "react-native-paper";
import AmountKeys from "../../components/AmountKeys";

import { generateClient } from 'aws-amplify/api';
const client = generateClient();

const CheckoutScreen = ({navigation, route}) => {
  const { staffData } = route.params;
   
  
  const [id, setCusId]= useState('');
  const [name, setCusName]= useState('');
  
  const [creditVisible, setCreditVisible]= useState(false);
  const [alerts, setAlert]= useState(false);
  const [nocustomer, AlertNoCustomer]= useState(false);
  const [received, setReceive]= useState(0);
  const [change, setChange]= useState(0);
  const [discounts, setDiscount] = useState(0)
  const [value, setValue] = useState(0);
  const [vertValue, setVertValue] = useState(0);
  const [custom_discount, setCustomDiscount] = useState(false);
  const [discountVisible, setDiscountVisible] = useState(false)
  const [selected, setSelected] = useState(0)
  const [scanner, setScanner] = useState(false)
  const [cameraType, setCameraType] = useState('back')
  const [torchMode, setTorchMode] = useState('off')
  const [discount_name, setDiscountName] = useState('');
  const [autoPrint, setAutoPrint] = useState(false);
  const [checked, setChecked] = useState(false);
  const [custom_customer, setCustomCustomer] = useState('')
  const { height, width } = Dimensions.get('window');
  const isLandscape = width > height;
    const onCancelCustomDisc = () => {
        setDiscountVisible(false)
        setSelected(0)
      }


    return (
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => {setDiscount(0); navigation.goBack()}}>
              <EvilIcons name={'arrow-left'} size={35} color={colors.white}/>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Checkout</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>

        <AlertwithChild 
         visible={discountVisible} 
         onCancel={onCancelCustomDisc} 
         onProceed={() => setDiscountVisible(false)} 
         title="Choose Discount"
         confirmTitle="SAVE"
         overlayStyle={styles.modalContainer}>
         <View style={styles.inputContainer}>
          <Text style={styles.modalTitle}>Discount Details</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
            <Text style={{flex: 1, fontSize: 16, fontWeight: '500'}}>Discount Name:</Text>
            <TextInput 
              mode="outlined"
              theme={{colors: {primary: colors.accent, underlineColor: 'transparent'}}}
              value={discount_name}
              onChangeText={(text) => setDiscountName(text)}
              style={styles.input}
              placeholder="Enter discount name"
            />
          </View>
            
   
          </View>
          <View style={{flexDirection:'row', justifyContent:'space-evenly', marginVertical: 10}}>
            <TouchableOpacity onPress={() => setSelected(5)} style={selected === 5 ? styles.discountButton2 : styles.discountButton}>
              <Text style={selected === 5 ? styles.discountTextSelected : styles.discountText}>5%</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelected(10)} style={selected === 10 ? styles.discountButton2 : styles.discountButton}>
              <Text style={selected === 10 ? styles.discountTextSelected : styles.discountText}>10%</Text>
            </TouchableOpacity>
        
          </View>
          <View style={{flexDirection:'row',justifyContent:'space-evenly', marginVertical: 2, alignItems:'center'}}>
          <Text style={{textAlign:'center', fontSize: 16, fontWeight: '700'}}>Custom : </Text>
            <View style={{flexDirection:'row', marginVertical: 2, alignItems:'center'}}>
           
              <TextInput 
                mode="outlined"
                theme={{colors: {primary: colors.accent, underlineColor: 'transparent'}}}
                onChangeText={(text)=> setSelected(parseFloat(text))}
                style={{height: 25, width: 60, borderColor: colors.accent}}
              />
                       <Text style={{textAlign:'center', fontSize: 18, fontWeight: '700'}}>%</Text>
            </View>
            
   
          </View>
        </AlertwithChild>
        <Grid style={[styles.gridContainer, { 
          flexDirection: isLandscape ? 'row' : 'column' 
        }]}>
      {isLandscape ? (
        // Landscape layout - side by side
        <>
          <Row size={1} style={[styles.listContainer, { width: '50%' }]}>
            <List 
              screen={route.name} 
              discount_visible={setDiscountVisible} 
              discount={selected}
              staff={staffData}
            />
          </Row>
          <Row size={1} style={[styles.amountContainer, { width: '50%', alignSelf: 'center' }]}>
            <AmountKeys 
              cashReceive={setReceive} 
              Change={setChange} 
              discount={selected} 
              discountName={discount_name} 
              setCreditVisible={setCreditVisible} 
              navigation={navigation}
              staff={staffData}
            />
          </Row>
        </>
      ) : (
        // Portrait layout - stacked
        <>
          <Row size={1} style={styles.listContainer}>
            <List 
              screen={route.name} 
              discount_visible={setDiscountVisible} 
              discount={selected}
              staff={staffData}
            />
          </Row>
          <Row style={styles.portraitAmountKeysRow}>
            <View style={styles.portraitAmountKeysContainer}>
              <AmountKeys 
                cashReceive={setReceive} 
                Change={setChange} 
                discount={selected} 
                discountName={discount_name} 
                setCreditVisible={setCreditVisible} 
                navigation={navigation}
                staff={staffData}
              />
            </View>
          </Row>
        </>
      )}
    </Grid>
          </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 15
  },
  gridContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 10,
    marginBottom: 20, // Add some bottom margin for scrolling
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    minHeight: 500 // Ensure a minimum height even on small screens
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10
  },
  amountContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  portraitAmountKeysRow: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20
  },
  portraitAmountKeysContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 'auto',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  discountButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    marginHorizontal: 5
  },
  discountButton2: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    backgroundColor: colors.primary,
    marginHorizontal: 5
  },
  discountText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '500'
  },
  discountTextSelected: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500'
  },
  actionButton: {
    backgroundColor: colors.white,
    justifyContent: 'center',
    padding: 8,
    borderRadius: 10,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: colors.accent
  },
  actionIcon: {
    padding: 5
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: colors.primary
  },
  inputContainer: {
    marginVertical: 10
  },
  input: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16
  }
});

export default CheckoutScreen;
