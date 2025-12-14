const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { isUser } = require('../middleware/roleCheck');
const {
  createBooking,
  getBookingDetails,
  getBookingQR,
  cancelBooking
} = require('../controllers/bookingController');

// All booking routes require authentication
router.use(authenticateToken);

// Create booking (users only)
router.post('/', isUser, createBooking);

// Get booking details (users can only see their own, admins can see any)
router.get('/:id', getBookingDetails);

// Get QR code (users only, their own bookings)
router.get('/:id/qr', isUser, getBookingQR);

// Cancel booking (users only, their own bookings)
router.delete('/:id', isUser, cancelBooking);

module.exports = router;
