import React, {useEffect, useState} from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  TouchableHighlight,
  ScrollView,
} from 'react-native';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import colors from '../../themes/colors';
import {ListItem, Card, Overlay} from 'react-native-elements';
import formatMoney from 'accounting-js/lib/formatMoney.js';
// import SmoothPinCodeInput from 'react-native-smooth-pincode-input';
import moment from 'moment';
import {useFocusEffect} from '@react-navigation/native';
import AppHeader from '../../components/AppHeader';
import AlertwithChild from '../../components/AlertwithChild';
import SearchInput, {createFilter} from 'react-native-search-filter';
import {listSale} from '../../graphql/queries';
import {generateClient} from 'aws-amplify/api';
const client = generateClient();

const TransactionDetailsScreen = ({navigation, route}) => {
    const {transactions} = route.params;
const [reason, setReason] = useState('');
const [alerts, alertVisible] = useState(false);
const [pinVisible, setPinVisible] = useState(false);
const [error, setError] = useState('');
const [code, setCode] = useState('');
const [items, setItem] = useState([]);
const [sales, setSales] = useState([]);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    const result = await client.graphql({
      query: listSale,
      variables: {
        filter: {
          transactionId: {eq: transactions.id},
         
        },
      },
    });
    const salesList = result.data.listSale.items;
    setSales(salesList);
  };

