const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generate a unique QR code for a booking
 * Format: UUID-TIMESTAMP-HASH
 * This ensures uniqueness and adds a layer of security
 */
const generateQRCode = (bookingId, userId, tripId) => {
  const uuid = uuidv4();
  const timestamp = Date.now();

  // Create a hash for additional security
  const hash = crypto
    .createHash('sha256')
    .update(`${bookingId}-${userId}-${tripId}-${timestamp}`)
    .digest('hex')
    .substring(0, 8);

  // Combine to create QR code string
  const qrCode = `BUS-${uuid}-${hash}`.toUpperCase();

  return qrCode;
};

/**
 * Validate QR code format
 */
const validateQRCodeFormat = (qrCode) => {
  if (!qrCode || typeof qrCode !== 'string') {
    return false;
  }

  // Check if it starts with BUS- and has the expected structure
  const pattern = /^BUS-[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}-[A-F0-9]{8}$/;
  return pattern.test(qrCode);
};

module.exports = {
  generateQRCode,
  validateQRCodeFormat
};
