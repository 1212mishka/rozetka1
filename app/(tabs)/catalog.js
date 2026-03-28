import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { getCategories } from '../../api';

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

const fallbackImage = require('../../assets/images/cimage1.png');

export default function CatalogScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
    Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    const load = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data);
      } catch (e) {
        console.error('Ошибка категорий:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const rows = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push(filtered.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          <Text style={styles.headerTitle}>Каталог</Text>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(tabs)/cart')}>
              <Ionicons name="cart-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.search}
            placeholder="Я шукаю..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {rows.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.card}
                  activeOpacity={0.75}
                  onPress={() => router.push({ pathname: '/(tabs)/category', params: { categoryId: cat.id, categoryName: cat.name } })}
                >
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

          <TouchableOpacity style={styles.premiumBanner} activeOpacity={0.85}>
            <View style={styles.premiumContent}>
              <Ionicons name="star" size={20} color="#00133d" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>PREMIUM</Text>
                <Text style={styles.premiumSub}>Безкоштовна доставка з підпискою Premium</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#00133d" />
            </View>
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
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  cartBtn: { padding: 4 },
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
    marginBottom: 8,
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyCard: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  catImg: {
    width: 52,
    height: 52,
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
    backgroundColor: '#f5c518',
    borderRadius: 12,
    marginTop: 4,
    padding: 14,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#00133d',
  },
  premiumSub: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    color: '#00133d',
    marginTop: 1,
  },
});
