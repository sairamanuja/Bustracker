import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Title, Paragraph, Divider, List } from 'react-native-paper';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import { tripAPI, bookingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { parsePolyline, generatePolylineFromStops } from '../../utils/polylineUtils';

export default function TripDetailsScreen({ route, navigation }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickupIndex, setPickupIndex] = useState(0);
  const [dropoffIndex, setDropoffIndex] = useState(1);
  const [price, setPrice] = useState(0);
  const [booking, setBooking] = useState(false);
  const { user, updateUser } = useAuth();

  useEffect(() => {
    loadTrip();
  }, []);

  useEffect(() => {
    if (trip && pickupIndex < dropoffIndex) {
      calculatePrice();
    }
  }, [pickupIndex, dropoffIndex, trip]);

  const loadTrip = async () => {
    try {
      const response = await tripAPI.getDetails(tripId);
      setTrip(response.data.trip);

      if (response.data.trip.stops.length > 1) {
        setDropoffIndex(response.data.trip.stops.length - 1);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load trip details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!trip) return;

    const pickupDistance = trip.stops[pickupIndex].distance_from_start;
    const dropoffDistance = trip.stops[dropoffIndex].distance_from_start;
    const distance = dropoffDistance - pickupDistance;
    const pricePerKm = trip.basePrice / trip.totalDistance;
    const calculatedPrice = distance * pricePerKm;

    setPrice(calculatedPrice.toFixed(2));
  };

  const handleBooking = async () => {
    if (pickupIndex >= dropoffIndex) {
      Alert.alert('Error', 'Dropoff must be after pickup');
      return;
    }

    if (parseFloat(price) > user.walletBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You need $${price} but only have $${user.walletBalance}. Please add money to your wallet.`,
        [
          { text: 'Cancel' },
          { text: 'Add Money', onPress: () => navigation.navigate('Wallet') }
        ]
      );
      return;
    }

    setBooking(true);
    try {
      const response = await bookingAPI.create({
        tripId,
        pickupStopIndex: pickupIndex,
        dropoffStopIndex: dropoffIndex,
      });

      await updateUser();

      Alert.alert(
        'Booking Successful!',
        `Your booking has been confirmed. Amount deducted: $${price}`,
        [
          {
            text: 'View QR Code',
            onPress: () => navigation.navigate('MyBookings', {
              bookingId: response.data.booking.id
            })
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text>Loading trip details...</Text>
      </View>
    );
  }

  if (!trip) return null;

  const region = {
    latitude: trip.startLocation.lat,
    longitude: trip.startLocation.lng,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  // Parse polyline for route display
  const routeCoordinates = trip.routePolyline
    ? parsePolyline(trip.routePolyline)
    : generatePolylineFromStops(trip.stops);

  return (
    <ScrollView style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
      >
        {/* Route polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#6200ee"
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
            description={`${stop.distance_from_start} km from start`}
            pinColor={
              index === pickupIndex ? 'green' :
              index === dropoffIndex ? 'red' : 'orange'
            }
          />
        ))}

        {trip.currentLocation && (
          <Marker
            coordinate={{
              latitude: trip.currentLocation.lat,
              longitude: trip.currentLocation.lng,
            }}
            title="Bus Location"
            pinColor="blue"
          />
        )}
      </MapView>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Trip Details</Title>
          <Paragraph>Driver: {trip.driverName}</Paragraph>
          <Paragraph>Phone: {trip.driverPhone}</Paragraph>
          <Paragraph>Total Distance: {trip.totalDistance} km</Paragraph>
          <Paragraph>Base Price: ${trip.basePrice}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Select Your Route</Title>

          <Text style={styles.label}>Pickup Stop:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={pickupIndex}
              onValueChange={(value) => setPickupIndex(value)}
            >
              {trip.stops.map((stop, index) => (
                <Picker.Item
                  key={index}
                  label={`${stop.address} (${stop.distance_from_start} km)`}
                  value={index}
                  enabled={index < dropoffIndex}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Dropoff Stop:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={dropoffIndex}
              onValueChange={(value) => setDropoffIndex(value)}
            >
              {trip.stops.map((stop, index) => (
                <Picker.Item
                  key={index}
                  label={`${stop.address} (${stop.distance_from_start} km)`}
                  value={index}
                  enabled={index > pickupIndex}
                />
              ))}
            </Picker>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Your Price:</Text>
            <Text style={styles.price}>${price}</Text>
          </View>

          <Text style={styles.note}>
            Distance: {(trip.stops[dropoffIndex].distance_from_start -
                      trip.stops[pickupIndex].distance_from_start).toFixed(2)} km
          </Text>

          <Button
            mode="contained"
            onPress={handleBooking}
            loading={booking}
            disabled={booking || pickupIndex >= dropoffIndex}
            style={styles.button}
          >
            Book Now - ${price}
          </Button>

          <Text style={styles.balance}>
            Wallet Balance: ${user.walletBalance}
          </Text>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    height: 300,
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 15,
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  divider: {
    marginVertical: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  note: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  balance: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
});
