const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { query } = require('../config/database');
const bcrypt = require('bcrypt');

// All admin routes require authentication and admin role
router.use(authenticateToken, isAdmin);

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, phone, role, wallet_balance, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      users: result.rows.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        walletBalance: parseFloat(user.wallet_balance),
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { email, password, name, phone, role = 'user' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Validate role
    const validRoles = ['admin', 'driver', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      `INSERT INTO users (email, password_hash, name, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, phone, role, wallet_balance, created_at`,
      [email.toLowerCase(), passwordHash, name, phone, role]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        walletBalance: parseFloat(user.wallet_balance),
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, phone, role, walletBalance } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email.toLowerCase());
    }
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (role !== undefined) {
      const validRoles = ['admin', 'driver', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }
    if (walletBalance !== undefined) {
      updates.push(`wallet_balance = $${paramCount++}`);
      values.push(walletBalance);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, name, phone, role, wallet_balance, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        walletBalance: parseFloat(user.wallet_balance),
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all trips
router.get('/trips', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, u.name as driver_name, u.email as driver_email
       FROM trips t
       JOIN users u ON t.driver_id = u.id
       ORDER BY t.created_at DESC`
    );

    res.json({
      trips: result.rows.map(trip => ({
        id: trip.id,
        driverId: trip.driver_id,
        driverName: trip.driver_name,
        driverEmail: trip.driver_email,
        startLocation: trip.start_location,
        endLocation: trip.end_location,
        stops: trip.stops,
        routePolyline: trip.route_polyline,
        basePrice: parseFloat(trip.base_price),
        totalDistance: parseFloat(trip.total_distance),
        status: trip.status,
        currentLocation: trip.current_location,
        startedAt: trip.started_at,
        completedAt: trip.completed_at,
        createdAt: trip.created_at
      }))
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get all bookings
router.get('/bookings', async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, u.name as user_name, u.email as user_email,
              t.driver_id, d.name as driver_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN trips t ON b.trip_id = t.id
       JOIN users d ON t.driver_id = d.id
       ORDER BY b.created_at DESC`
    );

    res.json({
      bookings: result.rows.map(booking => ({
        id: booking.id,
        tripId: booking.trip_id,
        userId: booking.user_id,
        userName: booking.user_name,
        userEmail: booking.user_email,
        driverId: booking.driver_id,
        driverName: booking.driver_name,
        pickupStopIndex: booking.pickup_stop_index,
        dropoffStopIndex: booking.dropoff_stop_index,
        pickupLocation: booking.pickup_location,
        dropoffLocation: booking.dropoff_location,
        distance: parseFloat(booking.distance),
        price: parseFloat(booking.price),
        qrCode: booking.qr_code,
        status: booking.status,
        verifiedAt: booking.verified_at,
        createdAt: booking.created_at
      }))
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get analytics
router.get('/analytics', async (req, res) => {
  try {
    const [userStats, tripStats, bookingStats, revenueStats] = await Promise.all([
      query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`),
      query(`SELECT status, COUNT(*) as count FROM trips GROUP BY status`),
      query(`SELECT status, COUNT(*) as count FROM bookings GROUP BY status`),
      query(`SELECT SUM(amount) as total FROM wallet_transactions WHERE type = 'debit'`)
    ]);

    res.json({
      users: userStats.rows.reduce((acc, row) => {
        acc[row.role] = parseInt(row.count);
        return acc;
      }, {}),
      trips: tripStats.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      bookings: bookingStats.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      totalRevenue: parseFloat(revenueStats.rows[0]?.total || 0)
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
