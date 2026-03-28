import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, Dimensions, Animated, Alert, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { getProduct, getProductOffers, addToFavorites, removeFromFavorites } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { addToCart, createCartTable } from '../../db/cart';

const { width } = Dimensions.get('window');

const namedImages = {
  'Apple iPhone 13': require('../../assets/images/phone0.png'),
  'Samsung Galaxy S23': require('../../assets/images/phone1.png'),
  'Xiaomi Redmi Note 12': require('../../assets/images/phone2.png'),
  'Realme 11 Pro': require('../../assets/images/phone3.png'),
  'Google Pixel 7a': require('../../assets/images/phone4.png'),
  'OnePlus Nord CE 3': require('../../assets/images/phone5.png'),
  'Apple MacBook Air M2': require('../../assets/images/laptop0.png'),
  'ASUS ZenBook 14': require('../../assets/images/laptop1.png'),
};

const laptopPool = [
  require('../../assets/images/laptop0.png'),
  require('../../assets/images/laptop1.png'),
];
const phonePool = [
  require('../../assets/images/phone0.png'),
  require('../../assets/images/phone1.png'),
  require('../../assets/images/phone2.png'),
  require('../../assets/images/phone3.png'),
  require('../../assets/images/phone4.png'),
  require('../../assets/images/phone5.png'),
];

const isLaptopName = (name = '') => {
  const l = name.toLowerCase();
  return l.includes('ноутбук') || l.includes('macbook') || l.includes('laptop') ||
    l.includes('zenbook') || l.includes('thinkpad') || l.includes('vivobook') ||
    l.includes('probook') || l.includes('elitebook') || l.includes('swift');
};

const isPhoneName = (name = '') => {
  const l = name.toLowerCase();
  return l.includes('iphone') || l.includes('samsung') || l.includes('xiaomi') ||
    l.includes('realme') || l.includes('pixel') || l.includes('oneplus') ||
    l.includes('смартфон') || l.includes('phone');
};
const getProductImage = (name = '') => {
  if (namedImages[name]) return namedImages[name];
  if (isLaptopName(name)) return laptopPool[name.length % laptopPool.length];
  if (isPhoneName(name)) return phonePool[name.length % phonePool.length];
  return null;
};

