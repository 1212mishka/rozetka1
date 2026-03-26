import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, Alert, TextInput,
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
import {
  getCartItems, removeFromCart, updateCartQuantity,
  clearCart, createCartTable,
} from '../../db/cart';
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

export default function CartScreen() {
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
    createCartTable();
    console.log('USER IN CART:', user); // ← добавь временно
    if (user?.id) setItems(getCartItems(user.id));
    else setItems([]);
  }, [user])
);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleRemove = (cartItemId, name) => {
    Alert.alert('Видалити товар', `Видалити "${name}" з кошика?`, [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити', style: 'destructive',
        onPress: () => { removeFromCart(cartItemId); setItems(getCartItems(user.id)); },
      },
    ]);
  };

  const handleQty = (cartItemId, newQty) => {
    updateCartQuantity(cartItemId, newQty);
    setItems(getCartItems(user.id));
  };

  if (!fontsLoaded) return null;

  return (
    <View style={s.container}>
      {/* Шапка */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Кошик</Text>
        <TouchableOpacity style={s.cartIconWrap} onPress={() => {}}>
          <Ionicons name="cart-outline" size={26} color="#fff" />
          {totalCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{totalCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Поиск */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color="#aaa" style={{ marginRight: 6 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Я шукаю..."
          placeholderTextColor="#aaa"
        />
      </View>

      {!user ? (
        <View style={s.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={s.emptyHeading}>Увійдіть в акаунт</Text>
          <Text style={s.emptySubtext}>Щоб переглянути кошик</Text>
          <TouchableOpacity style={s.orderBtn} onPress={() => router.push('/(tabs)/login')}>
            <Text style={s.orderBtnText}>Увійти</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={s.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={s.emptyHeading}>Кошик порожній</Text>
          <Text style={s.emptySubtext}>Але це легко виправити!</Text>
          <TouchableOpacity style={s.orderBtn} onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={s.orderBtnText}>Перейти до каталогу</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {/* Секция корзины */}
          <Text style={s.sectionTitle}>Кошик</Text>

          <View style={s.cartBlock}>
            {items.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && <View style={s.divider} />}
                <View style={s.cartRow}>
                  {/* Три точки */}
                  <TouchableOpacity
                    style={s.dotsBtn}
                    onPress={() => handleRemove(item.id, item.name)}
                  >
                    <Ionicons name="ellipsis-horizontal" size={16} color="#aaa" />
                  </TouchableOpacity>

                  {/* Фото */}
                  <Image
                    source={images[item.image] || images['phone0.png']}
                    style={s.cartImg}
                    resizeMode="contain"
                  />

                  {/* Инфо */}
                  <View style={s.cartInfo}>
                    <Text style={s.cartName} numberOfLines={3}>{item.name}</Text>
                  </View>

                  {/* Счётчик и цена */}
                  <View style={s.cartRight}>
                    <View style={s.qtyRow}>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={() => handleQty(item.id, item.quantity - 1)}
                      >
                        <Text style={s.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={s.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={s.qtyBtn}
                        onPress={() => handleQty(item.id, item.quantity + 1)}
                      >
                        <Text style={s.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={s.cartPrice}>
                      {(item.price * item.quantity).toLocaleString('uk-UA')} ₴
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Кнопка заказа */}
            <TouchableOpacity style={s.orderBtn}>
              <Text style={s.orderBtnText}>
                Зробити замовлення{'  '}
                <Text style={s.orderBtnPrice}>{totalPrice.toLocaleString('uk-UA')} ₴</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Секция "Переглянуті товари" */}
          <Text style={s.sectionTitle}>Переглянуті товари</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.recentScroll}>
            {items.map(item => (
              <TouchableOpacity key={'r-' + item.id} style={s.recentCard}>
                <TouchableOpacity style={s.recentHeart}>
                  <Ionicons name="heart-outline" size={18} color="#ccc" />
                </TouchableOpacity>
                <Image
                  source={images[item.image] || images['phone0.png']}
                  style={s.recentImg}
                  resizeMode="contain"
                />
                <Text style={s.recentName} numberOfLines={2}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  // Header
  header: {
    backgroundColor: '#00133d',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  cartIconWrap: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#a3ff00', borderRadius: 9,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#00133d' },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 38,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#333',
    lineHeight: 12,
  },

  // Empty
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyHeading: { fontFamily: 'Montserrat_500Medium', fontSize: 16, color: '#4a90d9', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#4a90d9', marginBottom: 24 },

  // Section title
  sectionTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#00133d',
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
  },

  // Cart block
  cartBlock: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingTop: 4,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 12,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    position: 'relative',
  },
  dotsBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  cartImg: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 10,
  },
  cartInfo: {
    flex: 1,
    paddingRight: 8,
  },
  cartName: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#00133d',
    lineHeight: 16,
  },
  cartRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 90,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: '#00133d',
    lineHeight: 18,
  },
  qtyText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#00133d',
    minWidth: 18,
    textAlign: 'center',
  },
  cartPrice: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 13,
    color: '#00133d',
  },

  // Order button
  orderBtn: {
    backgroundColor: '#98be2a',
    borderRadius: 30,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  orderBtnText: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  orderBtnPrice: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#fff',
  },

  // Recently viewed
  recentScroll: {
    paddingLeft: 16,
  },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 110,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  recentHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  recentImg: {
    width: 70,
    height: 70,
    marginTop: 16,
    marginBottom: 8,
  },
  recentName: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    color: '#00133d',
    textAlign: 'center',
    lineHeight: 14,
  },
});