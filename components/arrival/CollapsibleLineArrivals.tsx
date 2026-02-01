import { LINE_COLORS } from '@/constants/tfl';
import { formatTimeToStation } from '@/services/api/arrivals';
import { Arrival } from '@/types/arrival';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface CollapsibleLineArrivalsProps {
  lineName: string;
  lineId: string;
  arrivals: Arrival[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  persistCollapse?: boolean;
  onDragStart?: () => void;
}

/**
 * Groups arrivals by platform/direction
 */
const groupArrivalsByPlatform = (arrivals: Arrival[]) => {
  const grouped: Record<string, Arrival[]> = {};
  
  arrivals.forEach(arrival => {
    const key = arrival.platformName || arrival.direction || 'Unknown';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(arrival);
  });
  
  return grouped;
};

/**
 * CollapsibleLineArrivals - Displays arrivals for a line with collapsible sections by platform
 */
export const CollapsibleLineArrivals: React.FC<CollapsibleLineArrivalsProps> = ({
  lineName,
  lineId,
  arrivals,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse,
  persistCollapse = false,
  onDragStart,
}) => {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  
  const isCollapsed = persistCollapse ? externalIsCollapsed ?? false : internalIsCollapsed;
  
  const handleToggle = () => {
    if (persistCollapse && onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalIsCollapsed(!internalIsCollapsed);
    }
  };

  const lineColor = LINE_COLORS[lineId] || '#8B7355';
  const platformGroups = groupArrivalsByPlatform(arrivals);
  const totalArrivals = arrivals.length;

  return (
    <View style={styles.lineGroup}>
      {/* Collapsible Header */}
      <Pressable 
        style={styles.lineHeader} 
        onPress={handleToggle}
        onLongPress={onDragStart}
      >
        <View style={styles.lineHeaderLeft}>
          <View style={[styles.lineColorBar, { backgroundColor: lineColor }]} />
          <View>
            <Text style={styles.lineName}>{lineName}</Text>
            <Text style={styles.platformCount}>
              {Object.keys(platformGroups).length} platform{Object.keys(platformGroups).length !== 1 ? 's' : ''} • {totalArrivals} train{totalArrivals !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <Text style={styles.collapseIcon}>{isCollapsed ? '▶' : '▼'}</Text>
      </Pressable>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <View style={styles.platformsContainer}>
          {Object.entries(platformGroups).map(([platform, platformArrivals]) => (
            <View key={platform} style={styles.platformSection}>
              <Text style={styles.platformName}>{platform}</Text>
              {platformArrivals.slice(0, 3).map((arrival, index) => (
                <ArrivalItem key={`${arrival.id}-${index}`} arrival={arrival} />
              ))}
              {platformArrivals.length > 3 && (
                <Text style={styles.moreArrivals}>
                  +{platformArrivals.length - 3} more
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Arrival Item Component
 */
const ArrivalItem: React.FC<{ arrival: Arrival }> = ({ arrival }) => {
  return (
    <View style={styles.arrivalItem}>
      <View style={styles.arrivalLeft}>
        <Text style={styles.arrivalDestination}>{arrival.destinationName}</Text>
      </View>
      <Text style={styles.arrivalTime}>{formatTimeToStation(arrival.timeToStation)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  lineGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 14,
  },
  lineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lineColorBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  lineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5C4B37',
    marginBottom: 2,
  },
  platformCount: {
    fontSize: 12,
    color: '#8B7355',
  },
  collapseIcon: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 12,
  },
  platformsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  platformSection: {
    marginBottom: 16,
  },
  platformName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A90A4',
    marginBottom: 8,
    paddingLeft: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  arrivalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0E8',
  },
  arrivalLeft: {
    flex: 1,
  },
  arrivalDestination: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4B37',
  },
  arrivalTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5C4B37',
    marginLeft: 12,
  },
  moreArrivals: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
