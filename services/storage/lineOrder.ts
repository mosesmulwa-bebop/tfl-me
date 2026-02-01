import AsyncStorage from '@react-native-async-storage/async-storage';

const LINE_ORDER_KEY_PREFIX = '@tfl_line_order_';

/**
 * Get the saved line order for a specific station
 */
export const getLineOrder = async (stationId: string): Promise<string[]> => {
  try {
    const key = `${LINE_ORDER_KEY_PREFIX}${stationId}`;
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Error loading line order:', error);
    return [];
  }
};

/**
 * Save the line order for a specific station
 */
export const saveLineOrder = async (stationId: string, lineIds: string[]): Promise<void> => {
  try {
    const key = `${LINE_ORDER_KEY_PREFIX}${stationId}`;
    await AsyncStorage.setItem(key, JSON.stringify(lineIds));
  } catch (error) {
    console.error('Error saving line order:', error);
  }
};

/**
 * Clear line order for a specific station
 */
export const clearLineOrder = async (stationId: string): Promise<void> => {
  try {
    const key = `${LINE_ORDER_KEY_PREFIX}${stationId}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing line order:', error);
  }
};

/**
 * Clear all line orders
 */
export const clearAllLineOrders = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const lineOrderKeys = keys.filter(key => key.startsWith(LINE_ORDER_KEY_PREFIX));
    await AsyncStorage.multiRemove(lineOrderKeys);
  } catch (error) {
    console.error('Error clearing all line orders:', error);
  }
};
