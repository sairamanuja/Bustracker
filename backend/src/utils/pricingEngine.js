/**
 * Calculate price for a booking based on distance between pickup and dropoff stops
 * @param {Number} basePrice - Total base price for the entire trip
 * @param {Number} totalDistance - Total distance of the trip in km
 * @param {Number} pickupStopIndex - Index of pickup stop
 * @param {Number} dropoffStopIndex - Index of dropoff stop
 * @param {Array} stops - Array of stop objects with distance_from_start
 * @returns {Object} - {distance, price}
 */
const calculateBookingPrice = (basePrice, totalDistance, pickupStopIndex, dropoffStopIndex, stops) => {
  // Validation
  if (pickupStopIndex >= dropoffStopIndex) {
    throw new Error('Dropoff stop must be after pickup stop');
  }

  if (pickupStopIndex < 0 || dropoffStopIndex >= stops.length) {
    throw new Error('Invalid stop indices');
  }

  // Get distance from start for each stop
  const pickupDistance = stops[pickupStopIndex].distance_from_start;
  const dropoffDistance = stops[dropoffStopIndex].distance_from_start;

  // Calculate distance between pickup and dropoff
  const distance = dropoffDistance - pickupDistance;

  if (distance <= 0) {
    throw new Error('Invalid distance calculation');
  }

  // Calculate price based on proportion of total distance
  // Formula: (distance / totalDistance) * basePrice
  const pricePerKm = basePrice / totalDistance;
  const price = pricePerKm * distance;

  return {
    distance: parseFloat(distance.toFixed(2)),
    price: parseFloat(price.toFixed(2))
  };
};

/**
 * Validate if user has sufficient wallet balance
 * @param {Number} walletBalance - User's current wallet balance
 * @param {Number} requiredAmount - Amount needed for booking
 * @returns {Boolean}
 */
const hasSufficientBalance = (walletBalance, requiredAmount) => {
  return walletBalance >= requiredAmount;
};

module.exports = {
  calculateBookingPrice,
  hasSufficientBalance
};
