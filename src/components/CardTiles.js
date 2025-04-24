import React from "react";
import { Text, StyleSheet, View, TouchableWithoutFeedback,Dimensions, Image } from "react-native";
import { Col, Row, Grid } from "react-native-easy-grid";
import { Card } from "react-native-elements";
import Ionicons from 'react-native-vector-icons/Ionicons'
import LinearGradient from "react-native-linear-gradient";
import colors from "../themes/colors";
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;
const CardTiles = ({ 
  leftTileText, 
  rightTileText, 
  leftIconName, 
  rightIconName, 
  iconLeftName, 
  iconRightName, 
  rightRouteName, 
  leftRouteName, 
  extraProps, 
  centerTileText, 
  centerRouteName, 
  iconCenterName
}) => {
  const navigation = useNavigation();
  return (
    <Grid style={{ paddingBottom: 5, marginHorizontal: 10}}>
        <Row>
            <Col height={screenHeight / 3 - 20}>
              <TouchableWithoutFeedback onPress={() => navigation.navigate(leftRouteName, { store: extraProps })}>
              <Card
                 
                    wrapperStyle={{alignItems:'center'}} 
                    containerStyle={{borderRadius: 15, margin: 2, flex: 1,justifyContent:'center'}}
                >
                  <LinearGradient colors={[colors.white, colors.white]} style={{  height: 50, width: 50, borderRadius: 40, justifyContent:'center', alignItems:'center'}}>
                   {leftTileText == "Reports" ? <Image style={{height: 60, width: 60}} source={require('../../assets/xzacto_icons/warehouseicons/report.png')} />
                    : leftTileText == "Bills"  ? <Image style={{height: 60, width: 60}} source={require('../../assets/xzacto_icons/iconsstore/bills.png')}  />
                    : <Image style={{height: 60, width: 60}} source={require('../../assets/xzacto_icons/iconsstore/supplier1.png')}  />
                  }
                  </LinearGradient>
                  <Card.Divider />
                  <Card.Title style={{fontSize: 13}}>{leftTileText}</Card.Title>
                </Card>
              </TouchableWithoutFeedback>
            </Col>
            {
                centerTileText ?
                <Col height={screenHeight / 3 - 20}>
                  <TouchableWithoutFeedback onPress={() => navigation.navigate(centerRouteName, { store: extraProps })}>
                  <Card wrapperStyle={{alignItems:'center'}} containerStyle={{borderRadius: 15, margin: 2, flex: 1,justifyContent:'center'}}>
                    <LinearGradient colors={[colors.white, colors.white]} style={{height: 50, width: 50, borderRadius: 40,justifyContent:'center', alignItems:'center'}}>
                    {centerTileText == "Expenses" ? <Image style={{height: 60, width: 60}} source={require('../../assets/xzacto_icons/iconsstore/expenses.png')} />
                    : centerTileText == "Customers"  ? <Image style={{height: 60, width: 60}} source={require('../../assets/xzacto_icons/iconsstore/customer.png')}  />
                    : <Image style={{height: 60, width: 60}} source={require('../../assets/xzacto_icons/iconsstore/settings3.png')}  />
                  }
                    </LinearGradient>
                    <Card.Divider />
                    <Card.Title style={{fontSize: 13}}>{centerTileText}</Card.Title>
                    </Card> 
                  </TouchableWithoutFeedback>
                 
                </Col>  : 
                <Col/>     
            }
            {
                rightTileText ?
                <Col height={screenHeight / 3 - 20}>
                  <TouchableWithoutFeedback onPress={() => navigation.navigate(rightRouteName, { store: extraProps })}>
                  <Card wrapperStyle={{alignItems:'center'}} containerStyle={{borderRadius: 15, margin: 2, flex: 1,justifyContent:'center'}}>
                    <LinearGradient colors={[colors.white, colors.white]} style={{height: 50, width: 50, borderRadius: 40,justifyContent:'center', alignItems:'center'}}>
                    {rightTileText == "Products" ? <Image style={{height: 60, width: 60}} source={require('../../assets/xzacto_icons/iconsstore/products2.png')} />
                    :rightTileText == "Staff" ?  <Image style={{height: 60, width: 60}} source={require('../../assets/xzacto_icons/warehouseicons/cashier.png')}  />
                    :  <Image style={{height: 60, width: 60}} source={require('../../assets/xzacto_icons/warehouseicons/warehouse3.png')}  />
                    
                  }
                    </LinearGradient>
                    <Card.Divider />
                    <Card.Title style={{fontSize: 13}}>{rightTileText}</Card.Title>
                    </Card> 
                  </TouchableWithoutFeedback>
                 
                </Col>  : 
                <Col/>     
            }
        </Row>
    </Grid>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 30
  }
});

export default CardTiles;
