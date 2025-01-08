import React,{useEffect, useState} from 'react';
import { ScrollView, TouchableOpacity, TouchableWithoutFeedback, FlatList } from 'react-native';
import { StyleSheet, View, Text } from 'react-native';
import colors from '../themes/colors';
import { Button, Input, Overlay } from 'react-native-elements';
import formatMoney from 'accounting-js/lib/formatMoney.js'
import Feather from 'react-native-vector-icons/Feather'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { TextInput } from 'react-native-paper';
import Alert from './Alert';
import { generateClient } from 'aws-amplify/api';
const client = generateClient();
import { listLists } from '../graphql/queries';

import { updateList, deleteList } from '../graphql/mutations';

export default function List({ navigation, clearAll, archive, screen, toggleScanner, discount_visible, discount, autoPrint_visible,staff}) {

    
    const [edit, toggleEdit] = useState(false);
    const [newQty, setNewQty] = useState('');
    const [RMap, setRowMap] = useState({});
    const [RKey, setRowKey] = useState('');
    const [dList, setDList] = useState({});
    const [deletes, toggleDelete] = useState(false);
    const [customQty, setCustomQtyVisible] = useState(false);
    const [data, setData] = useState([]);
    const [alerts, alertVisible] = useState(false);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
  const closeRow = (rowMap, rowKey) => {
      if (rowMap[rowKey]) {
          rowMap[rowKey].closeRow();
      }
  };



  const deleteRow = () => {
      closeRow(RMap, RKey);
      
      // deleteList(dList);

      toggleDelete(false);
      setDList({});
      setRowMap([]);
      setRowKey('');
  };



  useEffect(() => {
    fetchList();
}, []);

const fetchList = async () => {
  try {
    const result = await client.graphql({
      query: listLists,
      variables: {
        filter: {
          storeId: { eq: staff.store_id },
        },
      },
    });

    const listItems = result.data.listLists.items;
    console.log(listItems);
    setCart(listItems); // Ensure setCart is a valid state setter function
  } catch (err) {
    console.log('Error fetching list:', err.message);
  }
};

const incrementQuantity = async (item) => {
  try {
    // Increment the quantity
    const updatedQuantity = item.quantity + 1;

    await client.graphql({
      query: updateList,
      variables: {
        input: {
          id: item.id,
          quantity: updatedQuantity,
        },
      },
    });

    console.log("Quantity incremented for item:", item.id);
    fetchList(); // Refresh the cart
  } catch (err) {
    console.log("Error incrementing quantity:", err.message);
  }
};

const decrementQuantity = async (item) => {
  try {
    if (item.quantity > 1) {
      // Decrement the quantity
      const updatedQuantity = item.quantity - 1;

      await client.graphql({
        query: updateList,
        variables: {
          input: {
            id: item.id,
            quantity: updatedQuantity,
          },
        },
      });

      console.log("Quantity decremented for item:", item.id);
    } else {
      // If quantity reaches 0, delete the item
      await client.graphql({
        query: deleteList,
        variables: {
          input: {
            id: item.id,
          },
        },
      });

      console.log("Item deleted from cart:", item.id);
    }

    fetchList(); // Refresh the cart
  } catch (err) {
    console.log("Error decrementing quantity:", err.message);
  }
};


  const onPressSave = () => {
    const foundObject = products.find(obj => obj._id === data._id);

    if (foundObject) {
      if (foundObject.stock > newQty) {
        editListQty(data, parseFloat(newQty))
             setCustomQtyVisible(false)
      } else {
        alertVisible(true);
            return
      }
    } 
    // products.map((x) => {

    //   if (x.pr_id === data.uid){
    //     if(newQty >= x.stock){
    //       alertVisible(true);
    //       return
    //     }else{
    //       editListQty(data, parseFloat(newQty))
    //       setCustomQtyVisible(false)
    //     }
    //     }
    // })


  }

  const onEditQty = (item) => {
    setData(item)
      setCustomQtyVisible(true)
  }

  const calculateTotal = () => {
    let total = 0;
    cart.forEach(list => {
            total += list.quantity *list.sprice;
    });
   return total;
}




  const renderRow = ({ item })=> {
    return (
        <View style={{ flex: 1, alignSelf: 'flex-start', flexDirection: 'row', backgroundColor:colors.white, paddingVertical: 10, justifyContent:'space-evenly' }}>
        <View style={[styles.cellContainer, {flex: 2}]}>
             <Text style={styles.cellStyle}>{item.name}</Text>
      {item.addon || item.option ?  <Text style={[styles.cellStyle,{ fontSize:10}]}>with {item.addon}, {item.option}</Text> : null}
        </View>
        <View style={[styles.cellContainer, {flex: 2.5}]}>
            <View style={{flexDirection:'row',  alignItems:'center'}}>
              {/*
              {
                data.item.quantity === 1 ?
                <TouchableOpacity style={[styles.stepBtn, {backgroundColor: colors.red}]} onPress={()=>  deleteList(data.item)}>
                  <Feather name={'trash'} size={18} color={colors.white} style={{padding: 5}}/>
                </TouchableOpacity> :
                <TouchableOpacity style={styles.stepBtn} onPress={()=> incrementListQty(1, data.item, 'decrement')}>
                  <Feather name={'minus'} size={18} color={colors.black} style={{padding: 5}}/>
                </TouchableOpacity>
              }
              */ }
              {
                item.quantity === 1 ?
                <TouchableOpacity style={[styles.stepBtn, {backgroundColor: colors.red}]} onPress={()=>  decrementQuantity(item)}>
                  <Feather name={'trash'} size={15} color={colors.white} style={{padding: 5}}/>
                </TouchableOpacity> :
                <TouchableOpacity style={styles.stepBtn} onPress={()=> decrementQuantity(item)}>
                  <Feather name={'minus'} size={15} color={colors.white} style={{padding: 5, fontWeight:'700'}}/>
                </TouchableOpacity>
              }
              <TouchableOpacity onPress={()=> onEditQty(item)}>
                 <Text style={[styles.cellStyle, {marginHorizontal: 5}]}>{Math.round(item.quantity  * 100) / 100}</Text>
              </TouchableOpacity>
            
                <TouchableWithoutFeedback  onPress={()=> incrementQuantity(item)}>
                  <View style={styles.stepBtn} >
                  <Feather name={'plus'} size={15} color={colors.white} style={{padding: 5}}/>
                  </View>
                 
                </TouchableWithoutFeedback >
            </View>
        </View>
        <View style={styles.cellContainer}>
          <Text style={styles.cellStyle}>{formatMoney(item.quantity * item.sprice, { symbol: "₱", precision: 2 })}</Text>
        </View>
    </View>
    );
}
 
  return (
    <>
     <Alert visible={alerts} onCancel={()=> alertVisible(false)} onProceed={()=> alertVisible(false)} title="Insufficient Stocks" content="Insufficient stocks can't proceed with your input." confirmTitle="OK"/>
     <View style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <View style={styles.cellHeaderContainer}>
          <View style={[styles.cellContainer, {flex: 3}]}>
                <Text style={styles.cellHeaderStyle}>Current Order</Text>
          </View>
          {
            screen !== 'Checkout' ?
            <View style={{flexDirection:'row'}}>
             
            <TouchableOpacity onPress={()=> clearAll(true)} style={{backgroundColor: colors.white, justifyContent:'center', paddingHorizontal: 5, borderRadius: 10, borderColor: colors.accent, borderWidth: 1}}>
                <Text style={{textAlign:'center', color: colors.statusBarCoverDark, fontSize: 14, fontWeight: '400'}}>
                    Clear All
                </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=> toggleScanner(true)} style={{backgroundColor:colors.white, justifyContent:'center', padding: 3, borderRadius: 10, marginLeft: 10, borderRadius: 10, borderColor: colors.accent, borderWidth: 1}}>
              <MaterialCommunityIcons name={'barcode-scan'} size={15} color={colors.statusBarCoverDark} style={{padding: 5}}/>
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={()=> archive(true)} style={{backgroundColor:colors.white, justifyContent:'center', padding: 3, borderRadius: 10, marginLeft: 10,borderRadius: 10, borderColor: colors.accent, borderWidth: 1}}>
              <Feather name={'archive'} size={15} color={colors.statusBarCoverDark} style={{padding: 5}}/>
            </TouchableOpacity> */}
           
        </View> : <View style={{flexDirection:'row'}}>
             
            
             <TouchableOpacity onPress={()=> toggleScanner(true)} style={{backgroundColor:colors.white, justifyContent:'center', padding: 3, borderRadius: 10, marginLeft: 10, borderRadius: 10, borderColor: colors.accent, borderWidth: 1}}>
               <MaterialCommunityIcons name={'barcode-scan'} size={15} color={colors.statusBarCoverDark} style={{padding: 5}}/>
             </TouchableOpacity>
            
             <TouchableOpacity onPress={()=> discount_visible(true)} style={{backgroundColor:colors.white, justifyContent:'center', padding: 3, borderRadius: 10, marginLeft: 10,borderRadius: 10, borderColor: colors.accent, borderWidth: 1}}>
               <Feather name={'percent'} size={15} color={colors.statusBarCoverDark} style={{padding: 5}}/>
             </TouchableOpacity>
             <TouchableOpacity onPress={()=> autoPrint_visible(true)} style={{backgroundColor:colors.white, justifyContent:'center', padding: 3, borderRadius: 10, marginLeft: 10,borderRadius: 10, borderColor: colors.accent, borderWidth: 1}}>
               <Feather name={'printer'} size={15} color={colors.statusBarCoverDark} style={{padding: 5}}/>
             </TouchableOpacity>
         </View>
          }
         
      </View> 
    
      <FlatList
        data={cart}
        renderItem={renderRow}
        keyExtractor={item => item._id}
      />
        <View style={styles.cellFooterStyle}>
          <Text style={styles.footerTextStyle}>Subtotal</Text>
          <Text style={styles.footerTextStyle}>{formatMoney(calculateTotal(), { symbol: "₱", precision: 2 })}</Text>
      </View>
      <View style={styles.cellFooterStyle}>
          <Text style={styles.footerTextStyle}>Discount</Text>
          <Text style={styles.footerTextStyle}>{formatMoney(calculateTotal()*(discount/100), { symbol: "₱", precision: 2 })}</Text>
      </View>
      <View style={styles.cellFooterStyle}>
          <Text style={[styles.footerTextStyle,{fontWeight: '700'}]}>Total</Text>
          <Text style={[styles.footerTextStyle,{fontWeight: '700'}]}>{formatMoney(calculateTotal()-(calculateTotal()*discount/100), { symbol: "₱", precision: 2 })}</Text>
      </View>
      <Overlay overlayStyle={{ width: "70%", borderRadius: 20, padding: 20, justifyContent:'center' }} isVisible={customQty} onBackdropPress={setCustomQtyVisible}>
      <Text style={{textAlign:'center', fontSize: 20, fontWeight:'600'}}>Quantity of <Text style={{ fontSize: 20, fontWeight:'600', color:colors.accent}}>{data.name}</Text> </Text>
        <View style={{marginHorizontal: 20, justifyContent:'center', alignItems:'center'}}>
            <TextInput 
              mode="outlined"
              onChangeText={(text)=> setNewQty(text)}
              defaultValue={`${data.quantity}`}
              keyboardType="decimal-pad"
              style={{ textAlign:'center',borderRadius: 10, width: 100, height: 40, margin:20}}
              theme={{colors: {primary: colors.accent, underlineColor: 'transparent'}}}
            />
        </View>
        <View style={{flexDirection:'row', justifyContent:'space-evenly'}}>
        <Button buttonStyle={{backgroundColor: colors.red, borderRadius: 5, paddingHorizontal:20}} title="  Cancel  " onPress={()=> setCustomQtyVisible(false)}/>
          <Button buttonStyle={{ backgroundColor: colors.primary, borderRadius: 5, paddingHorizontal:20}} title="    Save    " onPress={()=> onPressSave()}/>
          </View>
     
       
        
      </Overlay>
      <Overlay isVisible={deletes} onBackdropPress={toggleDelete}>
          <View style={{width: 200, padding: 10}}>
              <Text style={{textAlign:'center', paddingTop: 5, paddingBottom: 15, fontSize: 16, fontWeight:'bold'}}>Are you sure you want to delete this item?</Text>
              <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <Button title="   Save   " onPress={()=> deleteRow()}/>
                <Button title=" Cancel " onPress={()=> {}}/>
              </View>
          </View>
      </Overlay>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    justifyContent: 'center',
    alignItems:'center',
    borderRadius: 5,
    padding: 15,
    height: 150,
  },
  itemName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  itemCode: {
    fontWeight: '600',
    fontSize: 12,
    color: '#fff',
  },
  cellHeaderStyle : {
    paddingVertical: 5,
    color: colors.black,
    fontSize: 15,
    fontWeight: '400'
},
cellStyle : {
      textAlign:'center',

      fontSize: 13,
      fontWeight:'400',
      color: colors.black
  },
  cellContainer: {
    flex: 1, 
    alignSelf: 'stretch'
  },
  cellHeaderContainer: {
    alignSelf: 'stretch', 
    flexDirection: 'row' ,
    justifyContent:'space-between',
    backgroundColor: colors.white,
    padding: 5,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2
  },
  cellFooterStyle:{
    alignSelf: 'stretch',
      flexDirection: 'row',
    justifyContent:'space-between',
    marginHorizontal: 10,
    backgroundColor:colors.white,
    padding: 0,
    borderRadius: 5
  }, 
  footerTextStyle : {
    fontSize: 17,
    fontWeight:'500'
  },
  container: {
    backgroundColor: 'white',
    flex: 1
},
backTextWhite: {
    color: '#FFF'
},
rowFront: {
    alignItems: 'center',
    backgroundColor: '#CCC',
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    justifyContent: 'center',
    height: 50
},
rowBack: {
    alignItems: 'center',
    backgroundColor: '#DDD',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15
},
backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
},
backRightBtnLeft: {
    backgroundColor: 'blue',
    right: 75,
},
backRightBtnRight: {
    backgroundColor: 'red',
    right: 0,
},
stepBtn: {
  backgroundColor: colors.accent,
  borderRadius: 10,
  shadowColor: "#EBECF0",
shadowOffset: {
	width: 0,
	height: 1,
},
shadowOpacity: 0.10,
shadowRadius: 2,
elevation: 2,
marginHorizontal: 10
}
});