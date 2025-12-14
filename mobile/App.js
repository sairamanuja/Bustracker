import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { USER_ROLES } from './src/utils/constants';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// User Screens
import HomeScreen from './src/screens/user/HomeScreen';
import TripDetailsScreen from './src/screens/user/TripDetailsScreen';
import MyBookingsScreen from './src/screens/user/MyBookingsScreen';
import TrackBusScreen from './src/screens/user/TrackBusScreen';
import WalletScreen from './src/screens/user/WalletScreen';

// Driver Screens
import DriverHomeScreen from './src/screens/driver/DriverHomeScreen';
import CreateTripScreen from './src/screens/driver/CreateTripScreen';
import ActiveTripScreen from './src/screens/driver/ActiveTripScreen';
import ScanQRScreen from './src/screens/driver/ScanQRScreen';

// Admin Screens
import DashboardScreen from './src/screens/admin/DashboardScreen';
import ManageUsersScreen from './src/screens/admin/ManageUsersScreen';
import ManageTripsScreen from './src/screens/admin/ManageTripsScreen';
import ManageBookingsScreen from './src/screens/admin/ManageBookingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// User Tab Navigator
function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Browse Trips',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{
          title: 'My Bookings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="ticket-confirmation" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Driver Tab Navigator
function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#03DAC6',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{
          title: 'My Trips',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Admin Tab Navigator
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ManageUsers"
        component={ManageUsersScreen}
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ManageTrips"
        component={ManageTripsScreen}
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bus-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ManageBookings"
        component={ManageBookingsScreen}
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="ticket" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main Navigator based on role
function MainNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator>
      {user?.role === USER_ROLES.ADMIN && (
        <Stack.Screen
          name="AdminTabs"
          component={AdminTabs}
          options={{ headerShown: false }}
        />
      )}

      {user?.role === USER_ROLES.DRIVER && (
        <>
          <Stack.Screen
            name="DriverTabs"
            component={DriverTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateTrip"
            component={CreateTripScreen}
            options={{ title: 'Create New Trip' }}
          />
          <Stack.Screen
            name="ActiveTrip"
            component={ActiveTripScreen}
            options={{ title: 'Active Trip' }}
          />
          <Stack.Screen
            name="ScanQR"
            component={ScanQRScreen}
            options={{ title: 'Scan QR Code' }}
          />
        </>
      )}

      {user?.role === USER_ROLES.USER && (
        <>
          <Stack.Screen
            name="UserTabs"
            component={UserTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TripDetails"
            component={TripDetailsScreen}
            options={{ title: 'Trip Details' }}
          />
          <Stack.Screen
            name="TrackBus"
            component={TrackBusScreen}
            options={{ title: 'Track Bus' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

function AppContent() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return null; // You can add a splash screen here
  }

  return (
    <NavigationContainer>
      {isAuthenticated() ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PaperProvider>
      <AuthProvider>
        <AppContent />
        <StatusBar style="auto" />
      </AuthProvider>
    </PaperProvider>
  );
}
