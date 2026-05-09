import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Image, Modal,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts, Montserrat_400Regular, Montserrat_500Medium,
  Montserrat_600SemiBold, Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { getOrders, getOrder, createProductReview } from '../../../shared/api';
import { getProductImage } from '../../../shared/utils/productImages';

const STATUS_MAP = {
  1: 'Pending', 2: 'AwaitingPayment', 3: 'Paid', 4: 'Processing',
  5: 'Shipped', 6: 'Delivered', 7: 'Completed', 8: 'Cancelled',
};
const STATUS_LABEL = {
  Pending: 'Очікує', AwaitingPayment: 'Очікує оплати', Paid: 'Оплачено',
  Processing: 'В обробці', Shipped: 'Відправлено', Delivered: 'Доставлено',
  Completed: 'Завершено', Cancelled: 'Скасовано', Created: 'Оформлено',
  Submitted: 'Прийнято', Confirmed: 'Підтверджено', Refunded: 'Повернення',
};
const STATUS_COLOR = {
  Pending: '#E67E22', AwaitingPayment: '#E67E22', Paid: '#27AE60',
  Processing: '#3498DB', Shipped: '#9B59B6', Delivered: '#27AE60',
  Completed: '#27AE60', Cancelled: '#E74C3C', Refunded: '#E74C3C',
  Created: '#95a5a6', Submitted: '#3498DB', Confirmed: '#27AE60',
};
const STATUS_ICON = {
  Pending: 'time-outline', AwaitingPayment: 'card-outline', Paid: 'checkmark-circle-outline',
  Processing: 'refresh-outline', Shipped: 'airplane-outline', Delivered: 'checkmark-circle-outline',
  Completed: 'checkmark-done-circle-outline', Cancelled: 'close-circle-outline',
  Refunded: 'return-down-back-outline', Created: 'receipt-outline',
  Submitted: 'paper-plane-outline', Confirmed: 'checkmark-circle-outline',
};

