const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { isUser } = require('../middleware/roleCheck');
const { query, transaction } = require('../config/database');

// All wallet routes require authentication and user role
router.use(authenticateToken, isUser);

// Add money to wallet
router.post('/add-money', async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    if (amount > 10000) {
      return res.status(400).json({ error: 'Maximum amount per transaction is 10,000' });
    }

    const result = await transaction(async (client) => {
      // Get current balance (with lock)
      const userResult = await client.query(
        'SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );

      const currentBalance = parseFloat(userResult.rows[0].wallet_balance);
      const newBalance = currentBalance + parseFloat(amount);

      // Update balance
      await client.query(
        'UPDATE users SET wallet_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newBalance, userId]
      );

      // Create transaction record
      await client.query(
        `INSERT INTO wallet_transactions (user_id, amount, type, description, balance_after)
         VALUES ($1, $2, 'credit', $3, $4)`,
        [userId, amount, `Added money to wallet`, newBalance]
      );

      return { newBalance };
    });

    res.json({
      message: 'Money added successfully',
      amount: parseFloat(amount),
      walletBalance: parseFloat(result.newBalance)
    });
  } catch (error) {
    console.error('Add money error:', error);
    res.status(500).json({ error: 'Failed to add money' });
  }
});

module.exports = router;
