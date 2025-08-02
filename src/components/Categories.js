import React, {useState} from 'react';
import {
  BackHandler,
  FlatList,
  StatusBar,
  Text,
  View,
  Dimensions,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';

import {theme} from '../constants';
import colors from '../themes/colors';
import Alert from './Alert';
const {width, height} = Dimensions.get('window');

export function Categories({tabs, onTabChange}) {
  const [active, setActive] = useState('');
  const [tabData, setTab] = useState([]);
  const [alert_visible, setAlert] = useState(false);

  const handleTab = tab => {
    setActive(tab.name);
    onTabChange(tab.name);
  };

  const renderTab = tab => {
    const isActive = active === tab.name;

    return (
      <TouchableOpacity
        key={`tab-${tab.name}`}
        onPress={() => handleTab(tab)}
        style={[style.tab, isActive ? style.active : null]}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: colors.charcoalGrey,
          }}>
          {tab.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={style.tabs}>
        <Alert
          visible={alert_visible}
          onCancel={() => {
            setAlert(false), setTab([]);
          }}
          onProceed={() => {
            setAlert(false), setTab([]);
          }}
          title={`Delete ${tabData.name} category?`}
          content={`Are you sure you want to delete ${tabData.name} category?`}
          confirmTitle="Proceed"
        />
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          {tabs.map(tab => renderTab(tab))}
        </ScrollView>
      </View>
    </>
  );
}

const style = StyleSheet.create({
  header: {
    paddingHorizontal: theme.sizes.base * 2,
  },
  avatar: {
    height: theme.sizes.base * 2.2,
    width: theme.sizes.base * 2.2,
  },
  tabs: {
    paddingVertical: 3,
    paddingHorizontal: theme.sizes.base * 2,
  },
  content: {
    borderBottomColor: theme.colors.gray2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: theme.sizes.base,
    marginHorizontal: theme.sizes.base * 2,
  },
  tab: {
    marginRight: theme.sizes.base,

    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  active: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    borderBottomColor: colors.accent,
  },
  categories: {
    flexWrap: 'wrap',
    paddingHorizontal: theme.sizes.base,
    marginBottom: theme.sizes.base * 3.5,
  },
  category: {
    // this should be dynamic based on screen width
    minWidth: (width - theme.sizes.padding * 5.5 - theme.sizes.base) / 2,
    maxWidth: (width - theme.sizes.padding * 5.5 - theme.sizes.base) / 2,
    maxHeight: (width - theme.sizes.padding * 5.5 - theme.sizes.base) / 2,
  },
  imageThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 120,
    width: width / 3.5,
    backgroundColor: 'gray',
  },
  MainContainer: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.1,
    width,
    paddingBottom: theme.sizes.base * 4,
  },
});
