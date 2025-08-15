import React from 'react';
import {View} from 'react-native';
import {Overlay} from 'react-native-elements';
import {Headline, Button} from 'react-native-paper';
import colors from '../themes/colors';

const ModalInputFormRevamp = ({
  title,
  children,
  onSave,
  fullScreen,
  isVisible,
  onCancel,
}) => {
  return (
    <Overlay
      isVisible={isVisible}
      overlayStyle={{width: '70%', borderRadius: 20}}
      onBackdropPress={onCancel}
      fullScreen={fullScreen}>
      <View style={{flexDirection: 'row', justifyContent: 'center'}}>
        <Headline>{title}</Headline>
      </View>
      <View style={{margin: 15}}>{children}</View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          marginVertical: 15,
        }}>
        <View style={{flex: 1, marginHorizontal: 15}}>
          <Button mode="contained" buttonColor={colors.red} onPress={onCancel}>
            Cancel
          </Button>
        </View>
        <View style={{flex: 1, marginHorizontal: 15}}>
          <Button mode="contained" buttonColor={colors.yellow} onPress={onSave}>
            Save
          </Button>
        </View>
      </View>
    </Overlay>
  );
};

export default ModalInputFormRevamp;
