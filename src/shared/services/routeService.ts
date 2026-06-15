import { YatraLocation } from '@/shared/components/features/YatraMap';
import * as turf from '@turf/turf';

const generateCurvedFallback = (coords: [number, number][]): [number, number][] => {
  let curvedCoords: [number, number][] = [];
  for (let i = 0; i < coords.length - 1; i++) {
      const start = coords[i];
      const end = coords[i+1];
      const distance = (turf as any).distance(start, end);
      
      if (distance < 1) {
          curvedCoords.push(start);
          if (i === coords.length - 2) curvedCoords.push(end);
          continue;
      }

      const midpoint = (turf as any).midpoint(start, end);
      const bearing = (turf as any).bearing(start, end);
      
      const offsetDist = distance * 0.06; // 6% curve offset (less curved, matching reference)
      const offsetPoint = (turf as any).destination(midpoint, offsetDist, bearing + 90);
      
      const line = (turf as any).lineString([start, offsetPoint.geometry.coordinates as [number, number], end]);
      const curved = (turf as any).bezierSpline(line, { sharpness: 0.85 });
      
      const segmentCoords = curved.geometry.coordinates as [number, number][];
      if (i < coords.length - 2) {
          curvedCoords = curvedCoords.concat(segmentCoords.slice(0, -1));
      } else {
          curvedCoords = curvedCoords.concat(segmentCoords);
      }
  }
  return curvedCoords.length > 0 ? curvedCoords : coords;
};

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

  // Fallback to curved arc if no API key is provided
  if (!ORS_API_KEY) {
    console.warn("No OpenRouteService API key found. Falling back to curved arc routing.");
    return {
      coordinates: generateCurvedFallback(coords),
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
        coordinates: generateCurvedFallback(coords), // fallback
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
    coordinates: generateCurvedFallback(coords),
    distance: 0,
    duration: 0
  };
};
