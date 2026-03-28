import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, ActivityIndicator, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_700Bold,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import { getProducts } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { addToWishlist, removeFromWishlist, getWishlistItems, createWishlistTable } from '../../db/wishlist';
import { addToCart, createCartTable } from '../../db/cart';

const namedImages = {
  'Apple iPhone 13': require('../../assets/images/phone0.png'),
  'Samsung Galaxy S23': require('../../assets/images/phone1.png'),
  'Xiaomi Redmi Note 12': require('../../assets/images/phone2.png'),
  'Realme 11 Pro': require('../../assets/images/phone3.png'),
  'Google Pixel 7a': require('../../assets/images/phone4.png'),
  'OnePlus Nord CE 3': require('../../assets/images/phone5.png'),
  'Apple MacBook Air M2': require('../../assets/images/laptop0.png'),
  'ASUS ZenBook 14': require('../../assets/images/laptop1.png'),
};

const laptopPool = [
  require('../../assets/images/laptop0.png'),
  require('../../assets/images/laptop1.png'),
];
const phonePool = [
  require('../../assets/images/phone0.png'),
  require('../../assets/images/phone1.png'),
  require('../../assets/images/phone2.png'),
  require('../../assets/images/phone3.png'),
  require('../../assets/images/phone4.png'),
  require('../../assets/images/phone5.png'),
];

const isLaptopName = (name = '') => {
  const l = name.toLowerCase();
  return l.includes('ноутбук') || l.includes('macbook') || l.includes('laptop') ||
    l.includes('zenbook') || l.includes('thinkpad') || l.includes('vivobook') ||
    l.includes('probook') || l.includes('elitebook') || l.includes('swift');
};
const isPhoneName = (name = '') => {
  const l = name.toLowerCase();
  return l.includes('iphone') || l.includes('samsung') || l.includes('xiaomi') ||
    l.includes('realme') || l.includes('pixel') || l.includes('oneplus') ||
    l.includes('смартфон') || l.includes('phone');
};

const getProductImage = (name = '') => {
  if (namedImages[name]) return namedImages[name];
  if (isLaptopName(name)) return laptopPool[name.length % laptopPool.length];
  if (isPhoneName(name)) return phonePool[name.length % phonePool.length];
  return null;
};

const getProductImageFile = (name = '') => {
  const laptopFiles = ['laptop0.png', 'laptop1.png'];
  const phoneFiles = ['phone0.png', 'phone1.png', 'phone2.png', 'phone3.png', 'phone4.png', 'phone5.png'];
  if (isLaptopName(name)) return laptopFiles[name.length % 2];
  if (isPhoneName(name)) return phoneFiles[name.length % 6];
  return 'phone0.png';
};

export default function ProductsScreen() {
  const { categoryId, categoryName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [search, setSearch] = useState('');

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
    Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (!fontsLoaded || !categoryId) return;
    const load = async () => {
      try {
        const response = await getProducts(categoryId);
        setProducts(response.data);
      } catch (e) {
        console.error('Помилка завантаження товарів:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fontsLoaded, categoryId]);

  useFocusEffect(
    useCallback(() => {
      createWishlistTable();
      if (user) {
        const items = getWishlistItems(user.id);
        setWishlistIds(new Set(items.map(item => item.product_id)));
      } else {
        setWishlistIds(new Set());
      }
    }, [user])
  );

  const toggleWishlist = (product) => {
    if (!user) {
      router.push('/(tabs)/login');
      return;
    }
    if (wishlistIds.has(product.id)) {
      removeFromWishlist(user.id, product.id, 'api');
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    } else {
      addToWishlist(user.id, {
        id: product.id,
        name: product.name,
        price: product.offer?.priceAmount,
        old_price: product.offer?.oldPriceAmount ?? null,
        image: getProductImageFile(product.name),
      }, 'api');
      setWishlistIds(prev => new Set(prev).add(product.id));
    }
  };

  const handleAddToCart = (product) => {
    if (!user) {
      router.push('/(tabs)/login');
      return;
    }
    createCartTable();
    addToCart(user.id, {
      id: product.id,
      name: product.name,
      price: product.offer?.priceAmount,
      image: getProductImageFile(product.name),
    }, 'api');
  };

  if (!fontsLoaded) return null;

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{categoryName || 'Товари'}</Text>
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Я шукаю..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="swap-vertical-outline" size={14} color="#333" style={{ marginRight: 4 }} />
          <Text style={styles.filterBtnText}>Сортування</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={14} color="#333" style={{ marginRight: 4 }} />
          <Text style={styles.filterBtnText}>Фільтр</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="grid-outline" size={20} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="list-outline" size={20} color="#555" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="share-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Товарів не знайдено</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {filtered.map(product => (
            <TouchableOpacity
              key={product.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/(tabs)/ProductDetailScreen', params: { id: product.id, type: 'api' } })}
            >
              {/* Heart */}
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => toggleWishlist(product)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons
                  name={wishlistIds.has(product.id) ? 'heart' : 'heart-outline'}
                  size={18}
                  color={wishlistIds.has(product.id) ? '#ff0008' : '#bbb'}
                />
              </TouchableOpacity>

              {/* Image */}
              {getProductImage(product.name) ? (
                <Image source={getProductImage(product.name)} style={styles.cardImg} resizeMode="contain" />
              ) : (
                <View style={styles.noPhoto}>
                  <Ionicons name="image-outline" size={36} color="#ccc" />
                  <Text style={styles.noPhotoText}>Фото відсутнє</Text>
                </View>
              )}

              {/* Name */}
              <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>

              {/* Prices */}
              <View style={styles.priceBlock}>
                <View style={{ flex: 1 }}>
                  {product.offer?.oldPriceAmount ? (
                    <Text style={styles.oldPrice}>{product.offer.oldPriceAmount} ₴</Text>
                  ) : null}
                  <Text style={styles.price}>{product.offer?.priceAmount} ₴</Text>
                </View>
                {/* Cart button */}
                <TouchableOpacity
                  style={styles.cartMiniBtn}
                  onPress={() => handleAddToCart(product)}
                  hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                >
                  <Ionicons name="cart-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    backgroundColor: '#00133d',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  cartBtn: { padding: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 14,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#000',
  },

  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterBtnText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#333',
  },
  iconBtn: {
    padding: 4,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    width: '48%',
    margin: '1%',
    padding: 10,
    borderRadius: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  cardImg: {
    width: '100%',
    height: 110,
    marginTop: 8,
    marginBottom: 8,
  },
  cardName: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    color: '#222',
    lineHeight: 15,
    marginBottom: 6,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  oldPrice: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 10,
    color: '#aaa',
    textDecorationLine: 'line-through',
    marginBottom: 1,
  },
  price: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#ff0008',
  },
  cartMiniBtn: {
    backgroundColor: '#00133d',
    borderRadius: 8,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  noPhoto: { width: '100%', height: 110, marginTop: 8, marginBottom: 8, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  noPhotoText: { fontFamily: 'Montserrat_400Regular', fontSize: 9, color: '#bbb', marginTop: 4 },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#888',
    marginTop: 12,
  },
});
