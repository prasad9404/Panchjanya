// @ts-nocheck
// ─── React Native file — excluded from the web TypeScript project ──────────
// This file belongs to a React Native app and uses packages that are not
// installed in this Vite/React web project (react-native, @maplibre/maplibre-react-native,
// react-native-config). Errors about missing modules are expected here and
// intentionally suppressed. Move this file to a dedicated RN project to build it.
// ───────────────────────────────────────────────────────────────────────────
/**
 * MapScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * React Native screen using @maplibre/maplibre-react-native.
 * Base style: MapTiler Streets v2
 *
 * Dependencies
 * ────────────
 *   npm install @maplibre/maplibre-react-native react-native-config
 *
 * API key (react-native-config)
 * ──────────────────────────────
 *   .env  →  MAPTILER_KEY=your_api_key_here
 *   Access via `Config.MAPTILER_KEY`
 *
 * Props
 * ─────
 *   locations : Array<{ id, name, lat, lng, description? }>
 *
 * Features
 * ────────
 *   • Full-screen MapLibreGL.MapView with MapTiler Streets v2
 *   • Flat green CircleLayer markers (no teardrop) via ShapeSource
 *   • Press marker → bottom sheet modal with name & description
 *   • MapLibreGL.Camera set to default center (India) and zoom 4
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  SafeAreaView,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import Config from 'react-native-config';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface LocationItem {
  id: number | string;
  name: string;
  lat: number;
  lng: number;
  description?: string;
}

interface MapScreenProps {
  locations?: LocationItem[];
}

// ─── MapTiler config ──────────────────────────────────────────────────────

// Map ID from your MapTiler dashboard
const MAP_ID    = '019edf5e-9455-76c8-8965-9b59fa30781f';
// API key: reads from react-native-config (.env) first, then falls back
const MAPTILER_KEY = (Config.MAPTILER_KEY && Config.MAPTILER_KEY !== 'undefined')
  ? Config.MAPTILER_KEY
  : 'OPcGOLHMRYAQgK1qMHaP';   // ← your MapTiler key

const STYLE_URL = `https://api.maptiler.com/maps/${MAP_ID}/style.json?key=${MAPTILER_KEY}`;

// Required: MapLibre React Native is NOT Mapbox — no token needed
MapLibreGL.setAccessToken(null);

const DEFAULT_CENTER: [number, number] = [80.00122, 21.51903]; // [lng, lat] — MapTiler dashboard default
const DEFAULT_ZOOM   = 4;

/** Brand green */
const MARKER_COLOR  = '#2D6A4F';
const MARKER_BORDER = '#FFFFFF';

// ─── Sample data (used when no locations prop is provided) ─────────────────

const SAMPLE_LOCATIONS: LocationItem[] = [
  { id: 1, name: 'Mumbai',    lat: 19.076,  lng: 72.8777,  description: 'Financial capital of India' },
  { id: 2, name: 'Delhi',     lat: 28.6139, lng: 77.209,   description: 'Capital of India' },
  { id: 3, name: 'Bengaluru', lat: 12.9716, lng: 77.5946,  description: 'Silicon Valley of India' },
  { id: 4, name: 'Kolkata',   lat: 22.5726, lng: 88.3639,  description: 'City of Joy' },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function MapScreen({ locations = SAMPLE_LOCATIONS }: MapScreenProps) {
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);

  // ── Convert locations array to a GeoJSON FeatureCollection ───────────────
  const geoJSON: GeoJSON.FeatureCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: locations.map((loc) => ({
      type: 'Feature',
      id: String(loc.id),
      geometry: {
        type: 'Point',
        coordinates: [loc.lng, loc.lat],
      },
      properties: {
        id:          String(loc.id),
        name:        loc.name,
        description: loc.description ?? '',
      },
    })),
  }), [locations]);

  // ── Handle marker press via onPress on ShapeSource ───────────────────────
  const handleFeaturePress = useCallback(
    (e: { features?: GeoJSON.Feature[] }) => {
      const feature = e.features?.[0];
      if (!feature?.properties) return;

      const props = feature.properties as { id: string; name: string; description?: string };
      const loc   = locations.find((l) => String(l.id) === props.id);
      if (loc) {
        setSelectedLocation(loc);
        // Fly to the tapped marker
        cameraRef.current?.flyTo([loc.lng, loc.lat], 1500);
      }
    },
    [locations]
  );

  // ── Close bottom sheet ────────────────────────────────────────────────────
  const closeSheet = useCallback(() => setSelectedLocation(null), []);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Map ── */}
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={STYLE_URL}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, right: 8 }}
        pitchEnabled={false}
        rotateEnabled={false}
        compassEnabled={false}
      >
        {/* Camera */}
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={DEFAULT_CENTER}
          animationMode="flyTo"
          animationDuration={1200}
        />

        {/* Markers as a CircleLayer — flat green filled circles */}
        <MapLibreGL.ShapeSource
          id="locationsSource"
          shape={geoJSON}
          onPress={handleFeaturePress}
        >
          {/* Outer glow / shadow ring */}
          <MapLibreGL.CircleLayer
            id="markerGlow"
            style={{
              circleRadius:        14,
              circleColor:         MARKER_COLOR,
              circleOpacity:       0.18,
              circleStrokeWidth:   0,
            }}
            belowLayerID="markerFill"
          />

          {/* Main filled circle */}
          <MapLibreGL.CircleLayer
            id="markerFill"
            style={{
              circleRadius:        9,
              circleColor:         MARKER_COLOR,
              circleStrokeWidth:   2,
              circleStrokeColor:   MARKER_BORDER,
              circlePitchAlignment: 'map',
            }}
          />

          {/* Active marker highlight (when selected) */}
          {selectedLocation && (
            <MapLibreGL.CircleLayer
              id="markerActive"
              filter={['==', ['get', 'id'], String(selectedLocation.id)]}
              style={{
                circleRadius:      12,
                circleColor:       '#1a5e3f',
                circleStrokeWidth: 2.5,
                circleStrokeColor: MARKER_BORDER,
              }}
            />
          )}
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>

      {/* ── Bottom-sheet modal ── */}
      <Modal
        visible={!!selectedLocation}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <Pressable style={styles.backdrop} onPress={closeSheet} />
        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header row */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetDot} />
              <Text style={styles.sheetTitle} numberOfLines={2}>
                {selectedLocation?.name}
              </Text>
            </View>

            {selectedLocation?.description ? (
              <Text style={styles.sheetDesc}>{selectedLocation.description}</Text>
            ) : null}

            {/* Coordinates */}
            <View style={styles.coordRow}>
              <Text style={styles.coordLabel}>Lat / Lng</Text>
              <Text style={styles.coordValue}>
                {selectedLocation?.lat.toFixed(4)}, {selectedLocation?.lng.toFixed(4)}
              </Text>
            </View>
          </ScrollView>

          {/* Close button */}
          <Pressable
            style={styles.closeBtn}
            onPress={closeSheet}
            accessibilityRole="button"
            accessibilityLabel="Close location details"
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4efe3',
  },
  map: {
    flex: 1,
  },

  /* Bottom sheet */
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    minHeight: 200,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sheetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: MARKER_COLOR,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: MARKER_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  sheetDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginBottom: 8,
  },
  coordLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordValue: {
    fontSize: 12,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  closeBtn: {
    marginTop: 4,
    backgroundColor: MARKER_COLOR,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
