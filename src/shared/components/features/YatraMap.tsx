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
const getNumberedMarker = (
    sequence: number, 
    status: string, 
    isHighlighted: boolean, 
    customColor?: string,
    isStart?: boolean,
    isEnd?: boolean
) => {
    const key = `${sequence}-${status}-${isHighlighted}-${customColor || ''}-${isStart}-${isEnd}`;
    if (markerIcons.has(key)) return markerIcons.get(key)!;

    const icon = L.divIcon({
        className: 'custom-yatra-marker',
        html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <div style="
                    background: ${isHighlighted ? '#EF4444' : '#2A6DF4'}; 
                    width: ${isStart || isEnd ? '32px' : '28px'}; 
                    height: ${isStart || isEnd ? '32px' : '28px'}; 
                    border-radius: 4px; 
                    border: 2px solid white; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: white; 
                    font-weight: 900; 
                    font-size: ${isStart || isEnd ? '14px' : '12px'};
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
                    z-index: 10;
                ">
                    ${sequence}
                </div>
                <!-- Stem/Tail -->
                <div style="
                    width: 2px; 
                    height: 6px; 
                    background: white; 
                    margin-top: -1px;
                "></div>
                
                ${isStart ? `
                    <div style="position: absolute; bottom: -18px; font-weight: 900; color: white; font-size: 9px; background: #2A6DF4; padding: 1px 6px; border-radius: 2px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 5; border: 1px solid white; white-space: nowrap;">START</div>
                ` : ''}
                ${isEnd ? `
                    <div style="position: absolute; bottom: -18px; font-weight: 900; color: white; font-size: 9px; background: #EF4444; padding: 1px 6px; border-radius: 2px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 5; border: 1px solid white; white-space: nowrap;">END</div>
                ` : ''}
            </div>
        `,
        iconSize: [32, 45],
        iconAnchor: [16, 45],
    });
    markerIcons.set(key, icon);
    return icon;
};

function MapBounds({ locations, centerOnFullRoute }: { locations: YatraLocation[], centerOnFullRoute?: number }) {
    const map = useMap();
    useEffect(() => {
        if (locations.length > 0) {
            const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [locations, centerOnFullRoute, map]);
    return null;
}

function MapCenter({ highlightedId, locations, forceFocus }: { highlightedId?: string, locations: YatraLocation[], forceFocus?: number }) {
    const map = useMap();
    useEffect(() => {
        if (highlightedId) {
            const loc = locations.find(l => l.id === highlightedId);
            if (loc) {
                map.setView([loc.latitude, loc.longitude], 15, { animate: true });
            }
        }
    }, [highlightedId, locations, forceFocus, map]);
    return null;
}

interface YatraMapProps {
    locations: YatraLocation[];
    highlightedId?: string;
    centerOnFullRoute?: number;
    forceFocus?: number;
}

function RouteVisualization({ locations, highlightedId }: { locations: YatraLocation[], highlightedId?: string }) {
    const map = useMap();
    const [zoom, setZoom] = useState(map.getZoom());
    const [fullPath, setFullPath] = useState<[number, number][]>([]);
    const [currentPathIndex, setCurrentPathIndex] = useState(0);

    const sortedLocations = useMemo(() => 
        [...locations].sort((a, b) => a.sequence - b.sequence), 
    [locations]);

    useEffect(() => {
        const syncZoom = () => setZoom(map.getZoom());
        map.on('zoomend moveend resize', syncZoom);
        return () => {
            map.off('zoomend moveend resize', syncZoom);
        };
    }, [map]);

    // Segmented routing to ENFORCE sequence 1 -> 2 -> 3 -> 4 -> 5 -> 6
    useEffect(() => {
        if (sortedLocations.length < 2) {
            setFullPath([]);
            return;
        }

        const fetchSegmentedRoute = async () => {
            try {
                const segmentPromises = sortedLocations.slice(0, -1).map((start, idx) => {
                    const end = sortedLocations[idx + 1];
                    const coords = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
                    return fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
                        .then(res => res.json());
                });

                const results = await Promise.all(segmentPromises);
                let combinedPath: [number, number][] = [];

                results.forEach((data, idx) => {
                    if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
                        const segmentPath = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
                        // Avoid duplicating overlapping points at segment boundaries
                        if (combinedPath.length > 0) {
                            combinedPath.push(...segmentPath.slice(1));
                        } else {
                            combinedPath.push(...segmentPath);
                        }
                    } else {
                        // Fallback to straight line for this segment if OSRM fails
                        const start = sortedLocations[idx];
                        const end = sortedLocations[idx + 1];
                        combinedPath.push([start.latitude, start.longitude], [end.latitude, end.longitude]);
                    }
                });

                setFullPath(combinedPath);
            } catch (error) {
                console.error("Segmented routing error:", error);
                // Fallback to full straight line path
                setFullPath(sortedLocations.map(l => [l.latitude, l.longitude] as [number, number]));
            }
        };

        fetchSegmentedRoute();
    }, [sortedLocations]);

    // Update progress index based on highlightedId
    useEffect(() => {
        if (!highlightedId || fullPath.length === 0) {
            setCurrentPathIndex(0);
            return;
        }

        const currentLoc = sortedLocations.find(l => l.id === highlightedId);
        if (!currentLoc) return;

        // Find the closest point in the fullPath to the current location
        let closestIdx = 0;
        let minOffset = Infinity;

        // We only look up to the point where this sthan *should* be in the sequence
        // This is simplified; a better way would be tracking segment boundaries
        fullPath.forEach((pt, idx) => {
            const dist = Math.abs(pt[0] - currentLoc.latitude) + Math.abs(pt[1] - currentLoc.longitude);
            if (dist < minOffset) {
                minOffset = dist;
                closestIdx = idx;
            }
        });
        
        setCurrentPathIndex(closestIdx);
    }, [highlightedId, fullPath, sortedLocations]);

    if (fullPath.length < 2) return null;

    const routeRed = "#EF4444";
    const completedColor = "#10B981"; // Emerald for completed path

    // Direction arrows along the road path
    const arrows: JSX.Element[] = [];
    const desiredPixelGap = zoom > 14 ? 120 : zoom > 12 ? 200 : zoom > 10 ? 400 : 800;

    let lastArrowPixelDist = 0;
    for (let i = 0; i < fullPath.length - 1; i++) {
        const p1 = map.project(L.latLng(fullPath[i][0], fullPath[i][1]), zoom);
        const p2 = map.project(L.latLng(fullPath[i + 1][0], fullPath[i + 1][1]), zoom);
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const segmentDist = Math.sqrt(dx * dx + dy * dy);
        
        if (lastArrowPixelDist + segmentDist >= desiredPixelGap) {
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const arrowIcon = L.divIcon({
                className: 'nav-direction-arrow',
                html: `<div style="transform: rotate(${angle}deg); display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 0 2px rgba(255,255,255,0.8));">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="#2A6DF4">
                           <path d="M5 3l14 9-14 9V3z"/>
                         </svg>
                       </div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6],
            });

            arrows.push(
                <Marker
                    key={`nav-arrow-${i}`}
                    position={[fullPath[i][0], fullPath[i][1]]}
                    icon={arrowIcon}
                    zIndexOffset={600}
                    interactive={false}
                />
            );
            lastArrowPixelDist = 0;
        } else {
            lastArrowPixelDist += segmentDist;
        }
    }

    return (
        <>
            <style>
                {`
                @keyframes path-flow {
                    from { stroke-dashoffset: 40; }
                    to { stroke-dashoffset: 0; }
                }
                .nav-path-animated {
                    animation: path-flow 1.5s linear infinite;
                }
                `}
            </style>
            
            {/* 1. Base Outline Layer */}
            <Polyline
                positions={fullPath}
                pathOptions={{
                    color: "white",
                    weight: 10,
                    opacity: 0.3,
                    lineJoin: "round",
                    lineCap: "round",
                }}
            />

            {/* 2. Main Navigation Red Path (Mimic Image) */}
            <Polyline
                positions={fullPath}
                pathOptions={{
                    color: routeRed,
                    weight: 6,
                    opacity: 1,
                    lineJoin: "round",
                    lineCap: "round",
                }}
            />

            {/* 3. Journey Progress Overly (Completed Part) */}
            {currentPathIndex > 0 && (
                <Polyline
                    positions={fullPath.slice(0, currentPathIndex + 1)}
                    pathOptions={{
                        color: completedColor,
                        weight: 6,
                        opacity: 0.8,
                        lineJoin: "round",
                        lineCap: "round",
                    }}
                />
            )}

            {/* 4. Animated Flow Layer (White Dashes) */}
            <Polyline
                positions={fullPath}
                className="nav-path-animated"
                pathOptions={{
                    color: "white",
                    weight: 2,
                    opacity: 0.4,
                    lineJoin: "round",
                    lineCap: "round",
                    dashArray: "10, 30",
                }}
            />

            {arrows}
        </>
    );
}

