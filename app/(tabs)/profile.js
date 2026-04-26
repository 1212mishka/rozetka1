
import { useState, useCallback } from 'react';

import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { getProfile, logout as logoutApi } from '../../services/api';
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  useFocusEffect(useCallback(() => {
    if (!user) return;
    if (user.name) { setDisplayName(user.name); return; }
    getProfile().then(res => {
      const p = res.data;
      const name = [p.firstName, p.lastName].filter(Boolean).join(' ') || p.name || p.username || user.email;
      setDisplayName(name);
    }).catch(() => setDisplayName(user.email || 'Гость'));
  }, [user]));

  if (!fontsLoaded) return null;

  const menuGroup1 = [
    { icon: 'gift-outline',         label: 'Мой бонусный счёт',          badge: null, onPress: null },
    { icon: 'diamond-outline',      label: 'Подписка Premium',            badge: null, onPress: null },
    { icon: 'receipt-outline',      label: 'Мои заказы',                  badge: null, onPress: () => router.push('/(tabs)/orders') },
    { icon: 'wallet-outline',       label: 'Мой кошелёк',                 badge: null, onPress: null },
    { icon: 'shield-outline',       label: 'Сервис и возврат товара',     badge: null, onPress: null },
    { icon: 'mail-outline',         label: 'Моя переписка',               badge: 1,    onPress: null },
    { icon: 'git-compare-outline',  label: 'Сравнение',                   badge: 1,    onPress: null },
  ];

  const menuGroup2 = [
    { icon: 'storefront-outline',          label: 'Адреса и часы работы', badge: null },
    { icon: 'information-circle-outline',  label: 'Информация',           badge: null },
    { icon: 'settings-outline',            label: 'Настройки',            badge: null },
  ];

  const MenuItem = ({ icon, label, badge, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress || undefined}>
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

      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person-circle-outline" size={24} color="#555" style={styles.menuIcon} />
          <Text style={[styles.menuLabel, { fontFamily: 'Montserrat_500Medium' }]}>
            {displayName || user?.email || 'Гость'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {menuGroup1.map((item, idx) => (
          <View key={idx}>
            <MenuItem {...item} />
            {idx < menuGroup1.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        {menuGroup2.map((item, idx) => (
          <View key={idx}>
            <MenuItem {...item} />
            {idx < menuGroup2.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={async () => {
          try {
            await logoutApi();
          } catch {}
          logout();
        }}
      >
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#00133d',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 14,
    marginBottom: 12,
  },
  logo: { width: 150, height: 50 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(166,165,165,1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuIcon: { marginRight: 14, width: 24 },
  menuLabel: {
    flex: 1,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#222',
  },
  badge: {
    backgroundColor: '#98be2a',
    borderRadius: 11,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Montserrat_700Bold' },
  divider: { height: 0.5, backgroundColor: 'rgba(166,165,165,0.4)', marginLeft: 54 },
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
  logoutText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#e8000d' },
});
