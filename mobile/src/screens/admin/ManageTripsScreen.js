import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Text, Chip, Button } from 'react-native-paper';
import { adminAPI } from '../../services/api';

export default function ManageTripsScreen() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getTrips();
      setTrips(response.data.trips);
    } catch (error) {
      console.error('Load trips error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'active': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#999';
    }
  };

  const renderTrip = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.title}>Trip #{item.id}</Title>
          <Chip
            mode="flat"
            style={[styles.chip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={{ color: 'white' }}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <Text style={styles.driver}>
          Driver: {item.driverName} ({item.driverEmail})
        </Text>

        <Text style={styles.route}>
          {item.startLocation.address} → {item.endLocation.address}
        </Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{item.totalDistance} km</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.label}>Base Price</Text>
            <Text style={styles.value}>${item.basePrice}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.label}>Stops</Text>
            <Text style={styles.value}>{item.stops.length}</Text>
          </View>
        </View>

        <Text style={styles.date}>
          Created: {new Date(item.createdAt).toLocaleString()}
        </Text>
        {item.startedAt && (
          <Text style={styles.date}>
            Started: {new Date(item.startedAt).toLocaleString()}
          </Text>
        )}
        {item.completedAt && (
          <Text style={styles.date}>
            Completed: {new Date(item.completedAt).toLocaleString()}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
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
            <Text style={styles.emptyText}>No trips found</Text>
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
  driver: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  route: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 15,
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
