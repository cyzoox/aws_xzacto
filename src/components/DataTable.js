import React from 'react';
import {StyleSheet, ScrollView, FlatList, View, Dimensions} from 'react-native';
import {Grid, Col, Row} from 'react-native-easy-grid';
import {Text} from 'react-native-elements';

import formatMoney from 'accounting-js/lib/formatMoney.js';
import colors from '../themes/colors';
import Spacer from './Spacer';
const windowWidth = Dimensions.get('window').width;
const DataTable = ({alignment, headerTitles, children, total, colStyle}) => {
  return (
    <View style={{flex: 1}}>
      <Grid>
        <Row
          style={{
            height: 40,
            backgroundColor: colors.coverDark,
            marginHorizontal: 5,
          }}>
          {headerTitles.map((rowData, index) => (
            <Col
              key={rowData}
              style={[
                colStyle ? colStyle[index] : styles.ColStyle,
                {alignItems: alignment},
              ]}>
              <Text style={styles.textColor}>{rowData}</Text>
            </Col>
          ))}
        </Row>
        {children}
      </Grid>
      <View style={styles.footerContainer}>
        <View>
          <Text style={styles.footerBar}>Total</Text>
        </View>

        <View>
          <Text style={styles.footerBar}>
            {formatMoney(total, {symbol: '₱', precision: 2})}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  textColor: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
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
  },
  footerBar: {
    color: colors.white,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 10,
    backgroundColor: colors.coverDark,
    padding: 5,
    paddingHorizontal: 5,
  },
});

export default DataTable;
