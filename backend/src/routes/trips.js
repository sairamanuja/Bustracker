const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getActiveTrips,
  getTripDetails,
  getTripLocation
} = require('../controllers/tripController');

// All trip routes require authentication
router.use(authenticateToken);

// Get all active trips
router.get('/', getActiveTrips);

// Get trip details
router.get('/:id', getTripDetails);

// Get current location of trip
router.get('/:id/location', getTripLocation);

module.exports = router;
