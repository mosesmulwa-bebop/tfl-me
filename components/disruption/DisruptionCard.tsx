import { LineStatus } from '@/types/disruption';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBadge } from './StatusBadge';

interface DisruptionCardProps {
  lineStatus: LineStatus;
}

/**
 * DisruptionCard - Displays detailed information about a line disruption
 */
export const DisruptionCard: React.FC<DisruptionCardProps> = ({ lineStatus }) => {
  const { lineName, statusSeverityDescription, reason, disruption } = lineStatus;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.lineName}>{lineName}</Text>
        <StatusBadge 
          severity={lineStatus.statusSeverity} 
          description={statusSeverityDescription}
        />
      </View>
      
      {reason && (
        <Text style={styles.reason}>{reason}</Text>
      )}
      
      {disruption?.description && (
        <Text style={styles.description}>{disruption.description}</Text>
      )}
      
      {disruption?.closureText && (
        <View style={styles.closureBox}>
          <Text style={styles.closureText}>{disruption.closureText}</Text>
        </View>
      )}
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lineName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5C4B37',
  },
  reason: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#5C4B37',
    lineHeight: 20,
    marginBottom: 8,
  },
  closureBox: {
    backgroundColor: '#FFE4E1',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  closureText: {
    fontSize: 13,
    color: '#5C4B37',
    lineHeight: 18,
  },
});