const getProductImageFile = (name = '') => {
  const laptopFiles = ['laptop0.png', 'laptop1.png'];
  const phoneFiles = ['phone0.png', 'phone1.png', 'phone2.png', 'phone3.png', 'phone4.png', 'phone5.png'];
  const pool = isLaptopName(name) ? laptopFiles : phoneFiles;
  return pool[name.length % pool.length];
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
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;
    const load = async () => {
      try {
        const [productRes, offersRes] = await Promise.all([
          getProduct(id),
          getProductOffers(id),
        ]);
        const product = productRes.data;
        const offer = Array.isArray(offersRes.data) ? offersRes.data[0] : offersRes.data;
        setItem({ ...product, offer });
        setIsFavorite(offer?.isFavorite ?? false);
      } catch (e) {
        console.error('Помилка завантаження товару:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fontsLoaded, id]);

  useEffect(() => {
    if (item) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [item]);

  const handleAddToCart = () => {
    if (!user) {
      router.push('/(tabs)/login');
      return;
    }
    createCartTable();
    const result = addToCart(user.id, {
      id: item.id,
      name: item.name,
      price: item.offer?.priceAmount,
      image: getProductImageFile(item.name),
    }, 'api');
    if (result.success) {
      Alert.alert('Додано!', `"${item.name}" додано до кошика.`, [
        { text: 'OK', style: 'cancel' },
        { text: 'Перейти до кошика', onPress: () => router.push('/(tabs)/cart') },
      ]);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      router.push('/(tabs)/login');
      return;
    }
    try {
      if (isFavorite) {
        await removeFromFavorites(id);
        setIsFavorite(false);
      } else {
        await addToFavorites(id);
        setIsFavorite(true);
      }
    } catch (e) {
      console.error('Помилка вішліст:', e);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#00133d" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontFamily: 'Montserrat_400Regular', color: '#888' }}>Товар не знайдено.</Text>
      </View>
    );
  }

  const offer = item.offer;
  const imgSource = getProductImage(item.name);

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
          {imgSource ? (
            <Image source={imgSource} style={s.mainImg} resizeMode="contain" />
          ) : (
            <View style={s.noPhoto}>
              <Ionicons name="image-outline" size={64} color="#ccc" />
              <Text style={s.noPhotoText}>Фото відсутнє</Text>
            </View>
          )}
          <View style={s.dots}><View style={[s.dot, s.dotActive]} /></View>
        </View>

        <View style={s.infoBlock}>
          <Text style={s.productName}>{item.name}</Text>
          <View style={s.ratingRow}>
            {[1,2,3,4,5].map(i => (
              <Ionicons key={i} name={i <= 4 ? 'star' : 'star-half'} size={16} color="#f5a623" />
            ))}
            <Text style={s.ratingText}>75 відгуків</Text>
          </View>
          <View style={s.priceRow}>
            <Text style={s.priceMain}>{offer?.priceAmount} ₴</Text>
            {offer?.oldPriceAmount ? (
              <Text style={s.priceOld}>{offer.oldPriceAmount} ₴</Text>
            ) : null}
          </View>
          <View style={s.actionsRow}>
            <TouchableOpacity style={s.actionIcon} onPress={toggleFavorite}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={26}
                color={isFavorite ? '#ff0008' : '#888'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={s.actionIcon}>
              <Ionicons name="git-compare-outline" size={26} color="#888" />
            </TouchableOpacity>
          </View>
          <View style={s.deliveryRow}>
            <Ionicons name="cube-outline" size={18} color="#98be2a" />
            <Text style={s.deliveryText}>Самовивіз з наших магазинів — Безкоштовно</Text>
          </View>
        </View>

        <View style={s.btnRow}>
          <TouchableOpacity style={s.btnOrder}>
            <Text style={s.btnOrderText}>Оформити замовлення</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnCart} onPress={handleAddToCart}>
            <Ionicons name="cart-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={s.btnCartText}>Додати до кошика</Text>
          </TouchableOpacity>
        </View>

        <View style={s.accordions}>
          <AccordionSection title="Опис товару">
            <Text style={s.accordionText}>{item.description || 'Опис відсутній.'}</Text>
          </AccordionSection>
          <AccordionSection title="Відгуки" badge={0}>
            <Text style={s.accordionText}>Відгуків ще немає.</Text>
          </AccordionSection>
          <AccordionSection title="Питання" badge={0}>
            <Text style={s.accordionText}>Питань ще немає.</Text>
          </AccordionSection>
          <AccordionSection title="Характеристики">
            <Text style={s.accordionText}>Характеристики відсутні.</Text>
          </AccordionSection>
          <AccordionSection title="Доставка">
            <Text style={s.accordionText}>Інформація про доставку відсутня.</Text>
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
  noPhoto: { width: width * 0.7, height: width * 0.7, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 12 },
  noPhotoText: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#bbb', marginTop: 8 },
  mainImg: { width: width * 0.7, height: width * 0.7 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
  dotActive: { backgroundColor: '#98be2a', width: 20, borderRadius: 4 },
  infoBlock: { paddingHorizontal: 16, paddingTop: 14 },
  productName: { fontFamily: 'Montserrat_700Bold', fontSize: 16, color: '#00133d', lineHeight: 22, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 },
  ratingText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#888', marginLeft: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  priceMain: { fontFamily: 'Montserrat_700Bold', fontSize: 22, color: '#00133d' },
  priceOld: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#888', textDecorationLine: 'line-through' },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  actionIcon: { padding: 6, borderWidth: 1, borderColor: '#eee', borderRadius: 8 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  deliveryText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#444', flex: 1 },
  btnRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 8, marginBottom: 4 },
  btnOrder: { flex: 1, backgroundColor: '#98be2a', borderRadius: 8, height: 44, justifyContent: 'center', alignItems: 'center' },
  btnOrderText: { color: '#fff', fontFamily: 'Montserrat_700Bold', fontSize: 13 },
  btnCart: { flex: 1, backgroundColor: '#00133d', borderRadius: 8, height: 44, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
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