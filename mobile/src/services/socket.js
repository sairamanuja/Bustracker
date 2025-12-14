import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, STORAGE_KEYS, SOCKET_EVENTS } from '../utils/constants';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  async connect() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        console.log('No auth token found, cannot connect to socket');
        return;
      }

      this.socket = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      this.socket.on(SOCKET_EVENTS.CONNECT, () => {
        console.log('✅ Socket connected');
        this.connected = true;
      });

      this.socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        console.log('❌ Socket disconnected');
        this.connected = false;
      });

      this.socket.on(SOCKET_EVENTS.ERROR, (error) => {
        console.error('Socket error:', error);
      });

      return this.socket;
    } catch (error) {
      console.error('Failed to connect socket:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected && this.socket !== null;
  }

  // Driver: Join trip room
  joinTrip(tripId) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.DRIVER_JOIN_TRIP, tripId);
    }
  }

  // Driver: Send location update
  sendLocationUpdate(tripId, lat, lng) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
        tripId,
        lat,
        lng,
      });
    }
  }

  // User: Subscribe to trip location updates
  trackTrip(tripId) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.USER_TRACK_TRIP, tripId);
    }
  }

  // User: Unsubscribe from trip
  untrackTrip(tripId) {
    if (this.socket) {
      this.socket.emit(SOCKET_EVENTS.USER_UNTRACK_TRIP, tripId);
    }
  }

  // Listen for location updates
  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, callback);
    }
  }

  // Remove location update listener
  offLocationUpdate(callback) {
    if (this.socket) {
      this.socket.off(SOCKET_EVENTS.TRIP_LOCATION_UPDATED, callback);
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
