import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import socketService from '../services/socket';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Load user data from storage on app start
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await AsyncStorage.multiGet([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);

      const authToken = storedToken[1];
      const userData = storedUser[1] ? JSON.parse(storedUser[1]) : null;

      if (authToken && userData) {
        setToken(authToken);
        setUser(userData);

        // Connect socket
        await socketService.connect();
      }
    } catch (error) {
      console.error('Load auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: authToken, user: userData } = response.data;

      // Store auth data
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, authToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
      ]);

      setToken(authToken);
      setUser(userData);

      // Connect socket
      await socketService.connect();

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { token: authToken, user: userData } = response.data;

      // Store auth data
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, authToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(userData)],
      ]);

      setToken(authToken);
      setUser(userData);

      // Connect socket
      await socketService.connect();

      return { success: true, user: userData };
    } catch (error) {
      console.error('Register error:', error);
      const message = error.response?.data?.error || 'Registration failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // Disconnect socket
      socketService.disconnect();

      // Clear storage
      await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);

      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const userData = response.data.user;

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      console.error('Update user error:', error);
      return null;
    }
  };

  const isAuthenticated = () => {
    return token !== null && user !== null;
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
