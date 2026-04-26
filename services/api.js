// Подключаем библиотеку axios — она позволяет делать HTTP-запросы к серверу
// (то есть "общаться" с бэкендом: получать и отправлять данные)
import axios from 'axios';

// Создаём единственный экземпляр axios с настройками
// baseURL — адрес нашего бэкенда (сервер в локальной сети)
// timeout — если сервер не ответил за 10 секунд (10000 мс), запрос отменяется
const api = axios.create({
  baseURL: 'http://192.168.1.200:8080',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = global.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;


export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const logout = () => api.post('/api/auth/logout');
export const getCategories = () => api.get('/api/catalog/categories');
export const getCategoriesTree = () => api.get('/api/catalog/categories/tree');
export const getCategory = (id) => api.get(`/api/catalog/categories/${id}`);
export const getProducts = (categoryId) => api.get(`/api/catalog/products/category/${categoryId}`);
export const getProduct = (productId) => api.get(`/api/catalog/products/${productId}`);
export const getProductAttributes = (productId) => api.get(`/api/catalog/products/${productId}/attributes-view`);
export const getProductOffers = (productId) => api.get(`/api/catalog/offers/by-product/${productId}`);

export const searchProducts = (query) => api.get(`/api/catalog/products/search?q=${query}`);
export const getCart = () => api.get('/api/customer/me/cart');
export const addToCart = (data) => api.post('/api/customer/me/cart/items', data);
export const updateCartItem = (offerId, data) => api.put(`/api/customer/me/cart/items/${offerId}`, data);
export const removeFromCart = (offerId) => api.delete(`/api/customer/me/cart/items/${offerId}`);
export const clearCartApi = () => api.delete('/api/customer/me/cart/items');
export const getViewedProducts = () => api.get('/api/customer/me/viewed');
export const getFavorites = () => api.get('/api/customer/favorites');
export const addToFavorites = (productId) => api.put(`/api/customer/favorites/${productId}`);
export const removeFromFavorites = (productId) => api.delete(`/api/customer/favorites/${productId}`);
export const getProfile = () => api.get('/api/customer/me');
export const updateProfile = (data) => api.put('/api/customer/me/profile', data);

// Admin
export const adminGetCategories = () => api.get('/api/catalog/categories');
export const adminCreateCategory = (data) => api.post('/api/admin/catalog/categories', data);
export const adminGetCategory = (id) => api.get(`/api/catalog/categories/${id}`);
export const adminUploadCategoryImage = (id, formData) =>
  api.post(`/api/admin/catalog/categories/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const adminDeleteCategoryImage = (id) => api.delete(`/api/admin/catalog/categories/${id}/image`);
export const adminGetBrands = () => api.get('/api/admin/catalog/brands');
export const adminCreateBrand = (data) => api.post('/api/admin/catalog/brands', data);
export const adminArchiveBrand = (id) => api.post(`/api/admin/catalog/brands/${id}/archive`);
export const adminActivateBrand = (id) => api.post(`/api/admin/catalog/brands/${id}/activate`);
export const adminGetSellers = () => api.get('/api/admin/sellers');
export const adminApproveSeller = (id) => api.post(`/api/admin/sellers/${id}/approve`);
export const adminRejectSeller = (id) => api.post(`/api/admin/sellers/${id}/reject`);
export const adminSuspendSeller = (id) => api.post(`/api/admin/sellers/${id}/suspend`);
export const adminGetProductReviews = () => api.get('/api/admin/product-reviews');
export const adminGetPendingProductReviews = () => api.get('/api/admin/product-reviews/pending');
export const adminApproveProductReview = (id) => api.post(`/api/admin/product-reviews/${id}/approve`);
export const adminRejectProductReview = (id) => api.post(`/api/admin/product-reviews/${id}/reject`);
export const adminDeleteProductReview = (id) => api.delete(`/api/admin/product-reviews/${id}`);
export const adminGetShippings = () => api.get('/api/admin/shippings');
export const adminShippingReady = (id) => api.post(`/api/admin/shippings/${id}/ready-for-pickup`);
export const adminShippingDelivered = (id) => api.post(`/api/admin/shippings/${id}/delivered`);
export const adminUploadProductImages = (productId, formData) =>
  api.post(`/api/seller/me/products/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Checkout
export const startCheckout = () => api.post('/api/customer/checkouts', {});
export const setCheckoutRecipient = (checkoutId, data) => api.put(`/api/customer/checkouts/${checkoutId}/lines/recipient`, data);
export const setCheckoutLineShipping = (checkoutId, lineId, data) => api.put(`/api/customer/checkouts/${checkoutId}/lines/${lineId}/shipping`, data);
export const setCheckoutLinePayment = (checkoutId, lineId, data) => api.put(`/api/customer/checkouts/${checkoutId}/lines/${lineId}/payment`, data);
export const submitCheckout = (checkoutId) => api.post(`/api/customer/checkouts/${checkoutId}/submit`);

// Seller
export const getOrders = () => api.get('/api/customer/orders');
export const getSellerMe = () => api.get('/api/seller/me');
export const createSellerProfile = (data) => api.post('/api/seller/me', data);
export const getMyProducts = (sellerId) => api.get(`/api/catalog/products/seller/${sellerId}`);
export const createProduct = (data) => api.post('/api/seller/me/products', data);
export const uploadProductImages = (productId, formData) =>
  api.post(`/api/seller/me/products/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const createOffer = (data) => api.post('/api/seller/offers', data);
