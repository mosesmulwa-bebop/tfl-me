import { FavoriteStation, Station } from '@/types/station';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@stationly_favorites';
const MAIN_STATION_KEY = '@stationly_main_station';

/**
 * Load all favorite stations from AsyncStorage
 */
export const loadFavorites = async (): Promise<FavoriteStation[]> => {
  try {
    const favoritesJson = await AsyncStorage.getItem(FAVORITES_KEY);
    
    if (!favoritesJson) {
      return [];
    }

    const favorites = JSON.parse(favoritesJson);
    
    // Convert date strings back to Date objects
    return favorites.map((station: any) => ({
      ...station,
      addedAt: new Date(station.addedAt),
    }));
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

/**
 * Save favorite stations to AsyncStorage
 */
export const saveFavorites = async (stations: FavoriteStation[]): Promise<void> => {
  try {
    const favoritesJson = JSON.stringify(stations);
    await AsyncStorage.setItem(FAVORITES_KEY, favoritesJson);
  } catch (error) {
    console.error('Error saving favorites:', error);
    throw error;
  }
};

/**
 * Add a station to favorites
 */
export const addFavorite = async (station: Station): Promise<FavoriteStation> => {
  try {
    const favorites = await loadFavorites();
    
    // Check if already exists
    if (favorites.some(fav => fav.id === station.id)) {
      throw new Error('Station is already in favorites');
    }

    const newFavorite: FavoriteStation = {
      ...station,
      isFavorite: true,
      isMain: favorites.length === 0, // First favorite becomes main
      addedAt: new Date(),
    };

    const updatedFavorites = [...favorites, newFavorite];
    await saveFavorites(updatedFavorites);

    // If this is the first favorite, set it as main
    if (newFavorite.isMain) {
      await AsyncStorage.setItem(MAIN_STATION_KEY, station.id);
    }

    return newFavorite;
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
};

/**
 * Remove a station from favorites
 */
export const removeFavorite = async (stationId: string): Promise<void> => {
  try {
    const favorites = await loadFavorites();
    const stationToRemove = favorites.find(fav => fav.id === stationId);
    
    if (!stationToRemove) {
      return; // Station not in favorites
    }

    const updatedFavorites = favorites.filter(fav => fav.id !== stationId);
    
    // If removing the main station, set another as main
    if (stationToRemove.isMain && updatedFavorites.length > 0) {
      updatedFavorites[0].isMain = true;
      await AsyncStorage.setItem(MAIN_STATION_KEY, updatedFavorites[0].id);
    } else if (stationToRemove.isMain) {
      await AsyncStorage.removeItem(MAIN_STATION_KEY);
    }

    await saveFavorites(updatedFavorites);
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};

/**
 * Set a station as the main/primary station
 */
export const setMainStation = async (stationId: string): Promise<void> => {
  try {
    const favorites = await loadFavorites();
    
    // Find the station
    const stationIndex = favorites.findIndex(fav => fav.id === stationId);
    
    if (stationIndex === -1) {
      throw new Error('Station not found in favorites');
    }

    // Update isMain for all stations
    const updatedFavorites = favorites.map(fav => ({
      ...fav,
      isMain: fav.id === stationId,
    }));

    await saveFavorites(updatedFavorites);
    await AsyncStorage.setItem(MAIN_STATION_KEY, stationId);
  } catch (error) {
    console.error('Error setting main station:', error);
    throw error;
  }
};

/**
 * Get the current main station ID
 */
export const getMainStationId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(MAIN_STATION_KEY);
  } catch (error) {
    console.error('Error getting main station ID:', error);
    return null;
  }
};

/**
 * Get the main station object
 */
export const getMainStation = async (): Promise<FavoriteStation | null> => {
  try {
    const favorites = await loadFavorites();
    return favorites.find(fav => fav.isMain) || null;
  } catch (error) {
    console.error('Error getting main station:', error);
    return null;
  }
};

/**
 * Clear all favorites (for debugging/testing)
 */
export const clearAllFavorites = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(FAVORITES_KEY);
    await AsyncStorage.removeItem(MAIN_STATION_KEY);
  } catch (error) {
    console.error('Error clearing favorites:', error);
    throw error;
  }
};
