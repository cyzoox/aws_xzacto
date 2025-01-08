import React from "react";
import { Text, StyleSheet,SafeAreaView, ScrollView } from "react-native";
import Appbar from "../../components/Appbar";
import CardTiles from "../../components/CardTiles";

const StoreDashboard = ({navigation, route}) => {
  const STORE = route.params.storess;
  return (
    <SafeAreaView style={styles.container}>
    <Appbar
      title="POS Dashboard"
      onMenuPress={() => console.log("Menu pressed")}
      onSearchPress={() => console.log("Search pressed")}
      onNotificationPress={() => console.log("Notifications pressed")}
      onProfilePress={() => console.log("Profile pressed")}
    />
    <ScrollView>
     <CardTiles
          rightTileText="Products"
          leftTileText="Reports"
          iconRightName="md-barcode-outline"
          iconLeftName="../../../assets/xzacto_icons/warehouseicons/report.png"
          leftRouteName="Reports"
          rightRouteName="ProductDashboard"
          centerTileText="Expenses"
          centerRouteName="Expenses"
          iconCenterName="document-text-outline"
          extraProps={STORE}
        />
         <CardTiles
          rightTileText="Products"
          leftTileText="Reports"
          iconRightName="md-barcode-outline"
          iconLeftName="../../../assets/xzacto_icons/warehouseicons/report.png"
          leftRouteName="Reports"
          rightRouteName="Products"
          centerTileText="Expenses"
          centerRouteName="Expenses"
          iconCenterName="document-text-outline"
          extraProps={STORE}
        />
          <CardTiles
          leftTileText="Suppliers"
          iconLeftName="../../../assets/xzacto_icons/warehouseicons/report.png"
          leftRouteName="Supplier"
          centerTileText="Settings"
          centerRouteName="Settings"
          iconCenterName="settings-outline"
          rightTileText="Delivery"
          iconRightName="md-people-circle-outline"
          rightRouteName="DeliveryRequest"
          extraProps={STORE}
        />
          <CardTiles
          rightTileText="Attendants"
          leftTileText="Bills"
          iconRightName="md-people-circle-outline"
          iconLeftName="../../../assets/xzacto_icons/warehouseicons/report.png"
          leftRouteName="BillsAndReceipt"
          rightRouteName="Staffs"
          centerTileText="Customers"
          centerRouteName="Customers"
          iconCenterName="md-people-circle-outline"
          extraProps={STORE}
        />
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 30
  },
  container: { flex: 1 },
});

export default StoreDashboard;
