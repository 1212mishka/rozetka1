import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { getWishlistItems, removeFromWishlist, createWishlistTable } from '../../db/wishlist';
import { addToCart, createCartTable } from '../../db/cart';
import { useAuth } from '../../context/AuthContext';

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

export default function WishlistScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useFocusEffect(
    useCallback(() => {
      createWishlistTable();
      createCartTable();
      if (user?.id) setItems(getWishlistItems(user.id));
      else setItems([]);
    }, [user])
  );

  const handleRemove = (productId, productType, name) => {
    Alert.alert('Видалити', `Видалити "${name}" з обраного?`, [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити', style: 'destructive',
        onPress: () => {
          removeFromWishlist(user.id, productId, productType);
          setItems(getWishlistItems(user.id));
        },
      },
    ]);
  };

  const handleAddToCart = (item) => {
    if (!user) return;
    const result = addToCart(user.id, {
      id: item.product_id,
      name: item.name,
      price: item.price,
      image: item.image,
    }, item.product_type);
    if (result.success) {
      Alert.alert('Додано!', `"${item.name}" додано до кошика.`, [
        { text: 'OK', style: 'cancel' },
        { text: 'Перейти до кошика', onPress: () => router.push('/(tabs)/cart') },
      ]);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Обране</Text>
        {items.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countBadgeText}>{items.length}</Text>
          </View>
        )}
      </View>

      {!user ? (
        <View style={s.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={s.emptyTitle}>Увійдіть в акаунт</Text>
          <Text style={s.emptySubtext}>Щоб переглянути обране</Text>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/(tabs)/login')}>
            <Text style={s.actionBtnText}>Увійти</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={s.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color="#ccc" />
          <Text style={s.emptyTitle}>Список обраного порожній</Text>
          <Text style={s.emptySubtext}>Додавайте товари натискаючи ♡</Text>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/(tabs)/')}>
            <Text style={s.actionBtnText}>Перейти на головну</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={s.grid}>
            {items.map(item => (
              <View key={item.id} style={s.card}>
                {/* Сердечко — убрать из вішліста */}
                <TouchableOpacity
                  style={s.heartBtn}
                  onPress={() => handleRemove(item.product_id, item.product_type, item.name)}
                >
                  <Ionicons name="heart" size={20} color="#ff0008" />
                </TouchableOpacity>

                {/* Фото */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push({
                    pathname: '/(tabs)/ProductDetailScreen',
                    params: { id: item.product_id, type: item.product_type },
                  })}
                >
                  <Image
                    source={images[item.image] || images['phone0.png']}
                    style={s.cardImg}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>

                {item.old_price ? (
                  <Text style={s.oldPrice}>{item.old_price?.toLocaleString('uk-UA')} ₴</Text>
                ) : null}
                <Text style={s.price}>{item.price?.toLocaleString('uk-UA')} ₴</Text>

                {/* Кнопка в кошик */}
                <TouchableOpacity style={s.cartBtn} onPress={() => handleAddToCart(item)}>
                  <Ionicons name="cart-outline" size={15} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={s.cartBtnText}>До кошика</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#00133d',
    paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: {
    fontFamily: 'Montserrat_700Bold', fontSize: 20, color: '#fff', flex: 1,
  },
  countBadge: {
    backgroundColor: '#a3ff00', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  countBadgeText: {
    fontFamily: 'Montserrat_700Bold', fontSize: 13, color: '#00133d',
  },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60,
  },
  emptyTitle: {
    fontFamily: 'Montserrat_500Medium', fontSize: 16,
    color: '#00133d', marginTop: 16, marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Montserrat_400Regular', fontSize: 13,
    color: '#888', marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#98be2a', borderRadius: 30, height: 46,
    paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: '#fff',
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    width: '47.5%', alignItems: 'center', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  heartBtn: { position: 'absolute', top: 10, right: 10, zIndex: 1 },
  cardImg: { width: 110, height: 110, marginTop: 16, marginBottom: 8 },
  cardName: {
    fontFamily: 'Montserrat_400Regular', fontSize: 12,
    color: '#00133d', textAlign: 'center', lineHeight: 16, marginBottom: 4,
  },
  oldPrice: {
    fontFamily: 'Montserrat_400Regular', fontSize: 11,
    color: '#aaa', textDecorationLine: 'line-through', marginBottom: 2,
  },
  price: {
    fontFamily: 'Montserrat_700Bold', fontSize: 14,
    color: '#ff0008', marginBottom: 10,
  },
  cartBtn: {
    backgroundColor: '#00133d', borderRadius: 20, height: 34,
    paddingHorizontal: 14, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', width: '100%',
  },
  cartBtnText: {
    fontFamily: 'Montserrat_500Medium', fontSize: 12, color: '#fff',
  },
});