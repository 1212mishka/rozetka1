import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { register as registerApi } from '../../api';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
  });

  if (!fontsLoaded) return null;

  const handleRegister = async () => {
    if (!name || !surname || !phone || !email || !password) {
      Alert.alert('Помилка', 'Заповніть всі поля');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Помилка', 'Пароль повинен містити не менше 6 символів');
      return;
    }
    try {
      await registerApi({
        firstName: name,
        lastName: surname,
        phone,
        email,
        password,
      });
      Alert.alert('Успіх', 'Реєстрація пройшла успішно!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/login') }
      ]);
    } catch (error) {
      Alert.alert('Помилка', 'Користувач з таким email вже існує');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>

      <Text style={styles.title}>Реєстрація</Text>

      <TextInput style={styles.input} placeholder="Ім'я" placeholderTextColor="#aaa" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Прізвище" placeholderTextColor="#aaa" value={surname} onChangeText={setSurname} />
      <TextInput style={styles.input} placeholder="+380 38 88 383" placeholderTextColor="#aaa" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="examplemail@gmail.com" placeholderTextColor="#aaa" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      <View style={styles.passwordContainer}>
        <TextInput style={styles.passwordInput} placeholder="••••••••" placeholderTextColor="#aaa" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      <Text style={styles.passwordHint}>
        Пароль повинен складатися з не менш ніж 6 символів, містити цифри та латинські літери, у тому числі великі, і не повинен збігатися з ім'ям та ел. поштою
      </Text>

      <Text style={styles.orText}>Увійти як користувач</Text>

      <TouchableOpacity style={styles.socialBtn}>
        <Ionicons name="logo-facebook" size={20} color="#1877F2" style={{marginRight: 8}} />
        <Text style={styles.socialBtnText}>Facebook</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.socialBtn}>
        <Image source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/480px-Google_%22G%22_logo.svg.png'}} style={{width: 20, height: 20, marginRight: 8}} />
        <Text style={styles.socialBtnText}>Google</Text>
      </TouchableOpacity>

      <Text style={styles.terms}>
        Реєструючись, ви погоджуєтесь з{' '}
        <Text style={styles.termsLink}>угодою користувача</Text>
      </Text>

      <TouchableOpacity style={styles.btn} onPress={handleRegister}>
        <Text style={styles.btnText}>Зареєструватись</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.link}>Я вже зареєстрований</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 40 },
  header: { backgroundColor: '#00133d', alignItems: 'center', paddingVertical: 20, marginBottom: 24 },
  logo: { width: 150, height: 50 },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 20, color: '#00133d', textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 25, paddingHorizontal: 20, height: 48, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#000', marginHorizontal: 16, marginBottom: 12 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 25, paddingHorizontal: 20, height: 48, marginHorizontal: 16, marginBottom: 8 },
  passwordInput: { flex: 1, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#000' },
  passwordHint: { fontFamily: 'Montserrat_400Regular', fontSize: 11, color: '#888', marginHorizontal: 16, marginBottom: 20, lineHeight: 16 },
  orText: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#000', textAlign: 'center', marginBottom: 12 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 25, height: 48, marginHorizontal: 16, marginBottom: 12 },
  socialBtnText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#000' },
  terms: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#888', textAlign: 'center', marginHorizontal: 16, marginBottom: 16 },
  termsLink: { color: '#00133d', textDecorationLine: 'underline' },
  btn: { backgroundColor: 'rgba(152, 190, 42, 1)', borderRadius: 41, height: 48, justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, marginBottom: 16 },
  btnText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#fff' },
  link: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#00133d', textAlign: 'center', textDecorationLine: 'underline' },
});