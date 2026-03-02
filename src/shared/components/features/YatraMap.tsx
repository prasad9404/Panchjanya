import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useState, useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";

export interface YatraLocation {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    sequence: number;
    status: "completed" | "current" | "upcoming";
    pinColor?: string;
    locationLink?: string;
}

// Memoize Marker Icons to prevent recreation on every render
const arrowIcons = new Map<number, L.DivIcon>();
const getArrowIcon = (angle: number) => {
    if (arrowIcons.has(angle)) return arrowIcons.get(angle)!;
    const icon = L.divIcon({
        className: 'arrow-marker',
        html: `<div style="transform: rotate(${angle}deg); width: 12px; height: 12px; display: flex; items-center; justify-center;">
                 <img src="/icons/left-arrow.png" style="width: 100%; height: auto; opacity: 0.8;" />
               </div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
    });
    arrowIcons.set(angle, icon);
    return icon;
};

const markerIcons = new Map<string, L.DivIcon>();
const getNumberedMarker = (sequence: number, status: string, isHighlighted: boolean, customColor?: string) => {
    const key = `${sequence}-${status}-${isHighlighted}-${customColor || ''}`;
    if (markerIcons.has(key)) return markerIcons.get(key)!;

    // Base color selection
    const baseColor = customColor || (
        status === "current" ? "#F59E0B" : // Amber-500
            status === "completed" ? "#4F46E5" : // Indigo-600
                "#10B981" // Emerald-500 (Upcoming)
    );

    const isUpcoming = status === "upcoming";
    const mainBg = isHighlighted ? "#EF4444" : (isUpcoming ? "white" : baseColor);
    const borderColor = isHighlighted ? "white" : (isUpcoming ? baseColor : "white");
    const textColor = isHighlighted ? "white" : (isUpcoming ? baseColor : "white");
    const pulseClass = isHighlighted ? "animate-pulse" : "";

    const icon = L.divIcon({
        className: `custom-number-marker ${isHighlighted ? 'active-marker' : ''}`,
        html: `
            <div class="${pulseClass}" style="
                width: 52px; height: 52px; background-color: ${mainBg};
                border: 3px solid ${borderColor}; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                color: ${textColor}; font-weight: bold; font-size: 20px;
                box-shadow: 0 0 15px rgba(0,0,0,0.3); transition: all 0.3s ease;
            ">
                ${sequence}
            </div>
        `,
        iconSize: [52, 52],
        iconAnchor: [26, 26],
    });
    markerIcons.set(key, icon);
    return icon;
};

function MapBounds({ locations }: { locations: YatraLocation[] }) {
    const map = useMap();

    useEffect(() => {
        if (locations.length > 0) {
            const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [locations, map]);

    return null;
}

function MapCenter({ locations, highlightedId }: { locations: YatraLocation[], highlightedId?: string }) {
    const map = useMap();

    useEffect(() => {
        if (highlightedId) {
            const loc = locations.find(l => l.id === highlightedId);
            if (loc) {
                map.flyTo([loc.latitude, loc.longitude], Math.max(map.getZoom(), 12), {
                    duration: 1.5
                });
            }
        }
    }, [highlightedId, locations, map]);

    return null;
}

interface YatraMapProps {
    locations: YatraLocation[];
    highlightedId?: string;
}

function RouteArrows({ locations }: { locations: YatraLocation[] }) {
    const map = useMap();
    const [zoom, setZoom] = useState(map.getZoom());

    useEffect(() => {
        const syncZoom = () => setZoom(map.getZoom());
        map.on('zoomend moveend resize', syncZoom);
        return () => {
            map.off('zoomend moveend resize', syncZoom);
        };
    }, [map]);

    // Optimize: Reduce density as zoom level decreases
    const desiredPixelGap = zoom > 12 ? 15 : zoom > 8 ? 30 : 60;

    const routeCoordinates = useMemo(() => [...locations]
        .sort((a, b) => a.sequence - b.sequence)
        .map(l => ({ lat: l.latitude, lng: l.longitude, id: l.id })), [locations]);

    if (routeCoordinates.length < 2) return null;

    const arrows: JSX.Element[] = [];

    routeCoordinates.slice(0, -1).forEach((coord, idx) => {
        const nextCoord = routeCoordinates[idx + 1];

        const p1 = map.project(L.latLng(coord.lat, coord.lng), zoom);
        const p2 = map.project(L.latLng(nextCoord.lat, nextCoord.lng), zoom);

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);

        const numArrows = Math.floor(pixelDistance / desiredPixelGap);
        const angle = Math.round((Math.atan2(dy, dx) * (180 / Math.PI)) + 180);
        const icon = getArrowIcon(angle);

        const skipPixels = 20;

        for (let i = 1; i <= numArrows; i++) {
            const currentPixelDist = i * desiredPixelGap;
            if (currentPixelDist < skipPixels || currentPixelDist > pixelDistance - skipPixels) continue;

            const ratio = currentPixelDist / pixelDistance;
            const arrowLat = coord.lat + (nextCoord.lat - coord.lat) * ratio;
            const arrowLng = coord.lng + (nextCoord.lng - coord.lng) * ratio;

            arrows.push(
                <Marker
                    key={`arrow-${coord.id}-${idx}-${i}`}
                    position={[arrowLat, arrowLng]}
                    icon={icon}
                    zIndexOffset={-500}
                    interactive={false}
                />
            );
        }
    });

    return <>{arrows}</>;
}

export default function YatraMap({ locations, highlightedId }: YatraMapProps) {
    return (
        <div className="w-full h-full relative z-0">
            <MapContainer
                center={[25.3176, 82.9739]} // Initial fallback
                zoom={5}
                style={{ width: "100%", height: "100%" }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    maxZoom={20}
                />

                <MapBounds locations={locations} />
                <MapCenter locations={locations} highlightedId={highlightedId} />
                <RouteArrows locations={locations} />

                {/* Markers */}
                {locations.map((loc) => (
                    <Marker
                        key={loc.id}
                        position={[loc.latitude, loc.longitude]}
                        icon={getNumberedMarker(loc.sequence, loc.status, loc.id === highlightedId, loc.pinColor)}
                        zIndexOffset={loc.id === highlightedId ? 2000 : 1000}
                    >
                        <Tooltip direction="top" offset={[0, -26]} opacity={1}>
                            <span className="font-bold text-xs">{loc.name}</span>
                        </Tooltip>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
