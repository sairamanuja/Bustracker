const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { isUser } = require('../middleware/roleCheck');
const { query } = require('../config/database');
const { getActiveTrips } = require('../controllers/tripController');
const { getMyBookings } = require('../controllers/bookingController');

// All user routes require authentication and user role
router.use(authenticateToken, isUser);

// Get all active trips
router.get('/trips/active', getActiveTrips);

// Get my bookings
router.get('/bookings/my', getMyBookings);

// Get wallet balance
router.get('/wallet', async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await query(
      'SELECT wallet_balance FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      walletBalance: parseFloat(result.rows[0].wallet_balance)
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// Get wallet transactions
router.get('/wallet/transactions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await query(
      `SELECT * FROM wallet_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      transactions: result.rows.map(txn => ({
        id: txn.id,
        amount: parseFloat(txn.amount),
        type: txn.type,
        description: txn.description,
        bookingId: txn.booking_id,
        balanceAfter: parseFloat(txn.balance_after),
        createdAt: txn.created_at
      }))
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
