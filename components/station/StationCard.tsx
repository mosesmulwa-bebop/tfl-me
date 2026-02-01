import { FavoriteStation } from '@/types/station';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface StationCardProps {
  station: FavoriteStation;
  onPress?: () => void;
  onLongPress?: () => void;
  showMainBadge?: boolean;
}

/**
 * StationCard - Card component for displaying a station
 */
export const StationCard: React.FC<StationCardProps> = ({ 
  station, 
  onPress,
  onLongPress,
  showMainBadge = true,
}) => {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        station.isMain && styles.mainCard,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.stationName}>{station.name}</Text>
          {station.isMain && showMainBadge && (
            <View style={styles.mainBadge}>
              <Text style={styles.mainBadgeText}>⭐ Main</Text>
            </View>
          )}
        </View>
      </View>
      
      {station.lines && station.lines.length > 0 && (
        <View style={styles.linesContainer}>
          {station.lines.slice(0, 4).map((line, index) => (
            <View key={index} style={styles.linePill}>
              <Text style={styles.lineText}>{line}</Text>
            </View>
          ))}
          {station.lines.length > 4 && (
            <Text style={styles.moreLines}>+{station.lines.length - 4} more</Text>
          )}
        </View>
      )}
      
      <View style={styles.footer}>
        <Text style={styles.modesText}>
          {station.modes.join(' • ')}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.7,
  },
  mainCard: {
    borderWidth: 2,
    borderColor: '#B8E6D5',
    backgroundColor: '#F0FAF7',
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  stationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5C4B37',
    marginRight: 8,
  },
  mainBadge: {
    backgroundColor: '#B8E6D5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mainBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C4B37',
  },
  linesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  linePill: {
    backgroundColor: '#E0CFFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  lineText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5C4B37',
  },
  moreLines: {
    fontSize: 12,
    color: '#8B7355',
    alignSelf: 'center',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modesText: {
    fontSize: 12,
    color: '#8B7355',
    textTransform: 'capitalize',
  },
});
