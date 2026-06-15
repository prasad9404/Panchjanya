import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { YatraLocation } from './YatraMap';
import { Geolocation } from '@capacitor/geolocation';
import { useLanguage } from '@/shared/contexts/LanguageContext';
import { useYatraStore } from '@/store/useYatraStore';
import { fetchRoute } from '@/shared/services/routeService';
import { locationsToGeoJSON } from '@/shared/utils/clusterHelper';
import * as turfImport from '@turf/turf';
const turf = turfImport as any;

interface YatraMapProps {
  locations: YatraLocation[];
  highlightedId?: string;
  centerOnFullRoute?: number;
  forceFocus?: number;
  langCode?: string;
  onMarkerClick?: (id: string) => void;
  isMobileSheetOpen?: boolean;
}

export default function YatraMapMapLibre({ locations, highlightedId, centerOnFullRoute, forceFocus, langCode = 'en', onMarkerClick, isMobileSheetOpen }: YatraMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const { language } = useLanguage();
  const [mapLoaded, setMapLoaded] = useState(false);
  const { setCurrentRouteData, currentRouteData, setSelectedRoute, currentIndex, setIsAnimating } = useYatraStore();
  const lastIndexRef = useRef(currentIndex);
  const activeMarkerRef = useRef<maplibregl.Marker | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize MapLibre
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty', // OpenFreeMap Liberty style
      center: [82.9739, 25.3176],
      zoom: 5,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
    });

    // Add standard controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: false }), 'bottom-right');


    // Only initialize terrain on load, removed from style.load because we will do it below
    map.on('load', () => {
      setMapLoaded(true);

      // Add route sources and layers
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }
      });

      // Background line
      map.addLayer({
        id: 'route-line-bg',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#0f3c6e', // Faint solid blue background line
          'line-width': 3,
          'line-opacity': 0.15
        }
      });

      // Active glow layer source
      map.addSource('route-active', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }
      });

      // Active Glow layer (Underneath active line)
      map.addLayer({
        id: 'route-glow-active',
        type: 'line',
        source: 'route-active',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#d97706', // amber-600 glow
          'line-width': 8,
          'line-opacity': 0.3,
          'line-blur': 4
        }
      });

      // Active Main line
      map.addLayer({
        id: 'route-line-active',
        type: 'line',
        source: 'route-active',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#d97706', // amber-600
          'line-width': 2.5,
          'line-dasharray': [4, 5]
        }
      });
      
      // Direction Arrows on Active Line
      map.addLayer({
        id: 'route-arrows-active',
        type: 'symbol',
        source: 'route-active',
        layout: {
          'symbol-placement': 'line',
          'text-field': '>', // Using standard ASCII '>' chevron to guarantee glyph rendering
          'text-size': 16,
          'symbol-spacing': 35,
          'text-keep-upright': false
        },
        paint: {
          'text-color': '#d97706' // amber-600
        }
      });
      // Add 3D Terrain Source (AWS Terrain)
      map.addSource('terrain', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 14
      });
      map.setTerrain({ source: 'terrain', exaggeration: 1.5 });

      // Theme overriding programmatically for Google Maps UX Look
      const style = map.getStyle();
      if (style && style.layers) {
        style.layers.forEach((layer: any) => {
          const id = layer.id.toLowerCase();
          
          // Background
          if (id === 'background') {
             map.setPaintProperty(layer.id, 'background-color', '#f4efe3'); // Requested Off-white background
          }
          // Water
          else if (id.includes('water') || ['river', 'stream', 'sea', 'ocean', 'lake'].some(w => id.includes(w))) {
             if (layer.type === 'fill') map.setPaintProperty(layer.id, 'fill-color', '#8aa4be');
             if (layer.type === 'line') map.setPaintProperty(layer.id, 'line-color', '#8aa4be');
          }
          // Vegetation and Urban/Landuse
          else if (
              ['wood', 'forest', 'park', 'grass', 'pitch', 'landuse', 'residential', 'commercial', 'industrial', 'cemetery', 'hospital', 'school', 'college', 'university', 'urban', 'village', 'farmland', 'landcover', 'agriculture', 'meadow', 'scrub', 'heath', 'nature', 'recreation', 'golf', 'garden', 'greenfield', 'orchard'].some(w => id.includes(w))
          ) {
             if (layer.type === 'fill') map.setPaintProperty(layer.id, 'fill-color', '#d3f7e1');
          }
          // Buildings
          else if (id.includes('building')) {
             if (layer.type === 'fill') map.setPaintProperty(layer.id, 'fill-color', '#F3F3F3');
             if (layer.type === 'fill-extrusion') {
                 map.setPaintProperty(layer.id, 'fill-extrusion-color', '#F3F3F3');
                 map.setPaintProperty(layer.id, 'fill-extrusion-opacity', 0.9);
             }
          }
          // Roads
          else if (id.includes('road') || id.includes('highway') || id.includes('tunnel') || id.includes('bridge')) {
             if (layer.type === 'line') {
                 // If it's a casing (border)
                 if (id.includes('casing')) {
                     map.setPaintProperty(layer.id, 'line-color', '#e8eaed');
                 } else {
                     map.setPaintProperty(layer.id, 'line-color', '#FFFFFF');
                 }
             }
          }
          
          // Hide Map Clutter (Road Numbers, Shields)
          if (id.includes('shield') || id.includes('ref') || id.includes('highway_name') || id.includes('road_label')) {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
          }
          // Labels Color Overrides
          else if (layer.type === 'symbol') {
             if (layer.paint && layer.paint['text-color']) {
                 if (id.includes('place') || id.includes('city') || id.includes('town') || id.includes('poi')) {
                     map.setPaintProperty(layer.id, 'text-color', '#202124');
                 }
             }
          }
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Labels when langCode changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const style = map.getStyle();
    if (!style || !style.layers) return;

    const getLangExpression = (baseProp: string) => {
      if (langCode === 'mr') {
         return ['coalesce', ['get', `${baseProp}:mr`], ['get', `${baseProp}:hi`], ['get', `${baseProp}:en`], ['get', baseProp]];
      } else if (langCode === 'hi') {
         return ['coalesce', ['get', `${baseProp}:hi`], ['get', `${baseProp}:en`], ['get', baseProp]];
      }
      return ['coalesce', ['get', `${baseProp}:en`], ['get', baseProp]];
    };

    style.layers.forEach((layer: any) => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
         // Some layers like arrows shouldn't be touched, typically name layers check for "name"
         // To be safe, we apply it to layers that previously used "name_en" or "name"
         map.setLayoutProperty(layer.id, 'text-field', getLangExpression('name'));
      }
    });
  }, [langCode, mapLoaded]);

  // Update Route geometry via ORS
  useEffect(() => {
    const getRoute = async () => {
      const route = await fetchRoute(locations, userLocation);
      if (route && mapRef.current && mapLoaded) {
        setCurrentRouteData(route);
        const source = mapRef.current.getSource('route') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates
            }
          });
        }
      }
    };
    getRoute();
  }, [locations, userLocation, mapLoaded, setCurrentRouteData]);

  // Calculate distances of locations along the route
  const locationDistances = useMemo(() => {
    if (!currentRouteData || !locations.length || !currentRouteData.coordinates) return [];
    const validCoords = currentRouteData.coordinates.filter((c: any) => Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1]));
    if (validCoords.length < 2) return [];
    
    try {
      const line = turf.lineString(validCoords as [number, number][]);
      let lastDist = 0;
      return locations.map(loc => {
        try {
          const pt = turf.point([loc.longitude, loc.latitude]);
          const snapped = turf.nearestPointOnLine(line, pt);
          const sliced = turf.lineSlice(turf.point(validCoords[0] as [number, number]), snapped, line);
          let dist = turf.length(sliced);
          if (dist < lastDist || isNaN(dist)) dist = lastDist; // enforce monotonicity
          lastDist = dist;
          return dist;
        } catch (e) {
          return lastDist;
        }
      });
    } catch (e) {
      console.error("Error creating lineString for distances:", e);
      return [];
    }
  }, [currentRouteData, locations]);

  // Viewport-aware fit bounds function that centers active route segment (source & destination pins)
  const fitActiveSegment = useCallback((index: number, duration = 1500) => {
    const map = mapRef.current;
    if (!map || !mapLoaded || locations.length === 0) return;

    const isDesktop = window.innerWidth >= 1024;
    const isMobile = window.innerWidth < 768;

    // Viewport paddings to avoid overlapping overlay elements
    const padding = {
      top: isMobile ? 140 : 110, // Mobile top header safe offset
      bottom: isMobile ? 310 : 100, // Mobile bottom sheet safe offset
      left: isDesktop ? 460 : 60, // Desktop left panel safe offset
      right: 60
    };

    if (locations.length >= 2) {
      const p1 = locations[index];
      // Neighboring pin: use previous pin, or next pin if at the start (index 0)
      const p2 = locations[index - 1] || locations[index + 1];

      if (p1 && p2) {
        let boundsCoords = [
          [p1.longitude, p1.latitude],
          [p2.longitude, p2.latitude]
        ];

        // Slicing actual route if possible to include curved path in bounds
        if (currentRouteData?.coordinates && locationDistances.length > 0) {
          const d1 = locationDistances[index];
          const d2 = locationDistances[index - 1] !== undefined ? locationDistances[index - 1] : locationDistances[index + 1];
          if (d1 !== undefined && d2 !== undefined) {
            try {
              const validCoords = currentRouteData.coordinates.filter((c: any) => Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1]));
              if (validCoords.length >= 2) {
                const line = turf.lineString(validCoords as [number, number][]);
                const segment = turf.lineSliceAlong(line, Math.min(d1, d2), Math.max(d1, d2));
                boundsCoords = segment.geometry.coordinates;
              }
            } catch (e) {
              console.warn("Failed to slice route for bounds:", e);
            }
          }
        }

        try {
          const geojson = turf.featureCollection(boundsCoords.map(c => turf.point(c)));
          const bbox = turf.bbox(geojson) as [number, number, number, number];
          map.fitBounds(bbox, {
            padding,
            duration,
            essential: true,
            maxZoom: 15
          });
          return;
        } catch (e) {
          console.error("Error fitting bounds:", e);
        }
      }
    }

    // Fallback: zoom to single pin with correct padding
    const loc = locations[index];
    if (loc) {
      map.flyTo({
        center: [loc.longitude, loc.latitude],
        zoom: 15,
        padding,
        duration,
        essential: true
      });
    }
  }, [mapLoaded, locations, currentRouteData, locationDistances]);

  // Active marker element
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    if (!activeMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'relative flex items-center justify-center w-6 h-6 z-[60]';
        el.innerHTML = `
          <div class="absolute inset-0 rounded-full bg-[#d97706] animate-ping opacity-75"></div>
          <div class="relative w-4 h-4 bg-white rounded-full border-[3px] border-[#d97706] shadow-[0_0_15px_rgba(217,119,6,0.8)]"></div>
        `;
        activeMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([0, 0]);
    }
  }, [mapLoaded]);

  // Route Animation logic
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !currentRouteData || locationDistances.length === 0 || !activeMarkerRef.current) return;
    
    const sourceActive = map.getSource('route-active') as maplibregl.GeoJSONSource;
    if (!sourceActive) return;

    const validCoords = currentRouteData.coordinates.filter((c: any) => Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1]));
    if (validCoords.length < 2) return;

    let line: any;
    try {
        line = turf.lineString(validCoords as [number, number][]);
    } catch (e) {
        console.error("Error creating route lineString:", e);
        return;
    }
    
    // Initial load, route change jump, or jumping multiple places
    if (lastIndexRef.current === currentIndex || Math.abs(lastIndexRef.current - currentIndex) > 1 || locationDistances[lastIndexRef.current] === undefined) {
      const dist = locationDistances[currentIndex] || 0;
      if (dist > 0) {
        try {
          const activeLine = turf.lineSliceAlong(line, 0, dist);
          sourceActive.setData(activeLine);
          const pt = turf.along(line, dist);
          activeMarkerRef.current.setLngLat(pt.geometry.coordinates as [number, number]).addTo(map);
        } catch (e) {
          console.error("Error drawing active line:", e);
        }
      } else {
        sourceActive.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
        const startCoord = validCoords[0] as [number, number];
        activeMarkerRef.current.setLngLat(startCoord || [locations[0].longitude, locations[0].latitude]).addTo(map);
      }
      lastIndexRef.current = currentIndex;
      setIsAnimating(false);
      return;
    }

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    const startDist = locationDistances[lastIndexRef.current] || 0;
    const endDist = locationDistances[currentIndex] || 0;
    
    if (startDist !== endDist) {
        fitActiveSegment(currentIndex, 1500);
    }

    const duration = 1500; // 1.5 seconds animation
    const startTime = performance.now();
    
    setIsAnimating(true);
    
    const animate = (currentTime: number) => {
        let progress = (currentTime - startTime) / duration;
        if (progress > 1) progress = 1;
        
        // easeInOutCubic
        const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        const currentDist = startDist + (endDist - startDist) * ease;
        
        // Update line
        if (currentDist > 0) {
            try {
                const activeLine = turf.lineSliceAlong(line, 0, currentDist);
                sourceActive.setData(activeLine);
            } catch (e) {
                // Silent fallback
            }
        } else {
            sourceActive.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
        }
        
        // Update active marker
        try {
            const pt = turf.along(line, currentDist);
            const coords = pt.geometry.coordinates as [number, number];
            activeMarkerRef.current?.setLngLat(coords).addTo(map);
        } catch (e) {
            // Silent fallback
        }
        
        if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
        } else {
            setIsAnimating(false);
            lastIndexRef.current = currentIndex;
            animationRef.current = null;
        }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentIndex, currentRouteData, locationDistances, mapLoaded, setIsAnimating, locations]);

  // Manage all markers without clustering
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const newMarkersRef: { [id: string]: maplibregl.Marker } = {};

    locations.forEach(loc => {
      const markerId = `marker_${loc.id}`;
      const isHighlighted = loc.id === highlightedId;
      let marker = markersRef.current[markerId];

      if (!marker) {
          const el = document.createElement('div');
          el.className = 'custom-yatra-marker cursor-pointer relative';
          el.style.width = '48px';
          el.style.height = '48px';
          
          const inner = document.createElement('div');
          inner.className = 'marker-inner w-full h-full relative';
          inner.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          inner.style.transformOrigin = 'bottom center';
          
          const img = document.createElement('img');
          img.src = '/icons/pins/5 Shri_Chakradhar_Swami_Pin/Shri_Chakradhar_Swami_Pin.svg';
          img.className = 'w-full h-full block transition-all drop-shadow-md';
          
          const seqDiv = document.createElement('div');
          seqDiv.className = 'absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-bold text-[#0f3c6e] pointer-events-none';
          seqDiv.style.textShadow = '0 0 3px white, 0 0 3px white, 0 0 3px white';
          seqDiv.style.fontSize = String(loc.sequence).length > 2 ? '9px' : '11px';
          seqDiv.textContent = String(loc.sequence);
          
          inner.appendChild(img);
          inner.appendChild(seqDiv);

          // Name Tag on Highlight
          const badge = document.createElement('div');
          badge.className = 'marker-badge absolute bottom-[52px] left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded-lg shadow-lg border border-slate-200 text-xs font-bold whitespace-nowrap z-50 transition-opacity';
          badge.style.color = '#1E3A8A';
          badge.textContent = loc.name;
          badge.style.opacity = '0';
          badge.style.pointerEvents = 'none';
          inner.appendChild(badge);
          
          el.appendChild(inner);

          const handleClick = (e: Event) => {
             e.stopPropagation();
             if (onMarkerClick) onMarkerClick(loc.id);
          };
          el.addEventListener('click', handleClick);
          el.addEventListener('touchend', handleClick);

          marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([loc.longitude, loc.latitude])
            .addTo(map);
      }

      // Update highlight state for existing or new marker
      const inner = marker.getElement().querySelector('.marker-inner') as HTMLElement;
      if (inner) {
          inner.style.transform = `scale(${isHighlighted ? 1.25 : 1})`;
      }
      
      const el = marker.getElement();
      el.style.zIndex = isHighlighted ? '50' : '1';
      
      const img = el.querySelector('img');
      if (img) {
          img.style.filter = isHighlighted ? 'drop-shadow(0 0 10px rgba(217, 119, 6, 0.8))' : 'none';
      }

      const badge = el.querySelector('.marker-badge') as HTMLElement;
      if (badge) {
         badge.style.opacity = isHighlighted ? '1' : '0';
      }

      newMarkersRef[markerId] = marker;
    });

    // Remove old markers not in current view
    Object.keys(markersRef.current).forEach(id => {
      if (!newMarkersRef[id]) {
        markersRef.current[id].remove();
      }
    });

    markersRef.current = newMarkersRef;

  }, [locations, mapLoaded, highlightedId]);

  // Track user location natively
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

  // Sync user marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !userLocation) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'w-5 h-5 bg-[#d97706] rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-50 animate-pulse';
      userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
  }, [userLocation, mapLoaded]);

  // Focus and Center controls
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (forceFocus && userLocation) {
      map.flyTo({ 
        center: [userLocation.lng, userLocation.lat], 
        zoom: 16, 
        duration: 2000,
        essential: true
      });
      return;
    }

    if (centerOnFullRoute && locations.length > 0) {
      const geojson = turf.featureCollection(locationsToGeoJSON(locations));
      const bbox = turf.bbox(geojson) as [number, number, number, number];
      
      if (bbox) {
          const leftPadding = window.innerWidth >= 1024 ? 460 : 80;
          map.fitBounds(bbox, { padding: { top: 80, bottom: 80, left: leftPadding, right: 80 }, duration: 2500 });
      }
      return;
    }

    if (highlightedId && !animationRef.current) {
      const idx = locations.findIndex(l => l.id === highlightedId);
      if (idx !== -1) {
        fitActiveSegment(idx, 2000);
      }
    }
  }, [mapLoaded, highlightedId, centerOnFullRoute, forceFocus, userLocation, locations, fitActiveSegment]);

  // Handle window resize to re-center bounds correctly
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const handleResize = () => {
      if (highlightedId) {
        const idx = locations.findIndex(l => l.id === highlightedId);
        if (idx !== -1) {
          fitActiveSegment(idx, 500); // quick transition on resize
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mapLoaded, highlightedId, locations, fitActiveSegment]);

  return (
    <div className="w-full h-full relative z-0 bg-[#faf8f2]">
      <style>{`
        .maplibregl-ctrl-bottom-right {
          bottom: ${isMobileSheetOpen ? '320px' : '100px'} !important;
          right: 16px !important;
          transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (min-width: 768px) {
          .maplibregl-ctrl-bottom-right {
            bottom: 30px !important;
          }
        }
      `}</style>
      <div ref={mapContainer} className="w-full h-full outline-none" />
    </div>
  );
}
