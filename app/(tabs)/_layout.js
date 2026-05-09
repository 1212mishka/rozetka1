import { Tabs, Redirect, usePathname } from 'expo-router';
import React from 'react';
import { HapticTab } from '@/components/haptic-tab';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { useAuth } from '../../features/auth/AuthContext';

const HIDDEN = { href: null };

export default function TabLayout() {
  const { user } = useAuth();
  const pathname = usePathname();

  const isOnAuth = pathname === '/login' || pathname === '/register';

  if (!user && !isOnAuth) {
    return <Redirect href="/login" />;
  }

  if (user && isOnAuth) {
    return <Redirect href={user.role === 'Admin' ? '/admin' : '/'} />;
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
        <Tabs.Screen name="(admin)/admin" options={{ title: 'Панель', tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="(admin)/admin-categories" options={{ title: 'Категорії', tabBarIcon: ({ color }) => <Ionicons name="layers-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="(admin)/admin-products" options={{ title: 'Товари', tabBarIcon: ({ color }) => <Ionicons name="cube-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="(admin)/admin-sellers" options={{ title: 'Продавці', tabBarIcon: ({ color }) => <Ionicons name="storefront-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="(admin)/admin-reviews" options={{ title: 'Відгуки', tabBarIcon: ({ color }) => <Ionicons name="chatbubbles-outline" size={24} color={color} /> }} />

        <Tabs.Screen name="(shop)/index" options={HIDDEN} />
        <Tabs.Screen name="(shop)/catalog" options={HIDDEN} />
        <Tabs.Screen name="(shop)/category" options={HIDDEN} />
        <Tabs.Screen name="(shop)/products" options={HIDDEN} />
        <Tabs.Screen name="(shop)/ProductDetailScreen" options={HIDDEN} />
        <Tabs.Screen name="(user)/wishlist" options={HIDDEN} />
        <Tabs.Screen name="(user)/profile" options={HIDDEN} />
        <Tabs.Screen name="(user)/cart" options={HIDDEN} />
        <Tabs.Screen name="(user)/checkout" options={HIDDEN} />
        <Tabs.Screen name="(user)/orders" options={HIDDEN} />
        <Tabs.Screen name="(user)/user" options={HIDDEN} />
        <Tabs.Screen name="(seller)/seller-panel" options={HIDDEN} />
        <Tabs.Screen name="(seller)/seller-add-product" options={HIDDEN} />
        <Tabs.Screen name="(auth)/register" options={HIDDEN} />
        <Tabs.Screen name="(auth)/login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
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
        <Tabs.Screen name="(shop)/index" options={{ title: 'Головна', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
        <Tabs.Screen name="(shop)/catalog" options={{ title: 'Каталог', tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="(seller)/seller-panel" options={{ title: 'Магазин', tabBarIcon: ({ color }) => <Ionicons name="storefront-outline" size={24} color={color} /> }} />
        <Tabs.Screen name="(user)/profile" options={{ title: 'Ще', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} /> }} />

        <Tabs.Screen name="(seller)/seller-add-product" options={HIDDEN} />
        <Tabs.Screen name="(admin)/admin" options={HIDDEN} />
        <Tabs.Screen name="(admin)/admin-categories" options={HIDDEN} />
        <Tabs.Screen name="(admin)/admin-products" options={HIDDEN} />
        <Tabs.Screen name="(admin)/admin-sellers" options={HIDDEN} />
        <Tabs.Screen name="(admin)/admin-reviews" options={HIDDEN} />
        <Tabs.Screen name="(user)/wishlist" options={HIDDEN} />
        <Tabs.Screen name="(auth)/register" options={HIDDEN} />
        <Tabs.Screen name="(auth)/login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="(user)/cart" options={HIDDEN} />
        <Tabs.Screen name="(shop)/ProductDetailScreen" options={HIDDEN} />
        <Tabs.Screen name="(shop)/products" options={HIDDEN} />
        <Tabs.Screen name="(shop)/category" options={HIDDEN} />
        <Tabs.Screen name="(user)/user" options={HIDDEN} />
        <Tabs.Screen name="(user)/checkout" options={HIDDEN} />
        <Tabs.Screen name="(user)/orders" options={HIDDEN} />
      </Tabs>
    );
  }

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
      <Tabs.Screen name="(shop)/index" options={{ title: 'Головна', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="(shop)/catalog" options={{ title: 'Каталог', tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="(user)/wishlist" options={{ title: 'Обрані', tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={24} color={color} /> }} />
      <Tabs.Screen name="(user)/profile" options={{ title: 'Ще', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} /> }} />

      <Tabs.Screen name="(seller)/seller-panel" options={HIDDEN} />
      <Tabs.Screen name="(seller)/seller-add-product" options={HIDDEN} />
      <Tabs.Screen name="(admin)/admin" options={HIDDEN} />
      <Tabs.Screen name="(admin)/admin-categories" options={HIDDEN} />
      <Tabs.Screen name="(admin)/admin-products" options={HIDDEN} />
      <Tabs.Screen name="(admin)/admin-sellers" options={HIDDEN} />
      <Tabs.Screen name="(admin)/admin-reviews" options={HIDDEN} />
      <Tabs.Screen name="(auth)/register" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="(auth)/login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="(user)/cart" options={HIDDEN} />
      <Tabs.Screen name="(shop)/ProductDetailScreen" options={HIDDEN} />
      <Tabs.Screen name="(shop)/products" options={HIDDEN} />
      <Tabs.Screen name="(shop)/category" options={HIDDEN} />
      <Tabs.Screen name="(user)/user" options={HIDDEN} />
      <Tabs.Screen name="(user)/checkout" options={HIDDEN} />
      <Tabs.Screen name="(user)/orders" options={HIDDEN} />
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
