import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Modal } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Text } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { userAPI, bookingAPI } from '../../services/api';

export default function MyBookingsScreen({ navigation, route }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadBookings();

    // If navigated from booking confirmation, show QR
    if (route.params?.bookingId) {
      const booking = bookings.find(b => b.id === route.params.bookingId);
      if (booking) {
        showQRCode(booking);
      }
    }
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getMyBookings();
      setBookings(response.data.bookings);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const showQRCode = (booking) => {
    setSelectedBooking(booking);
    setShowQR(true);
  };

  const cancelBooking = async (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? You will receive a refund to your wallet.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingAPI.cancel(bookingId);
              Alert.alert('Success', 'Booking cancelled and refunded');
              loadBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'verified': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#999';
    }
  };

  const renderBooking = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.title}>Trip #{item.tripId}</Title>
          <Chip
            mode="flat"
            style={[styles.chip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={{ color: 'white' }}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <Paragraph style={styles.route}>
          {item.pickupLocation.address} → {item.dropoffLocation.address}
        </Paragraph>

        <View style={styles.details}>
          <Text>Distance: {item.distance} km</Text>
          <Text>Price: ${item.price}</Text>
        </View>

        <View style={styles.details}>
          <Text>Trip Status: {item.tripStatus}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>

      <Card.Actions>
        {item.status === 'pending' && (
          <>
            <Button
              mode="outlined"
              onPress={() => showQRCode(item)}
            >
              Show QR
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.navigate('TrackBus', { tripId: item.tripId })}
            >
              Track Bus
            </Button>
            <Button
              mode="text"
              textColor="#F44336"
              onPress={() => cancelBooking(item.id)}
            >
              Cancel
            </Button>
          </>
        )}
        {item.status === 'verified' && (
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('TrackBus', { tripId: item.tripId })}
          >
            Track Bus
          </Button>
        )}
        {item.status === 'completed' && (
          <Text style={styles.completedText}>Trip Completed</Text>
        )}
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadBookings} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Home')}
              style={styles.browseButton}
            >
              Browse Trips
            </Button>
          </View>
        }
      />

      <Modal
        visible={showQR}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Title>Booking QR Code</Title>
            <Paragraph style={styles.modalText}>
              Show this QR code to the driver when boarding
            </Paragraph>

            {selectedBooking && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={selectedBooking.qrCode}
                  size={200}
                />
                <Text style={styles.qrText}>{selectedBooking.qrCode}</Text>
              </View>
            )}

            <View style={styles.bookingInfo}>
              <Text>Booking ID: #{selectedBooking?.id}</Text>
              <Text>Price: ${selectedBooking?.price}</Text>
              <Text>Status: {selectedBooking?.status}</Text>
            </View>

            <Button
              mode="contained"
              onPress={() => setShowQR(false)}
              style={styles.closeButton}
            >
              Close
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 10,
  },
  card: {
    marginBottom: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
  },
  chip: {
    marginLeft: 10,
  },
  route: {
    fontSize: 14,
    marginBottom: 10,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  date: {
    color: '#666',
  },
  completedText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  browseButton: {
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrText: {
    marginTop: 10,
    fontSize: 10,
    color: '#666',
  },
  bookingInfo: {
    width: '100%',
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  closeButton: {
    marginTop: 20,
    width: '100%',
  },
});
