import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Text, Button } from 'react-native-paper';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function DashboardScreen({ navigation }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadAnalytics} />
      }
    >
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Title>Admin Dashboard</Title>
          <Text>Welcome, {user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={logout}>Logout</Button>
        </Card.Actions>
      </Card>

      {analytics && (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <Title>Users</Title>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{analytics.users?.admin || 0}</Text>
                  <Text style={styles.statLabel}>Admins</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{analytics.users?.driver || 0}</Text>
                  <Text style={styles.statLabel}>Drivers</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{analytics.users?.user || 0}</Text>
                  <Text style={styles.statLabel}>Passengers</Text>
                </View>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => navigation.navigate('ManageUsers')}>
                Manage Users
              </Button>
            </Card.Actions>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>Trips</Title>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{analytics.trips?.pending || 0}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{analytics.trips?.active || 0}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{analytics.trips?.completed || 0}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => navigation.navigate('ManageTrips')}>
                View All Trips
              </Button>
            </Card.Actions>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>Bookings</Title>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{analytics.bookings?.pending || 0}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{analytics.bookings?.verified || 0}</Text>
                  <Text style={styles.statLabel}>Verified</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{analytics.bookings?.completed || 0}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => navigation.navigate('ManageBookings')}>
                View All Bookings
              </Button>
            </Card.Actions>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Title>Revenue</Title>
              <Text style={styles.revenue}>${analytics.totalRevenue || 0}</Text>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
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
  email: {
    color: '#666',
    marginTop: 5,
  },
  card: {
    margin: 15,
    marginTop: 0,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  revenue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 10,
  },
  revenueLabel: {
    textAlign: 'center',
    color: '#666',
    marginTop: 5,
  },
});
