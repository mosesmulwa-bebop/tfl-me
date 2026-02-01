import AsyncStorage from '@react-native-async-storage/async-storage';

const COLLAPSED_LINES_KEY = '@stationly_collapsed_lines';

/**
 * Get collapsed lines for a specific station
 */
export const getCollapsedLines = async (stationId: string): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(`${COLLAPSED_LINES_KEY}_${stationId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting collapsed lines:', error);
    return [];
  }
};

/**
 * Save collapsed lines for a specific station
 */
export const saveCollapsedLines = async (stationId: string, lineIds: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(`${COLLAPSED_LINES_KEY}_${stationId}`, JSON.stringify(lineIds));
  } catch (error) {
    console.error('Error saving collapsed lines:', error);
  }
};

/**
 * Clear collapsed lines for a specific station
 */
export const clearCollapsedLines = async (stationId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`${COLLAPSED_LINES_KEY}_${stationId}`);
  } catch (error) {
    console.error('Error clearing collapsed lines:', error);
  }
};

/**
 * Clear all collapsed lines data
 */
export const clearAllCollapsedLines = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const collapsedKeys = keys.filter(key => key.startsWith(COLLAPSED_LINES_KEY));
    await AsyncStorage.multiRemove(collapsedKeys);
  } catch (error) {
    console.error('Error clearing all collapsed lines:', error);
  }
};
