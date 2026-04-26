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
  getCartItems as sqlGetCartItems,
  removeFromCart as sqlRemoveCart,
  updateCartQuantity as sqlUpdateQty,
  createCartTable,
} from '../../db/cart';
import {
  removeFromCart as apiRemoveCart,
  updateCartItem,
  getCategories,
  getProducts,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getProductImage } from '../../utils/productImages';

const ELECTRONICS_KEYWORDS = ['ноутбук', 'смартфон', 'телефон', 'електронік', 'комп'];

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [suggested, setSuggested] = useState([]);

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  const loadCart = useCallback(() => {
    createCartTable();
    if (user?.id) setItems(sqlGetCartItems(user.id));
    else setItems([]);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadCart();

      getCategories().then(async res => {
        const cats = res.data || [];
        const electroCats = cats.filter(c =>
          ELECTRONICS_KEYWORDS.some(k => c.name?.toLowerCase().includes(k))
        );
        const pool = electroCats.length ? electroCats : cats;
        const randomCat = pool[Math.floor(Math.random() * pool.length)];
        const prodRes = await getProducts(randomCat.id);
        const all = prodRes.data || [];
        const shuffled = [...all].sort(() => Math.random() - 0.5);
        setSuggested(shuffled.slice(0, 10));
      }).catch(() => {});
    }, [user, loadCart])
  );

  const totalPrice = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0) * (parseInt(i.quantity) || 1), 0);
  const totalCount = items.reduce((sum, i) => sum + (parseInt(i.quantity) || 1), 0);

  const handleRemove = (item) => {
    Alert.alert('Удалить товар', `Удалить "${item.name}" из корзины?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: () => {
          sqlRemoveCart(item.id);
          if (item.offerId) apiRemoveCart(item.offerId).catch(() => {});
          loadCart();
        },
      },
    ]);
  };

  const handleQty = (item, newQty) => {
    if (newQty < 1) { handleRemove(item); return; }
    sqlUpdateQty(item.id, newQty);
    if (item.offerId) {
      updateCartItem(item.offerId, { quantity: newQty }).catch(() => {});
    }
    loadCart();
  };

  if (!fontsLoaded) return null;

  return (
    <View style={s.container}>

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Корзина</Text>
        <TouchableOpacity style={s.cartIconWrap} onPress={() => {}}>
          <Ionicons name="cart-outline" size={26} color="#fff" />
          {totalCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{totalCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={s.headerSearchWrap}>
        <View style={s.headerSearch}>
          <Ionicons name="search-outline" size={16} color="#aaa" style={{ marginRight: 6 }} />
          <TextInput style={s.searchInput} placeholder="Я ищу..." placeholderTextColor="#aaa" />
        </View>
      </View>

      {!user ? (
        <View style={s.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={s.emptyHeading}>Войдите в аккаунт</Text>
          <Text style={s.emptySubtext}>Чтобы просмотреть корзину</Text>
          <TouchableOpacity style={s.orderBtn} onPress={() => router.push('/(tabs)/login')}>
            <Text style={s.orderBtnText}>Войти</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={s.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#ccc" />
          <Text style={s.emptyHeading}>Корзина пуста</Text>
          <Text style={s.emptySubtext}>Но это легко исправить!</Text>
          <TouchableOpacity style={s.orderBtn} onPress={() => router.push('/(tabs)/catalog')}>
            <Text style={s.orderBtnText}>Перейти в каталог</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>

          <Text style={s.sectionTitle}>Корзина</Text>

          {items.map((item) => (
            <View key={item.id} style={s.cartBlock}>
              <View style={s.cartRow}>
                <TouchableOpacity
                  style={s.dotsBtn}
                  onPress={() => handleRemove(item)}
                >
                  <Ionicons name="ellipsis-horizontal" size={16} color="#aaa" />
                </TouchableOpacity>

                <Image
                  source={getProductImage(item.name)}
                  style={s.cartImg}
                  resizeMode="contain"
                />

                <View style={s.cartInfo}>
                  <Text style={s.cartName} numberOfLines={3}>{item.name}</Text>
                </View>

                <View style={s.cartRight}>
                  <View style={s.qtyRow}>
                    <TouchableOpacity
                      style={s.qtyBtn}
                      onPress={() => handleQty(item, item.quantity - 1)}
                    >
                      <Text style={s.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={s.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={s.qtyBtn}
                      onPress={() => handleQty(item, item.quantity + 1)}
                    >
                      <Text style={s.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={s.cartPrice}>
                    {(parseFloat(item.price) * parseInt(item.quantity)).toLocaleString('uk-UA')} ₴
                  </Text>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={s.orderBtn}
            onPress={() => router.push({
              pathname: '/(tabs)/checkout',
              params: {
                items: JSON.stringify(items),
                total: totalPrice,
              }
            })}
          >
            <Text style={s.orderBtnText}>
              Оформить заказ{'  '}
              <Text style={s.orderBtnPrice}>{totalPrice.toLocaleString('uk-UA')} ₴</Text>
            </Text>
          </TouchableOpacity>

          {suggested.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Просмотренные товары</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16, paddingRight: 8, gap: 2 }}>
                {suggested.map(p => {
                  const img = getProductImage(p.name);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={s.recentCard}
                      onPress={() => router.push({ pathname: '/(tabs)/ProductDetailScreen', params: { id: p.id, type: 'api' } })}
                    >
                      <TouchableOpacity style={s.recentHeart}>
                        <Ionicons name="heart-outline" size={18} color="#ccc" />
                      </TouchableOpacity>
                      {img ? (
                        <Image source={img} style={s.recentImg} resizeMode="contain" />
                      ) : (
                        <View style={[s.recentImg, { backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="image-outline" size={28} color="#ccc" />
                        </View>
                      )}
                      <Text style={s.recentName} numberOfLines={2}>{p.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#00133d',
    paddingTop: 52,
    paddingBottom: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSearchWrap: {
    backgroundColor: '#00133d',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 10,
  },
  headerSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 38,
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
  searchInput: {
    flex: 1,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#333',
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyHeading: { fontFamily: 'Montserrat_500Medium', fontSize: 16, color: '#4a90d9', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#4a90d9', marginBottom: 24 },
  sectionTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#00133d',
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  cartBlock: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingTop: 4,
    paddingBottom: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(166,165,165,1)',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'relative',
  },
  dotsBtn: {
    position: 'absolute',
    top: -6,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  cartImg: { width: 64, height: 64, borderRadius: 8, marginRight: 10 },
  cartInfo: { flex: 1, paddingRight: 8 },
  cartName: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#00133d',
    lineHeight: 16,
  },
  cartRight: { alignItems: 'flex-end', justifyContent: 'space-between', minWidth: 90 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  qtyBtn: {
    width: 24, height: 24, borderRadius: 4,
    borderWidth: 1, borderColor: '#ddd',
    justifyContent: 'center', alignItems: 'center',
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
  cartPrice: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: '#00133d' },
  orderBtn: {
    backgroundColor: '#98be2a',
    borderRadius: 30,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  orderBtnText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: '#fff' },
  orderBtnPrice: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#fff' },
  recentCard: {
    backgroundColor: '#fff', borderRadius: 12,
    width: 120, padding: 10, marginRight: 2,
    alignItems: 'center', position: 'relative',
    borderWidth: 0.5, borderColor: 'rgba(166,165,165,1)',
  },
  recentHeart: { position: 'absolute', top: 8, right: 8 },
  recentImg: { width: 70, height: 70, marginTop: 16, marginBottom: 8 },
  recentName: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    color: '#00133d',
    textAlign: 'center',
    lineHeight: 14,
  },
});
