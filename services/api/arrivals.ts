import { TflArrival } from '@/types/api';
import { Arrival } from '@/types/arrival';
import { tflClient } from './client';
import { resolveStationId, type StationResolutionResult } from './stations';

// Re-export for convenience
export type { StationResolutionResult };

/**
 * Get real-time arrivals for a specific station
 * Automatically resolves shortcodes and station names to proper TfL station IDs
 * Returns trains arriving at the station sorted by time
 * 
 * @throws Error if station cannot be resolved or if multiple stations found (disambiguation needed)
 */
export const getStationArrivals = async (stationId: string): Promise<Arrival[]> => {
  try {
    // Resolve station ID (handles shortcodes, names, etc.)
    const resolution = await resolveStationId(stationId);
    
    if (!resolution.success) {
      if (resolution.alternatives && resolution.alternatives.length > 0) {
        // Multiple stations found - throw error with alternatives
        const alternativesList = resolution.alternatives
          .map(s => `- ${s.name} (${s.id}) - ${s.modes.join(', ')}`)
          .join('\n');
        
        throw new Error(
          `Multiple stations found for "${stationId}":\n${alternativesList}\n\nPlease specify which station you want.`
        );
      }
      
      throw new Error(resolution.error || 'Failed to resolve station');
    }

    const resolvedStationId = resolution.station!.id;
    
    const response = await tflClient.get<TflArrival[]>(`/StopPoint/${resolvedStationId}/Arrivals`);

    console.log(`Arrivals for ${resolvedStationId}:`, response.data.length, 'trains');
    
    // Log all modes if no trains found to help debug
    if (response.data.length === 0) {
      console.warn(`⚠️ No arrivals found for station ${resolvedStationId}. This may be normal if no trains are currently scheduled.`);
    } else if (response.data.length > 0) {
      const modes = [...new Set(response.data.map(a => a.modeName))];
      console.log(`Available modes at ${resolvedStationId}:`, modes);
    }

    // Transform TfL API response to our Arrival model
    const arrivals: Arrival[] = response.data
      .filter((arrival) => {
        // Only include our target transport modes
        const modeName = arrival.modeName?.toLowerCase();
        const isRelevantMode = (
          modeName === 'tube' ||
          modeName === 'dlr' ||
          modeName === 'elizabeth line' ||
          modeName === 'elizabeth-line'
        );
        
        if (!isRelevantMode) {
          console.log(`🔍 Filtered out arrival: ${arrival.destinationName} (mode: "${arrival.modeName}", line: ${arrival.lineName})`);
        }
        
        return isRelevantMode;
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

    console.log(`✅ Returning ${arrivals.length} arrivals after filtering`);
    return arrivals;
  } catch (error) {
    console.error('Error fetching station arrivals:', error);
    throw error;
  }
};

/**
 * Check if a station ID needs disambiguation (returns multiple options)
 * Use this before calling getStationArrivals to handle cases like "Bank"
 * which could be Bank Underground or Bank DLR
 */
export const checkStationDisambiguation = async (
  stationId: string
): Promise<StationResolutionResult> => {
  return await resolveStationId(stationId);
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
