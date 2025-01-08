import React, { useEffect, useState } from "react";
import { Text, StyleSheet, View, TouchableOpacity, FlatList, Picker, Dimensions, ScrollView, TouchableHighlight } from "react-native";
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import AppHeader from "../../components/AppHeader";
import colors from "../../themes/colors";
import moment from 'moment';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import DataTable from "../../components/DataTable";
import {Grid, Col, Row} from 'react-native-easy-grid';
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const { width, height } = Dimensions.get('window');

import { listSaleTransactions } from "../../graphql/queries";
import {generateClient} from 'aws-amplify/api';
import { theme } from "../../constants";
const client = generateClient();

const TransactionScreen = ({ navigation, route }) => {
      const {staffData} = route.params;
    const [selectedValue, setselectedValue] = useState('Today');
    const [visible, setVisible] = useState(false);
    const [selectedstaff, setSelectedStaff] = useState('');
    const [p_Visible, setPVisible] = useState(false);
    const [active, setActive] = useState('');
    const [term, setTerm] = useState('Completed');
    const [selected, setSelected] = useState(0);
    const [attendant_info, setAttendantInfo] = useState([]);

    const [alerts, alertVisible] = useState(false);
    const [items, setItem] = useState([]);
    const [completedTransactions, setCompletedTransactions] = useState([]);
    const [voidedTransactions, setVoidedTransactions] = useState([]);
    const [code, setCode] = useState('');
    const [reason, setReason] = useState('');
    const [pinVisible, setPinVisible] = useState(false);
    const [error, setError] = useState('');
    const keyExtractor = (item, index) => index.toString();
    
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const result = await client.graphql({
      query: listSaleTransactions,
      variables: {
        filter: {
          storeId: {eq: staffData.store_id},
          cashierId: {eq: staffData.id},
        },
      },
    });

    const resultList = result.data.listSaleTransactions.items;

    // Filter transactions
    const completedTransactions = resultList.filter(
      transaction => transaction.status === 'Completed',
    );

    const voidedTransactions = resultList.filter(
      transaction => transaction.status === 'Voided',
    );

    // Set both filtered lists in state
    setCompletedTransactions(completedTransactions);
    setVoidedTransactions(voidedTransactions);
  };

       const renderView = () => {
         if (selected === 0) {
           return (
             <DataTable
               total={0}
               headerTitles={[
                 'Time',
                 'Date',
                 'Type',
                 'Receipt',
                 'Discount',
                 'Amount',
                 'Action',
                 'View',
               ]}
               alignment="center">
               <FlatList
                 keyExtractor={keyExtractor}
                 data={completedTransactions}
                 style={{marginTop: 10, borderRadius: 5}}
                 renderItem={renderItem}
               />
             </DataTable>
           );
         }
         if (selected === 1) {
           return (
             <DataTable
               total={0}
               headerTitles={[
                 'Time',
                 'Date',
                 'Type',
                 'Receipt',
                 'Reason',
                 'Discount',
                 'Amount',
                 'View',
               ]}
               alignment="center">
               <FlatList
                 keyExtractor={keyExtractor}
                 data={voidedTransactions}
                 style={{marginTop: 10, borderRadius: 5}}
                 renderItem={renderVoid}
               />
             </DataTable>
           );
         }
       };

     const renderItem = ({item}) => (
       <Grid>
         <Row style={{height: 30, backgroundColor: colors.white}}>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>
               {moment(item.createdAt).format('MM/DD/YYYY, hh:mm A')}
             </Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>
               {moment(item.createdAt).format('DD MMM YYYY')}
             </Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>{item.paymentMethod}</Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>{item.id}</Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>
               {formatMoney(item.discount, {symbol: '₱', precision: 2})}
             </Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>
               {formatMoney(item.total, {symbol: '₱', precision: 2})}
             </Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <TouchableOpacity
               style={styles.voidStyle}
               onPress={() => {
                 setItem(item), alertVisible(true);
               }}>
               <Text style={{color: colors.white, fontSize: 11}}>VOID</Text>
             </TouchableOpacity>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <TouchableOpacity
               style={styles.voidStyle}
               onPress={() =>
                 navigation.navigate('TransactionDetails', {
                   transactions: item,
                 })
               }>
               <Text style={{color: colors.white, fontSize: 11}}>View</Text>
             </TouchableOpacity>
           </Col>
         </Row>
       </Grid>
     );

     const renderVoid = ({item}) => (
       <Grid>
         <Row style={{height: 30, backgroundColor: colors.white}}>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>
               {moment(item.createdAt).format('MM/DD/YYYY, hh:mm A')}
             </Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>
               {moment(item.createdAt).format('DD MMM YYYY')}
             </Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>{item.payment_method}</Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>{item.timeStamp}</Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>{item.void_reason}</Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>
               {formatMoney(item.discount, {symbol: '₱', precision: 2})}
             </Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <Text style={styles.textColor}>
               {formatMoney(item.total, {symbol: '₱', precision: 2})}
             </Text>
           </Col>
           <Col style={[styles.ColStyle, {alignItems: 'center'}]}>
             <TouchableOpacity
               style={styles.voidStyle}
               onPress={() =>
                 navigation.navigate('TransactionDetailsScreen', {
                   transactions: item,
                 })
               }>
               <Text style={{color: colors.white, fontSize: 11}}>View</Text>
             </TouchableOpacity>
           </Col>
         </Row>
       </Grid>
     );

    return (
      <View style={{flex: 1}}>
        <View style={{flex: 1}}>
          <AppHeader
            centerText="Transactions"
            leftComponent={
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <EvilIcons name={'arrow-left'} size={35} color={colors.white} />
              </TouchableOpacity>
            }
          />
          <SegmentedControl
            style={{
              marginTop: 10,
              backgroundColor: colors.boldGrey,
              marginHorizontal: 10,
            }}
            values={['Completed', 'Voided']}
            selectedIndex={selected}
            onChange={event => {
              setSelected(event.nativeEvent.selectedSegmentIndex);
            }}
          />
          {renderView()}
        </View>
      </View>
    );
}

