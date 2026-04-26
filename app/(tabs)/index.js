
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BANNERS = [
  require('../../assets/images/baner.png'),
  require('../../assets/images/banner2.png'),
  require('../../assets/images/banner3.png'),
];

import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getProducts, getCategories } from '../../services/api';
import { addToWishlist, removeFromWishlist, getWishlistItems, createWishlistTable } from '../../db/wishlist';
import { getCartItems, createCartTable } from '../../db/cart';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { getProductImage, getProductImageFile } from '../../utils/productImages';
const SMARTPHONES_CATEGORY_ID = 'f96ffa0a-3841-4b87-89da-83dc1916968f';
export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  const [products, setProducts] = useState([]);

  const [laptops, setLaptops] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);

  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [cartCount, setCartCount] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerRef = useRef(null);
  const router = useRouter();
  const { user } = useAuth();


  useEffect(() => {
    if (!fontsLoaded) return;

    const load = async () => {
      try {
        // Выполняем два запроса параллельно (одновременно), чтобы не ждать один за другим
        // Promise.all — ждёт, пока ОБА запроса завершатся
        const [phonesRes, categoriesRes] = await Promise.all([
          getProducts(SMARTPHONES_CATEGORY_ID), // Запрос смартфонов
          getCategories(),                       // Запрос всех категорий
        ]);

        setProducts(phonesRes.data);

        const laptopCategory = categoriesRes.data?.find(c =>
          c.name?.toLowerCase().includes('ноутбук')
        );

        //  ноутбуков
        if (laptopCategory) {
          const laptopsRes = await getProducts(laptopCategory.id);
          setLaptops(laptopsRes.data.slice(0, 6));
        }
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
      createCartTable();

      if (user) {
        const wishItems = getWishlistItems(user.id);
        setWishlistIds(new Set(wishItems.map(item => item.product_id)));

        const cartItems = getCartItems(user.id);
        const total = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(total);
      } else {
        setWishlistIds(new Set());
        setCartCount(0);
      }
    }, [user])
  );

  const toggleWishlist = (product) => {
    if (!user) { router.push('/(tabs)/login'); return; }

    if (wishlistIds.has(product.id)) {
      removeFromWishlist(user.id, product.id, 'api');
      setWishlistIds(prev => { const next = new Set(prev); next.delete(product.id); return next; });
    } else {
      addToWishlist(user.id, {
        id: product.id,
        name: product.name,
        price: product.offer?.priceAmount,       // Текущая цена
        old_price: product.offer?.oldPriceAmount ?? null, // Старая цена
        image: getProductImageFile(product.name),
      }, 'api');
      // Обновляем состояние
      setWishlistIds(prev => new Set(prev).add(product.id));
    }
  };

  if (!fontsLoaded) return null;


  const renderProductCard = (product, key) => {
    // Получаем изображение товара по его названию
    const img = getProductImage(product.name);
    // Проверяем, есть ли этот товар в вишлисте
    const isWished = wishlistIds.has(product.id);

    return (
      // детали товара
      <TouchableOpacity
        key={key}
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/(tabs)/ProductDetailScreen', params: { id: product.id, type: 'api' } })}
      >
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => toggleWishlist(product)}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }} // Увеличиваем область нажатия
        >
          <Ionicons name={isWished ? 'heart' : 'heart-outline'} size={20} color={isWished ? '#ff0008' : '#ccc'} />
        </TouchableOpacity>

        {img ? (
          <Image source={img} style={styles.cardImg} resizeMode="contain" />
        ) : (
          <View style={styles.noPhoto}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
          </View>
        )}

        <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>

        {product.offer?.oldPriceAmount ? (
          <Text style={styles.oldPrice}>{product.offer.oldPriceAmount} ₴</Text>
        ) : null}

        <Text style={styles.newPrice}>{product.offer?.priceAmount} ₴</Text>
      </TouchableOpacity>
    );
  };


  const renderGridCard = (product, key) => {
    const img = getProductImage(product.name);
    const isWished = wishlistIds.has(product.id);
    return (
      <TouchableOpacity
        key={key}
        style={styles.gridCard}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/(tabs)/ProductDetailScreen', params: { id: product.id, type: 'api' } })}
      >
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => toggleWishlist(product)}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name={isWished ? 'heart' : 'heart-outline'} size={20} color={isWished ? '#ff0008' : '#ccc'} />
        </TouchableOpacity>

        {img ? (
          <Image source={img} style={styles.gridImg} resizeMode="contain" />
        ) : (
          <View style={styles.noPhoto}>
            <Ionicons name="image-outline" size={36} color="#ccc" />
          </View>
        )}

        <Text style={styles.cardName} numberOfLines={2}>{product.name}</Text>
        {product.offer?.oldPriceAmount ? (
          <Text style={styles.oldPrice}>{product.offer.oldPriceAmount} ₴</Text>
        ) : null}
        <Text style={styles.newPrice}>{product.offer?.priceAmount} ₴</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />

          <Image source={require('../../assets/images/logo.png')} style={styles.logoLarge} resizeMode="contain" />

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
              <Ionicons name="cart-outline" size={26} color="#fff" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Поле поиска — при нажатии переходит на страницу каталога */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/(tabs)/catalog')}>
          <View pointerEvents="none">
            <TextInput
              style={styles.search}
              placeholder="Я ищу..."
              placeholderTextColor="#ccc"
              editable={false}
            />
          </View>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="wifi-outline" size={48} color="#ccc" />
          <Text style={{ fontFamily: 'Montserrat_400Regular', color: '#888', marginTop: 12, fontSize: 14 }}>
            Сервер недоступен. Проверьте подключение.
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>


          <FlatList
            ref={bannerRef}
            data={BANNERS}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={e => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setBannerIndex(index);
            }}
            renderItem={({ item }) => (
              <Image source={item} style={styles.bannerImg} resizeMode="cover" />
            )}
          />

          <View style={styles.bannerDots}>
            {BANNERS.map((_, i) => (
              <View key={i} style={[styles.bannerDot, bannerIndex === i && styles.bannerDotActive]} />
            ))}
          </View>

          {/*Акционные предложения*/}
          <Text style={styles.sectionTitle}>Акционные предложения</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 4, gap: 2 }} style={{ marginBottom: 8 }}>
            {products.map((p) => renderProductCard(p, p.id))}
          </ScrollView>

          {/*"Сейчас ищут" */}
          <Text style={styles.sectionTitle}>Сейчас ищут</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 4, gap: 2 }} style={{ marginBottom: 8 }}>
            {[...products].reverse().map((p) => renderProductCard(p, 'search-' + p.id))}
          </ScrollView>

          {/* "Горячие новинки" */}
          <Text style={styles.sectionTitle}>Горячие новинки</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 }}>
            {(laptops.length > 0 ? laptops : products.slice(0, 6)).map((p) => renderGridCard(p, 'grid-' + p.id))}
          </View>

          <TouchableOpacity style={styles.supportBtn}>
            <Text style={styles.supportBtnText}>Служба поддержки</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#00133d', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  logoLarge: { width: 160, height: 50 },
  cartBtn: { padding: 6, position: 'relative' },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#98be2a', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Montserrat_700Bold', lineHeight: 12 },
  search: { backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 16, height: 40, fontSize: 12, fontFamily: 'Montserrat_400Regular', color: '#000' },
  bannerImg: { width: SCREEN_WIDTH, height: 270 },
  bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
  bannerDotActive: { width: 8, backgroundColor: '#98be2a' },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#000', marginLeft: 16, marginTop: 8, marginBottom: 8 },

  card: { backgroundColor: 'rgba(255,255,255,1)', width: 150, marginHorizontal: 2, padding: 10, borderRadius: 12, position: 'relative', borderWidth: 0.5, borderColor: 'rgba(166,165,165,1)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  heartBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  cardImg: { width: '100%', height: 140, marginTop: 8, marginBottom: 8 },
  noPhoto: { width: '100%', height: 140, marginTop: 8, marginBottom: 8, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardName: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#222', lineHeight: 16, marginBottom: 4 },
  oldPrice: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: '#aaa', textDecorationLine: 'line-through', marginBottom: 2 },
  newPrice: { fontFamily: 'Montserrat_400Regular', fontSize: 15, color: '#ff0008' },

  gridCard: { backgroundColor: '#fff', width: '48%', margin: '1%', padding: 10, borderRadius: 12, alignItems: 'center', position: 'relative', borderWidth: 0.5, borderColor: 'rgba(166,165,165,1)' },
  gridImg: { width: '100%', height: 120, marginTop: 8, marginBottom: 8 },

  supportBtn: { width: 258, height: 36, borderRadius: 41, backgroundColor: 'rgba(152, 190, 42, 1)', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 16 },
  supportBtnText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#fff', lineHeight: 14 },
});
