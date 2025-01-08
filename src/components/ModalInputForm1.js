import React, { useState } from "react";
import { Overlay, Input, Button, Text } from "react-native-elements";
import {TouchableOpacity, View, StatusBar} from 'react-native';
import { Title,TextInput, Headline  } from "react-native-paper";
// The AddTask is a button for adding tasks. When the button is pressed, an
// overlay shows up to request user input for the new task name. When the
// "Create" button on the overlay is pressed, the overlay closes and the new
// task is created in the realm.
export function ModalInputForm1({ title, children, fullScreen, displayComponent,overlays }) {
  const [overlayVisible, setOverlayVisible] = useState();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");



  return (
    <>
      <Overlay
        isVisible={overlays}
        overlayStyle={{ width: "70%", borderRadius:20 }}
        onBackdropPress={() => setOverlayVisible(false)}
        fullScreen={fullScreen}
      >
          <View>
             
              <View style={{flexDirection: 'row', justifyContent: 'center'}}>
              <Headline>{title}</Headline>
              </View>
          </View>
        <View style={{margin: 15}}>
          {children}
        </View>
      
     
      </Overlay>
      <TouchableOpacity style={{flexDirection:'column', justifyContent: 'center',  alignItems: 'center',}} onPress={()=>setOverlayVisible(true)}>
            {displayComponent}
      </TouchableOpacity>
    </>
  );
}
