import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, Image, TextInput, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { useAuth } from '../../context/AuthContext';
import { getSellerMe, getMyProducts, createSellerProfile } from '../../services/api';

const STATUS_LABEL = {
  Active: 'Активен',
  Pending: 'На проверке',
  Suspended: 'Заблокирован',
  Rejected: 'Отклонён',
  Draft: 'Черновик',
};
const STATUS_COLOR = {
  Active: '#27AE60',
  Pending: '#E67E22',
  Suspended: '#E74C3C',
  Rejected: '#95a5a6',
  Draft: '#aaa',
};

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40) + '-' + Date.now().toString(36);
}

export default function SellerPanel() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [seller, setSeller] = useState(null);
  const [noProfile, setNoProfile] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold });

  // Create profile form state
  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sellerRes = await getSellerMe();
      setSeller(sellerRes.data);
      setNoProfile(false);
      if (sellerRes.data?.id) {
        const prodsRes = await getMyProducts(sellerRes.data.id);
        setProducts(prodsRes.data || []);
      }
    } catch (e) {
      if (e?.response?.status === 404) {
        setNoProfile(true);
      } else {
        Alert.alert('Ошибка', 'Не удалось загрузить данные продавца');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreateProfile = async () => {
    if (!shopName.trim()) { Alert.alert('Ошибка', 'Введите название магазина'); return; }
    if (!shopPhone.trim()) { Alert.alert('Ошибка', 'Введите контактный телефон'); return; }
    setCreating(true);
    try {
      await createSellerProfile({
        name: shopName.trim(),
        slug: slugify(shopName.trim()),
        supportEmail: user?.email,
        supportPhone: shopPhone.trim(),
        submitForApproval: true,
      });
      Alert.alert('Готово', 'Профиль магазина создан и отправлен на проверку!');
      load();
    } catch (e) {
      const data = e?.response?.data;
      const msg = data?.detail || (data?.errors ? Object.values(data.errors).flat().join('\n') : null) || data?.title || 'Ошибка создания профиля';
      Alert.alert('Ошибка', msg);
    } finally {
      setCreating(false);
    }
  };

  if (!fontsLoaded) return null;

  const status = seller?.status || 'Pending';
  const statusColor = STATUS_COLOR[status] || '#888';
  const isActive = status === 'Active';

  if (!loading && noProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { flex: 1 }]}>Мой магазин</Text>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={styles.statusCard}>
            <Text style={[styles.statusText, { color: '#00133d', marginBottom: 6 }]}>Создайте профиль магазина</Text>
            <Text style={styles.statusHint}>Заполните данные и отправьте заявку на проверку администратору.</Text>
          </View>

          <Text style={styles.createLabel}>Название магазина *</Text>
          <TextInput
            style={styles.createInput}
            placeholder="Например: Мой магазин"
            placeholderTextColor="#aaa"
            value={shopName}
            onChangeText={setShopName}
          />
          <Text style={styles.createLabel}>Контактный телефон *</Text>
          <TextInput
            style={styles.createInput}
            placeholder="+380961234567"
            placeholderTextColor="#aaa"
            value={shopPhone}
            onChangeText={setShopPhone}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.createBtn} onPress={handleCreateProfile} disabled={creating}>
            {creating
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.createBtnText}>Создать магазин</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Мой магазин</Text>
          {seller?.name && <Text style={styles.headerSub}>{seller.name}</Text>}
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={isActive ? products : []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              {/* Статус продавца */}
              <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {STATUS_LABEL[status] || status}
                  </Text>
                </View>
                {status === 'Pending' && (
                  <Text style={styles.statusHint}>
                    Ваша заявка на рассмотрении у администратора. После одобрения вы сможете добавлять товары.
                  </Text>
                )}
                {status === 'Suspended' && (
                  <Text style={styles.statusHint}>Аккаунт продавца заблокирован. Обратитесь в поддержку.</Text>
                )}
              </View>

              {isActive && (
                <>
                  {/* Статистика */}
                  <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                      <Text style={styles.statNum}>{products.length}</Text>
                      <Text style={styles.statLabel}>Товаров</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={styles.statNum}>{products.filter(p => p.status === 'Published').length}</Text>
                      <Text style={styles.statLabel}>Опубликовано</Text>
                    </View>
                  </View>

                  {/* Кнопка добавить товар */}
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push('/(tabs)/seller-add-product')}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                    <Text style={styles.addBtnText}>Добавить товар</Text>
                  </TouchableOpacity>

                  <Text style={styles.sectionLabel}>Мои товары</Text>
                </>
              )}
            </>
          }
          renderItem={({ item }) => <ProductCard item={item} />}
          ListEmptyComponent={
            isActive ? (
              <View style={styles.emptyBox}>
                <Ionicons name="cube-outline" size={48} color="#ddd" />
                <Text style={styles.emptyText}>Товаров пока нет</Text>
                <Text style={styles.emptyHint}>Нажмите «Добавить товар» чтобы начать</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function ProductCard({ item }) {
  return (
    <View style={styles.productCard}>
      {item.mainImageUrl ? (
        <Image source={{ uri: item.mainImageUrl }} style={styles.productImg} resizeMode="cover" />
      ) : (
        <View style={[styles.productImg, styles.noImg]}>
          <Ionicons name="image-outline" size={22} color="#ccc" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        {item.offer?.priceAmount != null && (
          <Text style={styles.productPrice}>{Number(item.offer.priceAmount).toLocaleString('uk-UA')} ₴</Text>
        )}
        <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[item.status] || '#aaa') + '20' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] || '#aaa' }]}>
            {STATUS_LABEL[item.status] || item.status}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#00133d', flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16,
  },
  headerTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#fff' },
  headerSub: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  logoutBtn: { padding: 6 },
  list: { padding: 16 },

  statusCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderLeftWidth: 4, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: 'Montserrat_700Bold', fontSize: 14 },
  statusHint: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#666', lineHeight: 18 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statNum: { fontFamily: 'Montserrat_700Bold', fontSize: 24, color: '#00133d' },
  statLabel: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#888', marginTop: 2 },

  addBtn: {
    backgroundColor: 'rgba(152,190,42,1)', borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, marginBottom: 20,
  },
  addBtnText: { fontFamily: 'Montserrat_700Bold', fontSize: 15, color: '#fff' },

  sectionLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },

  productCard: {
    backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row',
    padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  productImg: { width: 70, height: 70, borderRadius: 10, marginRight: 12, backgroundColor: '#f0f0f0' },
  noImg: { justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#00133d', lineHeight: 18 },
  productPrice: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#98BE2A', marginTop: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 6 },
  badgeText: { fontFamily: 'Montserrat_500Medium', fontSize: 11 },

  emptyBox: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#bbb', marginTop: 12 },
  emptyHint: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#ccc', marginTop: 6 },

  createLabel: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#333', marginBottom: 6, marginTop: 12 },
  createInput: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, height: 46,
    fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#000',
    borderWidth: 1, borderColor: '#e8e8e8',
  },
  createBtn: {
    backgroundColor: 'rgba(152,190,42,1)', borderRadius: 12, height: 50,
    justifyContent: 'center', alignItems: 'center', marginTop: 24,
  },
  createBtnText: { fontFamily: 'Montserrat_700Bold', fontSize: 15, color: '#fff' },
});
