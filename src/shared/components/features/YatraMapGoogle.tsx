import { useEffect, useState, useMemo, ReactNode, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { YatraLocation } from "./YatraMap";
import { Geolocation } from '@capacitor/geolocation';
import { Navigation } from "lucide-react";

const darkRoyalTheme = [
  { "elementType": "geometry", "stylers": [{ "color": "#0d1b2a" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#e0a96d" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0d1b2a" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#415a77" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d4af37" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#1b263b" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1b263b" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#415a77" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8b9dc3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#415a77" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#0d1b2a" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f0e6d2" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "business", "stylers": [{ "visibility": "off" }] }
];

function MapController({ locations, highlightedId, centerOnFullRoute, forceFocus, userLocation }: { locations: YatraLocation[], highlightedId?: string, centerOnFullRoute?: number, forceFocus?: number, userLocation: {lat: number, lng: number} | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    if (forceFocus && userLocation) {
      map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      map.setZoom(16);
      return;
    }
    
    if (locations.length === 0) return;
    
    if (centerOnFullRoute) {
      const bounds = new window.google.maps.LatLngBounds();
      locations.forEach(loc => bounds.extend({ lat: loc.latitude, lng: loc.longitude }));
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
      return;
    }

    if (highlightedId) {
      const loc = locations.find(l => l.id === highlightedId);
      if (loc) {
        map.panTo({ lat: loc.latitude, lng: loc.longitude });
        map.setZoom(15);
      }
    }
  }, [map, locations, highlightedId, centerOnFullRoute, forceFocus, userLocation]);

  return null;
}

function DirectionsPath({ locations, highlightedId, userLocation }: { locations: YatraLocation[], highlightedId?: string, userLocation: {lat: number, lng: number} | null }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();
  const [completedRenderer, setCompletedRenderer] = useState<google.maps.DirectionsRenderer>();

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    
    const renderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: "#0f3c6e",
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    });
    setDirectionsRenderer(renderer);

    const compRenderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: "#10B981", 
        strokeWeight: 6,
        strokeOpacity: 0.9,
        zIndex: 100
      }
    });
    setCompletedRenderer(compRenderer);

    return () => {
      renderer.setMap(null);
      compRenderer.setMap(null);
    };
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || locations.length < 1) {
      return;
    }

    const sorted = [...locations].sort((a, b) => a.sequence - b.sequence);
    let origin: google.maps.LatLngLiteral;
    
    if (userLocation) {
        origin = userLocation;
    } else {
        origin = { lat: sorted[0].latitude, lng: sorted[0].longitude };
    }
    
    const destination = { lat: sorted[sorted.length - 1].latitude, lng: sorted[sorted.length - 1].longitude };
    
    const waypointsArray = userLocation ? sorted : sorted.slice(1, -1);
    const waypoints = waypointsArray.map(loc => ({
      location: { lat: loc.latitude, lng: loc.longitude },
      stopover: true
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        }
      }
    );
  }, [directionsService, directionsRenderer, locations, highlightedId, userLocation]);

  return null;
}

interface YatraMapProps {
  locations: YatraLocation[];
  highlightedId?: string;
  centerOnFullRoute?: number;
  forceFocus?: number;
}

