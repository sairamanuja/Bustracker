import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Title, Text, Card, Chip } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { driverAPI } from '../../services/api';
import LocationSearchInput from '../../components/LocationSearchInput';

export default function CreateTripScreen({ navigation }) {
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [basePrice, setBasePrice] = useState('');
  const [creating, setCreating] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const handleMapPress = (event) => {
    // Keep map tap as fallback option
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newPoint = {
      lat: latitude,
      lng: longitude,
      address: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    };

    if (!startLocation) {
      setStartLocation(newPoint);
    } else if (!endLocation) {
      Alert.alert(
        'Add Point',
        'What is this location?',
        [
          {
            text: 'Waypoint',
            onPress: () => setWaypoints([...waypoints, newPoint])
          },
          {
            text: 'End Location',
            onPress: () => setEndLocation(newPoint)
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const updateMapRegion = (location) => {
    // Update map region to show selected location
    setMapRegion({
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const handleStartLocationSelect = (location) => {
    setStartLocation(location);
    updateMapRegion(location);
  };

  const handleEndLocationSelect = (location) => {
    setEndLocation(location);
    updateMapRegion(location);
  };

  const handleWaypointSelect = (location) => {
    setWaypoints([...waypoints, location]);
    updateMapRegion(location);
  };

  const removeWaypoint = (index) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  const resetMap = () => {
    setStartLocation(null);
    setEndLocation(null);
    setWaypoints([]);
  };

  const createTrip = async () => {
    if (!startLocation || !endLocation) {
      Alert.alert('Error', 'Please set start and end locations on the map');
      return;
    }

    if (!basePrice || parseFloat(basePrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid base price');
      return;
    }

    setCreating(true);
    try {
      await driverAPI.createTrip({
        startLocation,
        endLocation,
        waypoints,
        basePrice: parseFloat(basePrice),
      });

      Alert.alert(
        'Success',
        'Trip created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create trip');
    } finally {
      setCreating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.card}>
          <Card.Content>
            <Title>Create New Trip</Title>
            <Text style={styles.instructions}>
              Search for locations or tap on the map to set your route
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Start Location</Text>
            <LocationSearchInput
              placeholder="Search for start location..."
              onLocationSelect={handleStartLocationSelect}
              value={startLocation?.address}
              showClearButton={!!startLocation}
              onClear={() => setStartLocation(null)}
            />
            {startLocation && (
              <Chip icon="check" style={[styles.chip, styles.chipSet]}>
                {startLocation.address}
              </Chip>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.waypointHeader}>
              <Text style={styles.sectionTitle}>Waypoints (Optional)</Text>
              <Chip icon="map-marker" style={styles.chip}>
                {waypoints.length} added
              </Chip>
            </View>
            <LocationSearchInput
              placeholder="Search for waypoint..."
              onLocationSelect={handleWaypointSelect}
            />
            {waypoints.map((waypoint, index) => (
              <Chip
                key={index}
                icon="map-marker"
                onClose={() => removeWaypoint(index)}
                style={[styles.chip, styles.waypointChip]}
              >
                {index + 1}. {waypoint.address}
              </Chip>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>End Location</Text>
            <LocationSearchInput
              placeholder="Search for end location..."
              onLocationSelect={handleEndLocationSelect}
              value={endLocation?.address}
              showClearButton={!!endLocation}
              onClear={() => setEndLocation(null)}
            />
            {endLocation && (
              <Chip icon="check" style={[styles.chip, styles.chipSet]}>
                {endLocation.address}
              </Chip>
            )}
          </Card.Content>
        </Card>

        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          onPress={handleMapPress}
          onRegionChangeComplete={setMapRegion}
        >
          {startLocation && (
            <Marker
              coordinate={{
                latitude: startLocation.lat,
                longitude: startLocation.lng,
              }}
              title="Start"
              description={startLocation.address}
              pinColor="green"
            />
          )}

          {waypoints.map((point, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: point.lat,
                longitude: point.lng,
              }}
              title={`Stop ${index + 1}`}
              description={point.address}
              pinColor="orange"
            />
          ))}

          {endLocation && (
            <Marker
              coordinate={{
                latitude: endLocation.lat,
                longitude: endLocation.lng,
              }}
              title="End"
              description={endLocation.address}
              pinColor="red"
            />
          )}
        </MapView>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.locationInfo}>
              <Chip
                icon={startLocation ? 'check' : 'map-marker'}
                style={[styles.chip, startLocation && styles.chipSet]}
              >
                Start: {startLocation ? 'Set' : 'Not set'}
              </Chip>

              <Chip icon="dots-horizontal" style={styles.chip}>
                Waypoints: {waypoints.length}
              </Chip>

              <Chip
                icon={endLocation ? 'check' : 'map-marker'}
                style={[styles.chip, endLocation && styles.chipSet]}
              >
                End: {endLocation ? 'Set' : 'Not set'}
              </Chip>
            </View>

            <Button
              mode="outlined"
              onPress={resetMap}
              style={styles.resetButton}
            >
              Reset All Locations
            </Button>

            <TextInput
              label="Base Price (entire trip)"
              value={basePrice}
              onChangeText={setBasePrice}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Affix text="$" />}
            />

            <Button
              mode="contained"
              onPress={createTrip}
              loading={creating}
              disabled={creating || !startLocation || !endLocation}
              style={styles.button}
            >
              Create Trip
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    margin: 10,
    marginBottom: 5,
    elevation: 2,
  },
  instructions: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  waypointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  map: {
    height: 300,
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  locationInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  chip: {
    marginRight: 5,
    marginBottom: 5,
  },
  chipSet: {
    backgroundColor: '#4CAF50',
  },
  waypointChip: {
    backgroundColor: '#FF9800',
    marginTop: 5,
  },
  resetButton: {
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    paddingVertical: 6,
  },
});
