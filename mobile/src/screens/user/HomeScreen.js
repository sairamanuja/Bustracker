import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Text, Chip } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { userAPI } from '../../services/api';
import socketService from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const { user } = useAuth();

  useEffect(() => {
    loadTrips();

    // Listen for real-time location updates
    socketService.onLocationUpdate(handleLocationUpdate);

    return () => {
      socketService.offLocationUpdate(handleLocationUpdate);
    };
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getActiveTrips();
      const activeTrips = response.data.trips;
      setTrips(activeTrips);

      // Subscribe to all active trips for real-time updates
      activeTrips.forEach((trip) => {
        socketService.trackTrip(trip.id);
      });

      // Center map on first trip if available
      if (activeTrips.length > 0 && activeTrips[0].currentLocation) {
        setRegion({
          latitude: activeTrips[0].currentLocation.lat,
          longitude: activeTrips[0].currentLocation.lng,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    } catch (error) {
      console.error('Load trips error:', error);
      Alert.alert('Error', 'Failed to load trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationUpdate = (data) => {
    // Update trip location in state
    setTrips((prevTrips) =>
      prevTrips.map((trip) =>
        trip.id === data.tripId
          ? {
              ...trip,
              currentLocation: {
                lat: data.lat,
                lng: data.lng,
                timestamp: data.timestamp,
              },
            }
          : trip
      )
    );
  };

  const renderTrip = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title numberOfLines={1} style={styles.title}>
            {item.startLocation.address || 'Start'} →{' '}
            {item.endLocation.address || 'Destination'}
          </Title>
          <Chip mode="flat" style={styles.chip}>
            Active
          </Chip>
        </View>

        <Paragraph style={styles.detail}>
          Driver: {item.driverName} | {item.driverPhone}
        </Paragraph>

        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.label}>Base Price</Text>
            <Text style={styles.value}>${item.basePrice}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{item.totalDistance} km</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.label}>Stops</Text>
            <Text style={styles.value}>{item.stops.length}</Text>
          </View>
        </View>
      </Card.Content>

      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
        >
          Book Now
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('TrackBus', { tripId: item.id })}
        >
          Track
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      {showMap && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          {trips.map((trip) => {
            if (trip.currentLocation) {
              return (
                <Marker
                  key={trip.id}
                  coordinate={{
                    latitude: trip.currentLocation.lat,
                    longitude: trip.currentLocation.lng,
                  }}
                  title={`Bus #${trip.id}`}
                  description={`To: ${trip.endLocation.address}`}
                  pinColor="blue"
                />
              );
            }
            return null;
          })}
        </MapView>
      )}

      <FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTrips} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No active trips available right now
            </Text>
            <Button mode="outlined" onPress={loadTrips} style={styles.retryButton}>
              Refresh
            </Button>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon={showMap ? 'view-list' : 'map'}
        label={showMap ? 'List' : 'Map'}
        onPress={() => setShowMap(!showMap)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    height: 250,
  },
  list: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
  },
  chip: {
    marginLeft: 10,
  },
  detail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  priceItem: {
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
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
