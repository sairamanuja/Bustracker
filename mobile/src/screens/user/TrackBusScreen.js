import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Text, Chip } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import socketService from '../../services/socket';
import { tripAPI } from '../../services/api';

export default function TrackBusScreen({ route }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    loadTrip();
    subscribeToLocationUpdates();

    return () => {
      unsubscribeFromUpdates();
    };
  }, []);

  const loadTrip = async () => {
    try {
      const response = await tripAPI.getDetails(tripId);
      setTrip(response.data.trip);

      if (response.data.trip.currentLocation) {
        const location = response.data.trip.currentLocation;
        setBusLocation(location);
        setRegion({
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (error) {
      console.error('Load trip error:', error);
    }
  };

  const subscribeToLocationUpdates = () => {
    socketService.trackTrip(tripId);

    socketService.onLocationUpdate((data) => {
      if (data.tripId === tripId) {
        const newLocation = {
          lat: data.lat,
          lng: data.lng,
          timestamp: data.timestamp,
        };
        setBusLocation(newLocation);

        // Update map region to follow bus
        setRegion({
          latitude: data.lat,
          longitude: data.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    });
  };

  const unsubscribeFromUpdates = () => {
    socketService.untrackTrip(tripId);
  };

  const getTimeSinceUpdate = () => {
    if (!busLocation?.timestamp) return 'Unknown';
    const seconds = Math.floor((Date.now() - new Date(busLocation.timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation
        followsUserLocation
      >
        {/* Bus location marker */}
        {busLocation && (
          <Marker
            coordinate={{
              latitude: busLocation.lat,
              longitude: busLocation.lng,
            }}
            title="Bus Location"
            description="Current bus position"
            pinColor="blue"
          />
        )}

        {/* Trip stops markers */}
        {trip?.stops.map((stop, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: stop.lat,
              longitude: stop.lng,
            }}
            title={stop.address}
            description={`${stop.distance_from_start} km from start`}
            pinColor={
              index === 0 ? 'green' :
              index === trip.stops.length - 1 ? 'red' : 'orange'
            }
          />
        ))}
      </MapView>

      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.header}>
            <Title>Trip #{tripId}</Title>
            <Chip mode="flat" style={styles.statusChip}>
              {trip?.status || 'Loading...'}
            </Chip>
          </View>

          {trip && (
            <>
              <Text style={styles.route}>
                {trip.startLocation.address} → {trip.endLocation.address}
              </Text>

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.label}>Driver</Text>
                  <Text style={styles.value}>{trip.driverName}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.label}>Distance</Text>
                  <Text style={styles.value}>{trip.totalDistance} km</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.label}>Last Update</Text>
                  <Text style={styles.value}>{getTimeSinceUpdate()}</Text>
                </View>
              </View>

              {busLocation ? (
                <Text style={styles.tracking}>
                  🔴 Live tracking active
                </Text>
              ) : (
                <Text style={styles.noTracking}>
                  Waiting for location updates...
                </Text>
              )}
            </>
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
  statusChip: {
    backgroundColor: '#4CAF50',
  },
  route: {
    fontSize: 14,
    marginBottom: 15,
    color: '#666',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  tracking: {
    textAlign: 'center',
    color: '#4CAF50',
    fontWeight: '500',
    marginTop: 10,
  },
  noTracking: {
    textAlign: 'center',
    color: '#999',
    marginTop: 10,
  },
});
