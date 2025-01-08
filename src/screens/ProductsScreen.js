import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Modal, StyleSheet, ScrollView } from 'react-native';

const ProductScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [imgUrl, setImgUrl] = useState('');

  // Variants and Add-ons
  const [variants, setVariants] = useState([]);
  const [addons, setAddons] = useState([]);

  // New Variant State
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [newVariantCost, setNewVariantCost] = useState('');

  // New Add-on State
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [newAddonCost, setNewAddonCost] = useState('');
  const [newAddonOptions, setNewAddonOptions] = useState([]);
  const [newAddonOption, setNewAddonOption] = useState('');

  const handleAddVariant = () => {
    if (newVariantName && newVariantPrice && newVariantCost) {
      const newVariant = {
        name: newVariantName,
        price: parseFloat(newVariantPrice),
        cost: parseFloat(newVariantCost),
      };
      setVariants([...variants, newVariant]);
      setNewVariantName('');
      setNewVariantPrice('');
      setNewVariantCost('');
    }
  };

  const handleAddAddon = () => {
    if (newAddonName && newAddonPrice && newAddonCost) {
      const newAddon = {
        name: newAddonName,
        price: parseFloat(newAddonPrice),
        cost: parseFloat(newAddonCost),
        options: [...newAddonOptions],
      };
      setAddons([...addons, newAddon]);
      setNewAddonName('');
      setNewAddonPrice('');
      setNewAddonCost('');
      setNewAddonOptions([]);
    }
  };

  const handleAddAddonOption = () => {
    if (newAddonOption) {
      setNewAddonOptions([...newAddonOptions, newAddonOption]);
      setNewAddonOption('');
    }
  };

  const handleSaveProduct = () => {
    console.log({
      productName,
      brand,
      originalPrice,
      sellingPrice,
      stock,
      category,
      sku,
      imgUrl,
      variants,
      addons,
    });

    setModalVisible(false);
    setProductName('');
    setBrand('');
    setOriginalPrice('');
    setSellingPrice('');
    setStock('');
    setCategory('');
    setSku('');
    setImgUrl('');
    setVariants([]);
    setAddons([]);
  };

  return (
    <View style={styles.container}>
      <Button title="Add New Product" onPress={() => setModalVisible(true)} />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView>
            <Text style={styles.title}>Add Product</Text>

            <TextInput
              style={styles.input}
              placeholder="Product Name"
              value={productName}
              onChangeText={setProductName}
            />

            <TextInput
              style={styles.input}
              placeholder="Brand"
              value={brand}
              onChangeText={setBrand}
            />

            <TextInput
              style={styles.input}
              placeholder="Original Price"
              value={originalPrice}
              onChangeText={setOriginalPrice}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Selling Price"
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Stock"
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Category"
              value={category}
              onChangeText={setCategory}
            />

            <TextInput
              style={styles.input}
              placeholder="SKU"
              value={sku}
              onChangeText={setSku}
            />

            <TextInput
              style={styles.input}
              placeholder="Image URL"
              value={imgUrl}
              onChangeText={setImgUrl}
            />

            <Text style={styles.subTitle}>Variants</Text>
            <TextInput
              style={styles.input}
              placeholder="Variant Name"
              value={newVariantName}
              onChangeText={setNewVariantName}
            />
            <TextInput
              style={styles.input}
              placeholder="Variant Price"
              value={newVariantPrice}
              onChangeText={setNewVariantPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Variant Cost"
              value={newVariantCost}
              onChangeText={setNewVariantCost}
              keyboardType="numeric"
            />
            <Button title="Add Variant" onPress={handleAddVariant} />
            <FlatList
              data={variants}
              renderItem={({ item }) => (
                <Text style={styles.listItem}>
                  {item.name} - Price: {item.price} - Cost: {item.cost}
                </Text>
              )}
              keyExtractor={(item, index) => index.toString()}
            />

            <Text style={styles.subTitle}>Add-ons</Text>
            <TextInput
              style={styles.input}
              placeholder="Add-on Name"
              value={newAddonName}
              onChangeText={setNewAddonName}
            />
            <TextInput
              style={styles.input}
              placeholder="Add-on Price"
              value={newAddonPrice}
              onChangeText={setNewAddonPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Add-on Cost"
              value={newAddonCost}
              onChangeText={setNewAddonCost}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Add-on Option"
              value={newAddonOption}
              onChangeText={setNewAddonOption}
            />
            <Button title="Add Option" onPress={handleAddAddonOption} />
            <FlatList
              data={newAddonOptions}
              renderItem={({ item }) => <Text style={styles.listItem}>Option: {item}</Text>}
              keyExtractor={(item, index) => index.toString()}
            />
            <Button title="Add Add-on" onPress={handleAddAddon} />
            <FlatList
              data={addons}
              renderItem={({ item }) => (
                <Text style={styles.listItem}>
                  {item.name} - Price: {item.price} - Cost: {item.cost}
                  {item.options && item.options.length > 0 && (
                    <Text> - Options: {item.options.join(', ')}</Text>
                  )}
                </Text>
              )}
              keyExtractor={(item, index) => index.toString()}
            />

            <Button title="Save Product" onPress={handleSaveProduct} color="green" />
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  listItem: {
    fontSize: 16,
    padding: 5,
  },
});

export default ProductScreen;
