const { query } = require('../config/database');
const { calculateRouteDistances } = require('../utils/distanceCalculator');

// Create new trip (Driver only)
const createTrip = async (req, res) => {
  try {
    const { startLocation, endLocation, waypoints = [], basePrice } = req.body;
    const driverId = req.user.userId;

    // Validation
    if (!startLocation || !endLocation || !basePrice) {
      return res.status(400).json({
        error: 'Start location, end location, and base price are required'
      });
    }

    if (basePrice <= 0) {
      return res.status(400).json({ error: 'Base price must be greater than 0' });
    }

    // Calculate route and distances using Google Maps
    const { polyline, totalDistance, stops } = await calculateRouteDistances(
      startLocation,
      endLocation,
      waypoints
    );

    // Insert trip into database
    const result = await query(
      `INSERT INTO trips (driver_id, start_location, end_location, stops, route_polyline, base_price, total_distance, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [
        driverId,
        JSON.stringify(startLocation),
        JSON.stringify(endLocation),
        JSON.stringify(stops),
        polyline,
        basePrice,
        totalDistance
      ]
    );

    const trip = result.rows[0];

    res.status(201).json({
      message: 'Trip created successfully',
      trip: {
        id: trip.id,
        driverId: trip.driver_id,
        startLocation: trip.start_location,
        endLocation: trip.end_location,
        stops: trip.stops,
        routePolyline: trip.route_polyline,
        basePrice: parseFloat(trip.base_price),
        totalDistance: parseFloat(trip.total_distance),
        status: trip.status,
        createdAt: trip.created_at
      }
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: error.message || 'Failed to create trip' });
  }
};

// Get driver's own trips
const getMyTrips = async (req, res) => {
  try {
    const driverId = req.user.userId;

    const result = await query(
      `SELECT * FROM trips WHERE driver_id = $1 ORDER BY created_at DESC`,
      [driverId]
    );

    res.json({
      trips: result.rows.map(trip => ({
        id: trip.id,
        driverId: trip.driver_id,
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
    console.error('Get my trips error:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
};

// Start trip
const startTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.user.userId;

    const result = await query(
      `UPDATE trips
       SET status = 'active', started_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND driver_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Trip not found or cannot be started'
      });
    }

    const trip = result.rows[0];

    res.json({
      message: 'Trip started successfully',
      trip: {
        id: trip.id,
        status: trip.status,
        startedAt: trip.started_at
      }
    });
  } catch (error) {
    console.error('Start trip error:', error);
    res.status(500).json({ error: 'Failed to start trip' });
  }
};

// Complete trip
const completeTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.user.userId;

    const result = await query(
      `UPDATE trips
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND driver_id = $2 AND status = 'active'
       RETURNING *`,
      [id, driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Trip not found or cannot be completed'
      });
    }

    // Update all pending bookings for this trip to completed
    await query(
      `UPDATE bookings
       SET status = 'completed'
       WHERE trip_id = $1 AND status IN ('pending', 'verified')`,
      [id]
    );

    const trip = result.rows[0];

    res.json({
      message: 'Trip completed successfully',
      trip: {
        id: trip.id,
        status: trip.status,
        completedAt: trip.completed_at
      }
    });
  } catch (error) {
    console.error('Complete trip error:', error);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
};

// Get all active trips (for users to browse)
const getActiveTrips = async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, u.name as driver_name, u.phone as driver_phone
       FROM trips t
       JOIN users u ON t.driver_id = u.id
       WHERE t.status = 'active'
       ORDER BY t.started_at DESC`
    );

    res.json({
      trips: result.rows.map(trip => ({
        id: trip.id,
        driverId: trip.driver_id,
        driverName: trip.driver_name,
        driverPhone: trip.driver_phone,
        startLocation: trip.start_location,
        endLocation: trip.end_location,
        stops: trip.stops,
        routePolyline: trip.route_polyline,
        basePrice: parseFloat(trip.base_price),
        totalDistance: parseFloat(trip.total_distance),
        status: trip.status,
        currentLocation: trip.current_location,
        startedAt: trip.started_at
      }))
    });
  } catch (error) {
    console.error('Get active trips error:', error);
    res.status(500).json({ error: 'Failed to fetch active trips' });
  }
};

// Get trip details
const getTripDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT t.*, u.name as driver_name, u.phone as driver_phone
       FROM trips t
       JOIN users u ON t.driver_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = result.rows[0];

    res.json({
      trip: {
        id: trip.id,
        driverId: trip.driver_id,
        driverName: trip.driver_name,
        driverPhone: trip.driver_phone,
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
      }
    });
  } catch (error) {
    console.error('Get trip details error:', error);
    res.status(500).json({ error: 'Failed to fetch trip details' });
  }
};

// Get current location of trip
const getTripLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT id, current_location, status FROM trips WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = result.rows[0];

    res.json({
      tripId: trip.id,
      currentLocation: trip.current_location,
      status: trip.status
    });
  } catch (error) {
    console.error('Get trip location error:', error);
    res.status(500).json({ error: 'Failed to fetch trip location' });
  }
};

module.exports = {
  createTrip,
  getMyTrips,
  startTrip,
  completeTrip,
  getActiveTrips,
  getTripDetails,
  getTripLocation
};
