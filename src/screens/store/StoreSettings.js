import React, { useState, useEffect } from "react";
import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { listStoreSettings, updateStoreSettings } from "../../graphql/queries";
import { generateClient } from "aws-amplify/api";

const client = generateClient();

export const useTogglePasswordVisibility = () => {
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [rightIcon, setRightIcon] = useState("eye");

  const handlePasswordVisibility = () => {
    setRightIcon((prevIcon) => (prevIcon === "eye" ? "eye-off" : "eye"));
    setPasswordVisibility((prevVisibility) => !prevVisibility);
  };

  return { passwordVisibility, rightIcon, handlePasswordVisibility };
};

const StoreSettings = ({ route, navigation }) => {
  const STORE = route.params.store; // Pass store object from the previous screen
  const { passwordVisibility, rightIcon, handlePasswordVisibility } =
    useTogglePasswordVisibility();

  // Define states
  const [storeName, setStoreName] = useState("");
  const [vat, setVat] = useState(0); // Default to 0
  const [lowStock, setLowStock] = useState(0); // Default to 0
  const [toggle, setToggle] = useState(false); // Default to false
  const [oldPin, setOldPIN] = useState("");
  const [newPin, setNewPIN] = useState("");
  const [visible, setVisible] = useState(false);

  // Fetch store settings
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const result = await client.graphql({
          query: listStoreSettings,
          variables: { filter: { storeId: { eq: STORE.id } } },
        });

        const storeSetting = result.data.listStoreSettings.items;

        if (storeSetting.length > 0) {
          const storeData = storeSetting[0];
          setStoreName(storeData.store_name || "");
          setVat(storeData.vat || 0);
          setLowStock(storeData.lowstock || 0);
          setToggle(storeData.cashierview || false);
          setOldPIN(storeData.password || "");
        }
      } catch (error) {
        console.error("Error fetching store settings:", error.message);
      }
    };

    fetchStoreSettings();
  }, [STORE.id]);

  const onSaveSettings = async () => {
    try {
      const updatedStoreSettings = await client.graphql({
        query: updateStoreSettings,
        variables: {
          input: {
            storeId: STORE.id,
            store_name: storeName,
            lowstock: parseFloat(lowStock),
            vat: parseFloat(vat),
            cashierview: toggle,
            allow_credit: true,
            password: newPin || oldPin, // Update only if new PIN is provided
          },
        },
      });
      console.log("Updated Settings:", updatedStoreSettings);
      navigation.goBack();
    } catch (error) {
      console.error("Error updating store settings:", error.message);
    }
  };

  const toggleView = () => {
    setToggle(!toggle);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ marginBottom: 16 }}>
        <TextInput
          value={storeName}
          label="Store Name"
          onChangeText={(text) => setStoreName(text)}
          mode="outlined"
          style={{ marginHorizontal: 15, marginTop: 10 }}
        />
        <TextInput
          label="VAT"
          value={`${vat}`}
          onChangeText={(text) => setVat(text)}
          mode="outlined"
          keyboardType="numeric"
          style={{ marginHorizontal: 15, marginTop: 10 }}
        />
        <TextInput
          label="Low Stock Warning"
          value={`${lowStock}`}
          onChangeText={(text) => setLowStock(text)}
          mode="outlined"
          keyboardType="numeric"
          style={{ marginHorizontal: 15, marginTop: 10 }}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.inputField, { width: "80%" }]}
            mode="outlined"
            placeholder="Cashier Sales View"
            editable={false}
            value={toggle ? "Enabled" : "Disabled"}
          />
          <TouchableOpacity onPress={toggleView}>
            <MaterialCommunityIcons
              name={toggle ? "toggle-switch" : "toggle-switch-off"}
              size={50}
              color={toggle ? "green" : "red"}
            />
          </TouchableOpacity>
        </View>
        <TextInput
          label="Old PIN"
          secureTextEntry={passwordVisibility}
          value={oldPin}
          mode="outlined"
          style={{ marginHorizontal: 15, marginTop: 10 }}
          right={
            <TextInput.Icon
              name={rightIcon}
              onPress={handlePasswordVisibility}
            />
          }
          editable={false} // Ensure old PIN cannot be edited
        />
        <TextInput
          label="New PIN"
          secureTextEntry={passwordVisibility}
          value={newPin}
          onChangeText={(text) => setNewPIN(text)}
          mode="outlined"
          style={{ marginHorizontal: 15, marginTop: 10 }}
          right={
            <TextInput.Icon
              name={rightIcon}
              onPress={handlePasswordVisibility}
            />
          }
        />
      </ScrollView>
      <TouchableOpacity
        onPress={onSaveSettings}
        style={{
          padding: 10,
          backgroundColor: "blue",
          borderRadius: 15,
          margin: 15,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            color: "white",
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          Save
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginHorizontal: 15,
    paddingVertical: 4,
    backgroundColor: "white",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "grey",
  },
  inputField: {
    borderRadius: 5,
    backgroundColor: "white",
    width: "60%",
    marginLeft: 10,
  },
});

export default StoreSettings;
