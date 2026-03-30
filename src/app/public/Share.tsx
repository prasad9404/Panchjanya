import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Compass, Milestone, MapPin, Navigation, Loader2, ChevronLeft } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { getLocationUrl } from "@/shared/utils/locationUtils";

interface YatraPlace {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  latitude: number;
  longitude: number;
  mapLink: string;
  sequence: number;
  status: "visited" | "stayed" | "revisited";
}

// Custom marker icons - Smaller size
const createMarkerIcon = (status: string, number: number) => {
  const color = status === "visited" ? "#8B4513" : status === "stayed" ? "#FF9933" : "#C0C0C0";

  return L.divIcon({
    className: "custom-yatra-marker",
    html: `
      <div style="
        width: 52px;
        height: 52px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        font-weight: bold;
        color: white;
        font-size: 18px;
      ">
        ${number}
      </div>
    `,
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  });
};

const Share = () => {
  const navigate = useNavigate();
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [yatraRoute, setYatraRoute] = useState<YatraPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYatraPlaces();
  }, []);

  const fetchYatraPlaces = async () => {
    try {
      const q = query(collection(db, "yatraPlaces"), orderBy("sequence", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as YatraPlace[];
      setYatraRoute(data);
    } catch (error) {
      console.error("Error fetching yatra places:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extract coordinates for the polyline
  const routeCoordinates = yatraRoute.map(point => [point.latitude, point.longitude] as [number, number]);

  // Calculate center point for map
  const centerLat = yatraRoute.length > 0
    ? yatraRoute.reduce((sum, p) => sum + p.latitude, 0) / yatraRoute.length
    : 19.8;
  const centerLng = yatraRoute.length > 0
    ? yatraRoute.reduce((sum, p) => sum + p.longitude, 0) / yatraRoute.length
    : 75.8;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Swami's Yatra...</p>
        </div>
      </div>
    );
  }

  if (yatraRoute.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Yatra Places Added</h2>
          <p className="text-muted-foreground">
            Please add places from the admin dashboard to view the journey.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background lg:bg-white">
      {/* Standard Header */}
      <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between bg-background/95 lg:bg-white/95 backdrop-blur-sm border-b border-border">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-7 h-7 text-blue-900" />
        </Button>
        <h1 className="text-xl font-heading font-bold text-blue-900 font-serif">Swami's Yatra</h1>
        <div className="w-10" />
      </div>

      {/* Hero Header (kept as content) */}
      <div className="bg-background border-b border-border p-4 sm:p-6 space-y-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-bold uppercase tracking-widest border border-accent/20">
              <Milestone className="w-3 h-3" />
              Historical Journey • 1200 CE
            </div>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tighter">
            Swami's Yatra
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium mt-2">
            The sacred path traversed by Swami through Maharashtra's spiritual landscape
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-primary/5 border-b border-primary/10 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase">Historical Route</p>
              <p className="text-sm font-bold text-primary">Complete Journey Path</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase">Sacred Sthanas</p>
              <p className="font-heading text-2xl font-bold">{yatraRoute.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase">Era</p>
              <p className="font-heading text-2xl font-bold">1200 CE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map and Timeline Container */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Map Section */}
        <div className="h-[50vh] lg:h-auto lg:flex-1 relative">
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={11}
            style={{ width: "100%", height: "100%" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={20}
            />

            {/* Route Polyline - Dotted */}
            <Polyline
              positions={routeCoordinates}
              color="#FF9933"
              weight={3}
              opacity={0.8}
              dashArray="8, 12"
            />

            {/* Markers */}
            {yatraRoute.map((point, index) => (
              <Marker
                key={point.id}
                position={[point.latitude, point.longitude] as [number, number]}
                icon={createMarkerIcon(point.status, index + 1)}
                eventHandlers={{
                  click: () => setSelectedPoint(index + 1)
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-heading text-lg font-bold mb-2 text-primary">{point.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{point.description}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => {
                        const url = getLocationUrl(point.mapLink, point.latitude, point.longitude);
                        if (url) {
                          window.open(url, "_blank");
                        }
                      }}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Open in Maps
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Journey Timeline Sidebar */}
        <div className="lg:w-96 bg-background border-t lg:border-t-0 lg:border-l border-border overflow-y-auto p-4 sm:p-6">
          <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Journey Timeline
          </h2>

          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary via-accent to-secondary opacity-20" />

            <div className="space-y-4">
              {yatraRoute.map((point, index) => (
                <div
                  key={point.id}
                  className={cn(
                    "relative pl-10 pb-4",
                    index === yatraRoute.length - 1 && "pb-0"
                  )}
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-background shadow-md",
                    point.status === "visited" ? "bg-secondary text-white" :
                      point.status === "stayed" ? "bg-primary text-white" :
                        "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all",
                      selectedPoint === index + 1 ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedPoint(index + 1)}
                  >
                    <h3 className="font-heading text-base font-bold mb-1">{point.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{point.nameEn}</p>
                    <p className="text-xs text-muted-foreground italic">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">
              Sacred Path of Dharma
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Share;