function StarRating({ rating, onRate }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: 8 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onRate(i)} activeOpacity={0.7}>
          <Ionicons name={i <= rating ? 'star' : 'star-outline'} size={32} color={i <= rating ? '#f5a623' : '#ccc'} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular, Montserrat_500Medium,
    Montserrat_600SemiBold, Montserrat_700Bold,
  });

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const res = await getOrders();
          const raw = res.data?.items || res.data?.orders || res.data || [];
          const list = Array.isArray(raw) ? raw : [];
          const detailed = await Promise.all(
            list.map(async (order) => {
              try {
                const det = await getOrder(order.id);
                return { ...order, items: det.data?.items || [] };
              } catch {
                return order;
              }
            })
          );
          setOrders(detailed);
        } catch {
          setOrders([]);
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [])
  );

  const openReview = (item) => {
    setReviewItem(item);
    setReviewRating(0);
    setReviewText('');
    setReviewModal(true);
  };

  const submitReview = async () => {
    if (reviewRating === 0) { Alert.alert('Оцінка', 'Будь ласка, оберіть оцінку від 1 до 5 зірок'); return; }
    setReviewLoading(true);
    try {
      await createProductReview({
  productId: reviewItem.productId || reviewItem.id,
  rating: reviewRating,
  body: reviewText.trim() || null,
  advantages: null,
  disadvantages: null,
});
      setReviewModal(false);
      Alert.alert('Дякуємо!', 'Ваш відгук успішно надіслано');
    } catch (err) {
 if (err?.response?.status === 409) {
    Alert.alert('Відгук вже є', 'Ви вже залишили відгук на цей товар.');
  } else {
    Alert.alert('Помилка', 'Не вдалося надіслати відгук. Спробуйте пізніше.');
  }    } finally {
      setReviewLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  const renderOrderItem = (orderItem, idx) => {
    const name = orderItem.productName || orderItem.name || '';
    const img = getProductImage(name);
    const price = orderItem.unitPrice ?? orderItem.price ?? orderItem.priceAmount ?? 0;
    const qty = orderItem.quantity ?? 1;
    return (
      <View key={idx} style={s.productRow}>
        {img ? (
          <Image source={img} style={s.productImg} resizeMode="contain" />
        ) : (
          <View style={[s.productImg, s.productImgPlaceholder]}>
            <Ionicons name="image-outline" size={20} color="#ccc" />
          </View>
        )}
        <View style={s.productInfo}>
          <Text style={s.productName} numberOfLines={2}>{name || 'Товар'}</Text>
          <Text style={s.productMeta}>{qty} шт · {Number(price * qty).toLocaleString('uk-UA')} ₴</Text>
        </View>
        <TouchableOpacity style={s.reviewBtn} onPress={() => openReview(orderItem)}>
          <Ionicons name="star-outline" size={13} color="#98BE2A" />
          <Text style={s.reviewBtnText}>Відгук</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderOrder = ({ item }) => {
    const statusKey = (typeof item.status === 'number' ? STATUS_MAP[item.status] : item.status) || 'Created';
    const color = STATUS_COLOR[statusKey] || '#888';
    const label = STATUS_LABEL[statusKey] || statusKey;
    const icon = STATUS_ICON[statusKey] || 'receipt-outline';
    const date = item.createdAtUtc
      ? new Date(item.createdAtUtc).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })
      : '';
    const total = item.totalAmount ?? item.grandTotalAmount ?? 0;
    const orderItems = Array.isArray(item.items) ? item.items : [];
    const shortId = String(item.number || item.id || '').slice(-8).toUpperCase();

    return (
      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={s.orderIdRow}>
            <View style={[s.statusDot, { backgroundColor: color }]} />
            <Text style={s.orderId}>Замовлення #{shortId}</Text>
          </View>
          <View style={[s.badge, { backgroundColor: color + '18' }]}>
            <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} />
            <Text style={[s.badgeText, { color }]}>{label}</Text>
          </View>
        </View>

        {date ? <Text style={s.date}>{date}</Text> : null}

        {orderItems.length > 0 && (
          <View style={s.itemsList}>
            {orderItems.map((oi, idx) => renderOrderItem(oi, idx))}
          </View>
        )}

        {orderItems.length === 0 && (
          <View style={s.noItemsRow}>
            <Ionicons name="cube-outline" size={14} color="#ccc" />
            <Text style={s.noItemsText}>Склад замовлення недоступний</Text>
          </View>
        )}

        <View style={s.cardFooter}>
          <Text style={s.totalLabel}>Разом</Text>
          <Text style={s.totalValue}>{Number(total).toLocaleString('uk-UA')} ₴</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Мої замовлення</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, idx) => String(item.id || idx)}
          contentContainerStyle={s.list}
          renderItem={renderOrder}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyContainer}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="receipt-outline" size={48} color="#98BE2A" />
              </View>
              <Text style={s.emptyTitle}>Замовлень поки немає</Text>
              <Text style={s.emptySubtext}>Оформіть перше замовлення в каталозі</Text>
              <TouchableOpacity style={s.actionBtn} onPress={() => router.push('/(tabs)/catalog')}>
                <Text style={s.actionBtnText}>Перейти до каталогу</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal visible={reviewModal} transparent animationType="slide">
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={s.modalBackdrop} activeOpacity={1} onPress={() => setReviewModal(false)} />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Написати відгук</Text>
            {reviewItem && (
              <Text style={s.modalProduct} numberOfLines={1}>
                {reviewItem.productName || reviewItem.name || 'Товар'}
              </Text>
            )}
            <StarRating rating={reviewRating} onRate={setReviewRating} />
            <Text style={s.ratingHint}>
              {reviewRating === 0 ? 'Натисніть на зірку' :
               reviewRating === 1 ? 'Дуже погано' :
               reviewRating === 2 ? 'Погано' :
               reviewRating === 3 ? 'Нормально' :
               reviewRating === 4 ? 'Добре' : 'Відмінно!'}
            </Text>
            <View style={s.textAreaWrap}>
              <TextInput
                style={s.textArea}
                placeholder="Розкажіть про товар..."
                placeholderTextColor="#bbb"
                value={reviewText}
                onChangeText={setReviewText}
                multiline numberOfLines={4} textAlignVertical="top"
              />
            </View>
            <TouchableOpacity style={[s.submitBtn, reviewLoading && { opacity: 0.7 }]}
              onPress={submitReview} disabled={reviewLoading} activeOpacity={0.85}>
              {reviewLoading ? <ActivityIndicator color="#fff" size="small" /> :
                <Text style={s.submitBtnText}>Надіслати відгук</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setReviewModal(false)}>
              <Text style={s.cancelBtnText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f3f5' },
  header: { backgroundColor: '#00133d', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#fff', textAlign: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  orderId: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#00133d' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontFamily: 'Montserrat_500Medium', fontSize: 11 },
  date: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#aaa', marginBottom: 12 },
  itemsList: { borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10, marginBottom: 10, gap: 10 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  productImg: { width: 52, height: 52, borderRadius: 10 },
  productImgPlaceholder: { backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  productInfo: { flex: 1 },
  productName: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: '#00133d', lineHeight: 16, marginBottom: 3 },
  productMeta: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: '#888' },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: '#98BE2A', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  reviewBtnText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, color: '#98BE2A' },
  noItemsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  noItemsText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#ccc' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10, marginTop: 2 },
  totalLabel: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#888' },
  totalValue: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#00133d' },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f8e0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 17, color: '#00133d', marginBottom: 8 },
  emptySubtext: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#888', marginBottom: 24 },
  actionBtn: { backgroundColor: '#98BE2A', borderRadius: 30, height: 46, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#e0e0e0', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 18, color: '#00133d', textAlign: 'center', marginBottom: 4 },
  modalProduct: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 4 },
  ratingHint: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 12, height: 18 },
  textAreaWrap: { borderRadius: 12, borderWidth: 1, borderColor: '#eee', backgroundColor: '#f8f9fa', marginBottom: 16, padding: 12 },
  textArea: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#000', minHeight: 90 },
  submitBtn: { backgroundColor: '#98BE2A', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#98BE2A', shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 },
  submitBtnText: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#fff' },
  cancelBtn: { height: 44, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#888' },
});