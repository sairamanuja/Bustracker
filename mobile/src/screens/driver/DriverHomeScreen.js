import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Chip, Text } from 'react-native-paper';
import { driverAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function DriverHomeScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const response = await driverAPI.getMyTrips();
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

        <Paragraph style={styles.route}>
          {item.startLocation.address} → {item.endLocation.address}
        </Paragraph>

        <View style={styles.details}>
          <View style={styles.detail}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{item.totalDistance} km</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.label}>Base Price</Text>
            <Text style={styles.value}>${item.basePrice}</Text>
          </View>
          <View style={styles.detail}>
            <Text style={styles.label}>Stops</Text>
            <Text style={styles.value}>{item.stops.length}</Text>
          </View>
        </View>

        {item.startedAt && (
          <Text style={styles.timestamp}>
            Started: {new Date(item.startedAt).toLocaleString()}
          </Text>
        )}
        {item.completedAt && (
          <Text style={styles.timestamp}>
            Completed: {new Date(item.completedAt).toLocaleString()}
          </Text>
        )}
      </Card.Content>

      <Card.Actions>
        {item.status === 'pending' && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('ActiveTrip', { tripId: item.id })}
          >
            Start Trip
          </Button>
        )}
        {item.status === 'active' && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('ActiveTrip', { tripId: item.id })}
          >
            View Active Trip
          </Button>
        )}
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title>Welcome, {user?.name}</Title>
          <Paragraph>Manage your trips and share your location in real-time</Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button onPress={handleLogout} mode="outlined" icon="logout">
            Logout
          </Button>
        </Card.Actions>
      </Card>

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
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first trip to get started
            </Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        label="New Trip"
        onPress={() => navigation.navigate('CreateTrip')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeCard: {
    margin: 15,
    elevation: 2,
  },
  list: {
    paddingHorizontal: 15,
    paddingBottom: 80,
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
    marginBottom: 15,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
