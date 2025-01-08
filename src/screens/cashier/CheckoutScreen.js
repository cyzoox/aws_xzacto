import React, { useState } from "react";
import { Text, StyleSheet, View, TouchableOpacity, Dimensions } from "react-native";
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

const CheckoutScreen = ({navigation,route}) => {
   
  
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
        <View style={{flex: 1}}>
        <AppHeader
            centerText="Checkout"
            leftComponent={
              <TouchableOpacity onPress={()=>{setDiscount(0), navigation.goBack()}}>
                <EvilIcons name={'arrow-left'} size={35} color={colors.white}/>
              </TouchableOpacity>
          } 
          
        //   rightComponent={
        //    <CustomerScreen selectedCustomer={customer}/>
        // } 
        />

        <AlertwithChild visible={discountVisible} onCancel={onCancelCustomDisc} onProceed={()=> setDiscountVisible(false)} title="Choose Discount"  confirmTitle="S A V E">
         <View style={{flexDirection:'row',justifyContent:'space-evenly', marginVertical: 2, alignItems:'center'}}>
          <Text style={{textAlign:'center', fontSize: 14, fontWeight: '700'}}>Discount Name : </Text>
            <View style={{flexDirection:'row', marginVertical: 2, alignItems:'center'}}>
           
              <TextInput 
                mode="outlined"
                theme={{colors: {primary: colors.accent, underlineColor: 'transparent'}}}
                value={discount_name}
                onChangeText={(text)=> setDiscountName(text)}
                style={{height: 25, width: 100, borderColor: colors.accent}}
              />
                       <Text style={{textAlign:'center', fontSize: 18, fontWeight: '700'}}></Text>
            </View>
            
   
          </View>
          <View style={{flexDirection:'row', justifyContent:'space-evenly', marginVertical: 10}}>
            <TouchableOpacity onPress={()=> setSelected(5)} style={ selected === 5 ? styles.discountButton2 : styles.discountButton}>
              <Text  style={ selected === 5 ?{color: colors.white}:{color: colors.black}}> 5% </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=> setSelected(10)} style={ selected === 10 ? styles.discountButton2 : styles.discountButton}>
              <Text style={ selected === 10 ?{color: colors.white}:{color: colors.black}}>10%</Text>
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
        <Grid style={{ 
      flex: 1, 
      flexDirection: isLandscape ? 'row' : 'column' 
    }}>
      {isLandscape ? (
        // Landscape layout - side by side
        <>
          <Row size={1} style={{ width: '50%' }}>
            <List 
              screen={route.name} 
              discount_visible={setDiscountVisible} 
              discount={selected} 
            />
          </Row>
          <Row size={1} style={{ width: '30%', padding:30 }}>
            <AmountKeys 
              cashReceive={setReceive} 
              Change={setChange} 
              discount={selected} 
              discountName={discount_name} 
              setCreditVisible={setCreditVisible} 
              navigation={navigation}
            />
          </Row>
        </>
      ) : (
        // Portrait layout - stacked
        <>
          <Row size={1}>
            <List 
              screen={route.name} 
              discount_visible={setDiscountVisible} 
              discount={selected} 
            />
          </Row>
          <Row>
            <AmountKeys 
              cashReceive={setReceive} 
              Change={setChange} 
              discount={selected} 
              discountName={discount_name} 
              setCreditVisible={setCreditVisible} 
              navigation={navigation}
            />
          </Row>
        </>
      )}
    </Grid>
        </View>
    );
}

const styles = StyleSheet.create({
    text: {
      fontSize: 30
    },
    discountButton: {paddingVertical: 4,paddingHorizontal: 20, borderWidth: 1, borderColor: colors.accent, borderRadius: 10},
  discountButton2: {paddingVertical: 4,paddingHorizontal: 20, borderWidth: 1, borderColor: colors.primary, borderRadius: 10, backgroundColor: colors.primary}
  });

export default CheckoutScreen;


