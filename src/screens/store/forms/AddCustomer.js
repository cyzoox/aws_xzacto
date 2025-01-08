import React, {useState} from 'react';
import {Overlay, Input, Button} from 'react-native-elements';
import {TouchableOpacity, View, Text} from 'react-native';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import colors from '../../../themes/colors';

import {TextInput} from 'react-native-paper';


export function AddCustomer({saveCustomer, store}) {

  const [overlayVisible, setOverlayVisible] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [credit_balance, setBalance] = useState(0);
  const [mobile, setMobile] = useState('');
  const [errors, setError] = useState('');
  const [name_errors, setNameError] = useState('');

  const onSave = () => {
    // Input validation
    if (isNaN(credit_balance)) {
      setError("Credit balance must be a number.");
      return;
    }
  
    if (!name || name.length === 0) {
      setError("Name is required.");
      return;
    }
  
    if (!mobile || mobile.length < 10) {
      setError("Valid mobile number is required.");
      return;
    }
  
    // Call saveCustomer with proper arguments
    saveCustomer(
      name.trim(),
      store.id,
      store.store_name,
      address.trim(),
      parseFloat(credit_balance),
      mobile.trim(),
      
    );
  
    setOverlayVisible(false);
  };
  

  return (
    <>
      <Overlay
        isVisible={overlayVisible}
        overlayStyle={{width: '80%', padding: 20}}
        onBackdropPress={() => setOverlayVisible(false)}>
        <>
          <Text
            style={{
              fontSize: 19,
              textAlign: 'center',
              marginBottom: 10,
              marginTop: 5,
            }}>
            Add Customer
          </Text>
          <TextInput
            placeholder="Name"
            mode="outlined"
            onChangeText={text => setName(text)}
            autoFocus={true}
            theme={{
              colors: {primary: colors.accent, underlineColor: 'transparent'},
            }}
          />
          {name_errors.length !== 0 ? (
            <Text
              style={{
                textAlign: 'center',
                color: colors.red,
                marginVertical: 5,
              }}>
              {name_errors}
            </Text>
          ) : null}
          <TextInput
            placeholder="Address"
            mode="outlined"
            onChangeText={text => setAddress(text)}
            theme={{
              colors: {primary: colors.accent, underlineColor: 'transparent'},
            }}
          />
          <TextInput
            placeholder="Mobile #"
            mode="outlined"
            onChangeText={text => setMobile(text)}
            theme={{
              colors: {primary: colors.accent, underlineColor: 'transparent'},
            }}
          />
          <TextInput
            placeholder="Credit Balance (optional)"
            mode="outlined"
            onChangeText={text => setBalance(text)}
            theme={{
              colors: {primary: colors.accent, underlineColor: 'transparent'},
            }}
          />
          {errors.length !== 0 ? (
            <Text
              style={{
                textAlign: 'center',
                color: colors.red,
                marginVertical: 5,
              }}>
              {errors}
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
                buttonStyle={{backgroundColor: colors.red, paddingVertical: 15}}
                title="Cancel"
                onPress={() => {
                  setOverlayVisible(false);
                }}
              />
            </View>
            <View style={{flex: 1, marginHorizontal: 5}}>
              <Button
                buttonStyle={{
                  backgroundColor: colors.yellow,
                  paddingVertical: 15,
                }}
                title="Save"
                onPress={() => {
                  onSave();
                }}
              />
            </View>
          </View>
        </>
      </Overlay>
      <TouchableOpacity onPress={() => setOverlayVisible(true)}>
        <EvilIcons name={'plus'} size={30} color={colors.white} />
      </TouchableOpacity>
    </>
  );
}
