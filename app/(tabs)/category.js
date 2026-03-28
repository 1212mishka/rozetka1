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
import { getCategoriesTree, getProducts } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { addToWishlist, removeFromWishlist, getWishlistItems, createWishlistTable } from '../../db/wishlist';
import { addToCart, createCartTable } from '../../db/cart';

// ─── Зображення категорій ────────────────────────────────────────
const categoryImageMap = {
  'Ноутбуки та комп\'ютери': require('../../assets/images/cimage1.png'),
  'Смартфони, ТВ і електроніка': require('../../assets/images/cimage2.png'),
  'Товари для геймерів': require('../../assets/images/cimage3.png'),
  'Побутова техніка': require('../../assets/images/cimage4.png'),
  'Товари для дому': require('../../assets/images/cimage5.png'),
  'Інструменти та автотовари': require('../../assets/images/cimage6.png'),
  'Сантехніка та ремонт': require('../../assets/images/cimage7.png'),
  'Дача, сад і огород': require('../../assets/images/cimage8.png'),
  'Спорт і захоплення': require('../../assets/images/cimage9.png'),
  'Одяг, взуття та прикраси': require('../../assets/images/cimage10.png'),
  'Краса та здоров\'я': require('../../assets/images/cimage11.png'),
  'Дитячі товари': require('../../assets/images/cimage12.png'),
  'Зоотовари': require('../../assets/images/cimage13.png'),
  'Канцтовари та книги': require('../../assets/images/cimage14.png'),
  'Алкогольні напої та продукти': require('../../assets/images/cimage15.png'),
  'Товари для бізнесу та послуги': require('../../assets/images/cimage16.png'),
  'Смартфони': require('../../assets/images/cimage2.png'),
  'Ноутбуки': require('../../assets/images/cimage1.png'),
};
const catFallback = require('../../assets/images/cimage1.png');

// ─── Зображення товарів ──────────────────────────────────────────
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
// Повертає source або null (для заглушки)
const getProductImage = (name = '') => {
  if (namedImages[name]) return namedImages[name];
  if (isLaptopName(name)) return laptopPool[name.length % laptopPool.length];
  if (isPhoneName(name)) return phonePool[name.length % phonePool.length];
  return null; // невідома категорія → заглушка
};
const getProductImageFile = (name = '') => {
  const lFiles = ['laptop0.png', 'laptop1.png'];
  const pFiles = ['phone0.png', 'phone1.png', 'phone2.png', 'phone3.png', 'phone4.png', 'phone5.png'];
  if (isLaptopName(name)) return lFiles[name.length % 2];
  if (isPhoneName(name)) return pFiles[name.length % 6];
  return 'phone0.png';
};

