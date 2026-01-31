import { TRANSPORT_MODES } from '@/constants/tfl';
import { TflStopPoint } from '@/types/api';
import { Station } from '@/types/station';
import { tflClient } from './client';

/**
 * Search for stations by name
 * Filters results to only include tube, dlr, and elizabeth-line stations
 */
export const searchStations = async (query: string): Promise<Station[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await tflClient.get('/StopPoint/Search', {
      params: {
        query: query.trim(),
        modes: TRANSPORT_MODES.join(','),
        maxResults: 20,
      },
    });

    console.log('Search response:', JSON.stringify(response.data, null, 2));

    // TfL API returns either an array directly or a wrapper object with matches
    let matches: any[] = [];
    
    if (Array.isArray(response.data)) {
      matches = response.data;
    } else if (response.data?.matches && Array.isArray(response.data.matches)) {
      matches = response.data.matches;
    } else {
      console.warn('Unexpected response structure:', response.data);
      return [];
    }

    // Transform TfL API response to our Station model
    const stations: Station[] = matches
      .filter((match) => {
        // Only include stations with our target transport modes
        return match.modes?.some((mode: string) => 
          TRANSPORT_MODES.includes(mode as any)
        );
      })
      .map((match) => ({
        id: match.id,
        name: match.name || match.commonName,
        modes: match.modes || [],
        lat: match.lat,
        lon: match.lon,
      }));

    return stations;
  } catch (error) {
    console.error('Error searching stations:', error);
    throw error;
  }
};

/**
 * Get detailed information about a specific station
 */
export const getStationById = async (stationId: string): Promise<Station | null> => {
  try {
    const response = await tflClient.get<TflStopPoint>(`/StopPoint/${stationId}`);
    const data = response.data;

    // Extract line names from the response
    const lines = data.lines?.map((line) => line.name) || [];

    return {
      id: data.id,
      name: data.commonName,
      modes: data.modes || [],
      lines,
      lat: data.lat,
      lon: data.lon,
    };
  } catch (error) {
    console.error('Error fetching station details:', error);
    return null;
  }
};

/**
 * Get all stations for specific transport modes
 * Note: This can return a lot of data, use with caution
 */
export const getStationsByMode = async (modes: string[]): Promise<Station[]> => {
  try {
    const response = await tflClient.get<TflStopPoint[]>('/StopPoint/Mode', {
      params: {
        modes: modes.join(','),
      },
    });

    const stations: Station[] = response.data.map((stopPoint) => ({
      id: stopPoint.id,
      name: stopPoint.commonName,
      modes: stopPoint.modes || [],
      lines: stopPoint.lines?.map((line) => line.name) || [],
      lat: stopPoint.lat,
      lon: stopPoint.lon,
    }));

    return stations;
  } catch (error) {
    console.error('Error fetching stations by mode:', error);
    throw error;
  }
};
