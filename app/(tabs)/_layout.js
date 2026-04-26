import { Tabs, Redirect, useSegments } from 'expo-router';
import React from 'react';
import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const HIDDEN = { href: null };

export default function TabLayout() {
  const { user } = useAuth();
  const segments = useSegments();

  const isOnAuth = segments[1] === 'login' || segments[1] === 'register';

  if (!user && !isOnAuth) {
    return <Redirect href="/(tabs)/login" />;
  }

  if (user && isOnAuth) {
    return <Redirect href={user.role === 'Admin' ? '/(tabs)/admin' : '/(tabs)'} />;
  }

  const isAdmin = user?.role === 'Admin';
  const isSeller = user?.role === 'Seller';

  if (isAdmin) {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: '#98BE2A',
          tabBarInactiveTintColor: '#8e8e93',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
        }}>
        <Tabs.Screen name="admin" options={{ title: 'Панель', tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="admin-categories" options={{ title: 'Категории', tabBarIcon: ({ color }) => <Ionicons name="layers-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="admin-products" options={{ title: 'Товары', tabBarIcon: ({ color }) => <Ionicons name="cube-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="admin-sellers" options={{ title: 'Продавцы', tabBarIcon: ({ color }) => <Ionicons name="storefront-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="admin-reviews" options={{ title: 'Отзывы', tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={24} color={color} /> }} />

        <Tabs.Screen name="index" options={HIDDEN} />
        <Tabs.Screen name="catalog" options={HIDDEN} />
        <Tabs.Screen name="wishlist" options={HIDDEN} />
        <Tabs.Screen name="profile" options={HIDDEN} />
        <Tabs.Screen name="register" options={HIDDEN} />
        <Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="cart" options={HIDDEN} />
        <Tabs.Screen name="ProductDetailScreen" options={HIDDEN} />
        <Tabs.Screen name="products" options={HIDDEN} />
        <Tabs.Screen name="category" options={HIDDEN} />
        <Tabs.Screen name="user" options={HIDDEN} />
        <Tabs.Screen name="seller-panel" options={HIDDEN} />
        <Tabs.Screen name="seller-add-product" options={HIDDEN} />
        <Tabs.Screen name="checkout" options={HIDDEN} />
        <Tabs.Screen name="orders" options={HIDDEN} />
      </Tabs>
    );
  }

  if (isSeller) {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: '#98BE2A',
          tabBarInactiveTintColor: '#8e8e93',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
        }}>
        <Tabs.Screen name="index" options={{ title: 'Главная', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
        <Tabs.Screen name="catalog" options={{ title: 'Каталог', tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="seller-panel" options={{ title: 'Магазин', tabBarIcon: ({ color }) => <Ionicons name="storefront-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Ещё', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} /> }} />

        <Tabs.Screen name="seller-add-product" options={HIDDEN} />
        <Tabs.Screen name="admin" options={HIDDEN} />
        <Tabs.Screen name="admin-categories" options={HIDDEN} />
        <Tabs.Screen name="admin-products" options={HIDDEN} />
        <Tabs.Screen name="admin-sellers" options={HIDDEN} />
        <Tabs.Screen name="admin-reviews" options={HIDDEN} />
        <Tabs.Screen name="wishlist" options={HIDDEN} />
        <Tabs.Screen name="register" options={HIDDEN} />
        <Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="cart" options={HIDDEN} />
        <Tabs.Screen name="ProductDetailScreen" options={HIDDEN} />
        <Tabs.Screen name="products" options={HIDDEN} />
        <Tabs.Screen name="category" options={HIDDEN} />
        <Tabs.Screen name="user" options={HIDDEN} />
        <Tabs.Screen name="checkout" options={HIDDEN} />
        <Tabs.Screen name="orders" options={HIDDEN} />
      </Tabs>
    );
  }

  // Customer
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: 'rgba(152, 190, 42, 1)',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Главная', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="catalog" options={{ title: 'Каталог', tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Списки', tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Ещё', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} /> }} />

      <Tabs.Screen name="seller-panel" options={HIDDEN} />
      <Tabs.Screen name="seller-add-product" options={HIDDEN} />
      <Tabs.Screen name="admin" options={HIDDEN} />
      <Tabs.Screen name="admin-categories" options={HIDDEN} />
      <Tabs.Screen name="admin-products" options={HIDDEN} />
      <Tabs.Screen name="admin-sellers" options={HIDDEN} />
      <Tabs.Screen name="admin-reviews" options={HIDDEN} />
      <Tabs.Screen name="register" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="cart" options={HIDDEN} />
      <Tabs.Screen name="ProductDetailScreen" options={HIDDEN} />
      <Tabs.Screen name="products" options={HIDDEN} />
      <Tabs.Screen name="category" options={HIDDEN} />
      <Tabs.Screen name="user" options={HIDDEN} />
      <Tabs.Screen name="checkout" options={HIDDEN} />
      <Tabs.Screen name="orders" options={HIDDEN} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(166,165,165,0.5)',
    elevation: 4,
    height: 70,
    borderRadius: 0,
    paddingBottom: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '400',
  },
});
