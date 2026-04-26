import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, TextInput, Image,
  Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { adminGetCategories, getProducts, getProduct } from '../../services/api';

export default function AdminProducts() {
  const [view, setView] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProds, setLoadingProds] = useState(false);

  // Детали товара
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetail, setProductDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold });

  useEffect(() => {
    adminGetCategories()
      .then(r => setCategories(r.data || []))
      .catch(() => Alert.alert('Ошибка', 'Не удалось загрузить категории'))
      .finally(() => setLoadingCats(false));
  }, []);

  const openCategory = useCallback(async (cat) => {
    setSelectedCategory(cat);
    setView('products');
    setLoadingProds(true);
    setProducts([]);
    try {
      const res = await getProducts(cat.id);
      setProducts(res.data || []);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить товары');
    } finally {
      setLoadingProds(false);
    }
  }, []);

  const openProductDetail = async (product) => {
    setSelectedProduct(product);
    setProductDetail(null);
    setDetailVisible(true);
    setLoadingDetail(true);
    try {
      const res = await getProduct(product.id);
      setProductDetail(res.data);
    } catch {
      setProductDetail(product);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredProducts = search.trim()
    ? products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))
    : products;

  if (!fontsLoaded) return null;

  const detail = productDetail || selectedProduct;
  const imageUrl = detail?.mainImageUrl || detail?.imageUrl || null;
  const price = detail?.offer?.priceAmount ?? detail?.minPrice ?? null;
  const oldPrice = detail?.offer?.oldPriceAmount ?? null;
  const stock = detail?.offer?.stockQuantity ?? null;

  // ─── Экран: категории ───────────────────────────────────────────────────────
  if (view === 'categories') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Товары</Text>
        </View>
        <Text style={styles.hint}>Выберите категорию</Text>
        {loadingCats ? (
          <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.catRow} onPress={() => openCategory(item)}>
                <View style={styles.catIcon}>
                  <Ionicons name="layers-outline" size={20} color="#4A90D9" />
                </View>
                <Text style={styles.catName}>{item.name}</Text>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Категорий нет</Text>}
          />
        )}
      </SafeAreaView>
    );
  }

  // ─── Экран: список товаров ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setView('categories'); setSearch(''); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{selectedCategory?.name}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{products.length}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по названию..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#aaa"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#aaa" />
          </TouchableOpacity>
        )}
      </View>

      {loadingProds ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.productRow} onPress={() => openProductDetail(item)}>
              {item.mainImageUrl ? (
                <Image source={{ uri: item.mainImageUrl }} style={styles.productImg} resizeMode="cover" />
              ) : (
                <View style={[styles.productImg, styles.noImage]}>
                  <Ionicons name="image-outline" size={24} color="#ccc" />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                {item.offer?.priceAmount != null && (
                  <Text style={styles.productPrice}>{Number(item.offer.priceAmount).toLocaleString('uk-UA')} ₴</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Товаров нет</Text>}
        />
      )}

      {/* Модалка деталей товара */}
      <Modal visible={detailVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={2}>{detail?.name}</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Картинка */}
              <Text style={styles.sectionLabel}>Картинка</Text>
              {loadingDetail ? (
                <ActivityIndicator color="#00133d" style={{ marginVertical: 20 }} />
              ) : imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.productDetailImg} resizeMode="contain" />
              ) : (
                <View style={styles.noImageBox}>
                  <Ionicons name="image-outline" size={40} color="#ccc" />
                  <Text style={styles.noImageText}>Картинки нет</Text>
                  <Text style={styles.noImageHint}>Картинки загружают продавцы через свой аккаунт</Text>
                </View>
              )}

              {/* Информация */}
              {!loadingDetail && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Информация</Text>
                  <View style={styles.infoTable}>
                    {price != null && (
                      <InfoRow label="Цена" value={`${Number(price).toLocaleString('uk-UA')} ₴`} accent />
                    )}
                    {oldPrice != null && (
                      <InfoRow label="Старая цена" value={`${Number(oldPrice).toLocaleString('uk-UA')} ₴`} />
                    )}
                    {stock != null && (
                      <InfoRow label="В наличии" value={`${stock} шт.`} />
                    )}
                    {detail?.description && (
                      <InfoRow label="Описание" value={detail.description} />
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, accent }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, accent && { color: '#98BE2A', fontFamily: 'Montserrat_700Bold' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#00133d', flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#fff' },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  countText: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: '#fff' },
  hint: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#888', margin: 16, marginBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 10, marginHorizontal: 16, marginVertical: 10,
    paddingHorizontal: 14, height: 44,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  searchInput: { flex: 1, fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#000' },
  list: { padding: 16, paddingTop: 4 },
  catRow: {
    backgroundColor: '#fff', borderRadius: 10, flexDirection: 'row',
    alignItems: 'center', padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  catIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#e8f0fb', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  catName: { flex: 1, fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#00133d' },
  productRow: {
    backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  productImg: { width: 64, height: 64, borderRadius: 10, marginRight: 12, backgroundColor: '#f0f0f0' },
  noImage: { justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#00133d', lineHeight: 18 },
  productPrice: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#98BE2A', marginTop: 4 },
  empty: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#888', textAlign: 'center', marginTop: 40 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: 22, paddingBottom: 40, maxHeight: '88%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18, gap: 10 },
  modalTitle: { flex: 1, fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#00133d', lineHeight: 22 },
  sectionLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  productDetailImg: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#f0f0f0', marginBottom: 10 },
  noImageBox: {
    borderRadius: 12, backgroundColor: '#f7f7f7', padding: 28,
    alignItems: 'center', marginBottom: 4,
  },
  noImageText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#bbb', marginTop: 10 },
  noImageHint: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#ccc', marginTop: 4, textAlign: 'center' },

  infoTable: { backgroundColor: '#f9f9f9', borderRadius: 12, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  infoLabel: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#888', flex: 1 },
  infoValue: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#00133d', flex: 2, textAlign: 'right' },
});
