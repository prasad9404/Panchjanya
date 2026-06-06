import { create } from 'zustand';
import { YatraLocation } from '@/shared/components/features/YatraMap';

interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

interface YatraStoreState {
  selectedRoute: string;
  selectedSubRoute: string | null;
  searchedPlace: any | null;
  currentIndex: number;
  
  // Panel States
  isMobileSheetOpen: boolean;
  isSidebarOpen: boolean;
  
  // Map actions
  forceFocusTimestamp: number;
  centerFullRouteTimestamp: number;
  
  // Route Data
  currentRouteData: RouteData | null;
  
  // Actions
  setSelectedRoute: (routeId: string) => void;
  setSelectedSubRoute: (subRouteId: string | null) => void;
  setSearchedPlace: (place: any | null) => void;
  setCurrentIndex: (index: number) => void;
  setIsMobileSheetOpen: (isOpen: boolean) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  triggerForceFocus: () => void;
  triggerCenterFullRoute: () => void;
  setCurrentRouteData: (data: RouteData | null) => void;
}

export const useYatraStore = create<YatraStoreState>((set) => ({
  selectedRoute: 'swami-complete',
  selectedSubRoute: null,
  searchedPlace: null,
  currentIndex: 0,
  
  isMobileSheetOpen: false,
  isSidebarOpen: true,
  
  forceFocusTimestamp: 0,
  centerFullRouteTimestamp: 0,
  
  currentRouteData: null,
  
  setSelectedRoute: (routeId) => set({ selectedRoute: routeId, currentIndex: 0, searchedPlace: null }),
  setSelectedSubRoute: (subRouteId) => set({ selectedSubRoute: subRouteId, currentIndex: 0, searchedPlace: null }),
  setSearchedPlace: (place) => set({ searchedPlace: place }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  
  setIsMobileSheetOpen: (isOpen) => set({ isMobileSheetOpen: isOpen }),
  setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  
  triggerForceFocus: () => set({ forceFocusTimestamp: Date.now() }),
  triggerCenterFullRoute: () => set({ centerFullRouteTimestamp: Date.now() }),
  
  setCurrentRouteData: (data) => set({ currentRouteData: data }),
}));
