import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Title, Text, Card, Chip } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { driverAPI } from '../../services/api';

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
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newPoint = {
      lat: latitude,
      lng: longitude,
      address: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    };

    if (!startLocation) {
      setStartLocation(newPoint);
      Alert.alert('Start Location Set', 'Tap again to add waypoints, then tap once more for end location');
    } else if (!endLocation && waypoints.length >= 0) {
      const total = waypoints.length + 1; // start + waypoints
      if (total < 10) { // Allow up to 8 waypoints + start + end
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
      } else {
        setEndLocation(newPoint);
      }
    }
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
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Create New Trip</Title>
          <Text style={styles.instructions}>
            1. Tap map to set start location{'\n'}
            2. Tap again to add waypoints (optional){'\n'}
            3. Tap to set end location{'\n'}
            4. Enter base price and create trip
          </Text>
        </Card.Content>
      </Card>

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={mapRegion}
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
              Start: {startLocation ? 'Set' : 'Tap map'}
            </Chip>

            <Chip icon="dots-horizontal" style={styles.chip}>
              Waypoints: {waypoints.length}
            </Chip>

            <Chip
              icon={endLocation ? 'check' : 'map-marker'}
              style={[styles.chip, endLocation && styles.chipSet]}
            >
              End: {endLocation ? 'Set' : 'Tap map'}
            </Chip>
          </View>

          <Button
            mode="outlined"
            onPress={resetMap}
            style={styles.resetButton}
          >
            Reset Map
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  instructions: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  map: {
    height: 300,
    marginHorizontal: 10,
    marginVertical: 10,
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
