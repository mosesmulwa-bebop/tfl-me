import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusBadgeProps {
  severity: number;
  description: string;
}

/**
 * StatusBadge - Displays the service status with color coding
 * Severity levels:
 * 10 = Good Service (green)
 * 6-9 = Minor issues (yellow/orange)
 * 0-5 = Major issues (red)
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ severity, description }) => {
  const getStatusColor = () => {
    if (severity >= 10) return '#9DC183'; // Sage green - Good Service
    if (severity >= 6) return '#FFD300'; // Yellow - Minor issues
    return '#E32017'; // Red - Major issues
  };

  const getTextColor = () => {
    if (severity >= 10) return '#5C4B37'; // Dark brown
    if (severity >= 6) return '#5C4B37'; // Dark brown
    return '#FFFFFF'; // White for red background
  };

  return (
    <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
      <Text style={[styles.text, { color: getTextColor() }]}>
        {description}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
