import React, {useState,useEffect} from 'react';
import {
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  View,
  Text,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput
} from 'react-native';
import FlatGrid from 'react-native-super-grid';
import {Button, Input, Overlay} from 'react-native-elements';
import formatMoney from 'accounting-js/lib/formatMoney.js';
import { listCategories,listProducts, listLists } from '../graphql/queries';
import { createList,updateList } from '../graphql/mutations';


const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;


import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Alert from './Alert';
import colors from '../themes/colors';
import { generateClient } from 'aws-amplify/api';
import SearchBar from './SearchBar';
const client = generateClient();
export default function ProductsCashier({
route
}) {
  const { staffData } = route.params;
    
  const [selectedCategory, setSelectedCategory] = useState('All'); // Default to 'All'
  const [searchTerm, setSearchTerm] = useState(''); // Search query
  const [overlay, overlayVisible] = useState(false);
  const [item, setItems] = useState([]);
  const [term, setTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [alerts, alertVisible] = useState(false);
  const [alerts2, alertVisible2] = useState(false);
  const [product_info, setProductInfo] = useState([]);
  const [additionals, setWithAdditional] = useState(false);
  const [category, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setList] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState({
    name: '',
    price: 0,
    cost: 0,
  });
  const [selectedAddon, setSelectedAddon] = useState({
    name: '',
    price: 0,
    cost: 0,
  });
  const [selectedOption, setSelectedOption] = useState([]);
  const [total, setTotal] = useState(0);
  const [aqty, setAqty] = useState(1);
  const [bcode, setBarcode] = useState('');

  const setVariables = itemss => {
    setItems(itemss);
    if (stores[0].attendant === '') {
      alertVisible(true);
      setItems([]);
      return;
    }
    if (itemss.unit === 'Kilo' || itemss.unit === 'Gram') {
      overlayVisible(true);
      return;
    }
   
  };

  const onCancelAlert = () => {
    alertVisible(false);
  };



  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchList();
  }, []); // Initial fetch only
  
  useEffect(() => {
    let filtered = products;
  
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(
        (product) => product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm]); // React to changes in these values

  const fetchCategories = async () => {
   try{
    const result = await client.graphql({
        query: listCategories,
        variables: { filter: { storeId: { eq: staffData.store_id } } }
    });
    const categoriesList = result.data.listCategories.items;
    setCategories(categoriesList);
  }catch (err) {
    console.log('Error fetching category:', err);
  }
};

const fetchList = async () => {
  try {
    const result = await client.graphql({
      query: listLists,
      variables: {
        filter: {
          storeId: { eq: staffData.store_id},
        },
      },
    });

    const listItems = result.data.listLists.items;
    console.log(listItems);
    setList(listItems); // Ensure setCart is a valid state setter function
  } catch (err) {
    console.log('Error fetching list:', err.message);
  }
};

const fetchProducts = async () => {
try {
  const result = await client.graphql({
    query: listProducts,
    // Uncomment the filter if needed
    variables: { filter: { storeId: { eq: staffData.store_id} } },
  });

  // console.log('GraphQL Response:', JSON.stringify(result, null, 2));

  const productsList = result.data?.listProducts?.items ?? [];
  if (!Array.isArray(productsList)) {
    throw new Error('Invalid response format: items is not an array');
  }

 

  setProducts(productsList);
} catch (err) {
  console.error('Error fetching products:', err.message);
}
};



const addToCart = async (item) => {
  try {
    const newList = {
      name: item.name,
      brand: item.brand,
      oprice: item.oprice,
      sprice: item.sprice,
      productId: item.id,
      cashierId: "f2da884d-c91e-4050-a1ec-24071fd8d608",
      category: item.category,
      unit: "TBF",
      storeId: item.storeId,
      quantity: 1,
    };

    // Query to check if item already exists in the cart
    const result = await client.graphql({
      query: listLists,
      variables: {
        filter: {
          productId: { eq: newList.productId },
          storeId: { eq: newList.storeId },
        },
      },
    });

    const existingItem = result.data.listLists.items[0]; // Assuming productId and storeId are unique together

    if (existingItem) {
      // If item exists, update the quantity
      const updatedQuantity = existingItem.quantity + newList.quantity;

      await client.graphql({
        query: updateList, // Define the updateList mutation in your GraphQL API
        variables: {
          input: {
            id: existingItem.id,
            quantity: updatedQuantity,
          },
        },
      });

      console.log("Quantity updated for existing item:", existingItem.id);
    } else {
      // If item doesn't exist, create a new one
      await client.graphql({
        query: createList,
        variables: { input: newList },
      });

      console.log("New item added to cart");
    }

    fetchList(); // Refresh the cart list
  } catch (err) {
    console.log("Error adding to cart:", err.message);
  }
};



  const calculateTotal = () => {
    let total = 0;
    [].forEach(list => {
      total += list.quantity * list.sprice;
    });
    return total;
  };

  const calculateQty = () => {
    let total = 0;
    [].forEach(list => {
      total += list.quantity;
    });
    return total;
  };


  const onTabChange = sterm => {
    setSelectedCategory(sterm);
  };

  const handleInput = () => {
    if (
      isNaN(quantity) ||
      quantity === '.' ||
      quantity === ',' ||
      quantity === 0 ||
      quantity < 0
    ) {
      alertVisible2(true);
      return;
    }


  };


  const withAddtional = item => {
    setWithAdditional(true);
    setProductInfo(item);
  };

  const onselectVariant = item => {
    if (item._id === selectedVariant._id) {
      setSelectedVariant({name: '', price: 0, cost: 0});
      return;
    }
    setSelectedVariant(item);
  };

  const onselectAddon = item => {
    if (item._id === selectedAddon._id) {
      setSelectedAddon({name: '', price: 0, cost: 0});
      return;
    }
    setSelectedAddon(item);
  };

  const onselectOption = item => {
    if (item._id === selectedOption._id) {
      setSelectedOption({opton: ''});
      return;
    }
    setSelectedOption(item);
  };
  const _renderitem = ({item}) => {
    const cartItem = cart.find((cartItem) => cartItem.productId === item.id);
    const remainingStock = item.stock - (cartItem?.quantity || 0);
  
    const isOutOfStock = remainingStock <= 0;
    const hasLowStock = item.stock <= 10 && !isOutOfStock;
  
    return (
      <TouchableWithoutFeedback
        onPress={() => !isOutOfStock && 
          (item.withAddons || item.withOptions || item.withVariants
            ? withAddtional(item)
            : addToCart(item)
          )
        }>
        <View style={styles.itemContainer}>
          {/* Product Image */}
          <View>
            <Image
              style={styles.stretch}
              source={
                item.img 
                  ? {uri: item.img, headers: {Authorization: 'auth-token'}}
                  : require('../../assets/noproduct.png')
              }
              resizeMode="contain"
            />
            {isOutOfStock && (
              <View style={styles.overlay}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
          </View>
  
          {/* Product Details */}
          <View>
            <Text style={styles.priceText}>
              {formatMoney(item.sprice, {symbol: '₱', precision: 2})}
            </Text>
            <Text numberOfLines={1} style={styles.itemName}>{item.name}</Text>
            <Text style={styles.stockText}>
              {item.stock} {item.unit}
            </Text>
          </View>
  
          {/* Cart Quantity */}
          {cartItem && (
            <View style={styles.cartQuantity}>
              <Text style={styles.cartQuantityText}>{cartItem.quantity}</Text>
            </View>
          )}
  
          {/* Low Stock Indicator */}
          {hasLowStock && (
            <View style={styles.lowStock}>
              <Text style={styles.lowStockText}>Low stock</Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const onCancel = () => {
    alertVisible2(!alerts2);
  };

  return (
    <View style={{flex: 1, marginBottom: 80}}>
      <Alert
        visible={alerts}
        onCancel={onCancelAlert}
        onProceed={onCancelAlert}
        title="No Logged In Attendant"
        content="Please logged in first before you proceed."
        confirmTitle="OK"
      />

      <Alert
        visible={alerts2}
        onCancel={onCancel}
        onProceed={onCancel}
        title="Invalid Input"
        content="Input must be a number."
        confirmTitle="OK"
      />
      <Alert
        visible={alerts2}
        onCancel={onCancel}
        onProceed={onCancel}
        title="Invalid Input"
        content="Input value must be equal or lesser than the number of stocks."
        confirmTitle="OK"
      />

<SearchBar
        term={searchTerm}
        onTermChange={setSearchTerm}
        onTermSubmit={() => console.log('Search Submitted')} // Optional
      />
    
     <View style={styles.tabsContainer}>
      {/* "All" Category Tab */}
      <TouchableOpacity
        style={[styles.tab, selectedCategory === 'All' && styles.activeTab]}
        onPress={() => onTabChange('All')}
      >
        <Text style={[styles.tabText, selectedCategory === 'All' && styles.activeTabText]}>
          All
        </Text>
      </TouchableOpacity>

      {/* Other Category Tabs */}
      {category.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.tab,
            selectedCategory === category.name && styles.activeTab,
          ]}
          onPress={() => onTabChange(category.name)}
        >
          <Text
            style={[
              styles.tabText,
              selectedCategory === category.name && styles.activeTabText,
            ]}
          >
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
      <FlatGrid
        itemDimension={90}
        data={filteredProducts}
        // staticDimension={300}
        // fixed
        spacing={10}
        renderItem={_renderitem}
      />
   
    </View>
  );
}

const styles = StyleSheet.create({

    overlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    outOfStockText: { color: 'red', fontWeight: 'bold' },
    priceText: { fontSize: 14, color: colors.primary, fontWeight: '500', textAlign: 'center' },
    stockText: { color: 'gray', textAlign: 'center', fontSize: 13 },
    cartQuantity: {
      position: 'absolute', top: 5, left: 5, height: 35, width: 35, borderRadius: 25,
      justifyContent: 'center', backgroundColor: colors.black
    },
    cartQuantityText: { fontWeight: 'bold', textAlign: 'center', color: colors.white },
    lowStock: { height: 20, justifyContent: 'center', alignItems: 'center' },
    lowStockText: { color: colors.white, fontSize: 11, fontWeight: 'bold' },
  plusBtn: {
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    height: 30,
    width: 30,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
  },
  minusBtn: {
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    height: 45,
    width: 45,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
  },
  header: {
    backgroundColor: colors.white,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
    borderRadius: 10,
    zIndex: 0,
  },
  itemContainer: {
    marginTop: 0,
    marginHorizontal: 0,
    backgroundColor: colors.white,
    flexDirection: 'column',
    borderRadius: 7,
    shadowColor: 'black',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  additionalCard: {
    flex: 1,
    marginTop: 5,
    marginHorizontal: 5,
    backgroundColor: colors.white,
    flexDirection: 'column',
    borderRadius: 15,
    shadowColor: '#EBECF0',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 5,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    color: '#000',
    fontWeight: '400',
    textAlign: 'center',
  },
  itemCode: {
    fontWeight: '600',
    fontSize: 12,
    color: '#fff',
  },
  stretch: {
    width: windowWidth / 3 - 10,

    height: 100,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  stretch2: {
    width: windowWidth - 15,
    height: windowHeight / 3 - 20,
    borderRadius: 10,
  },
  iconStyle: {
    fontSize: 25,
    alignSelf: 'center',
    marginHorizontal: 15,
  },
  text: {
    fontSize: 30,
  },
  iconStyle: {
    fontSize: 25,
    alignSelf: 'center',
    marginHorizontal: 15,
  },
  container: {
    position: 'absolute',
    transform: [{rotate: '40deg'}],
    right: -25,
    top: 13,
    backgroundColor: 'red',
    width: 100,
  },
  modalView: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  containerStyle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  content: {
    width: '100%',
    height: '50%',
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  bottomView: {
    flex: 1,
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', //Here is the trick
    bottom: 0, //Here is the trick
    borderTopColor: colors.primary,
    borderWidth: 1,
  },
  label: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    padding: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iconStyle: {
    padding: 4,
  },
  discountButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
  },
  discountButton2: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  row: {
    flex: 1,
    justifyContent: 'space-around',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Ensure even spacing
    flexWrap: 'wrap', // Allow items to wrap if needed
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5, // Adjust margin to control spacing between tabs
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent, // Change this to your active color
  },
  tabText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.charcoalGrey, // Default text color
  },
  activeTabText: {
    color: colors.accent, // Change this to your active text color
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: colors.white,
    height: 150,
    shadowColor: '#EBECF0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.89,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
});
