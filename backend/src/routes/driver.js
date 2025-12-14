const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { isDriver } = require('../middleware/roleCheck');
const {
  createTrip,
  getMyTrips,
  startTrip,
  completeTrip
} = require('../controllers/tripController');
const { query } = require('../config/database');

// All driver routes require authentication and driver role
router.use(authenticateToken, isDriver);

// Trip management
router.post('/trips', createTrip);
router.get('/trips/my', getMyTrips);
router.put('/trips/:id/start', startTrip);
router.put('/trips/:id/complete', completeTrip);

// Verify booking by QR code
router.post('/bookings/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.user.userId;

    // Verify that the booking belongs to this driver's trip
    const result = await query(
      `UPDATE bookings b
       SET status = 'verified', verified_at = CURRENT_TIMESTAMP
       FROM trips t
       WHERE b.id = $1 AND b.trip_id = t.id AND t.driver_id = $2 AND b.status = 'pending'
       RETURNING b.*`,
      [id, driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Booking not found or already verified'
      });
    }

    const booking = result.rows[0];

    res.json({
      message: 'Booking verified successfully',
      booking: {
        id: booking.id,
        status: booking.status,
        verifiedAt: booking.verified_at
      }
    });
  } catch (error) {
    console.error('Verify booking error:', error);
    res.status(500).json({ error: 'Failed to verify booking' });
  }
});

// Verify booking by QR code string
router.post('/bookings/verify-qr', async (req, res) => {
  try {
    const { qrCode } = req.body;
    const driverId = req.user.userId;

    if (!qrCode) {
      return res.status(400).json({ error: 'QR code is required' });
    }

    // Verify that the booking belongs to this driver's trip
    const result = await query(
      `UPDATE bookings b
       SET status = 'verified', verified_at = CURRENT_TIMESTAMP
       FROM trips t
       WHERE b.qr_code = $1 AND b.trip_id = t.id AND t.driver_id = $2 AND b.status = 'pending'
       RETURNING b.*, t.id as trip_id`,
      [qrCode, driverId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Invalid QR code or booking already verified'
      });
    }

    const booking = result.rows[0];

    // Get user details
    const userResult = await query(
      'SELECT name, phone FROM users WHERE id = $1',
      [booking.user_id]
    );

    const user = userResult.rows[0];

    res.json({
      message: 'Booking verified successfully',
      booking: {
        id: booking.id,
        tripId: booking.trip_id,
        userId: booking.user_id,
        userName: user.name,
        userPhone: user.phone,
        pickupLocation: booking.pickup_location,
        dropoffLocation: booking.dropoff_location,
        price: parseFloat(booking.price),
        status: booking.status,
        verifiedAt: booking.verified_at
      }
    });
  } catch (error) {
    console.error('Verify QR error:', error);
    res.status(500).json({ error: 'Failed to verify booking' });
  }
});

module.exports = router;
