import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';

export default function ProfileScreen() {
  const { user, logout } = useAuth(); // --- логика: получаем пользователя и функцию выхода ---

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  if (!fontsLoaded) return null;

  const menuGroup1 = [ // для первой группы меню 
    { icon: 'gift-outline', label: 'Мій бонусний рахунок', badge: null },
    { icon: 'diamond-outline', label: 'Підписка Premium', badge: null },
    { icon: 'receipt-outline', label: 'Мої замовлення', badge: null },
    { icon: 'wallet-outline', label: 'Мій гаманець', badge: null },
    { icon: 'shield-outline', label: 'Сервіс та повернення товару', badge: null },
    { icon: 'mail-outline', label: 'Моє листування', badge: null },
    { icon: 'git-compare-outline', label: 'Порівняння', badge: null },
  ];

  const menuGroup2 = [ // для второй группы меню 
    { icon: 'storefront-outline', label: 'Адреси та час роботи', badge: null },
    { icon: 'information-circle-outline', label: 'Інформація', badge: null },
    { icon: 'settings-outline', label: 'Налаштування', badge: null },
  ];

  const MenuItem = ({ icon, label, badge }) => (
    <TouchableOpacity style={styles.menuItem}>
      <Ionicons name={icon} size={22} color="#555" style={styles.menuIcon} />
      <Text style={styles.menuLabel}>{label}</Text>
      {badge !== null && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Шапка */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Имя пользователя */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person-circle-outline" size={24} color="#555" style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { fontFamily: 'Montserrat_500Medium' }]}>
            {user?.name || 'Гість'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Группа 1 */}
      <View style={styles.card}>
        {menuGroup1.map((item, idx) => (
          <View key={idx}>
            <MenuItem {...item} />
            {idx < menuGroup1.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* Группа 2 */}
      <View style={styles.card}>
        {menuGroup2.map((item, idx) => (
          <View key={idx}>
            <MenuItem {...item} />
            {idx < menuGroup2.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* Кнопка выхода */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Вийти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#00133d',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 12,
  },
  logo: {
    width: 150,
    height: 50,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    marginRight: 14,
    width: 24,
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#222',
  },
  badge: {
    backgroundColor: 'rgba(152, 190, 42, 1)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Montserrat_700Bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 54,
  },
  logoutBtn: {
    marginHorizontal: 12,
    marginBottom: 32,
    height: 48,
    borderRadius: 41,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 14,
    color: '#e8000d',
  },
});