/**
 * Generates a Google Maps URL based on provided location data.
 * Supports direct URLs, coordinate strings, or numeric latitude/longitude.
 * 
 * @param locationLink - Direct URL or coordinates/query string (lat,lng or "Place Name")
 * @param latitude - Numeric latitude (fallback)
 * @param longitude - Numeric longitude (fallback)
 * @returns Fully qualified Google Maps URL or null if no valid data
 */
export const getLocationUrl = (
  locationLink?: string,
  latitude?: number | string,
  longitude?: number | string
): string | null => {
  if (locationLink && locationLink.trim() !== '') {
    const link = locationLink.trim();
    // 1. If it's already a full URL, return it as-is
    if (link.startsWith('http')) {
      return link;
    }
    
    // 2. If it's a string (coordinates or place name), wrap it in Google Maps Directions
    // This handles cases like "18.5204,73.8567" or "Hampi Temple"
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(link)}`;
  }

  // 3. Fallback to numeric latitude and longitude fields
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

  if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  return null;
};
