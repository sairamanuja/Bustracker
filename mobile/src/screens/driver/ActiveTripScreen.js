import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Title, Text, Button, Chip } from 'react-native-paper';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { driverAPI, tripAPI } from '../../services/api';
import socketService from '../../services/socket';
import locationService from '../../services/location';
import { parsePolyline, generatePolylineFromStops } from '../../utils/polylineUtils';

export default function ActiveTripScreen({ route, navigation }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationWatch, setLocationWatch] = useState(null);

  useEffect(() => {
    loadTrip();

    return () => {
      stopSharingLocation();
    };
  }, []);

  const loadTrip = async () => {
    try {
      const response = await tripAPI.getDetails(tripId);
      setTrip(response.data.trip);
      setIsActive(response.data.trip.status === 'active');

      if (response.data.trip.status === 'active') {
        startSharingLocation();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load trip');
      navigation.goBack();
    }
  };

  const startTrip = async () => {
    try {
      await driverAPI.startTrip(tripId);
      setIsActive(true);
      startSharingLocation();
      Alert.alert('Trip Started', 'You are now sharing your location in real-time');
    } catch (error) {
      Alert.alert('Error', 'Failed to start trip');
    }
  };

  const startSharingLocation = async () => {
    try {
      // Request location permissions
      const granted = await locationService.requestPermissions();
      if (!granted) {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      // Join trip room
      socketService.joinTrip(tripId);

      // Start watching location
      const watch = await locationService.startWatchingLocation(
        (location) => {
          setCurrentLocation(location);

          // Send location to server via Socket.io
          socketService.sendLocationUpdate(
            tripId,
            location.latitude,
            location.longitude
          );
        },
        5000 // Update every 5 seconds
      );

      setLocationWatch(watch);
    } catch (error) {
      console.error('Location sharing error:', error);
      Alert.alert('Error', 'Failed to start location sharing');
    }
  };

  const stopSharingLocation = () => {
    if (locationWatch) {
      locationService.stopWatchingLocation();
      setLocationWatch(null);
    }
  };

  const completeTrip = async () => {
    Alert.alert(
      'Complete Trip',
      'Are you sure you want to complete this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await driverAPI.completeTrip(tripId);
              stopSharingLocation();
              Alert.alert(
                'Trip Completed',
                'Trip has been marked as completed',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to complete trip');
            }
          }
        }
      ]
    );
  };

  if (!trip) {
    return (
      <View style={styles.loading}>
        <Text>Loading trip...</Text>
      </View>
    );
  }

  const region = currentLocation || {
    latitude: trip.startLocation.lat,
    longitude: trip.startLocation.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Parse polyline for route display
  const routeCoordinates = trip.routePolyline
    ? parsePolyline(trip.routePolyline)
    : generatePolylineFromStops(trip.stops);

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        followsUserLocation={isActive}
      >
        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#03DAC6"
            strokeWidth={3}
            lineDashPattern={[1]}
          />
        )}

        {trip.stops.map((stop, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: stop.lat,
              longitude: stop.lng,
            }}
            title={stop.address}
            pinColor={
              index === 0 ? 'green' :
              index === trip.stops.length - 1 ? 'red' : 'orange'
            }
          />
        ))}

        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            pinColor="blue"
          />
        )}
      </MapView>

      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.header}>
            <Title>Trip #{tripId}</Title>
            <Chip
              mode="flat"
              style={[
                styles.chip,
                { backgroundColor: isActive ? '#4CAF50' : '#FF9800' }
              ]}
              textStyle={{ color: 'white' }}
            >
              {trip.status.toUpperCase()}
            </Chip>
          </View>

          <Text style={styles.route}>
            {trip.startLocation.address} → {trip.endLocation.address}
          </Text>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>{trip.totalDistance} km</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.label}>Base Price</Text>
              <Text style={styles.value}>${trip.basePrice}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.label}>Stops</Text>
              <Text style={styles.value}>{trip.stops.length}</Text>
            </View>
          </View>

          {isActive && (
            <Text style={styles.sharing}>
              🔴 Sharing location in real-time
            </Text>
          )}

          {!isActive && trip.status === 'pending' && (
            <Button
              mode="contained"
              onPress={startTrip}
              style={styles.button}
            >
              Start Trip
            </Button>
          )}

          {isActive && (
            <View style={styles.buttons}>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('ScanQR')}
                style={styles.scanButton}
              >
                Scan QR Code
              </Button>
              <Button
                mode="contained"
                onPress={completeTrip}
                style={styles.completeButton}
              >
                Complete Trip
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chip: {
    marginLeft: 10,
  },
  route: {
    fontSize: 14,
    marginBottom: 15,
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  stat: {
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: '#999',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  sharing: {
    textAlign: 'center',
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 15,
  },
  button: {
    paddingVertical: 6,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  scanButton: {
    flex: 1,
  },
  completeButton: {
    flex: 1,
  },
});
