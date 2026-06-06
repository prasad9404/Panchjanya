import { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { YatraLocation } from './YatraMap';
import { Geolocation } from '@capacitor/geolocation';
import { useLanguage } from '@/shared/contexts/LanguageContext';
import { useYatraStore } from '@/store/useYatraStore';
import { fetchRoute } from '@/shared/services/routeService';
import { createSupercluster, locationsToGeoJSON, YatraFeature } from '@/shared/utils/clusterHelper';
import * as turf from '@turf/turf';

interface YatraMapProps {
  locations: YatraLocation[];
  highlightedId?: string;
  centerOnFullRoute?: number;
  forceFocus?: number;
  langCode?: string;
}

export default function YatraMapMapLibre({ locations, highlightedId, centerOnFullRoute, forceFocus, langCode = 'en' }: YatraMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const { language } = useLanguage();
  const [mapLoaded, setMapLoaded] = useState(false);
  const { setCurrentRouteData, currentRouteData, setSelectedRoute } = useYatraStore();

  const supercluster = useMemo(() => createSupercluster(), []);

  // Initialize MapLibre
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty', // OpenFreeMap Liberty style
      center: [82.9739, 25.3176],
      zoom: 5,
      attributionControl: false,
    });

    // Add standard controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true
    }), 'top-right');

    // Only initialize terrain on load, removed from style.load because we will do it below
    map.on('load', () => {
      setMapLoaded(true);

      // Add route sources and layers
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
          'line-color': '#FF9933', // Saffron glow
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
          'line-color': '#1E3A8A', // Deep Blue path
          'line-width': 5,
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
          'text-size': 20,
          'symbol-spacing': 100,
          'text-keep-upright': false
        },
        paint: {
          'text-color': '#FF9933', // Saffron arrows
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
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
             map.setPaintProperty(layer.id, 'background-color', '#E5F0D9'); // Light Google Maps Green
          }
          // Water
          else if (id.includes('water') || ['river', 'stream', 'sea', 'ocean', 'lake'].some(w => id.includes(w))) {
             if (layer.type === 'fill') map.setPaintProperty(layer.id, 'fill-color', '#A7D8FF');
             if (layer.type === 'line') map.setPaintProperty(layer.id, 'line-color', '#A7D8FF');
          }
          // Forest/Wood
          else if (id.includes('wood') || id.includes('forest')) {
             if (layer.type === 'fill') map.setPaintProperty(layer.id, 'fill-color', '#D8F0D0');
          }
          // Park/Grass/Pitch
          else if (id.includes('park') || id.includes('grass') || id.includes('pitch')) {
             if (layer.type === 'fill') map.setPaintProperty(layer.id, 'fill-color', '#CFECC7');
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
                     map.setPaintProperty(layer.id, 'line-color', '#DADCE0');
                 } else {
                     map.setPaintProperty(layer.id, 'line-color', '#FFFFFF');
                 }
             }
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
      let primaryLang = ['coalesce', ['get', `${baseProp}:en`], ['get', baseProp]];
      if (langCode === 'mr') {
         primaryLang = ['coalesce', ['get', `${baseProp}:mr`], ['get', `${baseProp}:hi`], ['get', `${baseProp}:en`], ['get', baseProp]];
      } else if (langCode === 'hi') {
         primaryLang = ['coalesce', ['get', `${baseProp}:hi`], ['get', `${baseProp}:en`], ['get', baseProp]];
      }

      if (langCode === 'en') return primaryLang;

      // For Marathi/Hindi, show Dual Language (Primary \n English)
      return [
        'case',
        ['all', ['has', `${baseProp}:en`], ['!=', primaryLang, ['get', `${baseProp}:en`]]],
        ['concat', primaryLang, '\n', ['get', `${baseProp}:en`]],
        primaryLang
      ];
    };

    style.layers.forEach((layer: any) => {
      if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
         // Some layers like arrows shouldn't be touched, typically name layers check for "name"
         // To be safe, we apply it to layers that previously used "name_en" or "name"
         map.setLayoutProperty(layer.id, 'text-field', getLangExpression('name'));
      }
    });
  }, [langCode, mapLoaded]);

  // Update Route geometry via ORS with Animation
  useEffect(() => {
    const getRoute = async () => {
      const route = await fetchRoute(locations, userLocation);
      if (route && mapRef.current && mapLoaded) {
        setCurrentRouteData(route);
        const source = mapRef.current.getSource('route') as maplibregl.GeoJSONSource;
        if (source) {
          // Animate route drawing
          const totalPoints = route.coordinates.length;
          let currentPoint = 0;
          
          const animateLine = () => {
            if (currentPoint < totalPoints) {
              const currentCoords = route.coordinates.slice(0, currentPoint + 1);
              source.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: currentCoords
                }
              });
              currentPoint += Math.max(1, Math.floor(totalPoints / 60)); // 60 frames roughly
              requestAnimationFrame(animateLine);
            } else {
              // Ensure final coordinates are perfectly set
              source.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: route.coordinates
                }
              });
            }
          };
          
          // Clear line first
          source.setData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
          requestAnimationFrame(animateLine);
        }
      }
    };
    getRoute();
  }, [locations, userLocation, mapLoaded, setCurrentRouteData]);

  // Load supercluster data
  useEffect(() => {
    supercluster.load(locationsToGeoJSON(locations));
    updateClusters();
  }, [locations, supercluster]);

  const updateClusters = () => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;
    const bounds = map.getBounds();
    const zoom = Math.round(map.getZoom());
    
    const bbox: [number, number, number, number] = [
      bounds.getWest(), bounds.getSouth(),
      bounds.getEast(), bounds.getNorth()
    ];

    const clusters = supercluster.getClusters(bbox, zoom);

    const newMarkersRef: { [id: string]: maplibregl.Marker } = {};

    clusters.forEach(cluster => {
      const isCluster = cluster.properties && 'cluster' in cluster.properties && cluster.properties.cluster;
      const coords = cluster.geometry.coordinates;
      const clusterId = isCluster ? `cluster_${cluster.properties.cluster_id}` : `marker_${(cluster.properties as YatraLocation).id}`;

      let marker = markersRef.current[clusterId];

      if (!marker) {
        const el = document.createElement('div');
        
        if (isCluster) {
          const props = cluster.properties as any;
          el.className = 'w-10 h-10 bg-landing-primary rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white/50 cursor-pointer transition-transform hover:scale-110';
          el.style.backgroundColor = '#1E3A8A'; // Deep blue
          el.textContent = props.point_count_abbreviated;
          
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const expansionZoom = supercluster.getClusterExpansionZoom(props.cluster_id);
            map.flyTo({
              center: [coords[0], coords[1]],
              zoom: expansionZoom
            });
          });
        } else {
          const loc = cluster.properties as YatraLocation;
          const isHighlighted = loc.id === highlightedId;
          
          el.className = 'custom-yatra-marker cursor-pointer relative';
          el.style.width = '48px';
          el.style.height = '48px';
          el.style.transform = `scale(${isHighlighted ? 1.25 : 1})`;
          el.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          
          // Custom Pin Image
          const img = document.createElement('img');
          img.src = '/icons/pins/5 Shri_Chakradhar_Swami_Pin/Shri_Chakradhar_Swami_Pin.svg';
          img.className = 'w-full h-full block transition-all drop-shadow-md';
          if (isHighlighted) img.style.filter = 'drop-shadow(0 0 10px rgba(255, 153, 51, 0.8))';
          
          const seqDiv = document.createElement('div');
          seqDiv.className = 'absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-bold text-[#0f3c6e] pointer-events-none';
          seqDiv.style.textShadow = '0 0 3px white, 0 0 3px white, 0 0 3px white';
          seqDiv.style.fontSize = String(loc.sequence).length > 2 ? '9px' : '11px';
          seqDiv.textContent = String(loc.sequence);
          
          el.appendChild(img);
          el.appendChild(seqDiv);

          // Name Tag on Highlight
          if (isHighlighted) {
             const badge = document.createElement('div');
             badge.className = 'absolute bottom-[52px] left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded-lg shadow-lg border border-slate-200 text-xs font-bold whitespace-nowrap z-50';
             badge.style.color = '#1E3A8A';
             badge.textContent = loc.name;
             el.appendChild(badge);
          }
        }

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([coords[0], coords[1]])
          .addTo(map);
      }
      
      newMarkersRef[clusterId] = marker;
    });

    // Remove old markers not in current view
    Object.keys(markersRef.current).forEach(id => {
      if (!newMarkersRef[id]) {
        markersRef.current[id].remove();
      }
    });

    markersRef.current = newMarkersRef;
  };

  // Bind map events to update clusters
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    
    map.on('move', updateClusters);
    map.on('zoom', updateClusters);
    
    // Initial call
    updateClusters();
    
    return () => {
      map.off('move', updateClusters);
      map.off('zoom', updateClusters);
    };
  }, [mapLoaded, locations]);

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
      el.className = 'w-5 h-5 bg-[#FF9933] rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-50 animate-pulse';
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
        pitch: 60, 
        bearing: map.getBearing(),
        duration: 2000,
        essential: true
      });
      return;
    }

    if (centerOnFullRoute && locations.length > 0) {
      const geojson = turf.featureCollection(locationsToGeoJSON(locations));
      const bbox = turf.bbox(geojson) as [number, number, number, number];
      
      if (bbox) {
          map.fitBounds(bbox, { padding: 80, duration: 2500, pitch: 0, bearing: 0 });
      }
      return;
    }

    if (highlightedId) {
      const loc = locations.find(l => l.id === highlightedId);
      if (loc) {
        // Calculate bearing towards next location if it exists
        let targetBearing = 0;
        const nextLoc = locations.find(l => l.sequence === loc.sequence + 1);
        if (nextLoc) {
            targetBearing = turf.bearing(
                turf.point([loc.longitude, loc.latitude]),
                turf.point([nextLoc.longitude, nextLoc.latitude])
            );
        }
        
        map.flyTo({ 
            center: [loc.longitude, loc.latitude], 
            zoom: 16.5, 
            pitch: 65, 
            bearing: targetBearing,
            duration: 2500,
            essential: true
        });
      }
    }
  }, [mapLoaded, highlightedId, centerOnFullRoute, forceFocus, userLocation, locations]);

  return (
    <div className="w-full h-full relative z-0 bg-[#faf8f2]">
      <div ref={mapContainer} className="w-full h-full outline-none" />
    </div>
  );
}