// ─── Пошук вузла в дереві категорій ─────────────────────────────
function findNodeInTree(tree, id) {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children?.length) {
      const found = findNodeInTree(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function CategoryScreen() {
  const { categoryId, categoryName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [mode, setMode] = useState(null); // 'subcategories' | 'products'
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wishlistIds, setWishlistIds] = useState(new Set());

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
        // Спробуємо отримати дерево щоб знайти підкатегорії
        let children = [];
        try {
          const treeRes = await getCategoriesTree();
          console.log('Tree response:', JSON.stringify(treeRes.data).slice(0, 300));
          const tree = Array.isArray(treeRes.data) ? treeRes.data : [];
          const node = findNodeInTree(tree, categoryId);
          console.log('Found node:', node?.name, 'children count:', node?.children?.length ?? node?.subcategories?.length ?? 0);
          // Пробуємо різні назви поля для підкатегорій
          children = node?.children ?? node?.subcategories ?? node?.items ?? [];
        } catch (treeErr) {
          console.warn('Tree fetch failed:', treeErr.message);
        }

        if (children.length > 0) {
          setSubcategories(children);
          setMode('subcategories');
        } else {
          // Немає підкатегорій — завантажуємо товари
          const prodRes = await getProducts(categoryId);
          console.log('Products count:', prodRes.data?.length ?? 0);
          setProducts(prodRes.data ?? []);
          setMode('products');
        }
      } catch (e) {
        console.error('Помилка завантаження категорії:', e);
        setMode('products');
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
        setWishlistIds(new Set(items.map(i => i.product_id)));
      } else {
        setWishlistIds(new Set());
      }
    }, [user])
  );

  const toggleWishlist = (product) => {
    if (!user) { router.push('/(tabs)/login'); return; }
    if (wishlistIds.has(product.id)) {
      removeFromWishlist(user.id, product.id, 'api');
      setWishlistIds(prev => { const n = new Set(prev); n.delete(product.id); return n; });
    } else {
      addToWishlist(user.id, {
        id: product.id, name: product.name,
        price: product.offer?.priceAmount,
        old_price: product.offer?.oldPriceAmount ?? null,
        image: getProductImageFile(product.name),
      }, 'api');
      setWishlistIds(prev => new Set(prev).add(product.id));
    }
  };

  const handleAddToCart = (product) => {
    if (!user) { router.push('/(tabs)/login'); return; }
    createCartTable();
    addToCart(user.id, {
      id: product.id, name: product.name,
      price: product.offer?.priceAmount,
      image: getProductImageFile(product.name),
    }, 'api');
  };

  if (!fontsLoaded) return null;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredSubs = subcategories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.container}>
      {/* ── Шапка ── */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{categoryName || 'Категорія'}</Text>
          <TouchableOpacity style={s.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Я шукаю..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* ── Панель фільтрів (тільки для товарів) ── */}
      {mode === 'products' && (
        <View style={s.filterBar}>
          <TouchableOpacity style={s.filterBtn}>
            <Ionicons name="swap-vertical-outline" size={14} color="#333" style={{ marginRight: 4 }} />
            <Text style={s.filterBtnText}>Сортування</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.filterBtn}>
            <Ionicons name="options-outline" size={14} color="#333" style={{ marginRight: 4 }} />
            <Text style={s.filterBtnText}>Фільтр</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={s.iconBtn}><Ionicons name="grid-outline" size={20} color="#555" /></TouchableOpacity>
          <TouchableOpacity style={s.iconBtn}><Ionicons name="list-outline" size={20} color="#555" /></TouchableOpacity>
        </View>
      )}

      {/* ── Контент ── */}
      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : mode === 'subcategories' ? (
        /* ── Підкатегорії ── */
        <ScrollView contentContainerStyle={s.listContent}>
          {filteredSubs.length === 0 ? (
            <View style={s.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#ccc" />
              <Text style={s.emptyText}>Підкатегорій не знайдено</Text>
            </View>
          ) : (
            <>
              {chunk(filteredSubs, 2).map((row, i) => (
                <View key={i} style={s.row}>
                  {row.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={s.catCard}
                      activeOpacity={0.75}
                      onPress={() => router.push({
                        pathname: '/(tabs)/category',
                        params: { categoryId: cat.id, categoryName: cat.name },
                      })}
                    >
                      <Image
                        source={categoryImageMap[cat.name] ?? catFallback}
                        style={s.catImg}
                        resizeMode="contain"
                      />
                      <Text style={s.catLabel} numberOfLines={2}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {row.length === 1 && <View style={[s.catCard, s.emptyCard]} />}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      ) : (
        /* ── Товари ── */
        filteredProducts.length === 0 ? (
          <View style={s.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={s.emptyText}>Товарів не знайдено</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={s.grid}>
            {filteredProducts.map(product => (
              <TouchableOpacity
                key={product.id}
                style={s.prodCard}
                activeOpacity={0.85}
                onPress={() => router.push({
                  pathname: '/(tabs)/ProductDetailScreen',
                  params: { id: product.id, type: 'api' },
                })}
              >
                <TouchableOpacity
                  style={s.heartBtn}
                  onPress={() => toggleWishlist(product)}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <Ionicons
                    name={wishlistIds.has(product.id) ? 'heart' : 'heart-outline'}
                    size={18}
                    color={wishlistIds.has(product.id) ? '#ff0008' : '#bbb'}
                  />
                </TouchableOpacity>
                {getProductImage(product.name) ? (
                  <Image source={getProductImage(product.name)} style={s.prodImg} resizeMode="contain" />
                ) : (
                  <View style={s.noPhoto}>
                    <Ionicons name="image-outline" size={36} color="#ccc" />
                    <Text style={s.noPhotoText}>Фото відсутнє</Text>
                  </View>
                )}
                <Text style={s.prodName} numberOfLines={2}>{product.name}</Text>
                <View style={s.priceBlock}>
                  <View style={{ flex: 1 }}>
                    {product.offer?.oldPriceAmount ? (
                      <Text style={s.oldPrice}>{product.offer.oldPriceAmount} ₴</Text>
                    ) : null}
                    <Text style={s.price}>{product.offer?.priceAmount} ₴</Text>
                  </View>
                  <TouchableOpacity
                    style={s.cartMiniBtn}
                    onPress={() => handleAddToCart(product)}
                    hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Ionicons name="cart-outline" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )
      )}
    </View>
  );
}

function chunk(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: { backgroundColor: '#00133d', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: '#fff', textAlign: 'center', marginHorizontal: 8 },
  cartBtn: { padding: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 14, height: 38 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#000' },

  filterBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  filterBtnText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#333' },
  iconBtn: { padding: 4 },

  // Підкатегорії
  listContent: { padding: 12, paddingBottom: 32 },
  row: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  catCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  emptyCard: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
  catImg: { width: 52, height: 52, marginRight: 10, flexShrink: 0 },
  catLabel: { flex: 1, fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#222', lineHeight: 17 },

  // Товари
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, paddingBottom: 32 },
  prodCard: { backgroundColor: '#fff', width: '48%', margin: '1%', padding: 10, borderRadius: 12, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  heartBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  prodImg: { width: '100%', height: 110, marginTop: 8, marginBottom: 8 },
  prodName: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: '#222', lineHeight: 15, marginBottom: 6 },
  priceBlock: { flexDirection: 'row', alignItems: 'flex-end' },
  oldPrice: { fontFamily: 'Montserrat_400Regular', fontSize: 10, color: '#aaa', textDecorationLine: 'line-through', marginBottom: 1 },
  price: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#ff0008' },
  cartMiniBtn: { backgroundColor: '#00133d', borderRadius: 8, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  noPhoto: { width: '100%', height: 110, marginTop: 8, marginBottom: 8, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  noPhotoText: { fontFamily: 'Montserrat_400Regular', fontSize: 9, color: '#bbb', marginTop: 4 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#888', marginTop: 12 },
});