export default TransactionScreen;


const styles = StyleSheet.create({
  text: {
    fontSize: 30,
  },
  textColor: {
    fontSize: 12,
    color: colors.black,
    fontWeight: '600',
    textAlign: 'center',
  },
  ColStyle: {
    width:
      windowWidth < 375
        ? windowWidth / 4 - 5
        : windowWidth < 414
        ? windowWidth / 4.2 - 3
        : windowWidth / 4.5 - 2,
    justifyContent: 'center',
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.charcoalGrey,
  },
  voidStyle: {
    marginTop: 3,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 10,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    paddingHorizontal: theme.sizes.base * 2,
  },
  avatar: {
    height: theme.sizes.base * 2.2,
    width: theme.sizes.base * 2.2,
  },
  tabs: {
    paddingVertical: 5,
    paddingHorizontal: theme.sizes.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderBottomColor: theme.colors.gray2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: theme.sizes.base,
    marginHorizontal: theme.sizes.base * 2,
  },
  tab: {
    flex: 1,
    marginRight: theme.sizes.base * 2,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 8,
    width: '100%',
  },
  active: {
    backgroundColor: colors.accent,
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  categories: {
    flexWrap: 'wrap',
    paddingHorizontal: theme.sizes.base,
    marginBottom: theme.sizes.base * 3.5,
  },
  category: {
    // this should be dynamic based on screen width
    minWidth: (width - theme.sizes.padding * 5.5 - theme.sizes.base) / 2,
    maxWidth: (width - theme.sizes.padding * 5.5 - theme.sizes.base) / 2,
    maxHeight: (width - theme.sizes.padding * 5.5 - theme.sizes.base) / 2,
  },
  imageThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
    width: width / 3.5,
    backgroundColor: 'gray',
  },
  MainContainer: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.1,
    width,
    paddingBottom: theme.sizes.base * 4,
  },
  upperContainer: {
    paddingVertical: 10,
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 10,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
  },
  filterStyle: {
    backgroundColor: colors.white,
    paddingVertical: 9,
    width: '45%',
    borderRadius: 5,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
    borderColor: colors.white,
    borderWidth: 1,
  },
  storeList: {
    flex: 1,
    borderColor: colors.boldGrey,
    borderWidth: 1,
    paddingVertical: 8,
    marginVertical: 5,
    borderRadius: 10,
    backgroundColor: colors.white,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 2,
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