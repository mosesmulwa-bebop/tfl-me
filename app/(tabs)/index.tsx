import { CollapsibleLineArrivals } from '@/components/arrival/CollapsibleLineArrivals';
import { DisruptionBanner } from '@/components/disruption/DisruptionBanner';
import { DisruptionCard } from '@/components/disruption/DisruptionCard';
import { StationCard } from '@/components/station/StationCard';
import { clearCollapsedLines, getCollapsedLines, saveCollapsedLines } from '@/services/storage/collapsedLines';
import { getLineOrder, saveLineOrder } from '@/services/storage/lineOrder';
import { useArrivalsStore } from '@/store/arrivalsStore';
import { useDisruptionsStore } from '@/store/disruptionsStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { Arrival } from '@/types/arrival';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

/**
 * Home Screen - Displays main station with real-time arrivals and relevant disruptions
 */
type LineGroup = {
  lineId: string;
  lineName: string;
  arrivals: Arrival[];
};

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [collapsedLines, setCollapsedLines] = useState<string[]>([]);
  const [lineOrder, setLineOrder] = useState<string[]>([]);
  const previousMainStationId = useRef<string | null>(null);
  const router = useRouter();

  // Zustand stores
  const { favorites, mainStationId, loadFavorites, isLoading: favoritesLoading } =
    useFavoritesStore();
  const { arrivals, fetchArrivals, isLoading: arrivalsLoading } = useArrivalsStore();
  const { lineStatuses, fetchLineStatus, getDisruptedLines } = useDisruptionsStore();

  const mainStation = favorites.find((fav) => fav.isMain);
  const allDisruptedLines = getDisruptedLines();

  // Get disruptions that affect the main station's lines
  const stationDisruptions = useMemo(() => {
    if (!mainStation || !mainStation.lines) return [];
    
    return allDisruptedLines.filter((disruptedLine) =>
      mainStation.lines?.some(
        (stationLine) =>
          stationLine.toLowerCase().includes(disruptedLine.lineName.toLowerCase()) ||
          disruptedLine.lineName.toLowerCase().includes(stationLine.toLowerCase())
      )
    );
  }, [mainStation, allDisruptedLines]);

  // Load favorites and collapsed lines on mount
  useEffect(() => {
    loadFavorites();
    fetchLineStatus();
  }, []);

  // Load collapsed lines and line order when main station changes
  useEffect(() => {
    const loadCollapsedState = async () => {
      if (mainStation) {
        // If main station changed, clear collapsed state
        if (previousMainStationId.current && previousMainStationId.current !== mainStation.id) {
          await clearCollapsedLines(previousMainStationId.current);
          setCollapsedLines([]);
        }
        
        // Load collapsed state and line order for current main station
        const collapsed = await getCollapsedLines(mainStation.id);
        const savedOrder = await getLineOrder(mainStation.id);
        setCollapsedLines(collapsed);
        setLineOrder(savedOrder);
        previousMainStationId.current = mainStation.id;
      }
    };
    
    loadCollapsedState();
  }, [mainStation?.id]);

  // Fetch arrivals for main station
  useEffect(() => {
    if (mainStation) {
      fetchArrivals(mainStation.id);
    }
  }, [mainStation?.id]);

  // Auto-refresh arrivals every 30 seconds
  useEffect(() => {
    if (!mainStation || !autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchArrivals(mainStation.id);
      fetchLineStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [mainStation?.id, autoRefreshEnabled]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadFavorites(),
      mainStation ? fetchArrivals(mainStation.id) : Promise.resolve(),
      fetchLineStatus(),
    ]);
    setRefreshing(false);
  };

  const mainStationArrivals = mainStation ? arrivals[mainStation.id] || [] : [];

  // Group arrivals by line and apply saved order
  const orderedLineGroups = useMemo(() => {
    const arrivalsByLine = mainStationArrivals.reduce((acc, arrival) => {
      if (!acc[arrival.lineName]) {
        acc[arrival.lineName] = {
          lineId: arrival.lineId,
          lineName: arrival.lineName,
          arrivals: [],
        };
      }
      acc[arrival.lineName].arrivals.push(arrival);
      return acc;
    }, {} as Record<string, LineGroup>);

    const lineGroups = Object.values(arrivalsByLine);

    // Apply saved order if it exists
    if (lineOrder.length > 0) {
      const orderedGroups: LineGroup[] = [];
      const unorderedGroups: LineGroup[] = [];

      // First, add lines in the saved order
      lineOrder.forEach(lineId => {
        const group = lineGroups.find(g => g.lineId === lineId);
        if (group) orderedGroups.push(group);
      });

      // Then add any new lines that aren't in the saved order
      lineGroups.forEach(group => {
        if (!lineOrder.includes(group.lineId)) {
          unorderedGroups.push(group);
        }
      });

      return [...orderedGroups, ...unorderedGroups];
    }

    return lineGroups;
  }, [mainStationArrivals, lineOrder]);

  // Handle line collapse toggle
  const handleToggleLineCollapse = async (lineId: string) => {
    if (!mainStation) return;
    
    const newCollapsedLines = collapsedLines.includes(lineId)
      ? collapsedLines.filter(id => id !== lineId)
      : [...collapsedLines, lineId];
    
    setCollapsedLines(newCollapsedLines);
    await saveCollapsedLines(mainStation.id, newCollapsedLines);
  };

  // Handle line reorder
  const handleDragEnd = async (data: LineGroup[]) => {
    if (!mainStation) return;
    
    const newOrder = data.map(group => group.lineId);
    setLineOrder(newOrder);
    await saveLineOrder(mainStation.id, newOrder);
  };

  // Render draggable line item
  const renderLineItem = ({ item, drag, isActive }: RenderItemParams<LineGroup>) => {
    return (
      <ScaleDecorator>
        <View style={[styles.draggableItem, isActive && styles.draggableItemActive]}>
          <CollapsibleLineArrivals
            lineName={item.lineName}
            lineId={item.lineId}
            arrivals={item.arrivals}
            isCollapsed={collapsedLines.includes(item.lineId)}
            onToggleCollapse={() => handleToggleLineCollapse(item.lineId)}
            persistCollapse={true}
            onDragStart={drag}
          />
        </View>
      </ScaleDecorator>
    );
  };

  // Render header with all content above arrivals
  const renderListHeader = () => (
    <View>
      {/* App Logo Header */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/stationly_with_slogan.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* General Disruption Banner (major system-wide issues) */}
      {allDisruptedLines.length > 0 && stationDisruptions.length === 0 && (
        <DisruptionBanner 
          disruptedLines={allDisruptedLines} 
          onPress={() => router.push('/disruptions')}
        />
      )}

      {/* Main Station Card */}
      <View style={styles.mainStationSection}>
        <Text style={styles.sectionTitle}>Your Main Station</Text>
        <StationCard station={mainStation!} showMainBadge={false} />
      </View>

      {/* Station-Specific Disruptions */}
      {stationDisruptions.length > 0 && (
        <View style={styles.disruptionsSection}>
          <Text style={styles.sectionTitle}>⚠️ Service Alerts</Text>
          {stationDisruptions.map((disruption) => (
            <DisruptionCard key={disruption.lineId} lineStatus={disruption} />
          ))}
        </View>
      )}

      {/* Arrivals Section Header */}
      <View style={styles.arrivalsSection}>
        <View style={styles.arrivalsSectionHeader}>
          <Text style={styles.sectionTitle}>Live Arrivals</Text>
          {arrivalsLoading && <ActivityIndicator size="small" color="#B8E6D5" />}
        </View>
        <Text style={styles.dragHint}>💡 Long press any line header to reorder</Text>
      </View>
    </View>
  );

  if (favoritesLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B8E6D5" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!mainStation) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚉</Text>
          <Text style={styles.emptyTitle}>No Main Station Set</Text>
          <Text style={styles.emptyMessage}>
            Add your first favorite station to get started!
          </Text>
          <Pressable 
            style={styles.addButton}
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.addButtonText}>+ Add Station</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {mainStationArrivals.length === 0 && !arrivalsLoading ? (
        <ScrollView
          style={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {renderListHeader()}
          <View style={styles.noArrivals}>
            <Text style={styles.noArrivalsText}>No upcoming arrivals</Text>
          </View>
        </ScrollView>
      ) : (
        <DraggableFlatList
          data={orderedLineGroups}
          onDragEnd={({ data }) => handleDragEnd(data)}
          keyExtractor={(item) => item.lineId}
          renderItem={renderLineItem}
          ListHeaderComponent={renderListHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={styles.flatListContainer}
        />
      )}
    </View>
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
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  logo: {
    width: '100%',
    height: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8B7355',
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
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#B8E6D5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4B37',
  },
  mainStationSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5C4B37',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  disruptionsSection: {
    marginTop: 16,
  },
  arrivalsSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  arrivalsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  noArrivals: {
    padding: 32,
    alignItems: 'center',
  },
  noArrivalsText: {
    fontSize: 16,
    color: '#8B7355',
  },
  dragHint: {
    fontSize: 13,
    color: '#8B7355',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  flatListContainer: {
    paddingBottom: 16,
  },
  draggableItem: {
    marginBottom: 0,
  },
  draggableItemActive: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
});
