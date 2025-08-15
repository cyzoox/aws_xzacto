import React, {useState, useEffect} from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  SafeAreaView,
  FlatList,
} from 'react-native';
import AppHeader from '../../components/AppHeader';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import colors from '../../themes/colors';
import AlertwithChild from '../../components/AlertwithChild';
import {Col, Grid, Row} from 'react-native-easy-grid';
import List from '../../components/List';
import {TextInput, Checkbox} from 'react-native-paper';
import AmountKeys from '../../components/AmountKeys';

import {generateClient} from 'aws-amplify/api';
import {listCustomers} from '../../graphql/queries';
import Appbar from '../../components/Appbar';
const client = generateClient();

const CheckoutScreen = ({navigation, route}) => {
  const {staffData} = route.params;

  const [id, setCusId] = useState('');
  const [name, setCusName] = useState('');
  
  // Customer selection state variables
  const [customerSelectionVisible, setCustomerSelectionVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  const [creditVisible, setCreditVisible] = useState(false);
  const [alerts, setAlert] = useState(false);
  const [nocustomer, AlertNoCustomer] = useState(false);
  const [received, setReceive] = useState(0);
  const [change, setChange] = useState(0);
  const [discounts, setDiscount] = useState(0);
  const [value, setValue] = useState(0);
  const [vertValue, setVertValue] = useState(0);
  const [custom_discount, setCustomDiscount] = useState(false);
  const [discountVisible, setDiscountVisible] = useState(false);
  const [selected, setSelected] = useState(0);
  const [scanner, setScanner] = useState(false);
  const [cameraType, setCameraType] = useState('back');
  const [torchMode, setTorchMode] = useState('off');
  const [discount_name, setDiscountName] = useState('');
  const [autoPrint, setAutoPrint] = useState(false);
  const [checked, setChecked] = useState(false);
  const [custom_customer, setCustomCustomer] = useState('');
  const {height, width} = Dimensions.get('window');
  const isLandscape = width > height;
  const onCancelCustomDisc = () => {
    setDiscountVisible(false);
    setSelected(0);
  };

  // Fetch customers from database
  const fetchCustomers = async () => {
    try {
      const response = await client.graphql({
        query: listCustomers
      });
      const customerData = response.data.listCustomers.items || [];
      setCustomers(customerData);
      setFilteredCustomers(customerData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };
  
  // Filter customers based on search term
  const filterCustomers = (searchTerm) => {
    setCustomerSearchTerm(searchTerm);
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    
    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
    setFilteredCustomers(filtered);
  };
  
  // Close customer selection modal
  const closeCustomerSelection = () => {
    setCustomerSelectionVisible(false);
    setCustomerSearchTerm('');
    setFilteredCustomers(customers);
  };
  
  // Select a customer
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    closeCustomerSelection();
  };
  
  // Clear selected customer
  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
  };
  
  // Load customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Appbar
        title={'Checkout'}
        onBack={() => {setDiscount(0); navigation.goBack()}}
      />
      {/* <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            setDiscount(0);
            navigation.goBack();
          }}>
          <EvilIcons name={'arrow-left'} size={35} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View> */}
      
      {/* Customer Selection Button */}
      <View style={styles.customerSelectionContainer}>
        <TouchableOpacity 
          style={styles.customerSelectButton}
          onPress={() => setCustomerSelectionVisible(true)}>
          <Text style={styles.customerSelectLabel}>
            {selectedCustomer ? selectedCustomer.name : "Select Customer"}
          </Text>
          <EvilIcons name="chevron-down" size={24} color={colors.primary} />
        </TouchableOpacity>
        {selectedCustomer && (
          <View style={styles.customerInfoContainer}>
            <Text style={styles.customerInfoText}>
              {selectedCustomer.points ? `Points: ${selectedCustomer.points}` : ''}
              {selectedCustomer.creditLimit ? ` | Credit Limit: ${selectedCustomer.creditLimit}` : ''}
            </Text>
            <TouchableOpacity 
              onPress={clearSelectedCustomer}
              style={styles.clearCustomerButton}>
              <EvilIcons name="close" size={22} color={colors.darkGrey} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Customer Selection Modal */}
        <AlertwithChild
          visible={customerSelectionVisible}
          onCancel={closeCustomerSelection}
          onProceed={closeCustomerSelection}
          title="Select Customer"
          confirmTitle="CLOSE"
          overlayStyle={styles.customerModalContainer}>
          <View style={styles.searchInputContainer}>
            <EvilIcons name="search" size={24} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or phone..."
              value={customerSearchTerm}
              onChangeText={filterCustomers}
              placeholderTextColor="#888"
            />
            {customerSearchTerm.length > 0 && (
              <TouchableOpacity onPress={() => filterCustomers('')}>
                <EvilIcons name="close" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            style={styles.customerListContainer}
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={({ item: customer }) => (
              <TouchableOpacity
                style={styles.customerItem}
                onPress={() => selectCustomer(customer)}>
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{customer.name}</Text>
                  <Text style={styles.customerPhone}>{customer.phone || 'No phone'}</Text>
                </View>
                <View style={styles.customerDetails}>
                  {customer.creditLimit > 0 && (
                    <View style={styles.creditBadge}>
                      <Text style={styles.creditBadgeText}>Credit</Text>
                    </View>
                  )}
                  {customer.points > 0 && (
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsBadgeText}>{customer.points} PTS</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.noCustomersContainer}>
                <Text style={styles.noCustomersText}>
                  {customerSearchTerm ? 'No customers found' : 'No customers yet'}
                </Text>
              </View>
            )}
          />

        </AlertwithChild>
        
        {/* Discount Modal */}
        <AlertwithChild
          visible={discountVisible}
          onCancel={onCancelCustomDisc}
          onProceed={() => {
            setDiscountVisible(false);
          }}
          title="Choose Discount"
          confirmTitle="SAVE"
          overlayStyle={styles.modalContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.modalTitle}>Discount Details</Text>
            <View style={styles.discountInputWrapper}>
              <Text style={styles.discountLabel}>Discount Name</Text>
              <TextInput
                mode="outlined"
                value={discount_name}
                onChangeText={setDiscountName}
                placeholder="e.g., Senior Citizen, PWD"
                style={styles.discountTextInput}
                theme={{
                  colors: {
                    primary: colors.accent,
                    background: '#f7f7f7',
                  },
                  roundness: 8,
                }}
              />
            </View>
          </View>

          <View style={styles.presetDiscountRow}>
            <TouchableOpacity
              onPress={() => setSelected(5)}
              style={selected === 5 ? styles.discountButton2 : styles.discountButton}>
              <Text style={selected === 5 ? styles.discountTextSelected : styles.discountText}>
                5%
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelected(10)}
              style={selected === 10 ? styles.discountButton2 : styles.discountButton}>
              <Text style={selected === 10 ? styles.discountTextSelected : styles.discountText}>
                10%
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.customDiscountRow}>
            <Text style={styles.customDiscountLabel}>Custom Discount</Text>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              placeholder="0"
              style={styles.customDiscountInput}
              onChangeText={text => setSelected(parseFloat(text) || 0)}
              right={<TextInput.Affix text="%" />}
              theme={{
                colors: {
                  primary: colors.accent,
                  background: '#f7f7f7',
                },
                roundness: 8,
              }}
            />
          </View>
        </AlertwithChild>
        <Grid
          style={[
            styles.gridContainer,
            {
              flexDirection: isLandscape ? 'row' : 'column',
            },
          ]}>
          {isLandscape ? (
            // Landscape layout - side by side
            <>
              <Row size={1} style={[styles.listContainer, {width: '50%'}]}>
                <List
                  screen={route.name}
                  discount_visible={setDiscountVisible}
                  discount={selected}
                  staff={staffData}
                />
              </Row>
              <Row
                size={1}
                style={[
                  styles.amountContainer,
                  {width: '50%', alignSelf: 'center'},
                ]}>
                <AmountKeys
                  cashReceive={setReceive}
                  Change={setChange}
                  discount={selected}
                  discountName={discount_name}
                  setCreditVisible={setCreditVisible}
                  navigation={navigation}
                  staff={staffData}
                  customer={selectedCustomer}
                />
              </Row>
            </>
          ) : (
            // Portrait layout - stacked
            <>
              <Row size={1} style={styles.listContainer}>
                <List
                  screen={route.name}
                  discount_visible={setDiscountVisible}
                  discount={selected}
                  staff={staffData}
                />
              </Row>
              <Row style={styles.portraitAmountKeysRow}>
                <View style={styles.portraitAmountKeysContainer}>
                  <AmountKeys
                    cashReceive={setReceive}
                    Change={setChange}
                    discount={selected}
                    discountName={discount_name}
                    setCreditVisible={setCreditVisible}
                    navigation={navigation}
                    staff={staffData}
                    customer={selectedCustomer}  // Pass selected customer
                  />
                </View>
              </Row>
            </>
          )}
        </Grid>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // New, Modern Customer Selection Styles
  customerSelectionContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerSelectLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  customerInfoContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfoText: {
    fontSize: 14,
    color: colors.darkGrey,
  },
  clearCustomerButton: {
    padding: 5,
  },

  // New, Modern Customer Modal Styles
  customerModalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 15,
    padding: 0, // Remove padding to allow full-width header/footer
    overflow: 'hidden', // Ensures children conform to border radius
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9', // A slightly different background for the search bar
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 0, // Remove default border from text input
  },
  customerListContainer: {
    // No specific styles needed here if the ScrollView is plain
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20, // Add more horizontal padding
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  customerInfo: {},
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  customerPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  customerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 5,
  },
  creditBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pointsBadge: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointsBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noCustomersContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noCustomersText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    color: colors.white,
    fontWeight: 'bold',
  },
  discountInputWrapper: {
    marginBottom: 20, // Add some bottom margin for scrolling
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    minHeight: 500, // Ensure a minimum height even on small screens
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
  },
  amountContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portraitAmountKeysRow: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  portraitAmountKeysContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 0,
    marginHorizontal: 'auto',
    alignSelf: 'center',
   
  },
  discountButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  discountButton2: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  discountText: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  discountTextSelected: {
    color: colors.white,
    fontWeight: 'bold',
  },
  discountInputWrapper: {
    marginVertical: 10,
  },
  discountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 8,
  },
  discountTextInput: {
    fontSize: 16,
  },
  presetDiscountRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 10,
  },
  customDiscountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  customDiscountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.darkGray,
  },
  customDiscountInput: {
    width: 120,
    textAlign: 'right',
  },
  actionButton: {
    backgroundColor: colors.white,
    justifyContent: 'center',
    padding: 8,
    borderRadius: 10,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  actionIcon: {
    padding: 5,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: colors.primary,
  },
  inputContainer: {
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
});

export default CheckoutScreen;
