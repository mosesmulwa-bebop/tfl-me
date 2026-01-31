import { TRANSPORT_MODES } from '@/constants/tfl';
import { TflStopPoint } from '@/types/api';
import { Station } from '@/types/station';
import { tflClient } from './client';

/**
 * Result type for station resolution
 */
export interface StationResolutionResult {
  success: boolean;
  station?: Station;
  alternatives?: Station[]; // Multiple stations found - user needs to choose
  error?: string;
}

/**
 * Resolve a station ID or name to the correct TfL station code(s)
 * Handles shortcodes, NaPTAN codes, and station names
 * Returns alternatives if multiple stations match (e.g., Bank has Underground + DLR)
 */
export const resolveStationId = async (input: string): Promise<StationResolutionResult> => {
  const trimmedInput = input.trim();
  
  // Check if it's already a valid TfL station code format
  const isValidFormat = /^(940GZZ(LU|DL)|910G)/i.test(trimmedInput);
  
  if (isValidFormat) {
    // Already correct format - use it directly without validation
    // This prevents the API from returning parent station IDs like HUBBAN
    console.log(`✅ Using provided station ID: ${trimmedInput}`);
    return { 
      success: true, 
      station: {
        id: trimmedInput,
        name: trimmedInput, // Will be updated when fetching arrivals
        modes: [],
      }
    };
  }

  // Search for the station by name
  console.log(`🔍 Resolving station ID/name: "${trimmedInput}"`);
  
  try {
    const results = await searchStations(trimmedInput);
    
    if (results.length === 0) {
      return {
        success: false,
        error: `No stations found matching "${trimmedInput}". Try using the full station name (e.g., "Bank", "Paddington").`,
      };
    }

    if (results.length === 1) {
      console.log(`✅ Auto-resolved "${trimmedInput}" to ${results[0].name} (${results[0].id})`);
      return {
        success: true,
        station: results[0],
      };
    }

    // Multiple matches - need user to disambiguate
    console.log(`🤔 Multiple stations found for "${trimmedInput}":`, results.map(s => s.name));
    return {
      success: false,
      alternatives: results,
      error: `Multiple stations found for "${trimmedInput}". Please select one.`,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to resolve station: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

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
        const hasValidMode = match.modes?.some((mode: string) => 
          TRANSPORT_MODES.includes(mode as any)
        );
        
        if (!hasValidMode) {
          return false;
        }
        
        // Only include stations with valid TfL station ID formats
        // Valid formats: 940GZZLU... (Underground), 940GZZDL... (DLR), 910G... (Elizabeth line)
        // This filters out parent station codes like HUBBAN that don't work with Arrivals API
        const hasValidId = /^(940GZZ(LU|DL)|910G)/i.test(match.id);
        
        if (!hasValidId) {
          console.log(`🚫 Filtered out station with invalid ID format: ${match.name} (${match.id})`);
        }
        
        return hasValidId;
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
 * Validate if a station ID exists and has valid transport modes
 * Helps identify incorrect station IDs
 * 
 * Note: Some station codes (like HUBBAN, NaPTAN codes) may be recognized by the 
 * StopPoint API but won't work with the Arrivals API. This function warns about that.
 */
export const validateStationId = async (stationId: string): Promise<{
  isValid: boolean;
  station?: Station;
  error?: string;
  warning?: string;
}> => {
  try {
    const station = await getStationById(stationId);
    
    if (!station) {
      return {
        isValid: false,
        error: `Station ID "${stationId}" not found`,
      };
    }

    const hasValidMode = station.modes.some(mode => 
      TRANSPORT_MODES.includes(mode as any)
    );

    if (!hasValidMode) {
      return {
        isValid: false,
        station,
        error: `Station "${station.name}" (${stationId}) does not support tube/DLR/Elizabeth line. Available modes: ${station.modes.join(', ')}`,
      };
    }

    // Check if the station ID format looks correct for arrivals
    // Valid formats: 940GZZLU... (Underground), 940GZZDL... (DLR), 910G... (Elizabeth line)
    const isStandardFormat = /^(940GZZ(LU|DL)|910G)/i.test(stationId);
    
    if (!isStandardFormat) {
      // Station exists but ID format might not work with Arrivals API
      return {
        isValid: false,
        station,
        error: `Station ID "${stationId}" is recognized as "${station.name}", but this ID format may not work with the Arrivals API. Please use the full TfL station code (e.g., 940GZZLUBNK for Bank). The provided ID "${stationId}" appears to be a NaPTAN or shortcode that won't return arrivals.`,
      };
    }

    return {
      isValid: true,
      station,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to validate station ID "${stationId}": ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
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
