import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';

export default function CartScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      {/* корзины --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Кошик</Text>
        <TouchableOpacity style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={28} color="#fff" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>0</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* */}
      <View style={styles.emptyContainer}>
        <Image
          source={require('../../assets/images/cart.png')}
          style={styles.emptyImg}
          resizeMode="contain"
        />
        <Text style={styles.emptyHeading}>Ой! Кошик порожній!</Text>
        <Text style={styles.emptySubtext}>Але це легко виправити!</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/catalog')}>
          <Text style={styles.shopBtnText}>Перейти до каталогу</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  cartBtn: {
    position: 'relative',
    padding: 4,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyHeading: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 16,
    color: '#4a90d9',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 13,
    color: '#4a90d9',
    marginBottom: 32,
  },
  shopBtn: {
    backgroundColor: 'rgba(152, 190, 42, 1)',
    borderRadius: 41,
    height: 48,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopBtnText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: '#fff',
  },
});