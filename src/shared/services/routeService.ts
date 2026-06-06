import { YatraLocation } from '@/shared/components/features/YatraMap';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY;

export interface RouteGeometry {
  coordinates: [number, number][]; // [lng, lat]
  distance: number; // in meters
  duration: number; // in seconds
}

export const fetchRoute = async (locations: YatraLocation[], userLocation?: { lat: number, lng: number } | null): Promise<RouteGeometry | null> => {
  if (locations.length === 0 && !userLocation) return null;
  
  // Create coordinate array [longitude, latitude]
  const sorted = [...locations].sort((a, b) => a.sequence - b.sequence);
  const coords: [number, number][] = sorted.map(l => [l.longitude, l.latitude]);
  if (userLocation) {
    coords.unshift([userLocation.lng, userLocation.lat]);
  }

  if (coords.length < 2) return null;

  // Fallback to straight line if no API key is provided
  if (!ORS_API_KEY) {
    console.warn("No OpenRouteService API key found. Falling back to straight-line direct routing.");
    return {
      coordinates: coords,
      distance: 0,
      duration: 0
    };
  }

  try {
    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ORS_API_KEY
      },
      body: JSON.stringify({
        coordinates: coords,
        elevation: true,
      })
    });

    if (!response.ok) {
      console.error("OpenRouteService API error:", response.statusText);
      return {
        coordinates: coords, // fallback
        distance: 0,
        duration: 0
      };
    }

    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        coordinates: feature.geometry.coordinates,
        distance: feature.properties.summary.distance,
        duration: feature.properties.summary.duration
      };
    }
  } catch (error) {
    console.error("Error fetching route:", error);
  }

  return {
    coordinates: coords,
    distance: 0,
    duration: 0
  };
};
