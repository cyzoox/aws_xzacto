import React, { createContext, useState, useEffect, useContext } from "react";
import { Auth } from "aws-amplify"; // For authentication

import { generateClient } from 'aws-amplify/api';

// GraphQL Queries
const listStores = `
  query ListStores {
    listStores {
      items {
        id
        name
        location
        ownerId
        createdAt
        updatedAt
      }
    }
  }
`;

const getStaff = `
  query GetStaff($id: ID!) {
    getStaff(id: $id) {
      id
      name
      role
      stores {
        items {
          store {
            id
            name
            location
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`;

const StoreContext = createContext({
  stores: [],
  currentStore: null,
  currentStaff: null,
  staffStores: [],
  fetchStores: () => {},
  setCurrentStore: () => {},
  setCurrentStaff: () => {},
});

const client = generateClient();

export const StoreProvider = ({ children }) => {
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [currentStaff, setCurrentStaff] = useState(null);
  const [staffStores, setStaffStores] = useState([]);
  const [formState, setFormState] = useState({
    name: "",
    location: "",
    ownerId: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize staff and stores on mount
  useEffect(() => {
    let isMounted = true;
    const initializeData = async () => {
      if (!isMounted) return;
      console.log('Initializing store context...');
      try {
        // Get authenticated user
        const user = await Auth.currentAuthenticatedUser();
        if (!user) {
          console.log('No authenticated user found');
          return;
        }

        // Create default store and SuperAdmin staff if no staff exists
        const staffList = await client.graphql({
          query: `query ListStaff {
            listStaff {
              items {
                id
                name
                role
              }
            }
          }`
        });

        if (staffList.data.listStaff.items.length === 0) {
          // Create default store
          const defaultStore = {
            name: 'Default Store',
            location: 'Main Branch',
            ownerId: user.username
          };

          const storeResult = await client.graphql({
            query: `mutation CreateStore($input: CreateStoreInput!) {
              createStore(input: $input) {
                id
                name
                location
                ownerId
              }
            }`,
            variables: { input: defaultStore }
          });

          // Create SuperAdmin staff
          const defaultStaff = {
            id: user.username,
            name: user.username,
            role: 'SuperAdmin',
            password: '00000'
          };

          const staffResult = await client.graphql({
            query: `mutation CreateStaff($input: CreateStaffInput!) {
              createStaff(input: $input) {
                id
                name
                role
              }
            }`,
            variables: { input: defaultStaff }
          });

          // Create StaffStore relationship
          await client.graphql({
            query: `mutation CreateStaffStore($input: CreateStaffStoreInput!) {
              createStaffStore(input: $input) {
                id
                staffId
                storeId
              }
            }`,
            variables: {
              input: {
                staffId: staffResult.data.createStaff.id,
                storeId: storeResult.data.createStore.id
              }
            }
          });
        }

        // Get staff record
        const staffData = await client.graphql({
          query: getStaff,
          variables: { id: user.username }
        });

        const staff = staffData.data.getStaff;
        if (staff) {
          console.log('Staff found:', staff);
          if (!isMounted) return;
          
          setCurrentStaff(staff);
          
          // Fetch all stores
          const storeData = await client.graphql({
            query: listStores,
            variables: {
              filter: {
                // Filter out deleted stores
                _deleted: { ne: true }
              }
            }
          });
          const stores = storeData.data.listStores.items;
          console.log('Stores fetched:', stores);
          if (!isMounted) return;
          
          setStores(stores);
          
          // For SuperAdmin/Admin, set first store as current if none selected
          if (staff.role.includes('SuperAdmin') || staff.role.includes('Admin')) {
            if (!currentStore && stores.length > 0) {
              console.log('Setting default store for admin:', stores[0]);
              setCurrentStore(stores[0]);
            }
          } else {
            // For non-admin roles, set their assigned store
            const assignedStores = staff.stores?.items
              ?.filter(s => s.store && !s.store._deleted)
              ?.map(s => s.store) || [];
            
            if (assignedStores.length > 0 && !currentStore) {
              console.log('Setting assigned store:', assignedStores[0]);
              setCurrentStore(assignedStores[0]);
            }
          }

          // Set staff stores based on role
          if (staff.role === 'SuperAdmin') {
            setStaffStores(stores);
            // Always set first store as current for SuperAdmin
            if (stores.length > 0) {
              console.log('Setting current store for SuperAdmin:', stores[0]);
              setCurrentStore(stores[0]);
            }
          } else {
            // Filter stores based on staff's store access
            const accessibleStores = stores.filter(store => 
              staff.stores?.some(s => s.id === store.id)
            );
            setStaffStores(accessibleStores);
            // Always set first accessible store as current
            if (accessibleStores.length > 0) {
              console.log('Setting current store for staff:', accessibleStores[0]);
              setCurrentStore(accessibleStores[0]);
            }
          }
        } else {
          console.log('No staff record found for user:', user.username);
        }
      } catch (err) {
        console.error('Error initializing data:', err);
      }
    };

    initializeData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch stores and initialize current store if needed
  async function fetchStores() {
    try {
      const storeData = await client.graphql({
        query: listStores,
      });
      const stores = storeData.data.listStores.items;
      console.log('Fetched stores:', stores);
      
      setStores(stores);

      // Initialize staff stores based on role
      if (currentStaff) {
        if (currentStaff.role === 'SuperAdmin') {
          setStaffStores(stores);
          // Always set first store as current for SuperAdmin
          if (stores.length > 0) {
            console.log('Setting current store for SuperAdmin:', stores[0]);
            setCurrentStore(stores[0]);
          }
        } else {
          // Filter stores based on StaffStore relationships
          const staffStoreIds = currentStaff.stores?.map(s => s.id) || [];
          const accessibleStores = stores.filter(store => staffStoreIds.includes(store.id));
          setStaffStores(accessibleStores);
          // Always set first accessible store as current
          if (accessibleStores.length > 0) {
            console.log('Setting current store for staff:', accessibleStores[0]);
            setCurrentStore(accessibleStores[0]);
          }
        }
      } else {
        console.log('No current staff found');
      }
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
      const { name, location, ownerId, password } = formState;
      if (!name || !location) return; // Validate required fields

      const newStore = { name, location, ownerId, password };

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

  const contextValue = {
    stores,
    currentStore,
    setCurrentStore,
    currentStaff,
    setCurrentStaff,
    staffStores,
    formState,
    errorMessage,
    setInput,
    addStore,
    fetchStores
  };

  console.log('StoreContext value:', contextValue);

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
