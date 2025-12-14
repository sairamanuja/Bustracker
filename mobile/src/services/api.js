import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth data
      await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getTrips: () => api.get('/admin/trips'),
  getBookings: () => api.get('/admin/bookings'),
  getAnalytics: () => api.get('/admin/analytics'),
};

// Driver API
export const driverAPI = {
  createTrip: (data) => api.post('/driver/trips', data),
  getMyTrips: () => api.get('/driver/trips/my'),
  startTrip: (id) => api.put(`/driver/trips/${id}/start`),
  completeTrip: (id) => api.put(`/driver/trips/${id}/complete`),
  verifyBookingQR: (qrCode) => api.post('/driver/bookings/verify-qr', { qrCode }),
};

// User API
export const userAPI = {
  getActiveTrips: () => api.get('/user/trips/active'),
  getMyBookings: () => api.get('/user/bookings/my'),
  getWalletBalance: () => api.get('/user/wallet'),
  getWalletTransactions: (params) => api.get('/user/wallet/transactions', { params }),
};

// Trip API
export const tripAPI = {
  getAll: () => api.get('/trips'),
  getDetails: (id) => api.get(`/trips/${id}`),
  getLocation: (id) => api.get(`/trips/${id}/location`),
};

// Booking API
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getDetails: (id) => api.get(`/bookings/${id}`),
  getQR: (id) => api.get(`/bookings/${id}/qr`),
  cancel: (id) => api.delete(`/bookings/${id}`),
};

// Wallet API
export const walletAPI = {
  addMoney: (amount) => api.post('/wallet/add-money', { amount }),
};

export default api;
