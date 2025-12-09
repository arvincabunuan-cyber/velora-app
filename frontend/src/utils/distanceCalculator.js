// Distance and price calculation utilities

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Calculate delivery price based on distance
 * Base rate: ₱50 for 13km
 * @param {number} distanceKm - Distance in kilometers
 * @returns {number} Price in Philippine Pesos
 */
export const calculateDeliveryPrice = (distanceKm) => {
  const baseDistance = 13; // km
  const basePrice = 50; // PHP
  const pricePerKm = basePrice / baseDistance; // ≈ ₱3.85 per km
  
  const calculatedPrice = Math.ceil(distanceKm * pricePerKm);
  
  // Minimum charge
  return Math.max(calculatedPrice, 30);
};

/**
 * Geocode an address using a geocoding service
 * Returns coordinates for the given address
 * @param {string} address - Address to geocode
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const geocodeAddress = async (address) => {
  try {
    // Using Nominatim (OpenStreetMap) free geocoding API
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    throw new Error('Address not found');
  } catch (error) {
    console.error('Geocoding error:', error);
    throw error;
  }
};

/**
 * Calculate distance and price between two addresses
 * @param {string} pickupAddress - Pickup address
 * @param {string} deliveryAddress - Delivery address
 * @returns {Promise<{distance: number, price: number}>}
 */
export const calculateDeliveryEstimate = async (pickupAddress, deliveryAddress) => {
  try {
    const [pickup, delivery] = await Promise.all([
      geocodeAddress(pickupAddress),
      geocodeAddress(deliveryAddress)
    ]);
    
    const distance = calculateDistance(
      pickup.lat,
      pickup.lng,
      delivery.lat,
      delivery.lng
    );
    
    const price = calculateDeliveryPrice(distance);
    
    return {
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      price,
      pickup,
      delivery
    };
  } catch (error) {
    console.error('Error calculating delivery estimate:', error);
    throw error;
  }
};
