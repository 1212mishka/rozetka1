import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getProducts } from '../../api';
import { addToWishlist, removeFromWishlist, getWishlistItems, createWishlistTable } from '../../db/wishlist';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';

const SMARTPHONES_CATEGORY_ID = '43a10c83-b2df-4b31-9416-33a35a541e63';

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

const getProductImage = (name = '') => {
  if (namedImages[name]) return namedImages[name];
  const pool = isLaptopName(name) ? laptopPool : phonePool;
  return pool[name.length % pool.length];
};

const getProductImageFile = (name = '') => {
  const laptopFiles = ['laptop0.png', 'laptop1.png'];
  const phoneFiles = ['phone0.png', 'phone1.png', 'phone2.png', 'phone3.png', 'phone4.png', 'phone5.png'];
  const pool = isLaptopName(name) ? laptopFiles : phoneFiles;
  return pool[name.length % pool.length];
};

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!fontsLoaded) return;
    const load = async () => {
      try {
        const response = await getProducts(SMARTPHONES_CATEGORY_ID);
        setProducts(response.data);
      } catch (e) {
        console.error('Ошибка загрузки товаров:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fontsLoaded]);

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

  if (!fontsLoaded) return null;

  const renderProductCard = (product, key, style = 'offer') => (
    <TouchableOpacity
      key={key}
      style={style === 'offer' ? styles.offerCard : styles.gridCard}
      activeOpacity={0.8}
      onPress={() => router.push({ pathname: '/(tabs)/ProductDetailScreen', params: { id: product.id, type: 'api' } })}
    >
      <TouchableOpacity
        style={style === 'offer' ? styles.heartBtn : styles.wishlistBtn}
        onPress={() => toggleWishlist(product)}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Ionicons
          name={wishlistIds.has(product.id) ? 'heart' : 'heart-outline'}
          size={20}
          color={wishlistIds.has(product.id) ? '#ff0008' : '#ccc'}
        />
      </TouchableOpacity>
      <Image
        source={getProductImage(product.name)}
        style={style === 'offer' ? styles.offerImg : styles.gridImg}
        resizeMode="contain"
      />
      <Text style={styles.offerName}>{product.name}</Text>
      {product.offer?.oldPriceAmount && (
        <Text style={styles.oldPrice}>{product.offer.oldPriceAmount} ₴</Text>
      )}
      <Text style={styles.newPrice}>{product.offer?.priceAmount} ₴</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logoLarge} resizeMode="contain" />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.search}
          placeholder="Я шукаю..."
          placeholderTextColor="#ccc"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="wifi-outline" size={48} color="#ccc" />
          <Text style={{ fontFamily: 'Montserrat_400Regular', color: '#888', marginTop: 12, fontSize: 14 }}>
            Сервер недоступний. Перевірте підключення.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.banner}>
            <Image source={require('../../assets/images/baner.png')} style={styles.bannerImg} resizeMode="cover" />
          </View>

          <Text style={styles.sectionTitle}>Акційні пропозиції</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {products.map((p) => renderProductCard(p, p.id))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Зараз шукають</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {[...products].reverse().map((p) => renderProductCard(p, 'search-' + p.id))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Гарячі новинки</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 }}>
            {products.slice(0, 6).map((p) => renderProductCard(p, 'grid-' + p.id, 'grid'))}
          </View>

          <TouchableOpacity style={styles.supportBtn}>
            <Text style={styles.supportBtnText}>Служба підтримки</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#00133d', paddingTop: 12, paddingHorizontal: 16, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 },
  logoLarge: { width: 180, height: 60, alignSelf: 'center', marginBottom: -35, marginTop: 24 },
  cartBtn: { position: 'relative', padding: 6 },
  search: { backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 16, height: 40, fontSize: 12, fontFamily: 'Montserrat_400Regular', color: '#000' },
  banner: { width: 400, height: 230, alignSelf: 'center', overflow: 'hidden' },
  bannerImg: { width: '100%', height: '100%' },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#000', marginLeft: 16, marginTop: 8, marginBottom: 8 },
  offerCard: { backgroundColor: '#fff', padding: 12, marginHorizontal: 8, alignItems: 'center', width: 140, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, position: 'relative' },
  heartBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  offerImg: { width: 80, height: 80, marginBottom: 8, marginTop: 12 },
  offerName: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#00133d', textAlign: 'center' },
  oldPrice: { fontSize: 13, color: '#888', textDecorationLine: 'line-through', marginTop: 4 },
  newPrice: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: 'rgba(255, 0, 8, 1)', paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  gridCard: { backgroundColor: '#fff', width: '48%', margin: '1%', padding: 12, borderRadius: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, position: 'relative' },
  gridImg: { width: 120, height: 120, marginBottom: 8, marginTop: 16 },
  wishlistBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  supportBtn: { width: 258, height: 36, borderRadius: 41, backgroundColor: 'rgba(152, 190, 42, 1)', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 16 },
  supportBtnText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#fff', lineHeight: 14 },
});