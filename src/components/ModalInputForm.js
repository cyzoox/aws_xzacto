import React, {useState} from 'react';
import {Overlay, Input, Button, Text} from 'react-native-elements';
import {TouchableOpacity, View, StatusBar} from 'react-native';

import colors from '../themes/colors';

import {Title, TextInput, Headline} from 'react-native-paper';
// The AddTask is a button for adding tasks. When the button is pressed, an
// overlay shows up to request user input for the new task name. When the
// "Create" button on the overlay is pressed, the overlay closes and the new
// task is created in the realm.
const ModalInputForm = ({
  title,
  children,
  onSave,
  fullScreen,
  displayComponent,
})=> {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const onClickSave = () => {
    onSave(), setOverlayVisible(false);
  };

  return (
    <>
      <Overlay
        isVisible={overlayVisible}
        overlayStyle={{width: '70%', borderRadius: 20}}
        onBackdropPress={() => setOverlayVisible(false)}
        fullScreen={fullScreen}>
        <View>
          <View style={{flexDirection: 'row', justifyContent: 'center'}}>
            <Headline>{title}</Headline>
          </View>
        </View>
        <View style={{margin: 15}}>{children}</View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            marginVertical: 15,
          }}>
          <View style={{flex: 1, marginHorizontal: 15}}>
            <Button
              buttonStyle={{backgroundColor: colors.red}}
              title="Cancel"
              onPress={() => setOverlayVisible(false)}
            />
          </View>
          <View style={{flex: 1, marginHorizontal: 15}}>
            <Button
              buttonStyle={{backgroundColor: colors.yellow}}
              title="Save"
              onPress={() => onClickSave()}
            />
          </View>
        </View>
      </Overlay>
      <TouchableOpacity
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => setOverlayVisible(true)}>
        {displayComponent}
      </TouchableOpacity>
    </>
  );
}
export default ModalInputForm;