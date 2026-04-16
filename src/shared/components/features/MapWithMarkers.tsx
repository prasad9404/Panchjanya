import { MapContainer, TileLayer, Marker, useMap, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useEffect, useRef, useMemo } from "react";
import type { Temple } from "@/types";

// Spiritual Marker Generator
// Spiritual Marker Generator - Memoized for performance
const markerIcons = new Map<boolean, L.DivIcon>();
const getCustomMarker = (isActive: boolean) => {
  if (markerIcons.has(isActive)) return markerIcons.get(isActive)!;

  const color = isActive ? "#FF9933" : "#C04000"; // Saffron vs Deep Maroon-ish Red
  const size = 52;

  const icon = L.divIcon({
    className: "custom-temple-marker",
    html: `
      <div style="
        width: ${size}px; 
        height: ${size}px; 
        background-color: ${color}; 
        border: 2px solid white; 
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        z-index: ${isActive ? 1000 : 1};
        transition: all 0.3s ease;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <!-- Custom Temple Shikhara Icon -->
          <svg viewBox="0 0 24 24" width="${size / 1.8}" height="${size / 1.8}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 22h16a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1z"></path>
            <path d="M18 18v-8a4 4 0 0 0-1-3l-4-7a2 2 0 0 0-2 0l-4 7a4 4 0 0 0-1 3v8"></path>
            <path d="M12 2v2"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 52],
  });
  markerIcons.set(isActive, icon);
  return icon;
};

interface MapWithMarkersProps {
  temples: Temple[];
  onTempleClick: (id: string) => void;
  selectedTempleId?: string | null;
}

function MapBoundsFitter({ temples, selectedTempleId }: { temples: Temple[], selectedTempleId?: string | null }) {
  const map = useMap();
  const lastTempleIds = useRef<string>("");

  useEffect(() => {
    if (selectedTempleId) {
      const selected = temples.find(t => t.id === selectedTempleId);
      if (selected && selected.latitude && selected.longitude) {
        map.flyTo([selected.latitude, selected.longitude], 12, {
          duration: 1.5,
          easeLinearity: 0.25
        });
        return;
      }
    }

    if (temples.length > 0) {
      const currentIds = temples.map(t => t.id).sort().join(',');
      if (currentIds !== lastTempleIds.current) {
        const validCoords = temples
          .filter(t => t.latitude && t.longitude && (Math.abs(t.latitude) > 0.1 || Math.abs(t.longitude) > 0.1))
          .map(t => [t.latitude!, t.longitude!] as [number, number]);

        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { 
              padding: [80, 80], 
              maxZoom: 14,
              animate: true,
              duration: 1.5
            });
            lastTempleIds.current = currentIds;
          }
        }
      }
    }
  }, [temples, selectedTempleId, map]);

  return null;
}

export default function MapWithMarkers({ temples, onTempleClick, selectedTempleId }: MapWithMarkersProps) {
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India Center

  // Process temples to add offset to overlapping coordinates
  // Uses a fixed geographic offset (Spiral) so they look stacked when zoomed out
  // but separate nicely when zoomed in.
  const markersToRender = useMemo(() => {
    const processed: (Temple & { renderLat: number, renderLng: number })[] = [];
    const grouped = new Map<string, Temple[]>();

    // 1. Group by exact location (rounded to ~11m precision)
    temples.forEach(t => {
      if (t.latitude && t.longitude) {
        const key = `${t.latitude.toFixed(4)},${t.longitude.toFixed(4)}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(t);
      }
    });

    // 2. Apply Spiral Offset to groups
    grouped.forEach((group) => {
      if (group.length === 1) {
        processed.push({ ...group[0], renderLat: group[0].latitude!, renderLng: group[0].longitude! });
      } else {
        // Spiral param
        const separation = 0.00015; // ~15-20 meters

        group.forEach((t, i) => {
          // Standard Spiral: r = a + b*theta
          // Or simpler "sunflower" packing: 
          // angle = i * 2.4 (golden angle roughly)
          // radius = c * sqrt(i)

          const angle = i * 2.4;
          const radius = separation * Math.sqrt(i + 1); // +1 to start offset immediately or 0 for center

          // If i=0 keep center? No, let's spiral all so they don't cover center perfect.
          // Actually i=0 at center is fine.

          const latOffset = (i === 0) ? 0 : radius * Math.cos(angle);
          const lngOffset = (i === 0) ? 0 : radius * Math.sin(angle);

          processed.push({
            ...t,
            renderLat: t.latitude! + latOffset,
            renderLng: t.longitude! + lngOffset
          });
        });
      }
    });

    return processed;
  }, [temples]);

  return (
    <div className="w-full h-full z-0 relative">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <MapBoundsFitter temples={temples} selectedTempleId={selectedTempleId} />

        {markersToRender.map((temple) => (
          <Marker
            key={temple.id}
            position={[temple.renderLat, temple.renderLng]}
            icon={getCustomMarker(selectedTempleId === temple.id)}
            zIndexOffset={selectedTempleId === temple.id ? 1000 : 0}
            eventHandlers={{
              click: () => onTempleClick(temple.id),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -26]}
              className="rounded-lg shadow-xl border-none p-0 overflow-hidden"
            >
              <div className="px-3 py-2 bg-white/95 backdrop-blur-sm border-l-4 border-primary">
                <p className="font-heading text-primary font-bold text-sm">{temple.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">
                  {temple.district} District
                </p>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
