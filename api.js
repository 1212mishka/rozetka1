import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.200:8080',
  timeout: 10000,
});

// Добавляем токен автоматически к каждому запросу
api.interceptors.request.use((config) => {
  const token = global.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// AUTH
export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const logout = () => api.post('/api/auth/logout');

// КАТАЛОГ
export const getCategories = () => api.get('/api/catalog/categories');
export const getCategoriesTree = () => api.get('/api/catalog/categories/tree');
export const getCategory = (id) => api.get(`/api/catalog/categories/${id}`);
export const getProducts = (categoryId) => api.get(`/api/catalog/products/category/${categoryId}`);
export const getProduct = (productId) => api.get(`/api/catalog/products/${productId}`);
export const getProductOffers = (productId) => api.get(`/api/catalog/offers/by-product/${productId}`);
export const searchProducts = (query) => api.get(`/api/catalog/products/search?q=${query}`);

// КОРЗИНА
export const getCart = () => api.get('/api/customer/me/cart');
export const addToCart = (data) => api.post('/api/customer/me/cart/items', data);
export const removeFromCart = (offerId) => api.delete(`/api/customer/me/cart/items/${offerId}`);

// ИЗБРАННОЕ
export const getFavorites = () => api.get('/api/customer/favorites');
export const addToFavorites = (productId) => api.put(`/api/customer/favorites/${productId}`);
export const removeFromFavorites = (productId) => api.delete(`/api/customer/favorites/${productId}`);

// ПРОФИЛЬ
export const getProfile = () => api.get('/api/customer/me');
export const updateProfile = (data) => api.put('/api/customer/me/profile', data);