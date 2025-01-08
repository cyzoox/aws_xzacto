import React from 'react';
import SimplePin from 'react-native-simple-pin'
import { Alert } from 'react-native'

const PinCodeInput = ({pinCode, onCheckPassword}) => (
    <SimplePin
        pin={Object.assign([], pinCode)}
        title="Enter PIN"
        repeatTitle="Repeat your PIN"
        onSuccess={onCheckPassword }
        onFailure={() => Alert.alert(
            'Failure',
            'Please, try again',
            [
                { text: 'OK' },
            ]
        )}
        titleStyle={{ fontSize: 23 }}
        numpadTextStyle={{ fontSize: 27 }}
        bulletStyle={{fontSize:25}}
    />
)

export default PinCodeInput