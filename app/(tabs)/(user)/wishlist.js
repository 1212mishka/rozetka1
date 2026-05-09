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
import {
  getFavorites,
  removeFromFavorites,
  getProductOffers,
  addToCart as apiAddToCart,
} from '../../../shared/api';
import { useAuth } from '../../../features/auth/AuthContext';
import { getProductImage } from '../../../shared/utils/productImages';

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

  const loadWishlist = useCallback(async () => {
    if (!user) { setItems([]); return; }
    try {
      const res = await getFavorites();
      const raw = res.data?.items || res.data || [];
      setItems(
        Array.isArray(raw)
          ? raw.map(i => ({
  id: i.id || i.productId,
  product_id: i.productId || i.id,
  name: i.productName || i.name || '',
  price: i.offer?.priceAmount ?? i.priceAmount ?? i.price ?? 0,
  old_price: i.offer?.oldPriceAmount ?? i.oldPriceAmount ?? i.oldPrice ?? null,
  offerId: i.offer?.id || i.offer?.offerId,
}))
          : []
      );
    } catch {
      setItems([]);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [user, loadWishlist])
  );

  function handleRemove(productId, name) {
    Alert.alert('Видалити', `Видалити "${name}" з обраного?`, [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити', style: 'destructive',
        onPress: async function() {
          try { await removeFromFavorites(productId); } catch {}
          loadWishlist();
        },
      },
    ]);
  }

  async function handleAddToCart(item) {
    if (!user) return;
    try {
      const offerId = item.offerId;
      if (!offerId) throw new Error('no offer');
      await apiAddToCart({ offerId, quantity: 1 });
      Alert.alert('Додано!', `"${item.name}" додано до кошика.`, [
        { text: 'OK', style: 'cancel' },
        { text: 'Перейти до кошика', onPress: () => router.push('/(tabs)/cart') },
      ]);
    } catch (e) {
      Alert.alert('Помилка', 'Не вдалося додати до кошика');
    }
  }
  if (!fontsLoaded) return null;

  return (
    <View style={s.container}>

      <View style={s.header}>
        <Text style={s.headerTitle}>Обране</Text>
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
          <Text style={s.emptySubtext}>Додавайте товари, натискаючи ♡</Text>
          <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/(tabs)/')}>
            <Text style={s.actionBtnText}>На головну</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View style={s.grid}>
            {items.map(item => (
              <View key={item.id} style={s.card}>
                <TouchableOpacity
                  style={s.heartBtn}
                  onPress={() => handleRemove(item.product_id, item.name)}
                >
                  <Ionicons name="heart" size={20} color="#ff0008" />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push({
                    pathname: '/(tabs)/ProductDetailScreen',
                    params: { id: item.product_id, type: 'api' },
                  })}
                >
                  <Image
                    source={getProductImage(item.name)}
                    style={s.cardImg}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>

                {item.old_price ? (
                  <Text style={s.oldPrice}>{item.old_price?.toLocaleString('uk-UA')} ₴</Text>
                ) : null}

                <Text style={s.price}>{item.price?.toLocaleString('uk-UA')} ₴</Text>

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
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: {
    fontFamily: 'Montserrat_700Bold', fontSize: 20, color: '#fff', flex: 1,
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    width: '47.5%', alignItems: 'center', position: 'relative',
    borderWidth: 0.5, borderColor: 'rgba(166,165,165,1)',
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
    fontFamily: 'Montserrat_400Regular', fontSize: 15,
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