export default function YatraMap({ locations, highlightedId, centerOnFullRoute, forceFocus }: YatraMapProps) {
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

                <MapBounds locations={locations} centerOnFullRoute={centerOnFullRoute} />
                <MapCenter locations={locations} highlightedId={highlightedId} forceFocus={forceFocus} />
                <RouteVisualization locations={locations} highlightedId={highlightedId} />

                {/* Markers */}
                {locations.map((loc, idx) => {
                    const isStart = idx === 0;
                    const isEnd = idx === locations.length - 1;
                    const isHighlighted = loc.id === highlightedId;
                    
                    return (
                        <Marker
                            key={loc.id}
                            position={[loc.latitude, loc.longitude]}
                            icon={getNumberedMarker(
                                loc.sequence, 
                                loc.status, 
                                isHighlighted, 
                                loc.pinColor,
                                isStart,
                                isEnd
                            )}
                            zIndexOffset={isHighlighted ? 2000 : 1000}
                        >
                            <Tooltip direction="top" offset={[0, -26]} opacity={1}>
                                <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-border/50">
                                    <span className="font-bold text-xs text-landing-primary block">{loc.name}</span>
                                    {isStart && <span className="text-[10px] text-accent-gold font-bold uppercase">Journey Start</span>}
                                    {isEnd && <span className="text-[10px] text-blue-600 font-bold uppercase">Journey Destination</span>}
                                </div>
                            </Tooltip>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
