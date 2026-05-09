import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';
import { useAuth } from '../../../features/auth/AuthContext';
import {
  startCheckout, setCheckoutRecipient,
  setCheckoutLineShipping, setCheckoutLinePayment,
  submitCheckout, clearCartApi,
} from '../../../shared/api';
import { clearCart } from '../../../features/cart';
import { getProductImage } from '../../../shared/utils/productImages';

function SectionCard({ icon, title, children }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.cardIconWrap}>
          <Ionicons name={icon} size={17} color="#98BE2A" />
        </View>
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Field({ label, required, style, ...props }) {
  return (
    <View style={[s.fieldWrap, style]}>
      <Text style={s.fieldLabel}>
        {label}{required && <Text style={{ color: '#E74C3C' }}> *</Text>}
      </Text>
      <TextInput style={s.input} placeholderTextColor="#bbb" {...props} />
    </View>
  );
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const items = params.items ? JSON.parse(params.items) : [];
  const total = params.total ? Number(params.total) : 0;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  if (!fontsLoaded) return null;

  async function handleSubmit() {
    if (!firstName.trim()) { Alert.alert('Помилка', 'Введіть ім\'я'); return; }
    if (!lastName.trim()) { Alert.alert('Помилка', 'Введіть прізвище'); return; }
    if (!phone.trim()) { Alert.alert('Помилка', 'Введіть телефон'); return; }

    setLoading(true);
    let orderCreated = false;

    try {
      const checkoutRes = await startCheckout();
      const checkoutId = checkoutRes.data?.checkoutId;
      const lines = checkoutRes.data?.lines || [];

      if (!checkoutId) throw new Error('Нет checkoutId');
      if (lines.length === 0) throw new Error('Нет lines: ' + JSON.stringify(checkoutRes.data));

      for (const line of lines) {
        const lineId = line.lineId || line.id;

        await setCheckoutRecipient(checkoutId, {
          lineId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim() || user?.email || '',
          isCustomerRecipient: true,
        });

        await setCheckoutLineShipping(checkoutId, lineId, {
          method: 2,
          country: 'UA',
          region: '',
          city: city.trim() || 'Київ',
          street: null,
          house: null,
          apartment: null,
          postalCode: null,
          warehouseCode: '1',
          warehouseName: 'Відділення №1',
          comment: comment.trim() || null,
        });

        await setCheckoutLinePayment(checkoutId, lineId, {
          method: 4,
          provider: 0,
          requiresOnlineAuthorization: false,
        });
      }

      await submitCheckout(checkoutId);
      orderCreated = true;
      if (user?.id) clearCart(user.id);
      await clearCartApi();
    } catch (e) {
      console.log('ERROR:', e?.response?.status, JSON.stringify(e?.response?.data), e?.message);
    }

    setLoading(false);

    Alert.alert(
      orderCreated ? '✓ Замовлення оформлено!' : 'Помилка',
      orderCreated
        ? `Дякуємо, ${firstName}! Ваше замовлення прийнято.\nМи зв'яжемося з вами за номером ${phone}.`
        : 'Не вдалося оформити замовлення. Спробуйте ще раз.',
      [{ text: 'OK', onPress: () => { if (orderCreated) router.replace('/(tabs)/orders'); } }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f2f3f5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Оформлення замовлення</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionCard icon="cart-outline" title="Ваше замовлення">
          {items.map((item, idx) => {
            const img = getProductImage(item.name);
            const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
            return (
              <View key={idx} style={[s.itemRow, idx < items.length - 1 && s.itemRowBorder]}>
                {img ? (
                  <Image source={img} style={s.itemImg} resizeMode="contain" />
                ) : (
                  <View style={[s.itemImg, s.itemImgPlaceholder]}>
                    <Ionicons name="image-outline" size={20} color="#ccc" />
                  </View>
                )}
                <View style={s.itemInfo}>
                  <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={s.itemQty}>{item.quantity} шт.</Text>
                </View>
                <Text style={s.itemPrice}>{itemTotal.toLocaleString('uk-UA')} ₴</Text>
              </View>
            );
          })}
          {items.length === 0 && (
            <Text style={{ fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#aaa' }}>
              Кошик порожній
            </Text>
          )}
        </SectionCard>

        <SectionCard icon="person-outline" title="Контактні дані">
          <View style={s.row}>
            <Field label="Ім'я" required placeholder="Іван"
              value={firstName} onChangeText={setFirstName} style={{ flex: 1 }} />
            <Field label="Прізвище" required placeholder="Іваненко"
              value={lastName} onChangeText={setLastName} style={{ flex: 1 }} />
          </View>
          <Field label="Телефон" required placeholder="+380 96 123 45 67"
            value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Email" placeholder="example@gmail.com"
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </SectionCard>

        <SectionCard icon="cube-outline" title="Адреса доставки">
          <View style={s.deliveryBadge}>
            <Ionicons name="business-outline" size={18} color="#98BE2A" />
            <Text style={s.deliveryBadgeText}>Нова Пошта</Text>
            <View style={s.deliveryBadgeDot} />
            <Text style={s.deliveryFree}>Безкоштовно</Text>
          </View>
          <Field label="Місто" required placeholder="Київ"
            value={city} onChangeText={setCity} />
          <View style={s.row}>
            <Field label="Вулиця" placeholder="Хрещатик"
              value={street} onChangeText={setStreet} style={{ flex: 2 }} />
            <Field label="Будинок" placeholder="1"
              value={house} onChangeText={setHouse} style={{ flex: 1 }} />
          </View>
        </SectionCard>

        <SectionCard icon="chatbubble-outline" title="Коментар">
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Побажання, уточнення до замовлення..."
            placeholderTextColor="#bbb"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </SectionCard>

        <View style={s.totalCard}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Товари ({items.length})</Text>
            <Text style={s.totalValue}>{total.toLocaleString('uk-UA')} ₴</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Доставка</Text>
            <Text style={[s.totalValue, { color: '#27AE60' }]}>Безкоштовно</Text>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalRow}>
            <Text style={s.totalFinalLabel}>Разом</Text>
            <Text style={s.totalFinalValue}>{total.toLocaleString('uk-UA')} ₴</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={s.submitBtnText}>Підтвердити замовлення</Text>
              <Text style={s.submitBtnPrice}>{total.toLocaleString('uk-UA')} ₴</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          Натискаючи кнопку, ви погоджуєтесь з умовами продажу та повернення товару
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: '#00133d',
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { padding: 6 },
  headerTitle: {
    flex: 1,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 17,
    color: '#fff',
    textAlign: 'center',
  },

  content: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginBottom: 14,
  },
  cardIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#f0f8e0',
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 14, color: '#00133d' },

  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 10,
  },
  itemRowBorder: {
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  itemImg: { width: 56, height: 56, borderRadius: 10 },
  itemImgPlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center', alignItems: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontFamily: 'Montserrat_500Medium', fontSize: 12,
    color: '#00133d', lineHeight: 17, marginBottom: 3,
  },
  itemQty: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: '#aaa' },
  itemPrice: { fontFamily: 'Montserrat_700Bold', fontSize: 13, color: '#00133d' },

  row: { flexDirection: 'row', gap: 10 },
  fieldWrap: { marginBottom: 10 },
  fieldLabel: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: '#888', marginBottom: 6 },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: '#000',
    borderWidth: 1,
    borderColor: '#eee',
  },
  textArea: { height: 80, paddingTop: 12, marginBottom: 0 },

  deliveryBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 14,
    backgroundColor: '#f5fbe8',
    borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#d6eead',
  },
  deliveryBadgeText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, color: '#00133d' },
  deliveryBadgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#aaa' },
  deliveryFree: { fontFamily: 'Montserrat_500Medium', fontSize: 12, color: '#27AE60' },

  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalLabel: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#888' },
  totalValue: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#00133d' },
  totalDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  totalFinalLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#00133d' },
  totalFinalValue: { fontFamily: 'Montserrat_700Bold', fontSize: 18, color: '#00133d' },

  submitBtn: {
    backgroundColor: '#98BE2A',
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 0,
  },
  submitBtnText: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#fff' },
  submitBtnPrice: {
    fontFamily: 'Montserrat_700Bold', fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },

  disclaimer: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});
