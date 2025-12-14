const { query, transaction } = require('../config/database');
const { calculateBookingPrice, hasSufficientBalance } = require('../utils/pricingEngine');
const { generateQRCode } = require('../utils/qrGenerator');

// Create booking
const createBooking = async (req, res) => {
  try {
    const { tripId, pickupStopIndex, dropoffStopIndex } = req.body;
    const userId = req.user.userId;

    // Validation
    if (tripId === undefined || pickupStopIndex === undefined || dropoffStopIndex === undefined) {
      return res.status(400).json({
        error: 'Trip ID, pickup stop index, and dropoff stop index are required'
      });
    }

    // Get trip details
    const tripResult = await query(
      'SELECT * FROM trips WHERE id = $1',
      [tripId]
    );

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripResult.rows[0];

    // Check if trip is active
    if (trip.status !== 'active') {
      return res.status(400).json({ error: 'Trip is not active' });
    }

    const stops = trip.stops;

    // Validate stop indices
    if (pickupStopIndex < 0 || dropoffStopIndex >= stops.length) {
      return res.status(400).json({ error: 'Invalid stop indices' });
    }

    if (pickupStopIndex >= dropoffStopIndex) {
      return res.status(400).json({ error: 'Dropoff stop must be after pickup stop' });
    }

    // Calculate distance and price
    const { distance, price } = calculateBookingPrice(
      parseFloat(trip.base_price),
      parseFloat(trip.total_distance),
      pickupStopIndex,
      dropoffStopIndex,
      stops
    );

    // Use transaction to ensure atomicity
    const result = await transaction(async (client) => {
      // Get user's current wallet balance (with lock)
      const userResult = await client.query(
        'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      const user = userResult.rows[0];
      const walletBalance = parseFloat(user.wallet_balance);

      // Check if user has sufficient balance
      if (!hasSufficientBalance(walletBalance, price)) {
        throw new Error('Insufficient wallet balance');
      }

      // Generate unique QR code
      const qrCode = generateQRCode(null, userId, tripId);

      // Create booking
      const bookingResult = await client.query(
        `INSERT INTO bookings (trip_id, user_id, pickup_stop_index, dropoff_stop_index,
                              pickup_location, dropoff_location, distance, price, qr_code, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
         RETURNING *`,
        [
          tripId,
          userId,
          pickupStopIndex,
          dropoffStopIndex,
          JSON.stringify(stops[pickupStopIndex]),
          JSON.stringify(stops[dropoffStopIndex]),
          distance,
          price,
          qrCode
        ]
      );

      const booking = bookingResult.rows[0];

      // Deduct from wallet
      const newBalance = walletBalance - price;
      await client.query(
        'UPDATE users SET wallet_balance = $1 WHERE id = $2',
        [newBalance, userId]
      );

      // Create wallet transaction record
      await client.query(
        `INSERT INTO wallet_transactions (user_id, amount, type, description, booking_id, balance_after)
         VALUES ($1, $2, 'debit', $3, $4, $5)`,
        [userId, price, `Booking for trip #${tripId}`, booking.id, newBalance]
      );

      return { booking, newBalance };
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: result.booking.id,
        tripId: result.booking.trip_id,
        userId: result.booking.user_id,
        pickupStopIndex: result.booking.pickup_stop_index,
        dropoffStopIndex: result.booking.dropoff_stop_index,
        pickupLocation: result.booking.pickup_location,
        dropoffLocation: result.booking.dropoff_location,
        distance: parseFloat(result.booking.distance),
        price: parseFloat(result.booking.price),
        qrCode: result.booking.qr_code,
        status: result.booking.status,
        createdAt: result.booking.created_at
      },
      walletBalance: parseFloat(result.newBalance)
    });
  } catch (error) {
    console.error('Create booking error:', error);
    if (error.message === 'Insufficient wallet balance') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to create booking' });
  }
};

// Get booking details
const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    let bookingQuery;
    let params;

    if (userRole === 'admin') {
      // Admin can see any booking
      bookingQuery = 'SELECT * FROM bookings WHERE id = $1';
      params = [id];
    } else {
      // Users can only see their own bookings
      bookingQuery = 'SELECT * FROM bookings WHERE id = $1 AND user_id = $2';
      params = [id, userId];
    }

    const result = await query(bookingQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];

    res.json({
      booking: {
        id: booking.id,
        tripId: booking.trip_id,
        userId: booking.user_id,
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
      }
    });
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
};

// Get QR code
const getBookingQR = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await query(
      'SELECT id, qr_code, status FROM bookings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = result.rows[0];

    res.json({
      bookingId: booking.id,
      qrCode: booking.qr_code,
      status: booking.status
    });
  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await transaction(async (client) => {
      // Get booking details
      const bookingResult = await client.query(
        `SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
        [id, userId]
      );

      if (bookingResult.rows.length === 0) {
        throw new Error('Booking not found or cannot be cancelled');
      }

      const booking = bookingResult.rows[0];
      const refundAmount = parseFloat(booking.price);

      // Update booking status
      await client.query(
        `UPDATE bookings SET status = 'cancelled' WHERE id = $1`,
        [id]
      );

      // Refund to wallet
      const userResult = await client.query(
        'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      const currentBalance = parseFloat(userResult.rows[0].wallet_balance);
      const newBalance = currentBalance + refundAmount;

      await client.query(
        'UPDATE users SET wallet_balance = $1 WHERE id = $2',
        [newBalance, userId]
      );

      // Create wallet transaction record
      await client.query(
        `INSERT INTO wallet_transactions (user_id, amount, type, description, booking_id, balance_after)
         VALUES ($1, $2, 'credit', $3, $4, $5)`,
        [userId, refundAmount, `Refund for cancelled booking #${id}`, id, newBalance]
      );

      return { newBalance };
    });

    res.json({
      message: 'Booking cancelled and refunded successfully',
      walletBalance: parseFloat(result.newBalance)
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel booking' });
  }
};

// Get my bookings (for regular users)
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT b.*, t.start_location, t.end_location, t.status as trip_status
       FROM bookings b
       JOIN trips t ON b.trip_id = t.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json({
      bookings: result.rows.map(booking => ({
        id: booking.id,
        tripId: booking.trip_id,
        tripStatus: booking.trip_status,
        tripStartLocation: booking.start_location,
        tripEndLocation: booking.end_location,
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
    console.error('Get my bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

module.exports = {
  createBooking,
  getBookingDetails,
  getBookingQR,
  cancelBooking,
  getMyBookings
};
