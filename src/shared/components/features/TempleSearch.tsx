import React, { useState, useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search, MapPin, History, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";

interface TempleSearchProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
}

export function TempleSearch({ onPlaceSelect, placeholder = "Search sacred destinations..." }: TempleSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [recentSearches, setRecentSearches] = useState<google.maps.places.PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const placesLibrary = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (!placesLibrary) return;
    setAutocompleteService(new placesLibrary.AutocompleteService());
    
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
        componentRestrictions: { country: 'in' }
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
        if (!inputValue.trim()) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue]);

  const handleSelect = (placeId: string, description: string) => {
    setInputValue(description);
    setIsOpen(false);
    setIsExpanded(false);

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
      setIsExpanded(false);
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

  // Calculate dynamic width based on device
  const expandedWidth = typeof window !== 'undefined' && window.innerWidth < 640 ? "calc(100vw - 32px)" : "320px";

  return (
    <div className="relative z-[1000] flex justify-end h-12 w-12" ref={containerRef}>
      <motion.div
        initial={false}
        animate={{
          width: isExpanded ? expandedWidth : "48px",
          backgroundColor: isExpanded ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.8)",
        }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className={cn(
          "absolute right-0 top-0 h-12 flex items-center backdrop-blur-xl border border-border/50 overflow-hidden transition-shadow duration-300",
          isExpanded ? "shadow-2xl rounded-2xl" : "shadow-sm rounded-full hover:shadow-md hover:bg-white cursor-pointer"
        )}
        onClick={() => {
          if (!isExpanded) {
            setIsExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
      >
        <div className="w-12 h-12 flex items-center justify-center shrink-0 text-landing-primary pointer-events-none">
          <Search className={cn("transition-all duration-300", isExpanded ? "h-4 w-4 text-primary" : "h-5 w-5")} />
        </div>
        
        <div className="flex-1 min-w-0 h-full flex items-center">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className={cn(
              "h-full w-full bg-transparent border-none shadow-none focus-visible:ring-0 px-0 text-sm font-medium placeholder:text-muted-foreground/70 transition-opacity duration-300",
              isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            disabled={!isExpanded}
          />
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="shrink-0 px-1"
            >
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={(e) => {
                      e.stopPropagation();
                      if (inputValue) {
                          setInputValue("");
                          setPredictions([]);
                          setIsOpen(false);
                      } else {
                          setIsExpanded(false);
                          setIsOpen(false);
                      }
                  }}
              >
                  <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isOpen && isExpanded && (inputValue.trim() || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[calc(100%+8px)] right-0 w-full min-w-[280px]"
            style={{ width: expandedWidth }}
          >
            <Card className="p-2 bg-white/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl overflow-hidden max-h-[50vh] overflow-y-auto">
              {inputValue.trim() ? (
                  <div className="space-y-1">
                    {predictions.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground font-medium">
                            No divine places found for "{inputValue}"
                        </div>
                    ) : (
                        predictions.map((p) => (
                        <button
                            key={p.place_id}
                            className="w-full flex items-start gap-3 p-3 text-left hover:bg-primary/5 rounded-xl transition-colors active:scale-[0.98]"
                            onClick={() => handleSelect(p.place_id, p.description)}
                        >
                            <div className="mt-0.5 p-2 bg-primary/10 rounded-lg shadow-sm">
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
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recent Journeys</span>
                          <Button variant="ghost" size="sm" onClick={clearRecent} className="h-6 px-2 text-[10px] uppercase font-bold hover:text-destructive">Clear</Button>
                      </div>
                      {recentSearches.map((place, i) => (
                          <button
                              key={`recent-${i}`}
                              className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 rounded-xl transition-colors active:scale-[0.98]"
                              onClick={() => handleRecentSelect(place)}
                          >
                              <div className="p-2 bg-muted rounded-lg shadow-sm">
                                <History className="h-4 w-4 text-muted-foreground" />
                              </div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
