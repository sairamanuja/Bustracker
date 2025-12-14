import * as Location from 'expo-location';

class LocationService {
  constructor() {
    this.locationSubscription = null;
    this.hasPermission = false;
  }

  // Request location permissions
  async requestPermissions() {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location permission not granted');
      }

      this.hasPermission = true;
      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  // Request background location permissions (for drivers)
  async requestBackgroundPermissions() {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Background location permission not granted');
      }

      return true;
    } catch (error) {
      console.error('Background location permission error:', error);
      return false;
    }
  }

  // Get current location
  async getCurrentLocation() {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Location permission not granted');
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Get location error:', error);
      throw error;
    }
  }

  // Start watching location (for drivers sharing real-time location)
  async startWatchingLocation(callback, interval = 5000) {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Location permission not granted');
        }
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: interval,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
          });
        }
      );

      return this.locationSubscription;
    } catch (error) {
      console.error('Watch location error:', error);
      throw error;
    }
  }

  // Stop watching location
  stopWatchingLocation() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  // Check if location services are enabled
  async isLocationEnabled() {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Check location services error:', error);
      return false;
    }
  }
}

// Create singleton instance
const locationService = new LocationService();

export default locationService;
