import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, Dimensions, Animated, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { getPhones } from '../../db/phones';
import { getLaptops } from '../../db/laptops';
import { addToCart, createCartTable, getCartItems } from '../../db/cart';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const images = {
  'phone0.png': require('../../assets/images/phone0.png'),
  'phone1.png': require('../../assets/images/phone1.png'),
  'phone2.png': require('../../assets/images/phone2.png'),
  'phone3.png': require('../../assets/images/phone3.png'),
  'phone4.png': require('../../assets/images/phone4.png'),
  'phone5.png': require('../../assets/images/phone5.png'),
  'laptop0.png': require('../../assets/images/laptop0.png'),
  'laptop1.png': require('../../assets/images/laptop1.png'),
};

function AccordionSection({ title, badge, children }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={acc.wrapper}>
      <TouchableOpacity style={acc.row} onPress={() => setOpen(v => !v)} activeOpacity={0.7}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={acc.title}>{title}</Text>
          {badge != null && <Text style={acc.badge}>{badge}</Text>}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-forward'} size={18} color="#888" />
      </TouchableOpacity>
      {open && <View style={acc.body}>{children}</View>}
    </View>
  );
}

export default function ProductDetailScreen() {
  const { id, type } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  useEffect(() => {
    createCartTable();
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    try {
      const list = type === 'laptop' ? getLaptops() : getPhones();
      const found = list.find(p => String(p.id) === String(id));
      setItem(found || null);
    } catch (e) {
      console.error(e);
    }
  }, [fontsLoaded, id, type]);

  useEffect(() => {
    if (item) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [item]);

  // Перевіряємо стан кошика кожного разу коли екран у фокусі
  // Це спрацює і при першому відкритті, і після повернення з корзини
  useFocusEffect(
    useCallback(() => {
      if (!item || !user?.id) {
        setAddedToCart(false);
        return;
      }
      const cartItems = getCartItems(user.id);
      const alreadyInCart = cartItems.some(
        c => String(c.product_id) === String(item.id) &&
             c.product_type === (type || 'phone')
      );
      setAddedToCart(alreadyInCart);
    }, [item, user, id, type])
  );

  const handleAddToCart = () => {
    if (!user) {
      Alert.alert(
        'Увійдіть в акаунт',
        'Щоб додати товар до кошика, потрібно увійти.',
        [
          { text: 'Скасувати', style: 'cancel' },
          { text: 'Увійти', onPress: () => router.push('/(tabs)/login') },
        ]
      );
      return;
    }

    // Якщо вже в кошику — переходимо туди
    if (addedToCart) {
      router.push('/(tabs)/cart');
      return;
    }

    const result = addToCart(user.id, item, type || 'phone');
    if (result.success) {
      setAddedToCart(true);
      Alert.alert(
        'Додано до кошика!',
        `"${item.name}" успішно додано.`,
        [
          { text: 'Продовжити покупки', style: 'cancel' },
          { text: 'Перейти до кошика', onPress: () => router.push('/(tabs)/cart') },
        ]
      );
    } else {
      Alert.alert('Помилка', result.error || 'Не вдалось додати до кошика.');
    }
  };

  if (!fontsLoaded || !item) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontFamily: 'Montserrat_400Regular', color: '#888' }}>Завантаження...</Text>
      </View>
    );
  }

  let specsList = [];
  try {
    const parsed = JSON.parse(item.specs);
    if (Array.isArray(parsed)) specsList = parsed;
    else if (typeof parsed === 'object') specsList = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`);
  } catch {
    if (item.specs) specsList = [item.specs];
  }

  const imgSource = images[item.image] || images['phone0.png'];

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#fff', opacity: fadeAnim }}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{item.name}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.iconBtn}>
            <Ionicons name="share-social-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.imgBlock}>
          <Image source={imgSource} style={s.mainImg} resizeMode="contain" />
          <View style={s.dots}><View style={[s.dot, s.dotActive]} /></View>
        </View>

        <View style={s.infoBlock}>
          {item.release_year && <Text style={s.code}>Рік: {item.release_year}</Text>}
          <Text style={s.productName}>{item.name}</Text>
          <View style={s.ratingRow}>
            {[1,2,3,4,5].map(i => (
              <Ionicons key={i} name={i <= 4 ? 'star' : 'star-half'} size={16} color="#f5a623" />
            ))}
            <Text style={s.ratingText}>75 відгуків</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceMain}>{item.price?.toLocaleString('uk-UA')} ₴</Text>
            {item.old_price ? <Text style={s.priceOld}>{item.old_price?.toLocaleString('uk-UA')} ₴</Text> : null}
            {item.discount ? (
              <View style={s.discountBadge}><Text style={s.discountText}>-{item.discount}%</Text></View>
            ) : null}
          </View>
          <View style={s.actionsRow}>
            <TouchableOpacity style={s.actionIcon}>
              <Ionicons name="heart-outline" size={26} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={s.actionIcon}>
              <Ionicons name="git-compare-outline" size={26} color="#888" />
            </TouchableOpacity>
          </View>
          <View style={s.deliveryRow}>
            <Ionicons name="cube-outline" size={18} color="#98be2a" />
            <Text style={s.deliveryText}>{item.delivery || 'Самовивіз з наших магазинів — Безкоштовно'}</Text>
          </View>
        </View>

        <View style={s.btnRow}>
          <TouchableOpacity style={s.btnOrder}>
            <Text style={s.btnOrderText}>Оформити замовлення</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btnCart, addedToCart && s.btnCartAdded]}
            onPress={handleAddToCart}
          >
            <Ionicons
              name={addedToCart ? 'checkmark-circle-outline' : 'cart-outline'}
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={s.btnCartText}>
              {addedToCart ? 'В кошику' : 'Додати до кошика'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.accordions}>
          <AccordionSection title="Опис товару">
            <Text style={s.accordionText}>{item.description || 'Опис відсутній.'}</Text>
          </AccordionSection>
          <AccordionSection title="Відгуки" badge={item.reviews ? undefined : 0}>
            <Text style={s.accordionText}>{item.reviews || 'Відгуків ще немає.'}</Text>
          </AccordionSection>
          <AccordionSection title="Питання" badge={item.questions ? undefined : 0}>
            <Text style={s.accordionText}>{item.questions || 'Питань ще немає.'}</Text>
          </AccordionSection>
          <AccordionSection title="Характеристики">
            {specsList.length > 0
              ? specsList.map((spec, i) => <Text key={i} style={s.accordionText}>• {spec}</Text>)
              : <Text style={s.accordionText}>Характеристики відсутні.</Text>}
          </AccordionSection>
          <AccordionSection title="Відеоогляди">
            <Text style={s.accordionText}>{item.video || 'Відеооглядів немає.'}</Text>
          </AccordionSection>
          <AccordionSection title="Оплата та гарантія">
            <Text style={s.accordionText}>{item.payment || ''}</Text>
            <Text style={s.accordionText}>{item.warranty || ''}</Text>
          </AccordionSection>
          <AccordionSection title="Доставка">
            <Text style={s.accordionText}>{item.delivery || 'Інформація про доставку відсутня.'}</Text>
          </AccordionSection>
        </View>

        <TouchableOpacity style={s.supportBtn}>
          <Text style={s.supportBtnText}>Служба підтримки</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: '#00133d', flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 12, gap: 8 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#fff' },
  iconBtn: { padding: 4 },
  imgBlock: { backgroundColor: '#f8f8f8', alignItems: 'center', paddingVertical: 20 },
  mainImg: { width: width * 0.7, height: width * 0.7 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
  dotActive: { backgroundColor: '#98be2a', width: 20, borderRadius: 4 },
  infoBlock: { paddingHorizontal: 16, paddingTop: 14 },
  code: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: '#888', marginBottom: 4 },
  productName: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#00133d', lineHeight: 22, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  ratingText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#888', marginLeft: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  priceMain: { fontFamily: 'Montserrat_700Bold', fontSize: 22, color: '#00133d' },
  priceOld: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#888', textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: '#ff0008', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { color: '#fff', fontSize: 12, fontFamily: 'Montserrat_700Bold' },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  actionIcon: { padding: 6, borderWidth: 1, borderColor: '#eee', borderRadius: 8 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  deliveryText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#444', flex: 1 },
  btnRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 8, marginBottom: 4 },
  btnOrder: { flex: 1, backgroundColor: '#98be2a', borderRadius: 8, height: 44, justifyContent: 'center', alignItems: 'center' },
  btnOrderText: { color: '#fff', fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  btnCart: { flex: 1, backgroundColor: '#00133d', borderRadius: 8, height: 44, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  btnCartAdded: { backgroundColor: '#98be2a' },
  btnCartText: { color: '#fff', fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  accordions: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  accordionText: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#444', lineHeight: 20, marginBottom: 4 },
  supportBtn: { width: 258, height: 36, borderRadius: 41, backgroundColor: '#98be2a', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 32 },
  supportBtnText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#fff' },
});

const acc = StyleSheet.create({
  wrapper: { borderBottomWidth: 1, borderBottomColor: '#eee' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  title: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#00133d' },
  badge: { backgroundColor: '#eee', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1, fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#555' },
  body: { paddingHorizontal: 16, paddingBottom: 14 },
});