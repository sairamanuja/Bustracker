import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Text, Chip } from 'react-native-paper';
import { adminAPI } from '../../services/api';

export default function ManageBookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getBookings();
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Load bookings error:', error);
    } finally {
      setLoading(false);
    }
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
          <Title style={styles.title}>Booking #{item.id}</Title>
          <Chip
            mode="flat"
            style={[styles.chip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={{ color: 'white' }}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <Text style={styles.info}>Trip #{item.tripId}</Text>

        <Text style={styles.person}>
          Passenger: {item.userName} ({item.userEmail})
        </Text>
        <Text style={styles.person}>
          Driver: {item.driverName}
        </Text>

        <Text style={styles.route}>
          {item.pickupLocation.address} → {item.dropoffLocation.address}
        </Text>

        <View style={styles.details}>
          <View style={styles.detail}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{item.distance} km</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.value}>${item.price}</Text>
          </View>
        </View>

        <Text style={styles.qr}>QR: {item.qrCode}</Text>

        <Text style={styles.date}>
          Booked: {new Date(item.createdAt).toLocaleString()}
        </Text>
        {item.verifiedAt && (
          <Text style={styles.date}>
            Verified: {new Date(item.verifiedAt).toLocaleString()}
          </Text>
        )}
      </Card.Content>
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
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        }
      />
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
  info: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  person: {
    fontSize: 14,
    marginBottom: 5,
  },
  route: {
    fontSize: 14,
    fontWeight: '500',
    marginVertical: 10,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  detail: {
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
  qr: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 5,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
