import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { adminGetCategories, adminGetSellers, adminGetPendingProductReviews } from '../../services/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ categories: 0, sellers: 0, pendingReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold });

  useEffect(() => {
    Promise.allSettled([
      adminGetCategories(),
      adminGetSellers(),
      adminGetPendingProductReviews(),
    ]).then(([cats, sellers, reviews]) => {
      setStats({
        categories: (cats.value?.data || []).length,
        sellers: (sellers.value?.data?.items || sellers.value?.data || []).length,
        pendingReviews: (reviews.value?.data?.items || reviews.value?.data || []).length,
      });
      setLoading(false);
    });
  }, []);

  if (!fontsLoaded) return null;

  const STATS = [
    { label: 'Категорий', value: stats.categories, icon: 'layers-outline', color: '#4A90D9' },
    { label: 'Продавцов', value: stats.sellers, icon: 'storefront-outline', color: '#E67E22' },
    { label: 'Отзывов на проверке', value: stats.pendingReviews, icon: 'chatbubbles-outline', color: '#E74C3C' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Добро пожаловать</Text>
          <Text style={styles.headerSub}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Статистика</Text>

        {loading ? (
          <ActivityIndicator color="#00133d" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.statsGrid}>
            {STATS.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon} size={22} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color="#4A90D9" style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.infoText}>
            Используйте вкладки внизу для управления категориями, товарами, продавцами и отзывами.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#00133d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#fff' },
  headerSub: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 },
  logoutText: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  content: { padding: 16 },
  sectionLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontFamily: 'Montserrat_700Bold', fontSize: 26, color: '#00133d' },
  statLabel: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#888', textAlign: 'center', marginTop: 2 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EBF4FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  infoText: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#2471A3', flex: 1, lineHeight: 19 },
});