export default function YatraMapGoogle({ locations, highlightedId, centerOnFullRoute, forceFocus }: YatraMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    let watchId: string;
    const startTracking = async () => {
      const hasPermission = await Geolocation.checkPermissions();
      if (hasPermission.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') return;
      }
      
      const pos = await Geolocation.getCurrentPosition();
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });

      watchId = await Geolocation.watchPosition({ enableHighAccuracy: true }, (pos, err) => {
          if (pos) {
              setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          }
      });
    };
    startTracking();
    
    return () => {
        if (watchId) {
            Geolocation.clearWatch({ id: watchId });
        }
    }
  }, []);

  return (
    <div className="w-full h-full relative z-0 bg-[#0d1b2a]">
      <style>
        {`
          @keyframes pulse-glow {
            0% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { transform: scale(1.1); opacity: 0; box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
            100% { transform: scale(1); opacity: 0; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
          .user-location-marker {
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            animation: pulse-glow 2s infinite;
          }
        `}
      </style>
        <Map
          mapId="PANCHJANYA_YATRA"
          defaultZoom={5}
          defaultCenter={{ lat: 25.3176, lng: 82.9739 }}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          styles={darkRoyalTheme}
          style={{ width: "100%", height: "100%" }}
        >
          <MapController 
            locations={locations} 
            highlightedId={highlightedId} 
            centerOnFullRoute={centerOnFullRoute} 
            forceFocus={forceFocus} 
            userLocation={userLocation}
          />
          <DirectionsPath locations={locations} highlightedId={highlightedId} userLocation={userLocation} />

          {userLocation && (
              <AdvancedMarker position={userLocation} zIndex={3000}>
                  <div className="user-location-marker"></div>
              </AdvancedMarker>
          )}

          {locations.map((loc, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === locations.length - 1;
            const isHighlighted = loc.id === highlightedId;
            const landingPrimary = '#0f3c6e'; 
            const goldAccent = '#D4AF37';
            const baseColor = isEnd ? goldAccent : landingPrimary;
            
            // Randomly assign a crowd status for demo
            const crowdStatus = ['low', 'moderate', 'heavy'][idx % 3];
            const crowdColor = crowdStatus === 'low' ? '#10B981' : crowdStatus === 'moderate' ? '#F59E0B' : '#EF4444';

            return (
              <AdvancedMarker
                key={loc.id}
                position={{ lat: loc.latitude, lng: loc.longitude }}
                zIndex={isHighlighted ? 2000 : 1000}
              >
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {isHighlighted && (
                        <div className="absolute top-[-50px] px-3 py-1.5 bg-card/90 backdrop-blur-md rounded-xl shadow-xl border border-border/50 flex flex-col items-center min-w-max">
                            <span className="font-bold text-xs text-landing-primary">{loc.name}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: crowdColor }}></div>
                                <span className="text-[9px] text-muted-foreground font-semibold uppercase">{crowdStatus} Crowd</span>
                            </div>
                            <div className="w-2 h-2 bg-card/90 border-r border-b border-border/50 rotate-45 absolute -bottom-1"></div>
                        </div>
                    )}
                    <div style={{
                        background: isHighlighted ? 'white' : baseColor,
                        width: isStart || isEnd ? '36px' : '32px',
                        height: isStart || isEnd ? '36px' : '32px',
                        borderRadius: '50%',
                        border: `3px solid ${isHighlighted ? baseColor : 'white'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isHighlighted ? baseColor : 'white',
                        fontWeight: 800,
                        fontSize: isStart || isEnd ? '14px' : '13px',
                        boxShadow: isHighlighted ? '0 0 25px rgba(212,175,55,0.9)' : '0 4px 12px rgba(0,0,0,0.4)',
                        zIndex: 10,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isHighlighted ? 'scale(1.2)' : 'scale(1)'
                    }}>
                        {loc.sequence}
                    </div>
                    
                    {isStart && (
                        <div style={{ position: 'absolute', bottom: '-22px', fontWeight: 800, color: 'white', fontSize: '10px', background: '#0f3c6e', padding: '2px 8px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(15,60,110,0.3)', zIndex: 5, whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>START</div>
                    )}
                    {isEnd && (
                        <div style={{ position: 'absolute', bottom: '-22px', fontWeight: 800, color: 'white', fontSize: '10px', background: '#D4AF37', padding: '2px 8px', borderRadius: '20px', boxShadow: '0 2px 8px rgba(212,175,55,0.3)', zIndex: 5, whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>END</div>
                    )}
                </div>
              </AdvancedMarker>
            );
          })}
        </Map>
    </div>
  );
}
