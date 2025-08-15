import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {generateClient} from 'aws-amplify/api';
import {useRoute, useNavigation} from '@react-navigation/native';
import * as queries from '../../graphql/queries';
import Appbar from '../../components/Appbar';

const client = generateClient();

const CustomerDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {customerId} = route.params;
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetails();
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      const customerData = await client.graphql({
        query: queries.getCustomer, 
        variables: {id: customerId}
      });
      setCustomer(customerData.data.getCustomer);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      Alert.alert('Error', 'Could not fetch customer details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('CustomerScreen', {customerToEditId: customer.id});
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.centeredContainer}>
        <Text>Customer not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar title="Customer Details" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>{customer.name}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{customer.email || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{customer.phone || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Points:</Text>
            <Text style={styles.value}>{customer.points || 0}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Allow Credit:</Text>
            <Text style={styles.value}>{customer.allowCredit ? 'Yes' : 'No'}</Text>
          </View>
          {customer.allowCredit && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Credit Limit:</Text>
              <Text style={styles.value}>{customer.creditLimit || 0}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Credit Balance:</Text>
            <Text style={styles.value}>{customer.creditBalance || 0}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>Edit Customer</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: '#666',
  },
  editButton: {
    backgroundColor: '#007BFF',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomerDetailScreen;
