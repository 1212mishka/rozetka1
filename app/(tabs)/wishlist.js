
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { getUsers, deleteUser, createUsersTable } from '../../db/users';
 
export default function WishlistScreen() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });
  const [users, setUsers] = useState([]);
 
  const loadUsers = () => {
    try {
      createUsersTable();
      setUsers(getUsers());
    } catch (e) {
      console.error('Ошибка загрузки пользователей:', e);
    }
  };
 
  useEffect(() => {
    if (!fontsLoaded) return;
    loadUsers();
  }, [fontsLoaded]);
 
  const handleDelete = (id, name) => {
    Alert.alert(
      'Видалити користувача',
      `Ви впевнені, що хочете видалити "${name}"?`,
      [
        { text: 'Скасувати', style: 'cancel' },
        {
          text: 'Видалити',
          style: 'destructive',
          onPress: () => {
            deleteUser(id);
            loadUsers();
          },
        },
      ]
    );
  };
 
  if (!fontsLoaded) return null;
 
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Шапка */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Користувачі</Text>
        <View style={s.countBadge}>
          <Text style={s.countBadgeText}>{users.length}</Text>
        </View>
      </View>
 
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {users.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="people-outline" size={52} color="#ccc" />
            <Text style={s.emptyText}>Немає зареєстрованих користувачів</Text>
          </View>
        ) : (
          users.map((user, idx) => (
            <View key={user.id || idx} style={s.card}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{user.name?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View style={s.info}>
                <Text style={s.name}>{user.name}</Text>
                <Text style={s.email}>{user.email}</Text>
                <Text style={s.idText}>ID: {user.id}</Text>
              </View>
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => handleDelete(user.id, user.name)}
              >
                <Ionicons name="trash-outline" size={20} color="#ff0008" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
 
const s = StyleSheet.create({
  header: {
    backgroundColor: '#00133d',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    color: '#fff',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#a3ff00',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 13,
    color: '#00133d',
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#00133d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    color: '#a3ff00',
  },
  info: { flex: 1 },
  name: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
    color: '#00133d',
  },
  email: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  idText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
});