import React, {useEffect, useState} from 'react';
import {Overlay, Input, Button, Text} from 'react-native-elements';
import {TouchableOpacity} from 'react-native';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

import {TextInput} from 'react-native-paper';
import colors from '../../../themes/colors';

import DeviceInfo from 'react-native-device-info';
// The AddTask is a button for adding tasks. When the button is pressed, an
// overlay shows up to request user input for the new task name. When the
// "Create" button on the overlay is pressed, the overlay closes and the new
// task is created in the realm.
export function AddStaff({ saveStaff, store }) {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('Active');
  const [deviceName, setDeviceName] = useState('');
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    DeviceInfo.getDeviceName().then(setDeviceName); // Set device name
    setDeviceId(DeviceInfo.getDeviceId()); // Set device ID
  }, []);

  const handleCreate = () => {
    if (!name || !password) {
      console.log("Name and Password are required!");
      return;
    }

    saveStaff(
      name,
      store._id,
      store.name,
      password,
      status,
      deviceName,
      deviceId,
      ["cashier"], // Role
      "Active" // Log status
    );

    // Clear fields
    setName('');
    setPassword('');
    setOverlayVisible(false);
  };

  return (
    <>
      <Overlay
        isVisible={overlayVisible}
        overlayStyle={{
          width: '70%',
          paddingHorizontal: 30,
          paddingBottom: 20,
          paddingTop: 15,
        }}
        onBackdropPress={() => setOverlayVisible(false)}
      >
        <>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 10,
            }}
          >
            Add Staff
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            mode="outlined"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            maxLength={6}
            secureTextEntry={true}
          />
          <Button
            title="Create"
            buttonStyle={{ marginTop: 20, backgroundColor: colors.accent }}
            onPress={handleCreate}
          />
        </>
      </Overlay>
      <TouchableOpacity onPress={() => setOverlayVisible(true)}>
        <EvilIcons name={'plus'} size={30} color={colors.white} />
      </TouchableOpacity>
    </>
  );
}
