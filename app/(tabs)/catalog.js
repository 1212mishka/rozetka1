import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { getCategories, searchProducts } from '../../services/api';
import { getProductImage } from '../../utils/productImages';
import { getCartItems, createCartTable } from '../../db/cart';
import { useAuth } from '../../context/AuthContext';
const categoryImageMap = {
  'Ноутбуки та комп\'ютери': require('../../assets/images/categories/cimage1.png'),
  'Смартфони, ТВ і електроніка': require('../../assets/images/categories/cimage2.png'),
  'Товари для геймерів': require('../../assets/images/categories/cimage3.png'),
  'Побутова техніка': require('../../assets/images/categories/cimage4.png'),
  'Товари для дому': require('../../assets/images/categories/cimage5.png'),
  'Інструменти та автотовари': require('../../assets/images/categories/cimage6.png'),
  'Сантехніка та ремонт': require('../../assets/images/categories/cimage7.png'),
  'Дача, сад і огород': require('../../assets/images/categories/cimage8.png'),
  'Спорт і захоплення': require('../../assets/images/categories/cimage9.png'),
  'Одяг, взуття та прикраси': require('../../assets/images/categories/cimage10.png'),
  'Краса та здоров\'я': require('../../assets/images/categories/cimage11.png'),
  'Дитячі товари': require('../../assets/images/categories/cimage12.png'),
  'Зоотовари': require('../../assets/images/categories/cimage13.png'),
  'Канцтовари та книги': require('../../assets/images/categories/cimage14.png'),
  'Алкогольні напої та продукти': require('../../assets/images/categories/cimage15.png'),
  'Товари для бізнесу та послуги': require('../../assets/images/categories/cimage16.png'),
  'Смартфони': require('../../assets/images/categories/cimage2.png'),
  'Ноутбуки': require('../../assets/images/categories/cimage1.png'),
};

const fallbackImage = require('../../assets/images/categories/cimage1.png');

export default function CatalogScreen() {
  const router = useRouter();

  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const searchTimeout = React.useRef(null);

  useFocusEffect(useCallback(() => {
    createCartTable();
    if (user?.id) {
      const items = getCartItems(user.id);
      setCartCount(items.reduce((sum, i) => sum + (parseInt(i.quantity) || 1), 0));
    } else {
      setCartCount(0);
    }
  }, [user]));

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
    Montserrat_600SemiBold,
  });

  // загрузка категорий с сервера

  useEffect(() => {
    if (!fontsLoaded) return;
    const load = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fontsLoaded]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }

    clearTimeout(searchTimeout.current);

    // "debounce" — позволяет не отправлять запрос при каждом введённом символе
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchProducts(search.trim());
        const data = res.data;
        // обработка массивов от сервера
        const results = Array.isArray(data) ? data : data?.content ?? data?.items ?? data?.products ?? [];
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(searchTimeout.current);
  }, [search]);
  if (!fontsLoaded) return null;

  const rows = [];
  for (let i = 0; i < categories.length; i += 2) {
    rows.push(categories.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>

      {/* заголовок, корзина и поиск */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          <Text style={styles.headerTitle}>Каталог</Text>
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

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.search}
            placeholder="Я ищу..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : search.trim() ? (
        searchLoading ? (
          <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
        ) : searchResults.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={{ fontFamily: 'Montserrat_400Regular', color: '#888', marginTop: 12 }}>Ничего не найдено</Text>
          </View>
        ) : (
          // Список товаров
          <ScrollView contentContainerStyle={styles.listContent}>
            {searchResults.map(product => {
              const img = getProductImage(product.name);
              return (
                <TouchableOpacity
                  key={product.id}
                  style={styles.searchCard}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: '/(tabs)/ProductDetailScreen', params: { id: product.id, type: 'api' } })}
                >
                  {/* Изображение или заглушка */}
                  {img ? (
                    <Image source={img} style={styles.searchImg} resizeMode="contain" />
                  ) : (
                    <View style={styles.searchImgPlaceholder}>
                      <Ionicons name="image-outline" size={28} color="#ccc" />
                    </View>
                  )}
                  <Text style={styles.searchName} numberOfLines={2}>{product.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((cat) => (
                // при нажатии переходим в соответствующую категорию
                <TouchableOpacity
                  key={cat.id}
                  style={styles.card}
                  activeOpacity={0.75}
                  onPress={() => router.push({ pathname: '/(tabs)/category', params: { categoryId: cat.id, categoryName: cat.name } })}
                >
                  {/* Картинка категории или fallback */}
                  <Image
                    source={categoryImageMap[cat.name] ?? fallbackImage}
                    style={styles.catImg}
                    resizeMode="contain"
                  />
                  <Text style={styles.catLabel} numberOfLines={2}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
              {row.length === 1 && <View style={[styles.card, styles.emptyCard]} />}
            </View>
          ))}

          {/* Баннер */}
          <TouchableOpacity activeOpacity={0.85} style={styles.premiumBanner}>
            <Image source={require('../../assets/images/button.png')} style={styles.premiumImg} resizeMode="cover" />
          </TouchableOpacity>
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
    height: 50,
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  cartBtn: { padding: 6, position: 'relative' },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#98be2a', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Montserrat_700Bold', lineHeight: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 14,
    height: 40,
  },
  search: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: '#000',
  },
  listContent: {
    padding: 12,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 4,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(166,165,165,1)',
    minHeight: 72,
  },
  emptyCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  catImg: {
    width: 56,
    height: 56,
    marginRight: 10,
    flexShrink: 0,
  },
  catLabel: {
    flex: 1,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#222',
    lineHeight: 17,
  },
  premiumBanner: {
    marginTop: 8,
    marginHorizontal: -12,
    overflow: 'hidden',
  },
  premiumImg: {
    width: '100%',
    height: 65,
  },
  premiumSub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    color: '#00133d',
    marginTop: 1,
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(166,165,165,1)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 6,
  },
  searchImg: { width: 60, height: 60, marginRight: 12, flexShrink: 0 },
  searchImgPlaceholder: {
    width: 60, height: 60, marginRight: 12, borderRadius: 8,
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center',
  },
  searchName: {
    flex: 1,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
    color: '#222',
    lineHeight: 18,
  },
});
