import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import {
  adminGetPendingProductReviews,
  adminGetProductReviews,
  adminApproveProductReview,
  adminRejectProductReview,
  adminDeleteProductReview,
} from '../../services/api';

export default function AdminReviews() {
  const router = useRouter();
  const [tab, setTab] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = tab === 'pending'
        ? await adminGetPendingProductReviews()
        : await adminGetProductReviews();
      setReviews(res.data?.items || res.data || []);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить отзывы');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (id, action, label) => {
    setActionId(id);
    try {
      await action(id);
      load();
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Ошибка';
      Alert.alert('Ошибка', msg);
      setActionId(null);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Удалить отзыв?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => doAction(id, adminDeleteProductReview, 'Удалить') },
    ]);
  };

  const renderStars = (rating) => {
    const r = Math.round(rating || 0);
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons key={i} name={i < r ? 'star' : 'star-outline'} size={12} color="#F39C12" />
    ));
  };

  const renderReview = ({ item }) => {
    const isLoading = actionId === item.id;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.ratingRow}>{renderStars(item.rating)}</View>
          <Text style={styles.author}>{item.authorName || item.customerName || 'Пользователь'}</Text>
        </View>

        {item.title ? <Text style={styles.reviewTitle}>{item.title}</Text> : null}
        {item.body || item.text ? (
          <Text style={styles.reviewBody} numberOfLines={3}>{item.body || item.text}</Text>
        ) : null}

        {item.productName ? (
          <Text style={styles.productLabel}>Товар: {item.productName}</Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator size="small" color="#00133d" style={{ marginTop: 10 }} />
        ) : (
          <View style={styles.actions}>
            {tab === 'pending' && (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => doAction(item.id, adminApproveProductReview)}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.actionText}>Одобрить</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => doAction(item.id, adminRejectProductReview)}>
                  <Ionicons name="close" size={16} color="#fff" />
                  <Text style={styles.actionText}>Отклонить</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Отзывы</Text>
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'pending' && styles.tabBtnActive]}
          onPress={() => setTab('pending')}
        >
          <Text style={[styles.tabText, tab === 'pending' && styles.tabTextActive]}>На проверке</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'all' && styles.tabBtnActive]}
          onPress={() => setTab('all')}
        >
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>Все</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={renderReview}
          ListEmptyComponent={<Text style={styles.empty}>Отзывов нет</Text>}
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
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: 'rgba(152,190,42,1)' },
  tabText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#888' },
  tabTextActive: { color: '#00133d' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  ratingRow: { flexDirection: 'row', gap: 2 },
  author: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: '#555' },
  reviewTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#00133d', marginBottom: 4 },
  reviewBody: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#444', lineHeight: 18 },
  productLabel: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: '#4A90D9', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
  },
  actionText: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#fff' },
  approveBtn: { backgroundColor: '#27AE60' },
  rejectBtn: { backgroundColor: '#E74C3C' },
  deleteBtn: { backgroundColor: '#95a5a6', paddingHorizontal: 10 },
  empty: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#888', textAlign: 'center', marginTop: 40 },
});
