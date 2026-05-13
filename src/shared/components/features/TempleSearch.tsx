import React, { useState, useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search, MapPin, History, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

interface TempleSearchProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
}

export function TempleSearch({ onPlaceSelect, placeholder = "Search sacred destinations..." }: TempleSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [recentSearches, setRecentSearches] = useState<google.maps.places.PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const placesLibrary = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (!placesLibrary) return;
    setAutocompleteService(new placesLibrary.AutocompleteService());
    
    // Create a dummy div for PlacesService since we only need it for details
    const dummyDiv = document.createElement('div');
    setPlacesService(new placesLibrary.PlacesService(dummyDiv));

    const saved = localStorage.getItem('yatra_recent_searches');
    if (saved) {
        try {
            setRecentSearches(JSON.parse(saved));
        } catch(e) {}
    }
  }, [placesLibrary]);

  useEffect(() => {
    if (!autocompleteService || !inputValue.trim()) {
      setPredictions([]);
      return;
    }

    const fetchPredictions = async () => {
      const request = {
        input: inputValue,
        types: ['hindu_temple', 'place_of_worship', 'tourist_attraction', 'point_of_interest'],
        componentRestrictions: { country: 'in' } // Focus on India
      };
      
      try {
          const response = await autocompleteService.getPlacePredictions(request);
          setPredictions(response.predictions);
      } catch (e) {
          setPredictions([]);
      }
    };

    const debounce = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(debounce);
  }, [inputValue, autocompleteService]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (placeId: string, description: string) => {
    setInputValue(description);
    setIsOpen(false);

    if (placesService) {
      placesService.getDetails({ placeId, fields: ['name', 'geometry', 'formatted_address', 'place_id'] }, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          onPlaceSelect(place);
          saveRecentSearch(place);
        }
      });
    }
  };

  const handleRecentSelect = (place: google.maps.places.PlaceResult) => {
      setInputValue(place.name || "");
      setIsOpen(false);
      onPlaceSelect(place);
  }

  const saveRecentSearch = (place: google.maps.places.PlaceResult) => {
      const newSearch = { name: place.name, geometry: place.geometry, place_id: place.place_id, formatted_address: place.formatted_address };
      const updated = [newSearch, ...recentSearches.filter(s => s.place_id !== place.place_id)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('yatra_recent_searches', JSON.stringify(updated));
  }

  const clearRecent = () => {
      setRecentSearches([]);
      localStorage.removeItem('yatra_recent_searches');
  }

  return (
    <div className="relative w-full z-[1000]" ref={containerRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-landing-primary opacity-60 group-focus-within:opacity-100 transition-opacity" />
        </div>
        <Input
          type="text"
          placeholder={placeholder}
          className="pl-11 h-12 w-full bg-white/90 backdrop-blur-md border-border/50 shadow-xl rounded-2xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-sm font-medium transition-all"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {inputValue && (
            <Button
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-1 top-1 h-10 w-10 text-muted-foreground hover:bg-transparent"
                onClick={() => {
                    setInputValue("");
                    setPredictions([]);
                    setIsOpen(false);
                }}
            >
                <X className="h-4 w-4" />
            </Button>
        )}
      </div>

      {isOpen && (inputValue.trim() || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 p-2 bg-white/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl overflow-hidden max-h-[60vh] overflow-y-auto">
          {inputValue.trim() ? (
              <div className="space-y-1">
                {predictions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No divine places found for "{inputValue}"
                    </div>
                ) : (
                    predictions.map((p) => (
                    <button
                        key={p.place_id}
                        className="w-full flex items-start gap-3 p-3 text-left hover:bg-primary/5 rounded-xl transition-colors"
                        onClick={() => handleSelect(p.place_id, p.description)}
                    >
                        <div className="mt-0.5 p-2 bg-primary/10 rounded-lg">
                            <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                        <div className="font-bold text-sm text-foreground truncate">
                            {p.structured_formatting.main_text}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                            {p.structured_formatting.secondary_text}
                        </div>
                        </div>
                    </button>
                    ))
                )}
              </div>
          ) : (
              <div className="space-y-1">
                  <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Journeys</span>
                      <Button variant="ghost" size="sm" onClick={clearRecent} className="h-6 text-[10px] uppercase">Clear</Button>
                  </div>
                  {recentSearches.map((place, i) => (
                      <button
                          key={`recent-${i}`}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 rounded-xl transition-colors"
                          onClick={() => handleRecentSelect(place)}
                      >
                          <History className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 overflow-hidden">
                              <div className="font-bold text-sm text-foreground truncate">
                                  {place.name}
                              </div>
                          </div>
                      </button>
                  ))}
              </div>
          )}
        </Card>
      )}
    </div>
  );
}
