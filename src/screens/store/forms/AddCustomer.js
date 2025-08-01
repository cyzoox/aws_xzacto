import React, { useState } from 'react';
import { Overlay, Button } from 'react-native-elements';
import { TouchableOpacity, View, Text, ScrollView } from 'react-native';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import colors from '../../../themes/colors';
import { TextInput } from 'react-native-paper';


export function AddCustomer({ saveCustomer, store }) {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [points, setPoints] = useState('0');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const onSave = () => {
    // Reset any previous errors
    setError('');
    
    // Input validation
    if (!name || name.trim().length === 0) {
      setError("Name is required");
      return;
    }
    
    // Phone validation only if provided
    if (phone && phone.length < 10) {
      setError("Please enter a valid phone number or leave it empty");
      return;
    }
    
    if (points && isNaN(points)) {
      setError("Points must be a number");
      return;
    }
    
    // Call saveCustomer with proper arguments for DataStore
    // Parameter order: name, storeId, storeName, address, points, phone, email
    saveCustomer(
      name.trim(),
      store.id,
      store.name,
      address.trim(),
      parseInt(points) || 0,
      phone.trim(),
      email.trim()
    );
    
    // Reset form fields
    resetForm();
    
    // Close overlay
    setOverlayVisible(false);
  };
  
  const resetForm = () => {
    setName('');
    setAddress('');
    setPoints('0');
    setPhone('');
    setEmail('');
    setError('');
  };
  

  return (
    <>
      <Overlay
        isVisible={overlayVisible}
        overlayStyle={{width: '85%', padding: 20, maxHeight: '80%'}}
        onBackdropPress={() => setOverlayVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text
            style={{
              fontSize: 20,
              textAlign: 'center',
              marginBottom: 15,
              marginTop: 5,
              fontWeight: 'bold',
              color: colors.primary
            }}>
            Add New Customer
          </Text>
          
          <TextInput
            label="Name"
            placeholder="Customer name"
            mode="outlined"
            value={name}
            onChangeText={text => setName(text)}
            autoFocus={true}
            style={{marginBottom: 10}}
            theme={{
              colors: {primary: colors.accent, underlineColor: 'transparent'},
            }}
          />
          
          <TextInput
            label="Phone (Optional)"
            placeholder="Phone number"
            mode="outlined"
            value={phone}
            onChangeText={text => setPhone(text)}
            keyboardType="phone-pad"
            style={{marginBottom: 10}}
            theme={{
              colors: {primary: colors.accent, underlineColor: 'transparent'},
            }}
          />
          
          <TextInput
            label="Email (Optional)"
            placeholder="Email address"
            mode="outlined"
            value={email}
            onChangeText={text => setEmail(text)}
            keyboardType="email-address"
            style={{marginBottom: 10}}
            theme={{
              colors: {primary: colors.accent, underlineColor: 'transparent'},
            }}
          />
          
          <TextInput
            label="Address"
            placeholder="Customer address"
            mode="outlined"
            value={address}
            onChangeText={text => setAddress(text)}
            style={{marginBottom: 10}}
            theme={{
              colors: {primary: colors.accent, underlineColor: 'transparent'},
            }}
          />
          
          <TextInput
            label="Points (Optional)"
            placeholder="Customer points"
            mode="outlined"
            value={points}
            onChangeText={text => setPoints(text)}
            keyboardType="numeric"
            style={{marginBottom: 10}}
            theme={{
              colors: {primary: colors.accent, underlineColor: 'transparent'},
            }}
          />
          
          {error ? (
            <Text
              style={{
                textAlign: 'center',
                color: colors.red,
                marginVertical: 10,
                fontWeight: '500'
              }}>
              {error}
            </Text>
          ) : null}
          
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-evenly',
              marginVertical: 15,
            }}>
            <View style={{flex: 1, marginHorizontal: 5}}>
              <Button
                buttonStyle={{backgroundColor: '#999', paddingVertical: 12}}
                title="Cancel"
                onPress={() => {
                  resetForm();
                  setOverlayVisible(false);
                }}
              />
            </View>
            <View style={{flex: 1, marginHorizontal: 5}}>
              <Button
                buttonStyle={{
                  backgroundColor: colors.accent,
                  paddingVertical: 12,
                }}
                title="Save"
                onPress={onSave}
              />
            </View>
          </View>
        </ScrollView>
      </Overlay>
      <TouchableOpacity onPress={() => setOverlayVisible(true)}>
        <EvilIcons name={'plus'} size={30} color={colors.white} />
      </TouchableOpacity>
    </>
  );
}
