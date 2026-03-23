import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { createCategoriesTable, getCategories } from '../../db/categories';
import { seedCategories } from '../../db/categories-seed';

const categoryImages = {
  'cimage1.png': require('../../assets/images/cimage1.png'),
  'cimage2.png': require('../../assets/images/cimage2.png'),
  'cimage3.png': require('../../assets/images/cimage3.png'),
  'cimage4.png': require('../../assets/images/cimage4.png'),
  'cimage5.png': require('../../assets/images/cimage5.png'),
  'cimage6.png': require('../../assets/images/cimage6.png'),
  'cimage7.png': require('../../assets/images/cimage7.png'),
  'cimage8.png': require('../../assets/images/cimage8.png'),
  'cimage9.png': require('../../assets/images/cimage9.png'),
  'cimage10.png': require('../../assets/images/cimage10.png'),
  'cimage11.png': require('../../assets/images/cimage11.png'),
  'cimage12.png': require('../../assets/images/cimage12.png'),
  'cimage13.png': require('../../assets/images/cimage13.png'),
  'cimage14.png': require('../../assets/images/cimage14.png'),
  'cimage15.png': require('../../assets/images/cimage15.png'),
  'cimage16.png': require('../../assets/images/cimage16.png'),
};

export default function CatalogScreen() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
    Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    try {
      createCategoriesTable();
      seedCategories();
      setCategories(getCategories());
    } catch (e) {
      console.error('Ошибка категорий:', e);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const filtered = categories.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const rows = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push(filtered.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      {/* Шапка */}
    <View style={styles.header}>
  <View style={styles.headerRow}>
    <View style={{flex: 1}} />
    <Text style={styles.headerTitle}>Каталог</Text>
    <View style={{flex: 1, alignItems: 'flex-end'}}>
      <TouchableOpacity style={styles.cartBtn}>
        <Ionicons name="cart-outline" size={28} color="#fff" />
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}></Text>
        </View>
      </TouchableOpacity>
    </View>
  </View>
  <View style={styles.searchContainer}>
    <Ionicons name="search-outline" size={18} color="#aaa" style={{marginRight: 8}} />
    <TextInput
      style={styles.search}
      placeholder="Я шукаю..."
      placeholderTextColor="#aaa"
      value={search}
      onChangeText={setSearch}
    />
  </View>
</View>

      <ScrollView contentContainerStyle={{padding: 12, paddingBottom: 32}}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.card}>
                <Image
                  source={categoryImages[cat.image] || categoryImages['cimage1.png']}
                  style={styles.catImg}
                  resizeMode="contain"
                />
                <Text style={styles.catLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
            {row.length === 1 && <View style={[styles.card, {backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0}]} />}
          </View>
        ))}

        {/* Premium баннер */}
        <TouchableOpacity style={styles.premiumBanner}>
          <Image
            source={require('../../assets/images/button.png')}
            style={styles.premiumImg}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00133d',
    paddingTop: 39,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cartBtn: {
    position: 'relative',
    padding: 6,
  },
  cartBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#a3ff00',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00133d',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 40,
  },
  search: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    color: '#000',
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
    alignItems: 'flex-start',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  catImg: {
    width: 60,
    height: 60,
    marginRight: 8,
  },
  catLabel: {
    flex: 1,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#222',
    alignSelf: 'center',
  },
  premiumBanner: {
    marginTop: 8,
    overflow: 'hidden',
    marginHorizontal: -12,
  },
  premiumImg: {
    width: '100%',
    height: 65,
  },
});