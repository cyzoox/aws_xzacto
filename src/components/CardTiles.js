import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {Col, Row, Grid} from 'react-native-easy-grid';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../themes/colors';
import {useNavigation} from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

// Map category names to their corresponding icons
const ICON_MAP = {
  Products: require('../../assets/xzacto_icons/iconsstore/products2.png'),
  Bills: require('../../assets/xzacto_icons/iconsstore/bills.png'),
  Reports: require('../../assets/xzacto_icons/warehouseicons/report.png'),
  Staff: require('../../assets/xzacto_icons/warehouseicons/cashier.png'),
  Expenses: require('../../assets/xzacto_icons/iconsstore/expenses.png'),
  Customers: require('../../assets/xzacto_icons/iconsstore/customer.png'),
  Settings: require('../../assets/xzacto_icons/iconsstore/settings3.png'),
  Suppliers: require('../../assets/xzacto_icons/iconsstore/supplier1.png'),
  Warehouse: require('../../assets/xzacto_icons/warehouseicons/warehouse3.png'),
  Deliveries: require('../../assets/delivery-truck.png'),
};

const CardTiles = ({tiles = [], extraProps, numColumns = 5}) => {
  const navigation = useNavigation();

  // Get screen width for responsive sizing
  const screenWidth = Dimensions.get('window').width;

  // Ensure tiles is an array of objects with text, icon, and routeName
  const validTiles = Array.isArray(tiles) ? tiles : [];

  // Calculate rows needed based on numColumns
  const rows = Math.ceil(validTiles.length / numColumns);

  // Calculate column width based on numColumns
  const columnWidth = `${100 / numColumns}%`;

  // Calculate appropriate font size based on screen width and number of columns
  // Base size is 12, but we reduce it for smaller screens or more columns
  const dynamicFontSize = Math.max(
    8,
    Math.min(12, screenWidth / numColumns / 15),
  );

  return (
    <View style={styles.container}>
      <Grid style={styles.grid}>
        {validTiles.map((tile, index) => {
          const iconSource = ICON_MAP[tile.text] || ICON_MAP.Settings; // Fallback icon

          return (
            <Col
              key={`tile-${index}`}
              style={[styles.column, {width: columnWidth}]}>
              <TouchableOpacity
                style={styles.tile}
                onPress={() =>
                  navigation.navigate(tile.routeName, {store: extraProps})
                }
                activeOpacity={0.7}>
                <View style={styles.iconContainer}>
                  <Image source={iconSource} style={styles.icon} />
                </View>
                <Text style={[styles.tileText, {fontSize: dynamicFontSize}]}>
                  {tile.text}
                </Text>
              </TouchableOpacity>
            </Col>
          );
        })}
      </Grid>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  grid: {
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  column: {
    width: '25%', // For 4 columns per row
    paddingHorizontal: 5,
    marginBottom: 15,
  },
  tile: {
    backgroundColor: '#E6F3FA', // Light blue color
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  tileText: {
    fontWeight: '600',
    textAlign: 'center',
    color: '#3A6EA5',
  },
});

export default CardTiles;
