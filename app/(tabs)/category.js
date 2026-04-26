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

import { getCategoriesTree, getProducts } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { addToWishlist, removeFromWishlist, getWishlistItems, createWishlistTable } from '../../db/wishlist';
import { addToCart, createCartTable } from '../../db/cart';
import { getProductImage, getProductImageFile } from '../../utils/productImages';

// Словарь: ключ = название категории, значение = локальное изображение
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

const catFallback = require('../../assets/images/categories/cimage1.png');

// ─── Поиск узла в дереве категорий ─────────────────────────────────────────
// Рекурсивная функция — обходит дерево (категории с подкатегориями)
// и ищет узел по id. Если не нашла на текущем уровне — спускается глубже
function findNodeInTree(tree, id) {
  for (const node of tree) {
    // Если нашли нужный узел — возвращаем его
    if (node.id === id) return node;
    // Если у этого узла есть дочерние элементы — ищем рекурсивно среди них
    if (node.children?.length) {
      const found = findNodeInTree(node.children, id);
      if (found) return found;
    }
  }
  // Ничего не нашли
  return null;
}

export default function CategoryScreen() {
  const { categoryId, categoryName } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState(null);
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
    // шрифты загружены и есть id категории
    if (!fontsLoaded || !categoryId) return;

    const load = async () => {
      try {
        let children = [];
        try {
          const treeRes = await getCategoriesTree();
          const tree = Array.isArray(treeRes.data) ? treeRes.data : [];

          // ищем категорию
          const node = findNodeInTree(tree, categoryId);
          children = node?.children ?? node?.subcategories ?? node?.items ?? [];
        } catch {
        }

        if (children.length > 0) {
          // вывод под категорий
          setSubcategories(children);
          setMode('subcategories');
        } else {
          const prodRes = await getProducts(categoryId);
          setProducts(prodRes.data ?? []);
          setMode('products');
        }
      } catch {
        setMode('products');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fontsLoaded, categoryId]);
  // ─── Обновление вишлиста при возврате на экран ──────────────────────────────
  useFocusEffect(
    useCallback(() => {
      createWishlistTable(); // Создаём таблицу если не существует
      if (user) {
        // Читаем избранные товары текущего пользователя
        const items = getWishlistItems(user.id);
        setWishlistIds(new Set(items.map(i => i.product_id)));
      } else {
        setWishlistIds(new Set());
      }
    }, [user])
  );
  //wishlist
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

  // корзина
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
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={s.headerTitle} numberOfLines={1}>{categoryName || 'Категория'}</Text>

          <TouchableOpacity style={s.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Я ищу..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {mode === 'products' && (
        <View style={s.filterBar}>
          {/* Сортировка и фильтр без функционала */}
          <TouchableOpacity style={s.filterBtn}>
            <Ionicons name="swap-vertical-outline" size={14} color="#333" style={{ marginRight: 4 }} />
            <Text style={s.filterBtnText}>Сортировка</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.filterBtn}>
            <Ionicons name="options-outline" size={14} color="#333" style={{ marginRight: 4 }} />
            <Text style={s.filterBtnText}>Фильтр</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={s.iconBtn}><Ionicons name="grid-outline" size={20} color="#555" /></TouchableOpacity>
          <TouchableOpacity style={s.iconBtn}><Ionicons name="list-outline" size={20} color="#555" /></TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : mode === 'subcategories' ? (
        <ScrollView contentContainerStyle={s.listContent}>
          {filteredSubs.length === 0 ? (
            <View style={s.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color="#ccc" />
              <Text style={s.emptyText}>Подкатегории не найдены</Text>
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
        filteredProducts.length === 0 ? (
          <View style={s.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={s.emptyText}>Товары не найдены</Text>
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
                {/*избранное*/}
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

                {/* Изображение товара или заглушка */}
                {getProductImage(product.name) ? (
                  <Image source={getProductImage(product.name)} style={s.prodImg} resizeMode="contain" />
                ) : (
                  <View style={s.noPhoto}>
                    <Ionicons name="image-outline" size={36} color="#ccc" />
                    <Text style={s.noPhotoText}>Фото отсутствует</Text>
                  </View>
                )}

                <Text style={s.prodName} numberOfLines={2}>{product.name}</Text>

                <View style={s.priceBlock}>
                  <View style={{ flex: 1 }}>
                    {/* Старая цена */}
                    {product.offer?.oldPriceAmount ? (
                      <Text style={s.oldPrice}>{product.offer.oldPriceAmount} ₴</Text>
                    ) : null}
                    {/* Цена */}
                    <Text style={s.price}>{product.offer?.priceAmount} ₴</Text>
                  </View>

                  {/* Кнопка корзины */}
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

  // Подкатегории
  listContent: { padding: 12, paddingBottom: 32 },
  row: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  catCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  emptyCard: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
  catImg: { width: 52, height: 52, marginRight: 10, flexShrink: 0 },
  catLabel: { flex: 1, fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#222', lineHeight: 17 },

  // Товары
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, paddingBottom: 32 },
  prodCard: { backgroundColor: '#fff', width: '48%', margin: '1%', padding: 10, borderRadius: 12, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  heartBtn: { position: 'absolute', top: 8, right: 8, zIndex: 1 },
  prodImg: { width: '100%', height: 110, marginTop: 8, marginBottom: 8 },
  prodName: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: '#222', lineHeight: 15, marginBottom: 6 },
  priceBlock: { flexDirection: 'row', alignItems: 'flex-end' },
  oldPrice: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: '#aaa', textDecorationLine: 'line-through', marginBottom: 2 },
  price: { fontFamily: 'Montserrat_400Regular', fontSize: 15, color: '#ff0008' },
  cartMiniBtn: { backgroundColor: '#00133d', borderRadius: 8, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  noPhoto: { width: '100%', height: 110, marginTop: 8, marginBottom: 8, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  noPhotoText: { fontFamily: 'Montserrat_400Regular', fontSize: 9, color: '#bbb', marginTop: 4 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#888', marginTop: 12 },
});
