import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { register as registerApi } from '../../services/api';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState('customer'); // 'customer' | 'seller'
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold });
  if (!fontsLoaded) return null;

  const handleRegister = async () => {
    if (!name || !surname || !email || !password) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен содержать не менее 6 символов');
      return;
    }

    setLoading(true);
    try {
      // Шаг 1: регистрация
      const regData = { firstName: name, lastName: surname, email, password };
      if (phone.trim()) regData.phone = phone.trim();
      await registerApi(regData);
    } catch (error) {
      setLoading(false);
      const data = error?.response?.data;
      const msg =
        data?.detail ||
        (data?.errors ? Object.values(data.errors).flat().join('\n') : null) ||
        data?.title ||
        'Ошибка при регистрации';
      Alert.alert('Ошибка', msg);
      return;
    }

    if (role === 'seller') {
      Alert.alert(
        'Аккаунт создан',
        'Ваш аккаунт зарегистрирован. Обратитесь к администратору для получения доступа продавца.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/login') }]
      );
    } else {
      Alert.alert('Успех', 'Регистрация прошла успешно!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/login') }
      ]);
    }

    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <Text style={styles.title}>Регистрация</Text>

      {/* Выбор роли */}
      <Text style={styles.roleLabel}>Я регистрируюсь как</Text>
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'customer' && styles.roleBtnActive]}
          onPress={() => setRole('customer')}
        >
          <Ionicons name="person-outline" size={20} color={role === 'customer' ? '#fff' : '#555'} />
          <Text style={[styles.roleBtnText, role === 'customer' && styles.roleBtnTextActive]}>Покупатель</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'seller' && styles.roleBtnActive]}
          onPress={() => setRole('seller')}
        >
          <Ionicons name="storefront-outline" size={20} color={role === 'seller' ? '#fff' : '#555'} />
          <Text style={[styles.roleBtnText, role === 'seller' && styles.roleBtnTextActive]}>Продавец</Text>
        </TouchableOpacity>
      </View>

      {role === 'seller' && (
        <View style={styles.sellerInfo}>
          <Ionicons name="information-circle-outline" size={16} color="#4A90D9" style={{ marginRight: 6 }} />
          <Text style={styles.sellerInfoText}>
            После регистрации заявка будет отправлена на проверку администратору
          </Text>
        </View>
      )}

      <TextInput style={styles.input} placeholder="Имя" placeholderTextColor="#aaa" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Фамилия" placeholderTextColor="#aaa" value={surname} onChangeText={setSurname} />
      <TextInput style={styles.input} placeholder="Телефон (необязательно)" placeholderTextColor="#aaa" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="examplemail@gmail.com" placeholderTextColor="#aaa" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="••••••••"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>
              {role === 'seller' ? 'Зарегистрироваться как продавец' : 'Зарегистрироваться'}
            </Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.link}>Я уже зарегистрирован</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 40 },
  header: { backgroundColor: '#00133d', alignItems: 'center', paddingVertical: 20, marginBottom: 24 },
  logo: { width: 150, height: 50 },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 20, color: '#00133d', textAlign: 'center', marginBottom: 20 },

  roleLabel: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#444', marginHorizontal: 16, marginBottom: 10 },
  roleRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12, marginBottom: 12 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 12,
  },
  roleBtnActive: { backgroundColor: '#00133d', borderColor: '#00133d' },
  roleBtnText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#555' },
  roleBtnTextActive: { color: '#fff' },

  sellerInfo: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EBF4FF',
    borderRadius: 10, padding: 12, marginHorizontal: 16, marginBottom: 16,
  },
  sellerInfoText: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#2471A3', flex: 1 },

  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 25, paddingHorizontal: 20, height: 48, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#000', marginHorizontal: 16, marginBottom: 12 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 25, paddingHorizontal: 20, height: 48, marginHorizontal: 16, marginBottom: 20 },
  passwordInput: { flex: 1, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#000' },

  btn: { backgroundColor: 'rgba(152,190,42,1)', borderRadius: 41, height: 48, justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, marginBottom: 16 },
  btnText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#fff' },
  link: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#00133d', textAlign: 'center', textDecorationLine: 'underline' },
});
