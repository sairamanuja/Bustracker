const axios = require('axios');

/**
 * Calculate route and distances using Google Maps Directions API
 * @param {Object} startLocation - {lat, lng, address}
 * @param {Object} endLocation - {lat, lng, address}
 * @param {Array} waypoints - Array of {lat, lng, address} for intermediate stops
 * @returns {Object} - {polyline, totalDistance, stops: [{...stop, distance_from_start}]}
 */
const calculateRouteDistances = async (startLocation, endLocation, waypoints = []) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn('Google Maps API key not configured, using fallback distance calculation');
      return calculateRouteDistancesFallback(startLocation, endLocation, waypoints);
    }

    // Build waypoints parameter
    const waypointsParam = waypoints.length > 0
      ? waypoints.map(w => `${w.lat},${w.lng}`).join('|')
      : '';

    // Call Google Maps Directions API
    const url = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = {
      origin: `${startLocation.lat},${startLocation.lng}`,
      destination: `${endLocation.lat},${endLocation.lng}`,
      waypoints: waypointsParam || undefined,
      mode: 'driving',
      key: apiKey
    };

    const response = await axios.get(url, { params });

    if (response.data.status !== 'OK') {
      const errorMessage = response.data.error_message || response.data.status;
      console.warn(`Google Maps API error: ${response.data.status} - ${errorMessage}`);
      console.warn('Falling back to Haversine distance calculation');
      
      // Fallback to Haversine calculation
      return calculateRouteDistancesFallback(startLocation, endLocation, waypoints);
    }

    const route = response.data.routes[0];
    const legs = route.legs;

    // Calculate cumulative distances for each stop
    let cumulativeDistance = 0;
    const enrichedStops = [];

    // Add start location
    enrichedStops.push({
      ...startLocation,
      distance_from_start: 0
    });

    // Add waypoints with cumulative distances
    legs.forEach((leg, index) => {
      cumulativeDistance += leg.distance.value / 1000; // Convert meters to km

      if (index < waypoints.length) {
        enrichedStops.push({
          ...waypoints[index],
          distance_from_start: parseFloat(cumulativeDistance.toFixed(2))
        });
      }
    });

    // Add end location
    enrichedStops.push({
      ...endLocation,
      distance_from_start: parseFloat(cumulativeDistance.toFixed(2))
    });

    return {
      polyline: route.overview_polyline.points,
      totalDistance: parseFloat(cumulativeDistance.toFixed(2)),
      stops: enrichedStops
    };
  } catch (error) {
    console.error('Route calculation error:', error.message);
    console.warn('Falling back to Haversine distance calculation');
    
    // Fallback to Haversine calculation
    return calculateRouteDistancesFallback(startLocation, endLocation, waypoints);
  }
};

/**
 * Fallback distance calculation using Haversine formula
 * This is used when Google Maps API is unavailable or returns an error
 */
const calculateRouteDistancesFallback = (startLocation, endLocation, waypoints = []) => {
  const enrichedStops = [];
  let cumulativeDistance = 0;

  // Add start location
  enrichedStops.push({
    ...startLocation,
    distance_from_start: 0
  });

  // Calculate distances between consecutive points
  let previousPoint = { lat: startLocation.lat, lng: startLocation.lng };

  // Process waypoints
  waypoints.forEach((waypoint) => {
    const distance = calculateHaversineDistance(
      previousPoint.lat,
      previousPoint.lng,
      waypoint.lat,
      waypoint.lng
    );
    cumulativeDistance += distance;

    enrichedStops.push({
      ...waypoint,
      distance_from_start: parseFloat(cumulativeDistance.toFixed(2))
    });

    previousPoint = { lat: waypoint.lat, lng: waypoint.lng };
  });

  // Calculate distance to end location
  const finalDistance = calculateHaversineDistance(
    previousPoint.lat,
    previousPoint.lng,
    endLocation.lat,
    endLocation.lng
  );
  cumulativeDistance += finalDistance;

  // Add end location
  enrichedStops.push({
    ...endLocation,
    distance_from_start: parseFloat(cumulativeDistance.toFixed(2))
  });

  // Generate a simple polyline (straight line approximation)
  // This is a basic polyline - in production, you might want to use a better approximation
  const simplePolyline = generateSimplePolyline(enrichedStops);

  return {
    polyline: simplePolyline,
    totalDistance: parseFloat(cumulativeDistance.toFixed(2)),
    stops: enrichedStops
  };
};

/**
 * Generate a simple polyline from stops (basic approximation)
 * Note: This is a simplified polyline format. For proper map display,
 * consider using @mapbox/polyline or similar library for encoding.
 * For now, we use a simple format that can be parsed by the frontend.
 */
const generateSimplePolyline = (stops) => {
  // Create a simple path connecting all stops
  // Format: "lat1,lng1|lat2,lng2|lat3,lng3"
  const points = stops.map(stop => `${stop.lat},${stop.lng}`);
  return points.join('|');
};

/**
 * Calculate distance between two points (fallback if not using Google Maps)
 * Haversine formula
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return parseFloat(distance.toFixed(2));
};

module.exports = {
  calculateRouteDistances,
  calculateHaversineDistance
};
