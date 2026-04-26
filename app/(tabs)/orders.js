import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { getOrders } from '../../services/api';

const STATUS_LABEL = {
  Pending: 'Ожидает',
  Processing: 'Обрабатывается',
  Shipped: 'Отправлен',
  Delivering: 'Доставляется',
  Delivered: 'Доставлен',
  Cancelled: 'Отменён',
  Created: 'Оформлен',
  Submitted: 'Принят',
  Confirmed: 'Подтверждён',
  Completed: 'Завершён',
  Refunded: 'Возврат',
};

const STATUS_COLOR = {
  Pending: '#E67E22',
  Processing: '#3498DB',
  Shipped: '#9B59B6',
  Delivering: '#8E44AD',
  Delivered: '#27AE60',
  Completed: '#27AE60',
  Cancelled: '#E74C3C',
  Refunded: '#E74C3C',
  Created: '#95a5a6',
  Submitted: '#3498DB',
  Confirmed: '#27AE60',
};

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const res = await getOrders();
          const raw = res.data?.items || res.data?.orders || res.data || [];
          setOrders(Array.isArray(raw) ? raw : []);
        } catch {
          setOrders([]);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  if (!fontsLoaded) return null;

  const renderOrder = ({ item }) => {
    const statusKey = item.status || 'Created';
    const color = STATUS_COLOR[statusKey] || '#888';
    const label = STATUS_LABEL[statusKey] || statusKey;
    const date = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
      : '';
    const total = item.totalAmount ?? item.total ?? item.totalPrice ?? 0;
    const itemsCount = item.itemsCount ?? item.items?.length ?? null;
    const shortId = String(item.id || item.orderId || '').slice(-8).toUpperCase();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Заказ #{shortId}</Text>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
        </View>
        {date ? <Text style={styles.date}>{date}</Text> : null}
        <View style={styles.cardFooter}>
          {itemsCount != null && (
            <Text style={styles.itemsCount}>{itemsCount} {itemsCount === 1 ? 'товар' : 'товара'}</Text>
          )}
          {total > 0 ? (
            <Text style={styles.total}>{Number(total).toLocaleString('uk-UA')} ₴</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Мои заказы</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, idx) => String(item.id || idx)}
          contentContainerStyle={styles.list}
          renderItem={renderOrder}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>Заказов пока нет</Text>
              <Text style={styles.emptySubtext}>Оформите первый заказ в каталоге</Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/(tabs)/catalog')}
              >
                <Text style={styles.actionBtnText}>Перейти в каталог</Text>
              </TouchableOpacity>
            </View>
          }
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
  backBtn: { padding: 6 },
  headerTitle: {
    flex: 1,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 17,
    color: '#fff',
    textAlign: 'center',
  },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#00133d' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontFamily: 'Montserrat_500Medium', fontSize: 11 },
  date: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#888', marginBottom: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  itemsCount: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#888' },
  total: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#00133d' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: {
    fontFamily: 'Montserrat_500Medium', fontSize: 16,
    color: '#00133d', marginTop: 16, marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Montserrat_400Regular', fontSize: 13,
    color: '#888', marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#98be2a', borderRadius: 30, height: 46,
    paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center',
  },
  actionBtnText: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#fff' },
});
