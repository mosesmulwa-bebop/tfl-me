import * as favoritesStorage from '@/services/storage/favorites';
import { FavoriteStation, Station } from '@/types/station';
import { create } from 'zustand';

interface FavoritesStore {
  favorites: FavoriteStation[];
  mainStationId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadFavorites: () => Promise<void>;
  addFavorite: (station: Station) => Promise<void>;
  removeFavorite: (stationId: string) => Promise<void>;
  setMainStation: (stationId: string) => Promise<void>;
  getMainStation: () => FavoriteStation | null;
  clearError: () => void;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],
  mainStationId: null,
  isLoading: false,
  error: null,

  loadFavorites: async () => {
    set({ isLoading: true, error: null });
    try {
      const favorites = await favoritesStorage.loadFavorites();
      const mainStationId = await favoritesStorage.getMainStationId();
      
      set({ 
        favorites, 
        mainStationId,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load favorites',
        isLoading: false 
      });
    }
  },

  addFavorite: async (station: Station) => {
    set({ isLoading: true, error: null });
    try {
      const newFavorite = await favoritesStorage.addFavorite(station);
      const { favorites } = get();
      
      set({ 
        favorites: [...favorites, newFavorite],
        mainStationId: newFavorite.isMain ? newFavorite.id : get().mainStationId,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add favorite',
        isLoading: false 
      });
      throw error;
    }
  },

  removeFavorite: async (stationId: string) => {
    set({ isLoading: true, error: null });
    try {
      await favoritesStorage.removeFavorite(stationId);
      const { favorites } = get();
      
      const updatedFavorites = favorites.filter(fav => fav.id !== stationId);
      const newMainStationId = updatedFavorites.find(fav => fav.isMain)?.id || null;
      
      set({ 
        favorites: updatedFavorites,
        mainStationId: newMainStationId,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to remove favorite',
        isLoading: false 
      });
      throw error;
    }
  },

  setMainStation: async (stationId: string) => {
    set({ isLoading: true, error: null });
    try {
      await favoritesStorage.setMainStation(stationId);
      const { favorites } = get();
      
      const updatedFavorites = favorites.map(fav => ({
        ...fav,
        isMain: fav.id === stationId,
      }));
      
      set({ 
        favorites: updatedFavorites,
        mainStationId: stationId,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to set main station',
        isLoading: false 
      });
      throw error;
    }
  },

  getMainStation: () => {
    const { favorites } = get();
    return favorites.find(fav => fav.isMain) || null;
  },

  clearError: () => set({ error: null }),
}));
