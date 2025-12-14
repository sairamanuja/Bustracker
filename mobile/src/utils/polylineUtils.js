/**
 * Parse polyline from backend
 * Handles both Google Maps encoded polyline and simple fallback format
 * @param {string} polyline - Polyline string from backend
 * @returns {Array} Array of {latitude, longitude} coordinates
 */
export const parsePolyline = (polyline) => {
  if (!polyline) {
    return [];
  }

  // Check if it's the simple fallback format (contains "|")
  if (polyline.includes('|')) {
    return parseSimplePolyline(polyline);
  }

  // Otherwise, try to decode as Google Maps encoded polyline
  return decodeGooglePolyline(polyline);
};

/**
 * Parse simple polyline format: "lat1,lng1|lat2,lng2|lat3,lng3"
 */
const parseSimplePolyline = (polyline) => {
  try {
    const points = polyline.split('|');
    return points.map(point => {
      const [lat, lng] = point.split(',').map(Number);
      return { latitude: lat, longitude: lng };
    }).filter(coord => !isNaN(coord.latitude) && !isNaN(coord.longitude));
  } catch (error) {
    console.error('Error parsing simple polyline:', error);
    return [];
  }
};

/**
 * Decode Google Maps encoded polyline
 * This is a simplified decoder - for production, consider using a library like @mapbox/polyline
 */
const decodeGooglePolyline = (encoded) => {
  try {
    const coordinates = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      coordinates.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5
      });
    }

    return coordinates;
  } catch (error) {
    console.error('Error decoding Google polyline:', error);
    // If decoding fails, try parsing as simple format
    return parseSimplePolyline(encoded);
  }
};

/**
 * Generate polyline coordinates from stops array (fallback)
 */
export const generatePolylineFromStops = (stops) => {
  if (!stops || stops.length === 0) {
    return [];
  }

  return stops.map(stop => ({
    latitude: stop.lat,
    longitude: stop.lng
  }));
};

