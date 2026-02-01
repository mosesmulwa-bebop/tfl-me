import { DisruptionCard } from '@/components/disruption/DisruptionCard';
import { StatusBadge } from '@/components/disruption/StatusBadge';
import { useDisruptionsStore } from '@/store/disruptionsStore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

/**
 * Disruptions Screen - Displays service status for all lines
 */
export default function DisruptionsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    lineStatuses, 
    fetchLineStatus, 
    isLoading,
    getDisruptedLines,
    getGoodServiceLines,
    lastUpdated,
  } = useDisruptionsStore();

  const disruptedLines = getDisruptedLines();
  const goodServiceLines = getGoodServiceLines();

  // Load line status on mount
  useEffect(() => {
    fetchLineStatus();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLineStatus();
    setRefreshing(false);
  };

  if (isLoading && lineStatuses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B8E6D5" />
        <Text style={styles.loadingText}>Loading line status...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Service Status</Text>
        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Disrupted Lines Section */}
      {disruptedLines.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚠️ Service Disruptions</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{disruptedLines.length}</Text>
            </View>
          </View>
          
          {disruptedLines.map(line => (
            <DisruptionCard key={line.lineId} lineStatus={line} />
          ))}
        </View>
      )}

      {/* Good Service Section */}
      {goodServiceLines.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✅ Good Service</Text>
            <View style={[styles.countBadge, styles.goodServiceBadge]}>
              <Text style={styles.countText}>{goodServiceLines.length}</Text>
            </View>
          </View>
          
          <View style={styles.goodServiceContainer}>
            {goodServiceLines.map(line => (
              <View key={line.lineId} style={styles.goodServiceItem}>
                <Text style={styles.goodServiceLine}>{line.lineName}</Text>
                <StatusBadge 
                  severity={line.statusSeverity} 
                  description={line.statusSeverityDescription}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* No Data State */}
      {lineStatuses.length === 0 && !isLoading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚇</Text>
          <Text style={styles.emptyTitle}>No Status Data</Text>
          <Text style={styles.emptyMessage}>
            Pull down to refresh and check service status
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8B7355',
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5C4B37',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#8B7355',
  },
  section: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5C4B37',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#FF9B85',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  goodServiceBadge: {
    backgroundColor: '#9DC183',
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goodServiceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goodServiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0E8',
  },
  goodServiceLine: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4B37',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5C4B37',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
  },
});