const onCancelAlert = () => {
  alertVisible(false);
};


 const renderItem = ({item}) =>
   item.status == 'Completed' && (
     <View
       style={{
         flexDirection: 'row',
         justifyContent: 'space-between',
         marginHorizontal: 10,
         marginVertical: 10,
       }}>
       <View style={{flexDirection: 'row'}}>
         {/* <Text style={{textAlign: 'center', paddingRight: 30}}>
           x{Math.round(item.quantity * 100) / 100}
         </Text> */}
         <View style={{flexDirection: 'column'}}>
           <Text>{item.name}</Text>
           {/* <Text>
             with {item.addon}, {item.option}
           </Text> */}
         </View>
       </View>

       <Text style={{color: colors.statusBarCoverDark, textAlign: 'center'}}>
         {formatMoney(item.quantity * item.price, {
           symbol: '₱',
           precision: 2,
         })}
       </Text>
       {sales.length === 1 && item.quantity === 1 ? null : (
         <TouchableOpacity
           onPress={() => {
             alertVisible(true), setItem(item);
           }}
           style={{
             width: 50,
             backgroundColor: colors.red,
             justifyContent: 'center',
             alignItems: 'center',
             paddingHorizontal: 5,
             borderRadius: 15,
             height: 30,
           }}>
           <Text style={{fontSize: 10, color: colors.white}}>Void</Text>
         </TouchableOpacity>
       )}
     </View>
   );

 const calculateTotal = () => {
   let total = 0;
   sales.forEach(list => {
     if (list.status == 'Completed') {
       total += list.quantity * (list.sprice + list.addon_price);
     }
   });
   return total;
 };

 const onProceed = () => {
//   s onVoidSingleTransaction(items, reason);
   setPinVisible(false);
   alertVisible(false);
 };

 const printReceipt = () => {
    // Implement the print receipt functionality here
    console.log("Print receipt");
  };

  return (
    <View style={{flex: 1}}>
      <AlertwithChild
        visible={alerts}
        onCancel={onCancelAlert}
        onProceed={() => setPinVisible(true)}
        title="Void Item?"
        confirmTitle="PROCEED">
        <View
          style={{
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            marginVertical: 2,
            alignItems: 'center',
          }}>
          <Text>Please select reason: </Text>
          <View style={{flexDirection: 'row', marginTop: 10}}>
            <TouchableOpacity
              style={
                reason === 'Return' ? styles.selectedBtn : styles.reasonBTn
              }
              onPress={() => setReason('Return')}>
              <Text
                style={
                  reason === 'Return'
                    ? {fontSize: 13, color: colors.white, fontWeight: 'bold'}
                    : {fontSize: 13, color: colors.black, fontWeight: 'bold'}
                }>
                Return
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={
                reason === 'Change Item' ? styles.selectedBtn : styles.reasonBTn
              }
              onPress={() => setReason('Change Item')}>
              <Text
                style={
                  reason === 'Change Item'
                    ? {fontSize: 12, color: colors.white, fontWeight: 'bold'}
                    : {fontSize: 12, color: colors.black, fontWeight: 'bold'}
                }>
                Change Item
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={
                reason === 'Refunded' ? styles.selectedBtn : styles.reasonBTn
              }
              onPress={() => setReason('Refunded')}>
              <Text
                style={
                  reason === 'Refunded'
                    ? {fontSize: 13, color: colors.white, fontWeight: 'bold'}
                    : {fontSize: 13, color: colors.black, fontWeight: 'bold'}
                }>
                Refunded
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AlertwithChild>
      {/* <AlertwithChild
        visible={pinVisible}
        onCancel={() => setPinVisible(false)}
        onProceed={() => onProceed()}
        title="Enter your code"
        confirmTitle="PROCEED">
        <View
          style={{
            flexDirection: 'column',
            justifyContent: 'space-evenly',
            marginVertical: 2,
            alignItems: 'center',
          }}>
          <View style={{padding: 20}}>
            <SmoothPinCodeInput
              password
              mask="﹡"
              cellStyle={{
                borderWidth: 1,
                borderColor: 'gray',
                borderRadius: 15,
              }}
              cellSize={35}
              codeLength={6}
              value={code}
              onTextChange={code => setCode(code)}
            />

            {error.length !== 0 ? (
              <Text style={{textAlign: 'center', color: colors.red}}>
                {error}
              </Text>
            ) : null}
          </View>
        </View>
      </AlertwithChild> */}
      <AppHeader
        centerText="Transaction Details"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <EvilIcons name={'arrow-left'} size={35} color={colors.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={{padding: 15, backgroundColor: colors.white}}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            padding: 15,
          }}>
          <View>
            <Text style={{fontWeight: '500'}}>
              Customer :{' '}
              {transactions.customerName ? transactions.customerName : 'None'}
            </Text>
            <Text style={{fontWeight: '500'}}>Date : {transactions.date}</Text>
            <Text style={{fontWeight: '500'}}>
              Receipt # : {transactions.id}
            </Text>
            <Text style={{fontWeight: '500'}}>
              Status : {transactions.status}
            </Text>
            <Text style={{fontWeight: '500'}}>
              Customer Name : {transactions.customerName}
            </Text>
            <Text style={{fontWeight: '500'}}>
              Cashier Name : {transactions.cashier}
            </Text>
          </View>
          <TouchableOpacity onPress={() => printReceipt()}>
            <AntDesign name={'printer'} size={25} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ListItem bottomDivider>
          <ListItem.Content
            style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <View style={{flexDirection: 'row'}}>
              <Text style={{fontWeight: 'bold', paddingRight: 20}}>Qty</Text>
              <Text style={{fontWeight: 'bold'}}>Product</Text>
            </View>

            <Text style={{fontWeight: 'bold'}}>Total</Text>
            <Text style={{fontWeight: 'bold'}}>Action</Text>
          </ListItem.Content>
        </ListItem>
        <FlatList
          keyExtractor={key => key.name}
          data={sales}
          renderItem={renderItem}
        />
        <ListItem>
          <ListItem.Content
            style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text>Sub Total</Text>
            <Text></Text>
            <Text style={{color: colors.statusBarCoverDark}}>
              {formatMoney(calculateTotal(), {symbol: '₱', precision: 2})}
            </Text>
          </ListItem.Content>
        </ListItem>
        <ListItem style={{marginTop: -20}}>
          <ListItem.Content
            style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={{fontWeight: 'bold', color: colors.red}}>
              Discount
            </Text>
            <Text></Text>
            <Text style={{fontWeight: 'bold', color: colors.red}}>
              -
              {formatMoney(transactions.discount, {
                symbol: '₱',
                precision: 2,
              })}
            </Text>
          </ListItem.Content>
        </ListItem>
        <ListItem style={{marginTop: -20}}>
          <ListItem.Content
            style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text
              style={{fontWeight: 'bold', fontSize: 18, color: colors.green}}>
              Total
            </Text>
            <Text></Text>
            <Text
              style={{fontWeight: 'bold', fontSize: 18, color: colors.green}}>
              {formatMoney(calculateTotal() - transactions.discount, {
                symbol: '₱',
                precision: 2,
              })}
            </Text>
          </ListItem.Content>
        </ListItem>
        <ListItem style={{marginTop: -20}}>
          <ListItem.Content
            style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text>VAT Sales</Text>
            <Text></Text>
            <Text>
              {formatMoney(
                calculateTotal() -
                  (calculateTotal() - transactions.discount) * 0.12,
                {symbol: '₱', precision: 2},
              )}
            </Text>
          </ListItem.Content>
        </ListItem>
        <ListItem style={{marginTop: -20}}>
          <ListItem.Content
            style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text>VAT Amount</Text>
            <Text></Text>
            <Text>
              {formatMoney((calculateTotal() - transactions.discount) * 0.12, {
                symbol: '₱',
                precision: 2,
              })}
            </Text>
          </ListItem.Content>
        </ListItem>
        <View style={{margin: 15}}>
          <Text style={{textAlign: 'center'}}>Voided Products</Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 10,
            }}>
            <Text style={{flex: 2}}>Item</Text>
            <Text style={{flex: 1}}>Total</Text>
            <Text>Reason</Text>
          </View>
          <View>
            {sales.map(
              item =>
                item.status == 'Voided' && (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginVertical: 10,
                    }}>
                    <Text style={{textAlign: 'left', flex: 2}}>
                      x{item.quantity} {item.name}
                    </Text>
                    <Text style={{flex: 1, textAlign: 'center'}}>
                      {formatMoney(
                        item.quantity * (item.sprice + item.addon_price),
                        {symbol: '₱', precision: 2},
                      )}
                    </Text>
                    <Text style={{flex: 1, textAlign: 'center'}}>
                      {item.void_reason}
                    </Text>
                  </View>
                ),
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  text: {
    fontSize: 30,
  },
  reasonBTn: {
    padding: 6,
    borderColor: colors.black,
    borderWidth: 1,
    backgroundColor: colors.white,
    borderRadius: 15,
    marginVertical: 10,
    marginHorizontal: 2,
  },
  selectedBtn: {
    padding: 6,
    borderColor: colors.primary,
    borderWidth: 1,
    backgroundColor: colors.primary,
    borderRadius: 15,
    marginVertical: 10,
    marginHorizontal: 2,
  },
  openButton: {
    backgroundColor: '#F194FF',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default TransactionDetailsScreen;