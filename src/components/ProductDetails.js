import React, {useState} from 'react';
import {Overlay, Input, Button} from 'react-native-elements';
import {
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  TextInput as TextInput2,
} from 'react-native';

import colors from '../themes/colors';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import {Picker} from '@react-native-picker/picker';
import {Text} from 'react-native';
import {View} from 'react-native';
import AppHeader from './AppHeader';
import {useNavigation} from '@react-navigation/native';
import {Card, TextInput} from 'react-native-paper';
import * as ImagePicker from 'react-native-image-picker';
import SelectDropdown from 'react-native-select-dropdown';
import Alert from './Alert';
import PinCodeInput from './PinCodeInput';
import AlertwithChild2 from './AlertwithChild2';
import {Keyboard} from 'react-native';

import {updateProduct} from '../graphql/mutations';

import {generateClient} from 'aws-amplify/api';
const client = generateClient();

export function ProductDetails({route}) {
  const navigation = useNavigation();
  const product = route.params.product;
  const store = route.params.store;
  const categories = route.params.categories;
  const [photos, setPhoto] = useState(
    'https://res.cloudinary.com/sbpcmedia/image/upload/v1652251290/pdn5niue9zpdazsxkwuw.png',
  );

  const [name, setName] = useState(product.name);
  const [brand, setBrand] = useState(product.brand);
  const [oprice, setOPrice] = useState(product.oprice);
  const [sprice, setSPrice] = useState(product.sprice);
  const [stock, setQty] = useState(product.stock);
  const [edit, setEditable] = useState(false);
  const [unit, setUnit] = useState(product.unit);
  const [new_categories, setCategory] = useState(product.category);
  const [visible, toggleOverlay] = useState(false);
  const [sku, setSKU] = useState(product.sku);
  const [img, setImg] = useState(product.img);
  const units = [
    'Kilo',
    'Gram',
    'Piece',
    'Liter',
    'Bundle',
    'Dozen',
    'Whole',
    'Half-Dozen',
    'Ounce',
    'Milliliter',
    'Milligrams',
    'Pack',
    'Ream',
    'Box',
    'Sack',
    'Serving',
    'Gallon',
    'Container',
    'Bottle',
    'Sachet',
    'Cup',
  ];
  const [visible2, setVisible] = useState(false);
  const [code, setCode] = useState('');
  const [info, setInfo] = useState([]);
  const [error, setError] = useState(null);
  const [onDeleteVariantVisible, setOnDeleteVariantVisible] = useState(false);
  const [onDeleteAddonVisible, setOnDeleteAddonsVisible] = useState(false);
  const [onDeleteOptionVisible, setOnDeleteOptionVisible] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState([]);
  const [selectedAddon, setSelectedAddons] = useState([]);
  const [selectedOption, setSelectedoptions] = useState([]);
  const [variants, setVariant] = useState([
    {name: 'set name', cost: 0, price: 0},
  ]);
  const [options, setOptions] = useState([{option: 'set option'}]);
  const [addons, setAddons] = useState([{name: 'set name', cost: 0, price: 0}]);
  const [optionsVisible, setOptionVisible] = useState(false);
  const [variantVisible, setVariantVisible] = useState(false);
  const [addonsVisible, setAddonsVisible] = useState(false);
  const filterCategory = () => {
    let holder = [];

    categories.forEach(item => {
      if (item.storeId === store.id) {
        holder.push(item);
      }
    });
    return holder;
  };
  console.log(product);
  // const onSaveImg = (photo) => {

  //   let new_products = {
  //     name: name,
  //     brand: brand,
  //     oprice: parseFloat(oprice),
  //     sprice: parseFloat(sprice),
  //     stock: parseFloat(stock),
  //     unit: unit,
  //     category: new_categories,
  //     sku: sku,
  //     img: photo
  //   }

  //   updateProduct(product ,new_products);

  // }
  async function onSaveProducts() {
    var updatedProduct = {
      id: product.id, // Ensure the ID is included for updating
      name,
      brand,
      stock: parseInt(stock, 10),
      oprice: parseFloat(oprice),
      sprice: parseFloat(sprice),
      unit,
      category: new_categories,
      sku,
      variants: [],
      img: '',
      storeId: store.id,
      addons: [],
      options: [],
    };

    try {
      // Assuming `updateProduct` is a mutation for updating the product in AWS
      await client.graphql({
        query: updateProduct, // Replace with your update mutation
        variables: {input: updatedProduct},
      });
      console.log('Success', 'Product updated successfully!');
      toggleOverlay(true);
      setVisible(false);
      setCode('');
      setError(null);
      fetchProducts();

      // Then go back
      navigation.goBack();
    } catch (error) {
      console.error(error);
      console.log('Error', 'Failed to update product.');
    }
  }

  const onCheckPassword = () => {
    onSaveProducts();
  };

  const openGallery = () => {
    ImagePicker.launchImageLibrary(
      {
        maxWidth: 500,
        maxHeight: 500,
        mediaType: 'photo',
        includeBase64: true,
      },
      image => {
        if (image.didCancel) {
          console.log('User cancelled image picker');
        } else if (image.error) {
          console.log('ImagePicker Error: ', response.error);
        } else {
          let CLOUDINARY_URL =
            'https://api.cloudinary.com/v1_1/sbpcmedia/upload';
          let base64Img = `data:image/jpg;base64,${image.assets[0].base64}`;
          let data = {
            file: base64Img,
            upload_preset: 'ancbewi9',
          };
          fetch(CLOUDINARY_URL, {
            body: JSON.stringify(data),
            headers: {
              'content-type': 'application/json',
            },
            method: 'POST',
          })
            .then(async r => {
              let data = await r.json();
              let photo = 'https' + data.url.slice(4);
              setImg('https' + data.url.slice(4));
              onSaveImg(photo);
            })
            .catch(error => {
              console.log('error : ', error);
            });
        }
      },
    );
  };

  const onDeleteVariant = item => {
    setOnDeleteVariantVisible(true);
    setSelectedVariant(item);
  };

  const onDeleteAddons = item => {
    setOnDeleteAddonsVisible(true);
    setSelectedAddons(item);
  };

  const onDeleteOptions = item => {
    setOnDeleteOptionVisible(true);
    setSelectedoptions(item);
  };

  return (
    <>
      <View style={{flex: 1}}>
        <Alert
          visible={onDeleteVariantVisible}
          onProceed={() => {
            setOnDeleteVariantVisible(false),
              deleteVariant(selectedVariant),
              setSelectedVariant([]);
          }}
          onCancel={() => {
            setOnDeleteVariantVisible(false), setSelectedVariant([]);
          }}
          title="Delete Variant?"
          content={`Are you sure you want to delete ${selectedVariant.name}?`}
          confirmTitle="Delete"
        />
        <Alert
          visible={onDeleteAddonVisible}
          onProceed={() => {
            setOnDeleteAddonsVisible(false),
              deleteAddon(selectedAddon),
              setSelectedAddons([]);
          }}
          onCancel={() => {
            setOnDeleteAddonsVisible(false), setSelectedVariant([]);
          }}
          title="Delete Addon?"
          content={`Are you sure you want to delete ${selectedAddon.name}?`}
          confirmTitle="Delete"
        />
        <Alert
          visible={onDeleteOptionVisible}
          onProceed={() => {
            setOnDeleteOptionVisible(false),
              deleteOption(selectedOption),
              setSelectedoptions([]);
          }}
          onCancel={() => {
            setOnDeleteOptionVisible(false), setSelectedVariant([]);
          }}
          title="Delete Option?"
          content={`Are you sure you want to delete ${selectedOption.option}?`}
          confirmTitle="Delete"
        />
        <AlertwithChild2
          visible={variantVisible}
          onProceed={() => {
            setVariantVisible(false), createInventory(product._id, variants);
          }}
          onCancel={() => setVariantVisible(false)}
          title="Add Variants"
          confirmTitle="S A V E"
          addButton={true}
          onPressAddbtn={() => onAddVariants()}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginVertical: 2,
              alignItems: 'center',
            }}>
            <View style={{width: 150, marginHorizontal: 2}}>
              <Text
                style={{fontWeight: '700', textAlign: 'center', fontSize: 15}}>
                Name
              </Text>
            </View>
            <View style={{width: 50, marginHorizontal: 2}}>
              <Text
                style={{fontWeight: '700', textAlign: 'center', fontSize: 15}}>
                Price
              </Text>
            </View>
            <View style={{width: 50, marginHorizontal: 2}}>
              <Text
                style={{fontWeight: '700', textAlign: 'center', fontSize: 15}}>
                Cost
              </Text>
            </View>
          </View>

          <ScrollView>
            {variants.map((element, index) => (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginVertical: 2,
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    borderWidth: 1,
                    width: 150,
                    height: 35,
                    borderRadius: 10,
                    borderColor: colors.boldGrey,
                    marginHorizontal: 2,
                  }}>
                  <TextInput2
                    style={{
                      textAlign: 'center',
                      flex: 3,
                      paddingBottom: 0,
                      paddingTop: 0,
                    }}
                    underlineColorAndroid="transparent"
                    placeholderTextColor="red"
                    disableFullscreenUI={true}
                    defaultValue={element.name}
                    multiline={true}
                    numberOfLines={1}
                    onEndEditing={e => {
                      element.name = e.nativeEvent.text;
                      setVariant([...variants]);
                    }}
                  />
                </View>
                <View
                  style={{
                    borderWidth: 1,
                    width: 50,
                    height: 35,
                    borderRadius: 10,
                    borderColor: colors.boldGrey,
                    marginHorizontal: 2,
                  }}>
                  <TextInput2
                    style={{
                      textAlign: 'center',
                      flex: 3,
                      paddingBottom: 0,
                      paddingTop: 0,
                    }}
                    underlineColorAndroid="transparent"
                    placeholderTextColor="red"
                    disableFullscreenUI={true}
                    defaultValue={`${element.price}`}
                    keyboardType="numeric"
                    multiline={true}
                    numberOfLines={1}
                    onEndEditing={e => {
                      element.price = parseFloat(e.nativeEvent.text);
                      setVariant([...variants]);
                    }}
                  />
                </View>
                <View
                  style={{
                    borderWidth: 1,
                    width: 50,
                    height: 35,
                    borderRadius: 10,
                    borderColor: colors.boldGrey,
                    marginHorizontal: 2,
                  }}>
                  <TextInput2
                    style={{
                      textAlign: 'center',
                      flex: 3,
                      paddingBottom: 0,
                      paddingTop: 0,
                    }}
                    underlineColorAndroid="transparent"
                    placeholderTextColor="red"
                    disableFullscreenUI={true}
                    keyboardType="numeric"
                    defaultValue={`${element.cost}`}
                    multiline={true}
                    numberOfLines={1}
                    onEndEditing={e => {
                      element.cost = parseFloat(e.nativeEvent.text);
                      setVariant([...variants]);
                    }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </AlertwithChild2>
        <AlertwithChild2
          visible={addonsVisible}
          onProceed={() => {
            setAddonsVisible(false), createAddon(product._id, addons);
          }}
          onCancel={() => setAddonsVisible(false)}
          title="Add Addons"
          confirmTitle="S A V E"
          addButton={true}
          onPressAddbtn={() => onAddAddons()}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginVertical: 2,
              alignItems: 'center',
            }}>
            <View style={{width: 150, marginHorizontal: 2}}>
              <Text
                style={{fontWeight: '700', textAlign: 'center', fSontSize: 15}}>
                Name
              </Text>
            </View>
            <View style={{width: 50, marginHorizontal: 2}}>
              <Text
                style={{fontWeight: '700', textAlign: 'center', fontSize: 15}}>
                Price
              </Text>
            </View>
            <View style={{width: 50, marginHorizontal: 2}}>
              <Text
                style={{fontWeight: '700', textAlign: 'center', fontSize: 15}}>
                Cost
              </Text>
            </View>
            <TouchableOpacity>
              <EvilIcons
                name={'trash'}
                size={26}
                color={colors.white}
                style={{marginTop: 5}}
              />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {addons.map((element, index) => (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginVertical: 2,
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    borderWidth: 1,
                    width: 150,
                    height: 35,
                    borderRadius: 10,
                    borderColor: colors.boldGrey,
                    marginHorizontal: 2,
                  }}>
                  <TextInput2
                    style={{
                      textAlign: 'center',
                      flex: 3,
                      paddingBottom: 0,
                      paddingTop: 0,
                    }}
                    underlineColorAndroid="transparent"
                    placeholderTextColor="red"
                    disableFullscreenUI={true}
                    defaultValue={element.name}
                    multiline={true}
                    numberOfLines={1}
                    onEndEditing={e => {
                      element.name = e.nativeEvent.text;
                      setAddons([...addons]);
                    }}
                  />
                </View>
                <View
                  style={{
                    borderWidth: 1,
                    width: 50,
                    height: 35,
                    borderRadius: 10,
                    borderColor: colors.boldGrey,
                    marginHorizontal: 2,
                  }}>
                  <TextInput2
                    style={{
                      textAlign: 'center',
                      flex: 3,
                      paddingBottom: 0,
                      paddingTop: 0,
                    }}
                    underlineColorAndroid="transparent"
                    placeholderTextColor="red"
                    disableFullscreenUI={true}
                    defaultValue={element.price}
                    keyboardType="numeric"
                    multiline={true}
                    numberOfLines={1}
                    onEndEditing={e => {
                      element.price = parseFloat(e.nativeEvent.text);
                      setAddons([...addons]);
                    }}
                  />
                </View>
                <View
                  style={{
                    borderWidth: 1,
                    width: 50,
                    height: 35,
                    borderRadius: 10,
                    borderColor: colors.boldGrey,
                    marginHorizontal: 2,
                  }}>
                  <TextInput2
                    style={{
                      textAlign: 'center',
                      flex: 3,
                      paddingBottom: 0,
                      paddingTop: 0,
                    }}
                    underlineColorAndroid="transparent"
                    placeholderTextColor="red"
                    disableFullscreenUI={true}
                    defaultValue={element.cost}
                    keyboardType="numeric"
                    multiline={true}
                    numberOfLines={1}
                    onEndEditing={e => {
                      element.cost = parseFloat(e.nativeEvent.text);
                      setAddons([...addons]);
                    }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </AlertwithChild2>
        <AlertwithChild2
          visible={optionsVisible}
          onProceed={() => {
            setOptionVisible(false),
              createOption(product._id, options),
              Keyboard.dismiss();
          }}
          onCancel={() => setOptionVisible(false)}
          title="Add Options"
          confirmTitle="S A V E"
          addButton={true}
          onPressAddbtn={() => onAddOptions()}>
          <ScrollView>
            {options.map((element, index) => (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginVertical: 2,
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 15,
                    fontWeight: '400',
                  }}>
                  Option :{' '}
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    width: 150,
                    height: 35,
                    borderRadius: 10,
                    borderColor: colors.boldGrey,
                    marginHorizontal: 2,
                  }}>
                  <TextInput2
                    style={{
                      textAlign: 'center',
                      flex: 3,
                      paddingBottom: 0,
                      paddingTop: 0,
                    }}
                    underlineColorAndroid="transparent"
                    placeholderTextColor="red"
                    disableFullscreenUI={true}
                    defaultValue={element.option}
                    multiline={true}
                    numberOfLines={1}
                    onSubmitEditing={e => {
                      element.option = e.nativeEvent.text;
                      setOptions([...options]);
                    }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </AlertwithChild2>
        <AppHeader
          centerText="Product Details"
          leftComponent={
            <TouchableOpacity onPress={() => {}}>
              <EvilIcons
                name={'close-o'}
                size={30}
                color={colors.white}
                onPress={() => navigation.goBack()}
              />
            </TouchableOpacity>
          }
        />
        <>
          <ScrollView style={{marginHorizontal: 20}}>
            <TouchableOpacity
              onPress={() => openGallery()}
              style={style.imageContainer}>
              <Image
                resizeMode="contain"
                source={{uri: img}}
                style={style.backgroundImage}
              />
            </TouchableOpacity>
            <TextInput
              mode="outlined"
              label="Name"
              placeholder="Name"
              value={name}
              onChangeText={text => setName(text)}
            />
            <View
              style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
              <TextInput
                style={{flex: 1}}
                mode="outlined"
                label="Brand"
                value={brand}
                onChangeText={text => setBrand(text)}
              />
              <TextInput
                style={{flex: 1, marginLeft: 5}}
                mode="outlined"
                label="Stock"
                value={`${Math.round(stock * 100) / 100}`}
                onChangeText={text => setQty(text)}
                keyboardType="numeric"
              />
            </View>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
              <TextInput
                style={{flex: 1}}
                mode="outlined"
                label="Original Price"
                value={`${oprice}`}
                keyboardType="numeric"
                onChangeText={text => setOPrice(text)}
              />
              <TextInput
                style={{flex: 1, marginLeft: 5}}
                mode="outlined"
                label="Selling Price"
                value={`${sprice}`}
                keyboardType="numeric"
                onChangeText={text => setSPrice(text)}
              />
            </View>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-evenly'}}>
              <SelectDropdown
                data={units}
                defaultButtonText={unit}
                onSelect={(selectedItem, index) => {
                  setUnit(selectedItem);
                }}
                buttonTextAfterSelection={(selectedItem, index) => {
                  // text represented after item is selected
                  // if data array is an array of objects then return selectedItem.property to render after item is selected
                  return selectedItem;
                }}
                rowTextForSelection={(item, index) => {
                  // text represented for each item in dropdown
                  // if data array is an array of objects then return item.property to represent item in dropdown
                  return item;
                }}
                buttonStyle={{
                  marginTop: 5,
                  flex: 1,
                  height: 50,
                  backgroundColor: '#FFF',
                  borderRadius: 5,
                  borderWidth: 1,
                  borderColor: '#444',
                }}
                buttonTextStyle={{
                  textAlign: 'left',
                  color: 'grey',
                  fontSize: 15,
                }}
              />
              <SelectDropdown
                data={filterCategory()}
                defaultButtonText={new_categories}
                onSelect={(selectedItem, index) => {
                  setCategory(selectedItem.name);
                }}
                buttonTextAfterSelection={(selectedItem, index) => {
                  // text represented after item is selected
                  // if data array is an array of objects then return selectedItem.property to render after item is selected
                  return selectedItem.name;
                }}
                rowTextForSelection={(item, index) => {
                  // text represented for each item in dropdown
                  // if data array is an array of objects then return item.property to represent item in dropdown
                  return item.name;
                }}
                buttonStyle={{
                  marginTop: 5,
                  flex: 1,
                  marginRight: 10,
                  height: 50,
                  backgroundColor: '#FFF',
                  borderRadius: 5,
                  borderWidth: 1,
                  borderColor: '#444',
                }}
                buttonTextStyle={{
                  textAlign: 'left',
                  color: 'grey',
                  fontSize: 15,
                }}
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderWidth: 1,
                marginTop: 10,
                borderRadius: 5,
                alignItems: 'center',
              }}>
              <TextInput2
                style={{flex: 3, paddingVertical: 13}}
                value={sku}
                label="Barcode"
                onChangeText={text => setSKU(text)}
              />
              {/* <Scanner barcode={setSKU}/> */}
            </View>
            {product.variants && product.variants.length > 0 && (
              <View style={{marginTop: 15}}>
                {/* Variants Header */}
                <View
                  style={{
                    paddingVertical: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginRight: 5,
                  }}>
                  <Text style={{fontSize: 20, fontWeight: 'bold'}}>
                    Variants
                  </Text>
                  <View
                    style={[
                      style.shadow,
                      {
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: colors.white,
                        padding: 5,
                        borderRadius: 10,
                      },
                    ]}>
                    <EvilIcons
                      name={'plus'}
                      size={20}
                      color={colors.red}
                      onPress={() => setVariantVisible(true)}
                    />
                  </View>
                </View>

                {/* Column Headers */}
                <View style={{flexDirection: 'row', marginBottom: 10}}>
                  <Text
                    style={{
                      width: 150,
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}>
                    Name
                  </Text>
                  <Text
                    style={{
                      width: 55,
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}>
                    Cost
                  </Text>
                  <Text
                    style={{
                      width: 55,
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}>
                    Price
                  </Text>
                </View>

                {/* Variants List */}
                <View>
                  {variants.map(
                    element =>
                      element.product_id === product._id && (
                        <View
                          style={{flexDirection: 'row', marginVertical: 5}}
                          key={element.id}>
                          {/* Name Input */}
                          <View
                            style={{
                              borderWidth: 1,
                              width: 150,
                              height: 35,
                              borderRadius: 10,
                              borderColor: colors.boldGrey,
                              marginHorizontal: 2,
                            }}>
                            <TextInput2
                              style={{
                                textAlign: 'center',
                                flex: 3,
                                paddingBottom: 0,
                                paddingTop: 0,
                              }}
                              underlineColorAndroid="transparent"
                              placeholderTextColor="red"
                              disableFullscreenUI={true}
                              defaultValue={element.name}
                              multiline={true}
                              numberOfLines={1}
                              onEndEditing={e => {
                                onUpdateVariants(
                                  element,
                                  e.nativeEvent.text,
                                  'name',
                                );
                              }}
                            />
                          </View>
                          {/* Price Input */}
                          <View
                            style={{
                              borderWidth: 1,
                              width: 50,
                              height: 35,
                              borderRadius: 10,
                              borderColor: colors.boldGrey,
                              marginHorizontal: 2,
                            }}>
                            <TextInput2
                              style={{
                                textAlign: 'center',
                                flex: 3,
                                paddingBottom: 0,
                                paddingTop: 0,
                              }}
                              underlineColorAndroid="transparent"
                              placeholderTextColor="red"
                              disableFullscreenUI={true}
                              defaultValue={`${element.price}`}
                              multiline={true}
                              numberOfLines={1}
                              keyboardType="number-pad"
                              onEndEditing={e => {
                                onUpdateVariants(
                                  element,
                                  parseFloat(e.nativeEvent.text),
                                  'price',
                                );
                              }}
                            />
                          </View>
                          {/* Cost Input */}
                          <View
                            style={{
                              borderWidth: 1,
                              width: 50,
                              height: 35,
                              borderRadius: 10,
                              borderColor: colors.boldGrey,
                              marginHorizontal: 2,
                            }}>
                            <TextInput2
                              style={{
                                textAlign: 'center',
                                flex: 3,
                                paddingBottom: 0,
                                paddingTop: 0,
                              }}
                              underlineColorAndroid="transparent"
                              placeholderTextColor="red"
                              disableFullscreenUI={true}
                              defaultValue={`${element.cost}`}
                              multiline={true}
                              numberOfLines={1}
                              keyboardType="number-pad"
                              onEndEditing={e => {
                                onUpdateVariants(
                                  element,
                                  parseFloat(e.nativeEvent.text),
                                  'cost',
                                );
                              }}
                            />
                          </View>
                          {/* Delete Variant */}
                          <TouchableOpacity
                            onPress={() => onDeleteVariant(element)}>
                            <EvilIcons
                              name={'trash'}
                              size={26}
                              color={colors.red}
                              style={{marginTop: 5}}
                            />
                          </TouchableOpacity>
                        </View>
                      ),
                  )}
                </View>
              </View>
            )}

            {/* Addons Section */}
            {product.addon && product.addon.length > 0 && (
              <View>
                {/* Addons Header */}
                <View
                  style={{
                    paddingVertical: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginRight: 5,
                  }}>
                  <Text style={{fontSize: 20, fontWeight: 'bold'}}>Addons</Text>
                  <View
                    style={[
                      style.shadow,
                      {
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: colors.white,
                        padding: 5,
                        borderRadius: 10,
                      },
                    ]}>
                    <EvilIcons
                      name={'plus'}
                      size={20}
                      color={colors.red}
                      onPress={() => setAddonsVisible(true)}
                    />
                  </View>
                </View>

                {/* Column Headers */}
                <View style={{flexDirection: 'row', marginBottom: 10}}>
                  <Text
                    style={{
                      width: 150,
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}>
                    Name
                  </Text>
                  <Text
                    style={{
                      width: 55,
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}>
                    Cost
                  </Text>
                  <Text
                    style={{
                      width: 55,
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}>
                    Price
                  </Text>
                </View>

                {/* Addons List */}
                <View>
                  {addon.map(
                    element =>
                      element.product_id === product._id && (
                        <View
                          style={{flexDirection: 'row', marginVertical: 5}}
                          key={element.id}>
                          {/* Name Input */}
                          <View
                            style={{
                              borderWidth: 1,
                              width: 150,
                              height: 35,
                              borderRadius: 10,
                              borderColor: colors.boldGrey,
                              marginHorizontal: 2,
                            }}>
                            <TextInput2
                              style={{
                                textAlign: 'center',
                                flex: 3,
                                paddingBottom: 0,
                                paddingTop: 0,
                              }}
                              underlineColorAndroid="transparent"
                              placeholderTextColor="red"
                              disableFullscreenUI={true}
                              defaultValue={element.name}
                              multiline={true}
                              numberOfLines={1}
                              onEndEditing={e => {
                                onUpdateAddons(
                                  element,
                                  e.nativeEvent.text,
                                  'name',
                                );
                              }}
                            />
                          </View>
                          {/* Price Input */}
                          <View
                            style={{
                              borderWidth: 1,
                              width: 50,
                              height: 35,
                              borderRadius: 10,
                              borderColor: colors.boldGrey,
                              marginHorizontal: 2,
                            }}>
                            <TextInput2
                              style={{
                                textAlign: 'center',
                                flex: 3,
                                paddingBottom: 0,
                                paddingTop: 0,
                              }}
                              underlineColorAndroid="transparent"
                              placeholderTextColor="red"
                              disableFullscreenUI={true}
                              defaultValue={`${element.price}`}
                              multiline={true}
                              numberOfLines={1}
                              keyboardType="number-pad"
                              onEndEditing={e => {
                                onUpdateAddons(
                                  element,
                                  parseFloat(e.nativeEvent.text),
                                  'price',
                                );
                              }}
                            />
                          </View>
                          {/* Cost Input */}
                          <View
                            style={{
                              borderWidth: 1,
                              width: 50,
                              height: 35,
                              borderRadius: 10,
                              borderColor: colors.boldGrey,
                              marginHorizontal: 2,
                            }}>
                            <TextInput2
                              style={{
                                textAlign: 'center',
                                flex: 3,
                                paddingBottom: 0,
                                paddingTop: 0,
                              }}
                              underlineColorAndroid="transparent"
                              placeholderTextColor="red"
                              disableFullscreenUI={true}
                              defaultValue={`${element.cost}`}
                              multiline={true}
                              numberOfLines={1}
                              keyboardType="number-pad"
                              onEndEditing={e => {
                                onUpdateAddons(
                                  element,
                                  parseFloat(e.nativeEvent.text),
                                  'cost',
                                );
                              }}
                            />
                          </View>
                          {/* Delete Addon */}
                          <TouchableOpacity
                            onPress={() => onDeleteAddons(element)}>
                            <EvilIcons
                              name={'trash'}
                              size={26}
                              color={colors.red}
                              style={{marginTop: 5}}
                            />
                          </TouchableOpacity>
                        </View>
                      ),
                  )}
                </View>
              </View>
            )}

            {product.option && product.option.length > 0 && (
              <View>
                {/* Header with Add Option */}
                <View
                  style={{
                    paddingVertical: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginRight: 5,
                  }}>
                  <Text style={{fontSize: 20, fontWeight: 'bold'}}>
                    Options
                  </Text>
                  <View
                    style={[
                      style.shadow,
                      {
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: colors.white,
                        padding: 5,
                        borderRadius: 10,
                      },
                    ]}>
                    <EvilIcons
                      name={'plus'}
                      size={20}
                      color={colors.red}
                      onPress={() => setOptionVisible(true)}
                    />
                  </View>
                </View>

                {/* Column Header */}
                <View style={{flexDirection: 'row', marginBottom: 10}}>
                  <Text
                    style={{
                      width: 150,
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}>
                    Option
                  </Text>
                </View>

                {/* Options List */}
                <View>
                  {options.map(element => {
                    return (
                      element.product_id === product._id && (
                        <View
                          style={{flexDirection: 'row', marginVertical: 5}}
                          key={element.id}>
                          {/* Option Input */}
                          <View
                            style={{
                              borderWidth: 1,
                              width: 150,
                              height: 35,
                              borderRadius: 10,
                              borderColor: colors.boldGrey,
                              marginHorizontal: 2,
                            }}>
                            <TextInput2
                              style={{
                                textAlign: 'center',
                                flex: 3,
                                paddingBottom: 0,
                                paddingTop: 0,
                              }}
                              underlineColorAndroid="transparent"
                              placeholderTextColor="red"
                              disableFullscreenUI={true}
                              defaultValue={element.option}
                              multiline={true}
                              numberOfLines={1}
                              onEndEditing={e => {
                                const newText = e.nativeEvent.text;
                                element.option = newText; // Update local state
                                onUpdateOptions(element, newText); // Trigger parent update
                              }}
                            />
                          </View>

                          {/* Delete Option */}
                          <TouchableOpacity
                            onPress={() => onDeleteOptions(element)}>
                            <EvilIcons
                              name={'trash'}
                              size={26}
                              color={colors.red}
                              style={{marginTop: 5}}
                            />
                          </TouchableOpacity>
                        </View>
                      )
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity
            onPress={() => setVisible(true)}
            style={style.uploadButton}>
            <Text style={style.uploadButtonText}>Save</Text>
          </TouchableOpacity>
        </>

        <Overlay isVisible={visible2} onBackdropPress={setVisible}>
          <View style={{padding: 20}}>
            <PinCodeInput
              pinCode={store.password}
              onCheckPassword={onCheckPassword}
            />

            {error && (
              <Text style={{textAlign: 'center', color: colors.red}}>
                {error}
              </Text>
            )}
          </View>
        </Overlay>
      </View>
    </>
  );
}

const style = StyleSheet.create({
  imageContainer: {
    backgroundColor: '#000000',
    height: Dimensions.get('window').height / 4,
    marginHorizontal: 50,
    borderRadius: 20,
  },
  backgroundImage: {
    flex: 1,
  },
  uploadContainer: {
    backgroundColor: '#f6f5f8',
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    position: 'absolute',
    bottom: 1,
    width: Dimensions.get('window').width,
    height: 200,
  },
  uploadContainerTitle: {
    alignSelf: 'center',
    fontSize: 25,
    margin: 20,
    fontFamily: 'Roboto',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 1.58,
    shadowRadius: 10,
    elevation: 3,
  },
  uploadButton: {
    borderRadius: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 7,
      height: 5,
    },
    shadowOpacity: 1.58,
    shadowRadius: 9,
    elevation: 4,
    margin: 10,
    padding: 10,
    backgroundColor: '#fe5b29',
    width: Dimensions.get('window').width - 60,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#f6f5f8',
    fontSize: 20,
    fontFamily: 'Roboto',
  },
});
