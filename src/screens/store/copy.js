import React, {useState, useEffect} from 'react';
import {
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  View,
} from 'react-native';
import {TextInput} from 'react-native-paper';
import Appbar from '../../components/Appbar';
import SearchBar from '../../components/SearchBar';
import ModalInputForm from '../../components/ModalInputForm';
import {useFocusEffect} from '@react-navigation/native';
import colors from '../../themes/colors';
import {AddProduct} from './forms/AddProduct';
import {generateClient} from 'aws-amplify/api';
import {createCategory} from '../../graphql/mutations';
import {listCategories, listProducts} from '../../graphql/queries';
import {Categories} from '../../components/Categories';
import Products from '../../components/Products';
const client = generateClient();
const ProductScreen = ({navigation, route}) => {
  const storeData = route.params.store;
  const [term, setTerm] = useState('');
  const [toggled, setToggle] = useState(false);
  const [categories, setCategory] = useState('');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState([]);
  const [error, setError] = useState(null);
  const [visible2, setVisible] = useState(false);
  const [upgrade_plan, setUpgradePlan] = useState(false);
  const [category, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const onTabChange = sterm => {
    setTerm(sterm);
  };

  useEffect(() => {
    console.log(storeData);
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await client.graphql({
        query: listCategories,
        variables: {filter: {storeId: {eq: storeData.id}}},
      });
      const categoriesList = result.data.listCategories.items;
      setCategories(categoriesList);
    } catch (err) {
      console.log('Error fetching category:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const result = await client.graphql({
        query: listProducts,
        // Uncomment the filter if needed
        variables: {filter: {storeId: {eq: storeData.id}}},
      });

      console.log('GraphQL Response:', JSON.stringify(result, null, 2));

      const productsList = result.data?.listProducts?.items ?? [];
      if (!Array.isArray(productsList)) {
        throw new Error('Invalid response format: items is not an array');
      }

      setProducts(productsList);
    } catch (err) {
      console.error('Error fetching products:', err.message);
    }
  };

  const saveCategory = async () => {
    if (!categories) {
      alert('category field are required!');
      return;
    }
    try {
      const newCategory = {
        name: categories,
        storeId: storeData.id,
      };

      console.log(newCategory);

      await client.graphql({
        query: createCategory,
        variables: {input: newCategory},
      });
      setCategory('');
      fetchCategories(); // Refresh the supplier list
    } catch (err) {
      console.log('category save error', err);
    }
  };

  return (
    <SafeAreaView>
      <Appbar
        title="POS Dashboard"
        onMenuPress={() => console.log('Menu pressed')}
        onSearchPress={() => console.log('Search pressed')}
        onNotificationPress={() => console.log('Notifications pressed')}
        onProfilePress={() => console.log('Profile pressed')}
      />
      <View style={{flexDirection: 'column'}}>
        <View style={styles.deck}>
          <AddProduct store={storeData}>
            <Text style={{textAlign: 'center', fontSize: 10}}>
              Add Products
            </Text>
          </AddProduct>

          <ModalInputForm
            displayComponent={
              <>
                <Image
                  resizeMode="cover"
                  source={require('../../../assets/add_cat.png')}
                  style={{width: 40, height: 40}}
                />
                <Text style={{textAlign: 'center', fontSize: 10}}>
                  Add Category
                </Text>
              </>
            }
            title="Add Category"
            onSave={() => saveCategory()}>
            <TextInput
              mode="outlined"
              label="Category"
              placeholder="Category"
              onChangeText={text => setCategory(text)}
            />
          </ModalInputForm>

          <TouchableOpacity
            style={{justifyContent: 'center', alignItems: 'center'}}
            onPress={() => setVisible(true)}>
            <Image
              resizeMode="cover"
              source={require('../../../assets/batch_edit.png')}
              style={{width: 40, height: 40}}
            />
            <Text style={{textAlign: 'center', fontSize: 10}}>Batch Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('BatchAddingStore', {store: STORE})
            }
            style={{justifyContent: 'center', alignItems: 'center'}}>
            <Image
              resizeMode="cover"
              source={require('../../../assets/batch_add.png')}
              style={{width: 40, height: 40}}
            />
            <Text style={{textAlign: 'center', fontSize: 10}}>
              Batch Adding
            </Text>
          </TouchableOpacity>
        </View>

        <Products
          products={products}
          store={storeData}
          navigation={navigation}
          categories={category}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 30,
  },
  backgroundStyle: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.charcoalGrey,
    height: 45,
    borderRadius: 5,
    marginHorizontal: 15,
    marginTop: 10,
  },
  barStyle: {
    alignSelf: 'center',
    height: 35,
    borderRadius: 20,
    backgroundColor: '#efefef',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputStyle: {
    fontSize: 18,
    alignContent: 'center',
  },
  iconStyle: {
    fontSize: 25,
    alignSelf: 'center',
    marginHorizontal: 15,
  },
  flexStyle: {
    fontSize: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    flexDirection: 'column',
  },
  customBox: {
    backgroundColor: colors.white,
    borderWidth: 0.5,
    paddingHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 10,

    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
  },
  deck: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: colors.white,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
    margin: 10,
    borderRadius: 10,
    padding: 10,
  },
});

export default ProductScreen;
