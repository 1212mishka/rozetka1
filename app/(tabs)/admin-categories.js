import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, Alert, ActivityIndicator, Modal, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import * as ImagePicker from 'expo-image-picker';
import {
  adminGetCategories,
  adminCreateCategory,
  adminGetCategory,
  adminUploadCategoryImage,
  adminDeleteCategoryImage,
} from '../../services/api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createVisible, setCreateVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [manageVisible, setManageVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [catDetail, setCatDetail] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_700Bold });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGetCategories();
      setCategories(res.data || []);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить категории');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openManage = async (cat) => {
    setSelectedCat(cat);
    setCatDetail(null);
    setManageVisible(true);
    try {
      const res = await adminGetCategory(cat.id);
      setCatDetail(res.data);
    } catch {
      setCatDetail(cat);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) { Alert.alert('Ошибка', 'Введите название'); return; }
    setCreating(true);
    try {
      await adminCreateCategory({ name: newName.trim() });
      setCreateVisible(false);
      setNewName('');
      load();
    } catch (e) {
      Alert.alert('Ошибка', e?.response?.data?.detail || 'Ошибка при создании');
    } finally {
      setCreating(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Нет доступа', 'Разрешите доступ к галерее в настройках');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName || 'image.jpg',
      type: asset.mimeType || 'image/jpeg',
    });

    setImageLoading(true);
    try {
      await adminUploadCategoryImage(selectedCat.id, formData);
      const res = await adminGetCategory(selectedCat.id);
      setCatDetail(res.data);
      load();
      Alert.alert('Готово', 'Картинка загружена');
    } catch (e) {
      Alert.alert('Ошибка', e?.response?.data?.detail || 'Не удалось загрузить картинку');
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteImage = () => {
    Alert.alert('Удалить картинку?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive', onPress: async () => {
          setImageLoading(true);
          try {
            await adminDeleteCategoryImage(selectedCat.id);
            const res = await adminGetCategory(selectedCat.id);
            setCatDetail(res.data);
            load();
          } catch (e) {
            Alert.alert('Ошибка', e?.response?.data?.detail || 'Не удалось удалить картинку');
          } finally {
            setImageLoading(false);
          }
        }
      }
    ]);
  };

  if (!fontsLoaded) return null;

  const imageUrl = catDetail?.imageUrl || catDetail?.image || catDetail?.iconUrl || null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Категории</Text>
        <TouchableOpacity onPress={() => setCreateVisible(true)} style={styles.addBtn}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00133d" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => openManage(item)}>
              {item.imageUrl || item.image ? (
                <Image source={{ uri: item.imageUrl || item.image }} style={styles.catImg} />
              ) : (
                <View style={styles.catImgPlaceholder}>
                  <Ionicons name="layers-outline" size={20} color="#4A90D9" />
                </View>
              )}
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={18} color="#bbb" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Категорий нет</Text>}
        />
      )}

      {/* Модалка: управление категорией */}
      <Modal visible={manageVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedCat?.name}</Text>
              <TouchableOpacity onPress={() => setManageVisible(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Картинка</Text>

            {imageLoading ? (
              <ActivityIndicator color="#00133d" style={{ marginVertical: 24 }} />
            ) : imageUrl ? (
              <View>
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="cover" />
                <View style={styles.imageActions}>
                  <TouchableOpacity style={styles.imageBtn} onPress={handlePickImage}>
                    <Ionicons name="cloud-upload-outline" size={18} color="#4A90D9" />
                    <Text style={[styles.imageBtnText, { color: '#4A90D9' }]}>Заменить</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.imageBtn, { borderColor: '#E74C3C' }]} onPress={handleDeleteImage}>
                    <Ionicons name="trash-outline" size={18} color="#E74C3C" />
                    <Text style={[styles.imageBtnText, { color: '#E74C3C' }]}>Удалить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={40} color="#ccc" />
                <Text style={styles.uploadText}>Нажмите чтобы загрузить картинку</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Модалка: создание */}
      <Modal visible={createVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Новая категория</Text>

            <Text style={styles.inputLabel}>Название</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: Ноутбуки"
              value={newName}
              onChangeText={setNewName}
              placeholderTextColor="#aaa"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setCreateVisible(false); setNewName(''); }}>
                <Text style={styles.cancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmText}>Создать</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#00133d', flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { flex: 1, fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#fff' },
  addBtn: { padding: 4 },
  list: { padding: 16 },
  row: {
    backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  catImg: { width: 44, height: 44, borderRadius: 10, marginRight: 12, backgroundColor: '#f0f0f0' },
  catImgPlaceholder: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: '#e8f0fb',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  rowTitle: { flex: 1, fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#00133d' },
  empty: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#888', textAlign: 'center', marginTop: 40 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  modalTitle: { flex: 1, fontFamily: 'Montserrat_700Bold', fontSize: 17, color: '#00133d' },
  sectionLabel: { fontFamily: 'Montserrat_700Bold', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },

  imagePreview: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12, backgroundColor: '#f0f0f0' },
  imageActions: { flexDirection: 'row', gap: 12 },
  imageBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1.5, borderColor: '#4A90D9', borderRadius: 10, paddingVertical: 10,
  },
  imageBtnText: { fontFamily: 'Montserrat_500Medium', fontSize: 13 },
  uploadArea: {
    borderWidth: 1.5, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 12,
    padding: 32, alignItems: 'center',
  },
  uploadText: { fontFamily: 'Montserrat_400Regular', fontSize: 13, color: '#aaa', marginTop: 10, textAlign: 'center' },

  inputLabel: { fontFamily: 'Montserrat_500Medium', fontSize: 13, color: '#444', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, height: 44, fontSize: 14,
    fontFamily: 'Montserrat_400Regular', color: '#000', marginBottom: 14,
  },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#666' },
  confirmBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: 'rgba(152,190,42,1)', justifyContent: 'center', alignItems: 'center' },
  confirmText: { fontFamily: 'Montserrat_500Medium', fontSize: 14, color: '#fff' },
});
