import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { listStaff } from "../graphql/queries";
import { generateClient } from 'aws-amplify/api';

const client = generateClient();
let hasNavigated = false;

const RoleSelectionScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      if (hasNavigated) return; // Prevent re-navigation
      hasNavigated = true;

      try {
        const storedSession = await AsyncStorage.getItem("staffSession");
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);

          if (sessionData.role === "Admin") {
            navigation.replace("AdminApp", { staffData: sessionData.staffData });
          } else if (sessionData.role === "Cashier") {
            navigation.replace("CashierApp", { staffData: sessionData.staffData });
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    checkSession();
  }, [navigation]);

  const handleRoleSelection = async () => {
    if (!role || !pin) {
      Alert.alert("Error", "Please select a role and enter your PIN.");
      return;
    }
    try {
      const result = await client.graphql({
        query: listStaff,
        variables: { filter: { username: { eq: username }, pin: { eq: pin } } },
      });

      const staff = result.data.listStaff.items;

      if (staff.length === 0) {
        Alert.alert("Error", "Invalid username or PIN.");
        return;
      }

      const [staffData] = staff;

      if (staffData.role && staffData.role.includes(role)) {
        Alert.alert("Success", `Logged in as ${role}`);

        await AsyncStorage.setItem(
          "staffSession",
          JSON.stringify({ role, pin, staffData })
        );

        if (role === "Admin") {
          navigation.replace("AdminApp", { staffData });
        } else if (role === "Cashier") {
          navigation.replace("CashierApp", { staffData });
        }
      } else {
        Alert.alert(
          "Error",
          `Role mismatch. Your available roles: ${staffData.role.join(", ")}.`
        );
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      Alert.alert("Error", "Failed to authenticate. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Role</Text>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === "Admin" && styles.activeRole]}
          onPress={() => setRole("Admin")}
        >
          <Text style={styles.roleText}>Admin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, role === "Cashier" && styles.activeRole]}
          onPress={() => setRole("Cashier")}
        >
          <Text style={styles.roleText}>Cashier</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="PIN"
        value={pin}
        onChangeText={setPin}
        secureTextEntry={true}
        mode="outlined"
        style={styles.input}
      />

      <TouchableOpacity onPress={handleRoleSelection} style={styles.submitButton}>
        <Text style={styles.submitText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  roleContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  roleButton: {
    marginHorizontal: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  activeRole: {
    backgroundColor: "blue",
    borderColor: "blue",
  },
  roleText: {
    color: "black",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "blue",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  submitText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default RoleSelectionScreen;
