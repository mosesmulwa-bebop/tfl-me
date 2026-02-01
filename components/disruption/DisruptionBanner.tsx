import { LineStatus } from '@/types/disruption';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface DisruptionBannerProps {
  disruptedLines: LineStatus[];
  onPress?: () => void;
}

/**
 * DisruptionBanner - Shows a warning banner when there are service disruptions
 * Displays at the top of screens to alert users
 */
export const DisruptionBanner: React.FC<DisruptionBannerProps> = ({ 
  disruptedLines, 
  onPress 
}) => {
  if (disruptedLines.length === 0) {
    return null;
  }

  // Get the most severe disruption
  const mostSevere = disruptedLines.reduce((prev, current) => 
    current.statusSeverity < prev.statusSeverity ? current : prev
  );

  const getSeverityColor = (severity: number) => {
    if (severity >= 6) return '#FFD4C9'; // Peach - Minor issues
    return '#FF9B85'; // Coral - Major issues
  };

  const getBannerText = () => {
    if (disruptedLines.length === 1) {
      return `${disruptedLines[0].lineName}: ${disruptedLines[0].statusSeverityDescription}`;
    }
    return `${disruptedLines.length} lines experiencing delays`;
  };

  return (
    <Pressable 
      style={[styles.banner, { backgroundColor: getSeverityColor(mostSevere.statusSeverity) }]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⚠️</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.text}>{getBannerText()}</Text>
        {onPress && (
          <Text style={styles.tapText}>Tap for details</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4B37',
    marginBottom: 2,
  },
  tapText: {
    fontSize: 12,
    color: '#8B7355',
  },
});
