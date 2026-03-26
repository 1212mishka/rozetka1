import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { createPhonesTable, getPhones, migratePhonesTable } from '../../db/phones';
import { seedPhones } from '../../db/phones-seed';
import { createLaptopsTable, getLaptops, migrateLaptopsTable, removeDuplicateLaptops } from '../../db/laptops';
import { seedLaptops } from '../../db/laptops-seed';
import { createWishlistTable, addToWishlist, removeFromWishlist, getWishlistItems } from '../../db/wishlist';
import { getCartCount, createCartTable } from '../../db/cart';
import { useAuth } from '../../context/AuthContext';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';

const images = {
  'phone0.png': require('../../assets/images/phone0.png'),
  'phone1.png': require('../../assets/images/phone1.png'),
  'phone2.png': require('../../assets/images/phone2.png'),
  'phone3.png': require('../../assets/images/phone3.png'),
  'phone4.png': require('../../assets/images/phone4.png'),
  'phone5.png': require('../../assets/images/phone5.png'),
  'laptop0.png': require('../../assets/images/laptop0.png'),
  'laptop1.png': require('../../assets/images/laptop1.png'),
};

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });
  const [phones, setPhones] = useState([]);
  const [laptops, setLaptops] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!fontsLoaded) return;
    try {
      createPhonesTable();
      migratePhonesTable();
      seedPhones();
      setPhones(getPhones());
      createLaptopsTable();
      migrateLaptopsTable();
      removeDuplicateLaptops();
      seedLaptops();
      setLaptops(getLaptops());
      createWishlistTable();
      createCartTable();
    } catch (error) {
      console.error("Ошибка при работе с БД:", error);
    }
  }, [fontsLoaded]);

  // Оновлюємо вішліст та лічильник кошика при кожному фокусі
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        const items = getWishlistItems(user.id);
        const ids = new Set(items.map(i => `${i.product_type}-${i.product_id}`));
        setWishlistIds(ids);
        setCartCount(getCartCount(user.id));
      } else {
        setWishlistIds(new Set());
        setCartCount(0);
      }
    }, [user])
  );

  const toggleWishlist = (product, productType = 'phone') => {
    if (!user) {
      router.push('/(tabs)/login');
      return;
    }
    const key = `${productType}-${product.id}`;
    if (wishlistIds.has(key)) {
      removeFromWishlist(user.id, product.id, productType);
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } else {
      addToWishlist(user.id, product, productType);
      setWishlistIds(prev => new Set(prev).add(key));
    }
  };

  const isWishlisted = (product, productType = 'phone') =>
    wishlistIds.has(`${productType}-${product.id}`);

  if (!fontsLoaded) return null;

  const newItems = [
    ...phones.map(p => ({ ...p, type: 'phone' })),
    ...laptops.map(l => ({ ...l, type: 'laptop' })),
  ].filter(item => item.release_year === 2026).sort((a, b) => b.id - a.id).slice(0, 6);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Шапка */}
      <View style={styles.header}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logoLarge} resizeMode="contain" />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart-outline" size={28} color="#fff" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.search}
          placeholder="Я шукаю..."
          placeholderTextColor="#ccc"
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Баннер */}
        <View style={styles.banner}>
          <Image source={require('../../assets/images/baner.png')} style={styles.bannerImg} resizeMode="cover" />
        </View>

        {/* Акційні пропозиції */}
        <Text style={styles.sectionTitle}>Акційні пропозиції</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {phones.map((phone, idx) => (
            <TouchableOpacity
              key={phone.id || idx}
              style={styles.offerCard}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/(tabs)/ProductDetailScreen', params: { id: phone.id, type: 'phone' } })}
            >
              {/* Сердечко */}
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => toggleWishlist(phone, 'phone')}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons
                  name={isWishlisted(phone, 'phone') ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isWishlisted(phone, 'phone') ? '#ff0008' : '#ccc'}
                />
              </TouchableOpacity>

              <Image
                source={images[phone.image] || images['phone0.png']}
                style={styles.offerImg}
                resizeMode="contain"
              />
              <Text style={styles.offerName}>{phone.name}</Text>
              {phone.old_price && <Text style={styles.oldPrice}>{phone.old_price} ₴</Text>}
              <Text style={styles.newPrice}>{phone.price} ₴</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Зараз шукають */}
        <Text style={styles.sectionTitle}>Зараз шукають</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {phones.map((phone, idx) => (
            <TouchableOpacity
              key={"search-" + (phone.id || idx)}
              style={styles.offerCard}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/(tabs)/ProductDetailScreen', params: { id: phone.id, type: 'phone' } })}
            >
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => toggleWishlist(phone, 'phone')}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons
                  name={isWishlisted(phone, 'phone') ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isWishlisted(phone, 'phone') ? '#ff0008' : '#ccc'}
                />
              </TouchableOpacity>
              <Image
                source={images[phone.image] || images['phone0.png']}
                style={styles.offerImg}
                resizeMode="contain"
              />
              <Text style={styles.offerName}>{phone.name}</Text>
              {phone.old_price && <Text style={styles.oldPrice}>{phone.old_price} ₴</Text>}
              <Text style={styles.newPrice}>{phone.price} ₴</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Гарячі новинки */}
        <Text style={styles.sectionTitle}>Гарячі новинки</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 }}>
          {newItems.map((item, idx) => (
            <TouchableOpacity
              key={item.type + '-' + (item.id || idx)}
              style={styles.gridCard}
              activeOpacity={0.8}
              onPress={() => router.push({ pathname: '/(tabs)/ProductDetailScreen', params: { id: item.id, type: item.type } })}
            >
              <TouchableOpacity
                style={styles.wishlistBtn}
                onPress={() => toggleWishlist(item, item.type)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons
                  name={isWishlisted(item, item.type) ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isWishlisted(item, item.type) ? '#ff0008' : '#ccc'}
                />
              </TouchableOpacity>
              <Image
                source={images[item.image] || images['phone0.png']}
                style={styles.gridImg}
                resizeMode="contain"
              />
              <Text style={styles.offerName}>{item.name}</Text>
              {item.old_price && <Text style={styles.oldPrice}>{item.old_price} ₴</Text>}
              <Text style={styles.newPrice}>{item.price} ₴</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.supportBtn}>
          <Text style={styles.supportBtnText}>Служба підтримки</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#00133d',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  logoLarge: {
    width: 180,
    height: 60,
    alignSelf: 'center',
    marginBottom: -35,
    marginTop: 24,
  },
  cartBtn: { position: 'relative', padding: 6 },
  cartBadge: {
    position: 'absolute', right: 0, top: 0,
    backgroundColor: '#a3ff00', borderRadius: 10,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
  },
  cartBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#00133d' },
  search: {
    backgroundColor: '#fff', borderRadius: 25,
    paddingHorizontal: 16, height: 40,
    fontSize: 12, fontFamily: 'Montserrat_400Regular', color: '#000',
  },
  banner: { width: 400, height: 230, alignSelf: 'center', overflow: 'hidden' },
  bannerImg: { width: '100%', height: '100%' },
  sectionTitle: {
    fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#000',
    marginLeft: 16, marginTop: 8, marginBottom: 8,
  },
  offerCard: {
    backgroundColor: '#fff', padding: 12, marginHorizontal: 8,
    alignItems: 'center', width: 140,
    borderRadius: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    position: 'relative',
  },
  heartBtn: {
    position: 'absolute', top: 8, right: 8, zIndex: 1,
  },
  offerImg: { width: 80, height: 80, marginBottom: 8, marginTop: 12 },
  offerName: {
    fontFamily: 'Montserrat_400Regular', fontSize: 12,
    color: '#00133d', textAlign: 'center',
  },
  oldPrice: {
    fontSize: 13, color: '#888',
    textDecorationLine: 'line-through', marginTop: 4,
  },
  newPrice: {
    fontFamily: 'Montserrat_400Regular', fontSize: 14,
    color: 'rgba(255, 0, 8, 1)', paddingHorizontal: 6,
    paddingVertical: 2, marginTop: 2,
  },
  gridCard: {
    backgroundColor: '#fff', width: '48%', margin: '1%',
    padding: 12, borderRadius: 8, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, position: 'relative',
  },
  gridImg: { width: 120, height: 120, marginBottom: 8, marginTop: 16 },
  wishlistBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  supportBtn: {
    width: 258, height: 36, borderRadius: 41,
    backgroundColor: 'rgba(152, 190, 42, 1)',
    alignSelf: 'center', justifyContent: 'center', alignItems: 'center',
    marginTop: 24, marginBottom: 16,
  },
  supportBtnText: {
    fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#fff', lineHeight: 14,
  },
});