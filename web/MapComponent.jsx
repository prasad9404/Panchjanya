/**
 * MapComponent.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MapLibre GL JS map — MapTiler custom style (019edf5e).
 *
 * Props
 * ─────
 *   locations : Array<{ id, name, lat, lng, description? }>
 *   center    : [lng, lat]   (default: [80.00122, 21.51903])
 *   zoom      : number       (default: 4)
 *
 * Style URL
 * ─────────
 *   https://api.maptiler.com/maps/019edf5e-9455-76c8-8965-9b59fa30781f/style.json
 *   Key stored in VITE_MAPTILER_KEY (.env) or falls back to the bundled key.
 *
 * Features
 * ────────
 *   • MapTiler custom style base map
 *   • Flat circular marker: brand-green #2D6A4F, 2 px white border, drop-shadow
 *   • Click marker → white-card popup (name bold + optional description)
 *   • Navigation control (zoom +/− + compass) at bottom-right
 *   • Fully responsive (fills 100% of its parent container)
 *   • No terrain / hillshade layers
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';

// ─── PropTypes-style JSDoc for IDE support ─────────────────────────────────
/**
 * @typedef {{ id: number|string, name: string, lat: number, lng: number, description?: string }} LocationItem
 */

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * @param {{ locations: LocationItem[], center?: [number, number], zoom?: number }} props
 */
// ─── MapTiler config ──────────────────────────────────────────────────────
// Map ID from your MapTiler dashboard
const MAP_ID  = '019edf5e-9455-76c8-8965-9b59fa30781f';
// API key: reads from .env first, then falls back to the dashboard key
const API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPTILER_KEY) ||
  (typeof process !== 'undefined' && process.env?.REACT_APP_MAPTILER_KEY) ||
  'OPcGOLHMRYAQgK1qMHaP';   // ← your MapTiler key

const STYLE_URL = `https://api.maptiler.com/maps/${MAP_ID}/style.json?key=${API_KEY}`;

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * @param {{ locations: LocationItem[], center?: [number, number], zoom?: number }} props
 */
export default function MapComponent({
  locations = [],
  center = [80.00122, 21.51903], // MapTiler dashboard default  [lng, lat]
  zoom = 4,
}) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({});   // id → { marker, popup }
  const [mapReady, setMapReady] = useState(false);

  // ── Initialise map ────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center,
      zoom,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false,
    });

    // Attribution (compact)
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    // Navigation control — zoom + compass — bottom-right
    map.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: false,
      }),
      'bottom-right'
    );

    map.on('load', () => setMapReady(true));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Add / update markers whenever locations change ────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;

    // ── Build set of current ids
    const incomingIds = new Set(locations.map((l) => String(l.id)));

    // ── Remove stale markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!incomingIds.has(id)) {
        markersRef.current[id].marker.remove();
        markersRef.current[id].popup.remove();
        delete markersRef.current[id];
      }
    });

    // ── Add new markers
    locations.forEach((loc) => {
      const id = String(loc.id);
      if (markersRef.current[id]) return; // already exists

      /* ── Marker element ── */
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.setAttribute('data-id', id);
      el.setAttribute('aria-label', loc.name);
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');

      /* ── Popup ── */
      const descHtml = loc.description
        ? `<p class="popup-desc">${loc.description}</p>`
        : '';

      const popup = new maplibregl.Popup({
        offset: 18,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '260px',
        className: 'map-popup',
      }).setHTML(`
        <div class="popup-inner">
          <div class="popup-header">
            <div class="popup-dot"></div>
            <p class="popup-name">${loc.name}</p>
          </div>
          ${descHtml}
        </div>
      `);

      /* ── Marker instance ── */
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([loc.lng, loc.lat])
        .addTo(map);

      /* ── Click / keyboard interaction ── */
      const openPopup = (e) => {
        e?.stopPropagation?.();
        // Deactivate all markers
        document.querySelectorAll('.map-marker.active').forEach((m) => m.classList.remove('active'));
        // Activate this one
        el.classList.add('active');
        popup.setLngLat([loc.lng, loc.lat]).addTo(map);
      };

      el.addEventListener('click', openPopup);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openPopup(e); });

      // Deactivate when popup is closed
      popup.on('close', () => el.classList.remove('active'));

      markersRef.current[id] = { marker, popup };
    });
  }, [locations, mapReady]);

  // ── Fit bounds to all locations whenever the list changes ─────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady || locations.length === 0) return;
    const map = mapRef.current;

    if (locations.length === 1) {
      map.flyTo({ center: [locations[0].lng, locations[0].lat], zoom: 13, duration: 1000 });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    locations.forEach((l) => bounds.extend([l.lng, l.lat]));
    map.fitBounds(bounds, { padding: 80, duration: 1200, maxZoom: 14 });
  }, [locations, mapReady]);

  return (
    <div
      className="map-wrap"
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
