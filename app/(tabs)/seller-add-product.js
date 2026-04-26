import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import * as ImagePicker from 'expo-image-picker';
import { adminGetCategories, createProduct, createOffer, uploadProductImages } from '../../services/api';

export default function SellerAddProduct() {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [catPickerVisible, setCatPickerVisible] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold });

  useEffect(() => {
    adminGetCategories().then(r => setCategories(r.data || [])).catch(() => {});
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Нет доступа', 'Разрешите доступ к галерее'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Ошибка', 'Введите название товара'); return; }
    if (!selectedCategory) { Alert.alert('Ошибка', 'Выберите категорию'); return; }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) { Alert.alert('Ошибка', 'Введите корректную цену'); return; }
    if (!stock || isNaN(Number(stock)) || Number(stock) < 0) { Alert.alert('Ошибка', 'Введите количество'); return; }

    setSaving(true);
    try {
      // 1. Создаём товар
      const productRes = await createProduct({
        name: name.trim(),
        categoryId: selectedCategory.id,
        description: description.trim() || undefined,
      });
      const productId = productRes.data?.id || productRes.data?.productId;

      // 2. Загружаем картинку если выбрана
      if (image && productId) {
        try {
          const fd = new FormData();
          fd.append('files', { uri: image.uri, name: image.fileName || 'photo.jpg', type: image.mimeType || 'image/jpeg' });
          fd.append('makeFirstImageMain', 'true');
          await uploadProductImages(productId, fd);
        } catch {}
      }

      // 3. Создаём оффер (цена + склад)
      if (productId) {
        await createOffer({
          productId,
          priceAmount: Number(price),
          priceCurrency: 'UAH',
          oldPriceAmount: oldPrice && Number(oldPrice) > 0 ? Number(oldPrice) : undefined,
          stock: Number(stock),
          minOrderQuantity: 1,
          activate: true,
        });
      }

      Alert.alert('Готово', 'Товар успешно добавлен!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.response?.data?.title || 'Ошибка при создании товара';
      Alert.alert('Ошибка', msg);
    } finally {
      setSaving(false);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новый товар</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Сохранить</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Фото */}
        <Text style={styles.label}>Фото товара</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={36} color="#ccc" />
              <Text style={styles.imagePlaceholderText}>Нажмите чтобы выбрать фото</Text>
            </View>
          )}
        </TouchableOpacity>
        {image && (
          <TouchableOpacity onPress={() => setImage(null)} style={styles.removeImg}>
            <Ionicons name="trash-outline" size={16} color="#E74C3C" />
            <Text style={styles.removeImgText}>Удалить фото</Text>
          </TouchableOpacity>
        )}

        {/* Основные поля */}
        <Text style={styles.label}>Название *</Text>
        <TextInput
          style={styles.input}
          placeholder="Например: iPhone 15 Pro"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Категория *</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setCatPickerVisible(!catPickerVisible)}>
          <Text style={[styles.pickerText, !selectedCategory && { color: '#aaa' }]}>
            {selectedCategory ? selectedCategory.name : 'Выберите категорию'}
          </Text>
          <Ionicons name={catPickerVisible ? 'chevron-up' : 'chevron-down'} size={18} color="#aaa" />
        </TouchableOpacity>

        {catPickerVisible && (
          <View style={styles.dropDown}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.dropDownItem, selectedCategory?.id === cat.id && styles.dropDownItemActive]}
                onPress={() => { setSelectedCategory(cat); setCatPickerVisible(false); }}
              >
                <Text style={[styles.dropDownText, selectedCategory?.id === cat.id && styles.dropDownTextActive]}>
                  {cat.name}
                </Text>
                {selectedCategory?.id === cat.id && <Ionicons name="checkmark" size={16} color="#98BE2A" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Описание</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Опишите товар..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholderTextColor="#aaa"
          textAlignVertical="top"
        />

        {/* Цена и склад */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Цена (₴) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Старая цена (₴)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={oldPrice}
              onChangeText={setOldPrice}
              keyboardType="numeric"
              placeholderTextColor="#aaa"
            />
          </View>
        </View>

        <Text style={styles.label}>Количество на складе *</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          value={stock}
          onChangeText={setStock}
          keyboardType="numeric"
          placeholderTextColor="#aaa"
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Добавить товар</Text>
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
  backBtn: { padding: 6, marginRight: 8 },
  headerTitle: { flex: 1, fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#fff' },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  saveBtnText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, color: 'rgba(152,190,42,1)' },

  content: { padding: 16, paddingBottom: 40 },
  label: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#333', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, height: 46,
    fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#000',
    borderWidth: 1, borderColor: '#e8e8e8', marginBottom: 12,
  },
  textArea: { height: 100, paddingTop: 12 },

  imagePicker: { borderRadius: 12, overflow: 'hidden', marginBottom: 8, height: 180 },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%', height: '100%', backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  imagePlaceholderText: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#ccc', marginTop: 8 },
  removeImg: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  removeImgText: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#E74C3C' },

  picker: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, height: 46,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#e8e8e8', marginBottom: 4,
  },
  pickerText: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#000' },

  dropDown: {
    backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e8e8e8',
    marginBottom: 12, overflow: 'hidden',
  },
  dropDownItem: { paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropDownItemActive: { backgroundColor: '#f0f8e8' },
  dropDownText: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#333' },
  dropDownTextActive: { fontFamily: 'Montserrat_500Medium', color: '#00133d' },

  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },

  submitBtn: {
    backgroundColor: 'rgba(152,190,42,1)', borderRadius: 12, height: 50,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  submitBtnText: { fontFamily: 'Montserrat_700Bold', fontSize: 15, color: '#fff' },
});
