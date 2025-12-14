# Bus Tracking Mobile App

React Native (Expo) mobile application for the bus tracking and booking system.

## Project Structure

```
mobile/
├── src/
│   ├── context/
│   │   └── AuthContext.js          ✅ Authentication state management
│   ├── services/
│   │   ├── api.js                  ✅ API client with axios
│   │   ├── socket.js               ✅ Socket.io client for real-time updates
│   │   └── location.js             ✅ Expo Location service
│   ├── utils/
│   │   └── constants.js            ✅ App constants
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js      ✅ Login screen
│   │   │   └── RegisterScreen.js   ✅ Registration screen
│   │   ├── admin/                  ⏳ To be implemented
│   │   ├── driver/                 ⏳ To be implemented
│   │   └── user/                   ⏳ To be implemented
│   ├── navigation/                 ⏳ To be implemented
│   └── components/                 ⏳ To be implemented
├── App.js                          ✅ Main app entry (basic structure)
├── app.json                        ✅ Expo configuration
├── package.json                    ✅ Dependencies
└── babel.config.js                 ✅ Babel configuration
```

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

Edit `app.json` and update:
- `extra.apiUrl`: Your backend API URL (default: http://localhost:3000)
- `extra.googleMapsApiKey`: Your Google Maps API key
- `android.config.googleMaps.apiKey`: Same Google Maps API key for Android

### 3. Run the App

```bash
# Start Expo
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Current Implementation Status

### ✅ Completed
- Project initialization with Expo
- Authentication flow (Login/Register screens)
- AuthContext for state management
- API service layer (all endpoints)
- Socket.io client service
- Location service (Expo Location)
- Basic navigation structure
- Constants and configuration

### ⏳ To Be Implemented

The following screens and components need to be created:

#### Admin Screens
- `DashboardScreen.js` - Analytics and overview
- `ManageUsersScreen.js` - CRUD operations for users
- `ManageTripsScreen.js` - View all trips
- `ManageBookingsScreen.js` - View all bookings

#### Driver Screens
- `DriverHomeScreen.js` - Dashboard with trip list
- `CreateTripScreen.js` - Create trip with map, stops, and pricing
- `ActiveTripScreen.js` - Share real-time location during trip
- `ScanQRScreen.js` - Scan passenger QR codes

#### User (Passenger) Screens
- `HomeScreen.js` - Browse active trips with map
- `TripDetailsScreen.js` - View trip details and select pickup/dropoff
- `BookingScreen.js` - Confirm booking
- `MyBookingsScreen.js` - View bookings with QR codes
- `TrackBusScreen.js` - Real-time bus tracking on map
- `WalletScreen.js` - Wallet balance and add money

#### Components
- `Map/MapView.js` - Reusable map component
- `Map/RoutePolyline.js` - Display route on map
- `Map/BusMarker.js` - Animated bus marker
- `Map/StopMarker.js` - Stop markers
- `QRCode.js` - QR code display component
- `QRScanner.js` - QR code scanner component
- `PriceDisplay.js` - Dynamic price display

#### Navigation
- `AppNavigator.js` - Main app navigator
- `AdminNavigator.js` - Admin bottom tabs
- `DriverNavigator.js` - Driver bottom tabs
- `UserNavigator.js` - User bottom tabs

## Implementation Guide

### Example: Creating a User Home Screen

```javascript
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import { userAPI } from '../../services/api';
import socketService from '../../services/socket';

export default function HomeScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const response = await userAPI.getActiveTrips();
      setTrips(response.data.trips);
    } catch (error) {
      console.error('Load trips error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTrip = ({ item }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('TripDetails', { trip: item })}>
      <Card.Content>
        <Title>{item.startLocation.address} → {item.endLocation.address}</Title>
        <Paragraph>Driver: {item.driverName}</Paragraph>
        <Paragraph>Base Price: ${item.basePrice}</Paragraph>
        <Paragraph>Distance: {item.totalDistance} km</Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button mode="contained">Book Now</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <MapView style={styles.map}>
        {trips.map(trip => (
          trip.currentLocation && (
            <Marker
              key={trip.id}
              coordinate={{
                latitude: trip.currentLocation.lat,
                longitude: trip.currentLocation.lng,
              }}
              title={`Bus #${trip.id}`}
            />
          )
        ))}
      </MapView>
      <FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={item => item.id.toString()}
        refreshing={loading}
        onRefresh={loadTrips}
      />
    </View>
  );
}
```

### Example: Real-time Location Tracking

```javascript
import React, { useState, useEffect } from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';
import socketService from '../../services/socket';

export default function TrackBusScreen({ route }) {
  const { tripId } = route.params;
  const [busLocation, setBusLocation] = useState(null);

  useEffect(() => {
    // Subscribe to trip location updates
    socketService.trackTrip(tripId);

    // Listen for location updates
    const handleLocationUpdate = (data) => {
      if (data.tripId === tripId) {
        setBusLocation({ lat: data.lat, lng: data.lng });
      }
    };

    socketService.onLocationUpdate(handleLocationUpdate);

    return () => {
      socketService.offLocationUpdate(handleLocationUpdate);
      socketService.untrackTrip(tripId);
    };
  }, [tripId]);

  return (
    <MapView style={{ flex: 1 }}>
      {busLocation && (
        <Marker
          coordinate={{
            latitude: busLocation.lat,
            longitude: busLocation.lng,
          }}
          title="Bus Location"
        />
      )}
    </MapView>
  );
}
```

## Key Features to Implement

1. **Google Maps Integration**
   - Display routes on map
   - Show bus real-time location
   - Allow users to select stops on map

2. **Dynamic Pricing**
   - Calculate price based on selected pickup/dropoff stops
   - Display price before booking

3. **QR Code**
   - Generate QR code after booking (using `react-native-qrcode-svg`)
   - Scan QR code for verification (using `expo-barcode-scanner`)

4. **Real-time Updates**
   - Subscribe to trip location updates via Socket.io
   - Update map markers in real-time

5. **Wallet Management**
   - Display balance
   - Add money (simple button)
   - Show transaction history

## Testing

1. Start the backend server first
2. Update `app.json` with correct API URL
3. Run the mobile app
4. Register as different user types (user, driver, admin)
5. Test each role's functionality

## Next Steps

1. Implement admin screens for user/trip/booking management
2. Implement driver screens for trip creation and QR scanning
3. Implement user screens for browsing, booking, and tracking
4. Add error handling and loading states
5. Polish UI with React Native Paper theming
6. Test real-time location updates
7. Test end-to-end booking flow

## Dependencies Explained

- **expo**: React Native framework
- **react-native-paper**: Material Design components
- **@react-navigation**: Navigation library
- **axios**: HTTP client for API requests
- **socket.io-client**: Real-time WebSocket communication
- **expo-location**: Access device location
- **react-native-maps**: Display maps
- **expo-barcode-scanner**: Scan QR codes
- **react-native-qrcode-svg**: Generate QR codes
- **@react-native-async-storage**: Local storage for auth tokens
