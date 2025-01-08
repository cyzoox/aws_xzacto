import React, { createContext, useState, useEffect, useContext } from "react";
import { Auth } from "aws-amplify"; // For authentication
import client from "../path/to/graphql/client"; // Update this path to your GraphQL client
import { listStores, createStore } from "../graphql/queries"; // Update paths for queries
import { uploadData } from "../path/to/s3/utils"; // Update path for your S3 utils
import { generateClient } from 'aws-amplify/api';

const StoreContext = createContext();
const client = generateClient();

export const StoreProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [formState, setFormState] = useState({
    store_name: "",
    branch: "",
    owner: "",
    password: "",
    confirmPassword: "",
    store_type: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch the authenticated user's ID and fetch stores on mount
  useEffect(() => {
    fetchStores();
  }, []);

  // Fetch stores
  async function fetchStores() {
    try {
      const storeData = await client.graphql({
        query: listStores,
      });
      const stores = storeData.data.listStores.items;

      // Sync the stores list to S3 as a JSON file
      const fileContent = JSON.stringify(stores);
      const fileName = `stores-${new Date().toISOString()}.json`;

      await uploadData({
        key: fileName,
        body: fileContent,
        contentType: "application/json",
      });

      console.log(`Stores synced to S3 with file name: ${fileName}`);
      setStores(stores);
    } catch (err) {
      console.error("Error fetching stores:", err);
    }
  }

  // Add a new store
  async function addStore() {
    if (formState.password !== formState.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    if (formState.password.length < 5) {
      setErrorMessage("Password must be at least 5 characters long");
      return;
    }

    try {
      const { store_name, branch, owner, password, store_type } = formState;
      if (!store_name || !branch) return; // Validate required fields

      const newStore = { store_name, branch, owner, password, store_type };

      await client.graphql({
        query: createStore,
        variables: { input: newStore },
      });

      setFormState({
        store_name: "",
        branch: "",
        owner: formState.owner,
        password: "",
        confirmPassword: "",
        store_type: "",
      });
      setErrorMessage("");
      fetchStores(); // Refresh the store list
    } catch (err) {
      console.error("Error creating store:", err);
    }
  }

  // Update form state
  function setInput(key, value) {
    setFormState((prevState) => ({ ...prevState, [key]: value }));
  }

  return (
    <StoreContext.Provider
      value={{
        stores,
        formState,
        errorMessage,
        setInput,
        fetchStores,
        addStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  return useContext(StoreContext);
};
