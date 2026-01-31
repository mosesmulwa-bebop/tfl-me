import { TflArrival } from '@/types/api';
import { Arrival } from '@/types/arrival';
import { tflClient } from './client';

/**
 * Get real-time arrivals for a specific station
 * Returns trains arriving at the station sorted by time
 */
export const getStationArrivals = async (stationId: string): Promise<Arrival[]> => {
  try {
    const response = await tflClient.get<TflArrival[]>(`/StopPoint/${stationId}/Arrivals`);

    console.log(`Arrivals for ${stationId}:`, response.data.length, 'trains');

    // Transform TfL API response to our Arrival model
    const arrivals: Arrival[] = response.data
      .filter((arrival) => {
        // Only include our target transport modes
        const modeName = arrival.modeName?.toLowerCase();
        return (
          modeName === 'tube' ||
          modeName === 'dlr' ||
          modeName === 'elizabeth line' ||
          modeName === 'elizabeth-line'
        );
      })
      .map((arrival) => ({
        id: arrival.id,
        lineName: arrival.lineName,
        lineId: arrival.lineId,
        direction: arrival.direction,
        destinationName: arrival.destinationName,
        platformName: arrival.platformName || 'Platform Unknown',
        timeToStation: arrival.timeToStation,
        expectedArrival: new Date(arrival.expectedArrival),
        currentLocation: arrival.currentLocation,
        towards: arrival.towards,
      }))
      .sort((a, b) => a.timeToStation - b.timeToStation); // Sort by nearest first

    return arrivals;
  } catch (error) {
    console.error('Error fetching station arrivals:', error);
    throw error;
  }
};

/**
 * Get arrivals for a specific line
 * Useful for checking all trains on a particular line
 */
export const getLineArrivals = async (lineId: string): Promise<Arrival[]> => {
  try {
    const response = await tflClient.get<TflArrival[]>(`/Line/${lineId}/Arrivals`);

    const arrivals: Arrival[] = response.data
      .map((arrival) => ({
        id: arrival.id,
        lineName: arrival.lineName,
        lineId: arrival.lineId,
        direction: arrival.direction,
        destinationName: arrival.destinationName,
        platformName: arrival.platformName || 'Platform Unknown',
        timeToStation: arrival.timeToStation,
        expectedArrival: new Date(arrival.expectedArrival),
        currentLocation: arrival.currentLocation,
        towards: arrival.towards,
      }))
      .sort((a, b) => a.timeToStation - b.timeToStation);

    return arrivals;
  } catch (error) {
    console.error('Error fetching line arrivals:', error);
    throw error;
  }
};

/**
 * Format time to station in a human-readable format
 * "Due", "1 min", "2 mins", etc.
 */
export const formatTimeToStation = (seconds: number): string => {
  if (seconds < 30) {
    return 'Due';
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes === 1) {
    return '1 min';
  }

  return `${minutes} mins`;
};

/**
 * Group arrivals by line for better display
 */
export const groupArrivalsByLine = (arrivals: Arrival[]): Record<string, Arrival[]> => {
  return arrivals.reduce((groups, arrival) => {
    const line = arrival.lineName;
    if (!groups[line]) {
      groups[line] = [];
    }
    groups[line].push(arrival);
    return groups;
  }, {} as Record<string, Arrival[]>);
};

/**
 * Group arrivals by platform for better display
 */
export const groupArrivalsByPlatform = (arrivals: Arrival[]): Record<string, Arrival[]> => {
  return arrivals.reduce((groups, arrival) => {
    const platform = arrival.platformName;
    if (!groups[platform]) {
      groups[platform] = [];
    }
    groups[platform].push(arrival);
    return groups;
  }, {} as Record<string, Arrival[]>);
};
