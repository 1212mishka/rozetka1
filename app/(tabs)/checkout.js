import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { useAuth } from '../../context/AuthContext';
import api, { startCheckout, setCheckoutRecipient, setCheckoutLineShipping, setCheckoutLinePayment, submitCheckout, clearCartApi } from '../../services/api';
import { clearCart } from '../../db/cart';

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

  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold });
  if (!fontsLoaded) return null;

  const handleSubmit = async () => {
    if (!firstName.trim()) { Alert.alert('Ошибка', 'Введите имя'); return; }
    if (!lastName.trim()) { Alert.alert('Ошибка', 'Введите фамилию'); return; }
    if (!phone.trim()) { Alert.alert('Ошибка', 'Введите телефон'); return; }

    setLoading(true);
    let orderCreated = false;

    try {
      // Шаг 1: создать чекаут
      const checkoutRes = await startCheckout();
      console.log('CHECKOUT:', JSON.stringify(checkoutRes.data));
      const checkoutId = checkoutRes.data?.checkoutId;
      const lines = checkoutRes.data?.lines || [];

      if (!checkoutId) throw new Error('Нет checkoutId');
      if (lines.length === 0) throw new Error('Нет lines в ответе: ' + JSON.stringify(checkoutRes.data));

      // Шаг 2: для каждой линии
      for (const line of lines) {
        const lineId = line.lineId || line.id;
        console.log('lineId:', lineId);

        await setCheckoutRecipient(checkoutId, {
          lineId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim() || user?.email || '',
          isCustomerRecipient: true,
        });

         await setCheckoutLineShipping(checkoutId, lineId, {
  method: 2, // NovaPoshtaWarehouse
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
  method: 4, // CashOnDelivery
  provider: 0, // Unknown
  requiresOnlineAuthorization: false,
});
      }

      // Шаг 3: сабмит
      await submitCheckout(checkoutId);
      orderCreated = true;
      if (user?.id) clearCart(user.id);
      await clearCartApi();

    } catch (e) {
      console.log('ERROR:', e?.response?.status, JSON.stringify(e?.response?.data), e?.message);
    }

    setLoading(false);

    Alert.alert(
      orderCreated ? 'Заказ оформлен!' : 'Ошибка',
      orderCreated
        ? `Спасибо, ${firstName}! Заказ принят.`
        : 'Не удалось оформить заказ. Попробуйте снова.',
      [{ text: 'OK', onPress: () => { if (orderCreated) router.replace('/(tabs)/orders'); } }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Оформление заказа</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summaryCard}>
          <Ionicons name="cart-outline" size={20} color="#98BE2A" />
          <Text style={styles.summaryText}>
            {items.length} {items.length === 1 ? 'товар' : 'товара'} на сумму{' '}
            <Text style={styles.summaryPrice}>{total.toLocaleString('uk-UA')} ₴</Text>
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Контактные данные</Text>
        <Text style={styles.label}>Имя *</Text>
        <TextInput style={styles.input} placeholder="Иван" placeholderTextColor="#aaa"
          value={firstName} onChangeText={setFirstName} />
        <Text style={styles.label}>Фамилия *</Text>
        <TextInput style={styles.input} placeholder="Иванов" placeholderTextColor="#aaa"
          value={lastName} onChangeText={setLastName} />
        <Text style={styles.label}>Телефон *</Text>
        <TextInput style={styles.input} placeholder="+380961234567" placeholderTextColor="#aaa"
          value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="example@gmail.com" placeholderTextColor="#aaa"
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.sectionTitle}>Адрес доставки</Text>
        <Text style={styles.label}>Город *</Text>
        <TextInput style={styles.input} placeholder="Киев" placeholderTextColor="#aaa"
          value={city} onChangeText={setCity} />
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Улица</Text>
            <TextInput style={styles.input} placeholder="Крещатик" placeholderTextColor="#aaa"
              value={street} onChangeText={setStreet} />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Дом</Text>
            <TextInput style={styles.input} placeholder="1" placeholderTextColor="#aaa"
              value={house} onChangeText={setHouse} />
          </View>
        </View>
        <Text style={styles.label}>Комментарий</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Пожелания к заказу..."
          placeholderTextColor="#aaa" value={comment} onChangeText={setComment}
          multiline numberOfLines={3} textAlignVertical="top" />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Подтвердить заказ · {total.toLocaleString('uk-UA')} ₴</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#00133d', flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14,
  },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#fff', textAlign: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 20,
    borderLeftWidth: 4, borderLeftColor: '#98BE2A',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  summaryText: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#333' },
  summaryPrice: { fontFamily: 'Montserrat_700Bold', color: '#00133d' },
  sectionTitle: {
    fontFamily: 'Montserrat_700Bold', fontSize: 13, color: '#888',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 4,
  },
  label: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#333', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, height: 46,
    fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#000',
    borderWidth: 1, borderColor: '#e8e8e8', marginBottom: 12,
  },
  textArea: { height: 80, paddingTop: 12 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  submitBtn: {
    backgroundColor: 'rgba(152,190,42,1)', borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  submitBtnText: { fontFamily: 'Montserrat_700Bold', fontSize: 15, color: '#fff' },
});