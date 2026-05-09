import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../features/auth/AuthContext';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { adminGetCategories, adminGetSellers, adminGetPendingProductReviews } from '../../../shared/api';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ categories: 0, sellers: 0, pendingSellers: 0, pendingReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold });

  useEffect(() => {
    Promise.allSettled([
      adminGetCategories(),
      adminGetSellers(),
      adminGetPendingProductReviews(),
    ]).then(([cats, sellers, reviews]) => {
      const allSellers = sellers.value?.data?.items || sellers.value?.data || [];
      const STATUS_MAP = { 0: 'Draft', 1: 'Pending', 2: 'Active', 3: 'Rejected', 4: 'Suspended' };
      const pendingSellers = allSellers.filter(s => {
        const st = typeof s.status === 'number' ? STATUS_MAP[s.status] : s.status;
        return st === 'Pending';
      }).length;
      setStats({
        categories: (cats.value?.data || []).length,
        sellers: allSellers.length,
        pendingSellers,
        pendingReviews: (reviews.value?.data?.items || reviews.value?.data || []).length,
      });
      setLoading(false);
    });
  }, []);

  if (!fontsLoaded) return null;

  const STATS = [
    { label: 'Категорій', value: stats.categories, icon: 'layers-outline', color: '#4A90D9' },
    { label: 'Всього продавців', value: stats.sellers, icon: 'storefront-outline', color: '#E67E22' },
    { label: 'Продавці на перевірці', value: stats.pendingSellers, icon: 'time-outline', color: '#E67E22' },
    { label: 'Відгуків на перевірці', value: stats.pendingReviews, icon: 'chatbubbles-outline', color: '#E74C3C' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ласкаво просимо</Text>
          <Text style={styles.headerSub}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Вийти</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!loading && stats.pendingSellers > 0 && (
          <TouchableOpacity style={styles.alertBanner} onPress={() => router.push('/admin-sellers')} activeOpacity={0.8}>
            <View style={styles.alertIconWrap}>
              <Ionicons name="time-outline" size={20} color="#E67E22" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Нові заявки продавців</Text>
              <Text style={styles.alertSub}>{stats.pendingSellers} продавець очікує схвалення → натисніть щоб переглянути</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#E67E22" />
          </TouchableOpacity>
        )}

        {!loading && stats.pendingReviews > 0 && (
          <TouchableOpacity style={[styles.alertBanner, styles.alertBannerRed]} onPress={() => router.push('/admin-reviews')} activeOpacity={0.8}>
            <View style={[styles.alertIconWrap, { backgroundColor: '#fdecea' }]}>
              <Ionicons name="chatbubbles-outline" size={20} color="#E74C3C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: '#c0392b' }]}>Відгуки на модерації</Text>
              <Text style={styles.alertSub}>{stats.pendingReviews} відгук очікує перевірки → натисніть щоб переглянути</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#E74C3C" />
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>Статистика</Text>

        {loading ? (
          <ActivityIndicator color="#00133d" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.statsGrid}>
            {STATS.map((s) => (
              <View key={s.label} style={[styles.statCard, s.label === 'Продавці на перевірці' && s.value > 0 && styles.statCardAlert]}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon} size={22} color={s.color} />
                </View>
                <Text style={[styles.statValue, s.label === 'Продавці на перевірці' && s.value > 0 && { color: '#E67E22' }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color="#4A90D9" style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.infoText}>
            Використовуйте вкладки внизу для керування категоріями, товарами, продавцями та відгуками.
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

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fad7a0',
    gap: 10,
  },
  alertBannerRed: {
    backgroundColor: '#fff5f5',
    borderColor: '#f5b7b1',
  },
  alertIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#fef3e7',
    justifyContent: 'center', alignItems: 'center',
  },
  alertTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: '#E67E22', marginBottom: 2 },
  alertSub: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: '#888', lineHeight: 15 },
  statCardAlert: {
    borderWidth: 1.5,
    borderColor: '#f0a500',
  },
});
