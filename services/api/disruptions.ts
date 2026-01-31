import { TRANSPORT_MODES } from '@/constants/tfl';
import { TflLineStatus } from '@/types/api';
import { LineStatus } from '@/types/disruption';
import { tflClient } from './client';

/**
 * Get current line status for all lines (tube, dlr, elizabeth-line)
 * Returns status for all lines including disruptions
 */
export const getAllLineStatus = async (): Promise<LineStatus[]> => {
  try {
    const modes = TRANSPORT_MODES.join(',');
    const response = await tflClient.get<TflLineStatus[]>(`/Line/Mode/${modes}/Status`);

    console.log('Line status fetched:', response.data.length, 'lines');

    const lineStatuses: LineStatus[] = response.data.map((line) => {
      // Get the first status (most important one)
      const status = line.lineStatuses && line.lineStatuses[0];

      return {
        lineId: line.id,
        lineName: line.name,
        statusSeverity: status?.statusSeverity || 10,
        statusSeverityDescription: status?.statusSeverityDescription || 'Good Service',
        reason: status?.reason,
        disruption: status?.disruption,
      };
    });

    return lineStatuses;
  } catch (error) {
    console.error('Error fetching line status:', error);
    throw error;
  }
};

/**
 * Get line status for specific lines
 */
export const getLineStatus = async (lineIds: string[]): Promise<LineStatus[]> => {
  try {
    const ids = lineIds.join(',');
    const response = await tflClient.get<TflLineStatus[]>(`/Line/${ids}/Status`);

    const lineStatuses: LineStatus[] = response.data.map((line) => {
      const status = line.lineStatuses && line.lineStatuses[0];

      return {
        lineId: line.id,
        lineName: line.name,
        statusSeverity: status?.statusSeverity || 10,
        statusSeverityDescription: status?.statusSeverityDescription || 'Good Service',
        reason: status?.reason,
        disruption: status?.disruption,
      };
    });

    return lineStatuses;
  } catch (error) {
    console.error('Error fetching line status:', error);
    throw error;
  }
};

/**
 * Get disruptions for specific lines
 * Includes planned works and real-time disruptions
 */
export const getLineDisruptions = async (lineIds: string[]): Promise<any[]> => {
  try {
    const ids = lineIds.join(',');
    const response = await tflClient.get(`/Line/${ids}/Disruption`);

    console.log('Disruptions fetched for lines:', lineIds);

    return response.data || [];
  } catch (error) {
    console.error('Error fetching line disruptions:', error);
    return [];
  }
};

/**
 * Check if a line has good service (no disruptions)
 */
export const hasGoodService = (status: LineStatus): boolean => {
  return status.statusSeverity === 10 || status.statusSeverity >= 18;
};

/**
 * Check if a line has any delays
 */
export const hasDelays = (status: LineStatus): boolean => {
  return status.statusSeverity >= 6 && status.statusSeverity <= 9;
};

/**
 * Check if a line has severe disruptions
 */
export const hasSevereDisruption = (status: LineStatus): boolean => {
  return status.statusSeverity <= 5;
};

/**
 * Get a color code for the status severity
 */
export const getStatusColor = (status: LineStatus): string => {
  if (hasGoodService(status)) {
    return '#9DC183'; // Sage green
  } else if (hasDelays(status)) {
    return '#FFD4C9'; // Peach (minor issues)
  } else if (hasSevereDisruption(status)) {
    return '#FF9B85'; // Coral (severe)
  }
  return '#8B7355'; // Default brown
};

/**
 * Get a friendly description for status
 */
export const getStatusDescription = (status: LineStatus): string => {
  const desc = status.statusSeverityDescription;
  
  // Common status descriptions
  const statusMap: Record<string, string> = {
    'Good Service': '✅ Good Service',
    'Minor Delays': '⚠️ Minor Delays',
    'Severe Delays': '🚫 Severe Delays',
    'Part Closure': '🔧 Part Closure',
    'Planned Closure': '🔧 Planned Closure',
    'Part Suspended': '⛔ Part Suspended',
    'Suspended': '⛔ Suspended',
    'Reduced Service': '⚠️ Reduced Service',
    'Service Closed': '🚫 Service Closed',
    'Special Service': 'ℹ️ Special Service',
  };

  return statusMap[desc] || desc;
};

/**
 * Filter lines with disruptions only
 */
export const getDisruptedLines = (statuses: LineStatus[]): LineStatus[] => {
  return statuses.filter((status) => !hasGoodService(status));
};

/**
 * Sort lines by severity (worst first)
 */
export const sortBySeverity = (statuses: LineStatus[]): LineStatus[] => {
  return [...statuses].sort((a, b) => a.statusSeverity - b.statusSeverity);
};
