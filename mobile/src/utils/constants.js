import Constants from 'expo-constants';

// API Configuration
export const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';
export const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || '';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  DRIVER: 'driver',
  USER: 'user',
};

// Trip Status
export const TRIP_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Socket Events
export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  DRIVER_JOIN_TRIP: 'driver:join-trip',
  DRIVER_LOCATION_UPDATE: 'driver:location-update',
  USER_TRACK_TRIP: 'user:track-trip',
  USER_UNTRACK_TRIP: 'user:untrack-trip',
  TRIP_LOCATION_UPDATED: 'trip:location-updated',
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_REGION: {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  LOCATION_UPDATE_INTERVAL: 5000, // 5 seconds
};

export default {
  API_URL,
  GOOGLE_MAPS_API_KEY,
  STORAGE_KEYS,
  USER_ROLES,
  TRIP_STATUS,
  BOOKING_STATUS,
  SOCKET_EVENTS,
  MAP_CONFIG,
};
