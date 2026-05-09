import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { adminGetSellers, adminApproveSeller, adminRejectSeller, adminSuspendSeller } from '../../../shared/api';

const STATUS_MAP = {
  0: 'Draft', 1: 'Pending', 2: 'Active', 3: 'Rejected', 4: 'Suspended',
  Draft: 'Draft', Pending: 'Pending', Active: 'Active', Rejected: 'Rejected', Suspended: 'Suspended',
};

const STATUS_COLOR = {
  Active: '#27AE60',
  Pending: '#E67E22',
  Suspended: '#E74C3C',
  Rejected: '#95a5a6',
  Draft: '#aaa',
};

const STATUS_LABEL = {
  Active: 'Активний',
  Pending: 'На перевірці',
  Suspended: 'Заблокований',
  Rejected: 'Відхилено',
  Draft: 'Чернетка',
};

export default function AdminSellers() {
  const router = useRouter();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetSellers();
      setSellers(res.data?.items || res.data || []);
    } catch {
      Alert.alert('Помилка', 'Не вдалося завантажити продавців');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doAction = async (id, action, label) => {
    Alert.alert('Підтвердження', `${label} продавця?`, [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Так', onPress: async () => {
          setActionId(id);
          try {
            await action(id);
            load();
          } catch (e) {
            const msg = e?.response?.data?.detail || 'Помилка';
            Alert.alert('Помилка', msg);
          } finally {
            setActionId(null);
          }
        }
      }
    ]);
  };

  if (!fontsLoaded) return null;

  const renderSeller = ({ item }) => {
    const status = STATUS_MAP[item.status] || 'Pending';
    const color = STATUS_COLOR[status] || '#888';
    const isLoading = actionId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Ionicons name="storefront-outline" size={22} color="#E67E22" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.sellerName}>{item.name || item.companyName || 'Без імені'}</Text>
            <Text style={styles.sellerEmail}>{item.email || ''}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>{STATUS_LABEL[status] || status}</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#00133d" style={{ marginTop: 10 }} />
        ) : (
          <View style={styles.actions}>
            {status === 'Pending' && (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => doAction(item.id, adminApproveSeller, 'Схвалити')}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.actionText}>Схвалити</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => doAction(item.id, adminRejectSeller, 'Відхилити')}>
                  <Ionicons name="close" size={16} color="#fff" />
                  <Text style={styles.actionText}>Відхилити</Text>
                </TouchableOpacity>
              </>
            )}
            {status === 'Active' && (
              <TouchableOpacity style={[styles.actionBtn, styles.suspendBtn]} onPress={() => doAction(item.id, adminSuspendSeller, 'Заблокувати')}>
                <Ionicons name="ban-outline" size={16} color="#fff" />
                <Text style={styles.actionText}>Заблокувати</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Продавці</Text>
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={sellers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={renderSeller}
          ListEmptyComponent={<Text style={styles.empty}>Продавців немає</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#00133d',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backBtn: { padding: 6, marginRight: 8 },
  headerTitle: { flex: 1, fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#fff' },
  refreshBtn: { padding: 6 },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: '#fef3e7', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  cardInfo: { flex: 1 },
  sellerName: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#00133d' },
  sellerEmail: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#888', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontFamily: 'Montserrat_500Medium', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  actionText: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#fff' },
  approveBtn: { backgroundColor: '#27AE60' },
  rejectBtn: { backgroundColor: '#E74C3C' },
  suspendBtn: { backgroundColor: '#E67E22' },
  empty: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#888', textAlign: 'center', marginTop: 40 },
});
