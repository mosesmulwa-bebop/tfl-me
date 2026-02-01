import { getStationArrivals } from '@/services/api/arrivals';
import { Arrival } from '@/types/arrival';
import { create } from 'zustand';

interface ArrivalsStore {
  arrivals: Record<string, Arrival[]>; // stationId -> arrivals
  isLoading: boolean;
  error: string | null;
  lastUpdated: Record<string, Date>; // stationId -> last update time
  
  // Actions
  fetchArrivals: (stationId: string) => Promise<void>;
  clearArrivals: (stationId: string) => void;
  clearError: () => void;
}

export const useArrivalsStore = create<ArrivalsStore>((set, get) => ({
  arrivals: {},
  isLoading: false,
  error: null,
  lastUpdated: {},

  fetchArrivals: async (stationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const arrivals = await getStationArrivals(stationId);
      
      set(state => ({ 
        arrivals: {
          ...state.arrivals,
          [stationId]: arrivals,
        },
        lastUpdated: {
          ...state.lastUpdated,
          [stationId]: new Date(),
        },
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch arrivals',
        isLoading: false 
      });
    }
  },

  clearArrivals: (stationId: string) => {
    set(state => {
      const { [stationId]: _, ...remainingArrivals } = state.arrivals;
      const { [stationId]: __, ...remainingUpdated } = state.lastUpdated;
      
      return {
        arrivals: remainingArrivals,
        lastUpdated: remainingUpdated,
      };
    });
  },

  clearError: () => set({ error: null }),
}));
