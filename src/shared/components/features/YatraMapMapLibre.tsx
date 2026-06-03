import { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { YatraLocation } from './YatraMap';
import { Geolocation } from '@capacitor/geolocation';
import { useLanguage } from '@/shared/contexts/LanguageContext';

interface YatraMapProps {
  locations: YatraLocation[];
  highlightedId?: string;
  centerOnFullRoute?: number;
  forceFocus?: number;
}

export default function YatraMapMapLibre({ locations, highlightedId, centerOnFullRoute, forceFocus }: YatraMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const { language } = useLanguage();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [maptilerStyle, setMaptilerStyle] = useState<any>(null);

  // Fetch and customize MapTiler style
  useEffect(() => {
    fetch('https://api.maptiler.com/maps/streets-v4/style.json?key=OPcGOLHMRYAQgK1qMHaP')
      .then(res => res.json())
      .then(data => {
        const creamBackground = '#faf8f2';
        const roadGold = '#d4af37';
        const textDark = '#2d3748';
        const waterColor = '#cbe3f0';

        data.layers.forEach((layer: any) => {
          if (layer.id === 'Background') {
            layer.paint = layer.paint || {};
            layer.paint['background-color'] = creamBackground;
          }
          if (layer.id.toLowerCase().includes('water') || ['River', 'Stream', 'Sea', 'Ocean', 'Lake'].some(w => layer.id.includes(w))) {
            if (layer.paint) {
              if (layer.paint['fill-color']) layer.paint['fill-color'] = waterColor;
              if (layer.paint['line-color']) layer.paint['line-color'] = waterColor;
            }
          }
          if (layer.type === 'symbol' && layer.paint && layer.paint['text-color']) {
            layer.paint['text-color'] = textDark;
          }
          // Remove unwanted POIs/clutter
          const unwantedLayers = [
            'shopping', 'food', 'tourism', 'transport', 'bus stop', 'parking',
            'parking space special', 'parking special', 'commercial', 'industrial',
            'hospital', 'school', 'public', 'subway station', 'railway station',
            'aerialway station'
          ];
          if (unwantedLayers.some(ul => layer.id.toLowerCase().includes(ul))) {
            layer.layout = { ...layer.layout, visibility: 'none' };
          }
        });

        setMaptilerStyle(data);
      })
      .catch(err => {
        console.error("Error fetching MapTiler style:", err);
      });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!maptilerStyle || mapRef.current || !mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: maptilerStyle,
      center: [82.9739, 25.3176],
      zoom: 5,
      attributionControl: false,
    });

    map.on('load', () => {
      setMapLoaded(true);

      // Add route source and layer
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }
      });

      // Glow layer
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#d4af37', // Golden glow accent
          'line-width': 12,
          'line-opacity': 0.4,
          'line-blur': 6
        }
      });

      // Main line
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0f3c6e', // Royal blue main path highlight
          'line-width': 4,
        }
      });

      // Direction Arrows
      map.addLayer({
        id: 'route-arrows',
        type: 'symbol',
        source: 'route',
        layout: {
          'symbol-placement': 'line',
          'text-field': '▶',
          'text-size': 18,
          'symbol-spacing': 80,
          'text-keep-upright': false,
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: {
          'text-color': '#d4af37', // Gold accent
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5
        }
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [maptilerStyle]);

  // Multilingual labels
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    // Ensure the map style is fully loaded
    const style = map.getStyle();
    if (!style || !style.layers) return;

    // Build regional-fallback coalesce expression
    // Order: requested language -> native/primary local name (usually Marathi/Hindi in regional areas) -> English
    let textFieldExpression: any;
    if (language === 'marathi') {
      textFieldExpression = ["coalesce", ["get", "name:mr"], ["get", "name"], ["get", "name:en"]];
    } else if (language === 'hindi') {
      textFieldExpression = ["coalesce", ["get", "name:hi"], ["get", "name"], ["get", "name:en"]];
    } else {
      textFieldExpression = ["coalesce", ["get", "name:en"], ["get", "name"]];
    }

    console.log(`[YatraMapMapLibre] Applying language expression for: ${language}`);

    style.layers.forEach((layer) => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
        const textFieldStr = JSON.stringify(layer.layout['text-field']);
        // If it references "name" in any way (template "{name}" or expression ["get", "name"])
        const isNameField = textFieldStr.toLowerCase().includes('name') || textFieldStr.toLowerCase().includes('{name}');

        if (isNameField) {
          try {
            map.setLayoutProperty(layer.id, 'text-field', textFieldExpression);
          } catch (e) {
            console.warn(`[YatraMapMapLibre] Failed to set layout property for layer ${layer.id}:`, e);
          }
        }
      }
    });
  }, [language, mapLoaded]);

  // Track user location
  useEffect(() => {
    let watchId: string;
    const startTracking = async () => {
      try {
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
      } catch (e) {
        console.log("Geolocation error", e);
      }
    };
    startTracking();

    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    }
  }, []);

  // Map Controls (Focus, Route, User Location)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (forceFocus && userLocation) {
      map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 16 });
      return;
    }

    if (locations.length === 0) return;

    if (centerOnFullRoute) {
      const bounds = new maplibregl.LngLatBounds();
      locations.forEach(loc => bounds.extend([loc.longitude, loc.latitude]));
      if (userLocation) bounds.extend([userLocation.lng, userLocation.lat]);
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 80, duration: 1000 });
      }
      return;
    }

    if (highlightedId) {
      const loc = locations.find(l => l.id === highlightedId);
      if (loc) {
        map.flyTo({ center: [loc.longitude, loc.latitude], zoom: 15, duration: 1500 });
      }
    }
  }, [mapLoaded, locations, highlightedId, centerOnFullRoute, forceFocus, userLocation]);

  // Handle Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    locations.forEach((loc, idx) => {
      const isStart = idx === 0;
      const isEnd = idx === locations.length - 1;
      const isHighlighted = loc.id === highlightedId;
      const landingPrimary = '#0f3c6e';
      const goldAccent = '#D4AF37';
      const baseColor = isEnd ? goldAccent : landingPrimary;

      const el = document.createElement('div');
      el.className = 'custom-yatra-marker';
      el.style.width = '0px';
      el.style.height = '0px';
      el.style.position = 'relative';

      const width = 48;
      const height = 48;

      // Inner container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.transform = `translate(-50%, -100%) scale(${isHighlighted ? 1.25 : 1})`;
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      container.style.justifyContent = 'center';
      container.style.pointerEvents = 'none';
      container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

      // Highlight place name tooltip
      if (isHighlighted) {
        const badge = document.createElement('div');
        badge.className = 'absolute bottom-[52px] left-1/2 -translate-x-1/2 px-3 py-1.5 bg-card/90 backdrop-blur-md rounded-xl shadow-xl border border-border/50 flex flex-col items-center min-w-max';
        badge.style.transform = 'translateX(-50%)';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-bold text-xs text-landing-primary';
        nameSpan.textContent = loc.name;
        badge.appendChild(nameSpan);

        const arrow = document.createElement('div');
        arrow.className = 'w-2 h-2 bg-card/90 border-r border-b border-border/50 rotate-45 absolute -bottom-1';
        badge.appendChild(arrow);

        container.appendChild(badge);
      }

      // Interactive Pin Wrapper
      const pinWrapper = document.createElement('div');
      pinWrapper.style.position = 'relative';
      pinWrapper.style.width = `${width}px`;
      pinWrapper.style.height = `${height}px`;
      pinWrapper.style.pointerEvents = 'auto';
      pinWrapper.style.cursor = 'pointer';

      // Custom Image Pin loading Shri_Chakradhar_Swami_Pin.svg
      const img = document.createElement('img');
      img.src = '/icons/pins/5 Shri_Chakradhar_Swami_Pin/Shri_Chakradhar_Swami_Pin.svg';
      img.style.width = `${width}px`;
      img.style.height = `${height}px`;
      img.style.display = 'block';
      img.style.filter = `drop-shadow(0px 3px 5px rgba(15, 60, 110, 0.15)) ${isHighlighted ? `drop-shadow(0 0 8px rgba(15, 60, 110, 0.4))` : ''}`;
      img.style.transition = 'all 0.3s ease';
      pinWrapper.appendChild(img);

      // Sequence Text Overlay centered in the pin
      const seqDiv = document.createElement('div');
      seqDiv.style.position = 'absolute';
      seqDiv.style.top = '40%';
      seqDiv.style.left = '50%';
      seqDiv.style.transform = 'translate(-50%, -50%)';
      seqDiv.style.width = '24px';
      seqDiv.style.height = '24px';
      seqDiv.style.display = 'flex';
      seqDiv.style.alignItems = 'center';
      seqDiv.style.justifyContent = 'center';
      seqDiv.style.color = '#0f3c6e'; // Theme primary dark blue
      seqDiv.style.fontWeight = '800';
      seqDiv.style.textShadow = '0 0 3px #ffffff, 0 0 3px #ffffff, 0 0 3px #ffffff';
      seqDiv.style.zIndex = '10';
      seqDiv.style.pointerEvents = 'none';

      const seqLength = String(loc.sequence).length;
      seqDiv.style.fontSize = seqLength > 2 ? '9px' : seqLength > 1 ? '11px' : '12px';
      seqDiv.textContent = String(loc.sequence);

      pinWrapper.appendChild(seqDiv);
      container.appendChild(pinWrapper);

      // START / END badge below the pin tip
      if (isStart || isEnd) {
        const badge = document.createElement('div');
        badge.style.position = 'absolute';
        badge.style.top = '50px';
        badge.style.fontWeight = '800';
        badge.style.color = 'white';
        badge.style.fontSize = '10px';
        badge.style.background = isEnd ? '#D4AF37' : '#0f3c6e';
        badge.style.padding = '2px 8px';
        badge.style.borderRadius = '20px';
        badge.style.boxShadow = isEnd ? '0 2px 8px rgba(212,175,55,0.3)' : '0 2px 8px rgba(15,60,110,0.3)';
        badge.style.zIndex = '5';
        badge.style.whiteSpace = 'nowrap';
        badge.style.letterSpacing = '0.5px';
        badge.style.left = '50%';
        badge.style.transform = 'translateX(-50%)';
        badge.textContent = isEnd ? 'END' : 'START';

        container.appendChild(badge);
      }

      el.appendChild(container);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([loc.longitude, loc.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [locations, highlightedId, mapLoaded]);

  // Handle User Location Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !userLocation) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation, mapLoaded]);

  // Direct Routing (Straight line between locations)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || locations.length < 2) return;

    const sorted = [...locations].sort((a, b) => a.sequence - b.sequence);
    const coords: [number, number][] = sorted.map(l => [l.longitude, l.latitude]);
    if (userLocation) {
      coords.unshift([userLocation.lng, userLocation.lat]);
    }

    const routeGeoJSON = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coords
      }
    };

    if (map.getSource('route')) {
      (map.getSource('route') as maplibregl.GeoJSONSource).setData(routeGeoJSON as any);
    }
  }, [locations, userLocation, mapLoaded]);

  return (
    <div className="w-full h-full relative z-0 bg-[#faf8f2]">
      <style>
        {`
          @keyframes pulse-glow {
            0% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
            70% { transform: scale(1.1); opacity: 0; box-shadow: 0 0 0 20px rgba(212, 175, 55, 0); }
            100% { transform: scale(1); opacity: 0; box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
          }
          .user-location-marker {
            width: 20px;
            height: 20px;
            background: #D4AF37;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            animation: pulse-glow 2s infinite;
          }
        `}
      </style>
      <div ref={mapContainer} className="w-full h-full outline-none" />
    </div>
  );
}
