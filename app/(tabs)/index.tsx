import { LINE_COLORS } from '@/constants/tfl';
import {
  checkStationDisambiguation,
  formatTimeToStation,
  getStationArrivals,
  groupArrivalsByLine
} from '@/services/api/arrivals';
import { getAllLineStatus } from '@/services/api/disruptions';
import { searchStations } from '@/services/api/stations';
import { Arrival } from '@/types/arrival';
import { LineStatus } from '@/types/disruption';
import { Station } from '@/types/station';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const RECENT_SEARCHES_KEY = '@stationly:recent_searches';
const MAX_RECENT_SEARCHES = 5;
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

// Transport Mode Badge Component
const TransportModeBadge = ({ mode }: { mode: string }) => {
  const getBadgeStyle = () => {
    switch (mode) {
      case 'tube':
        return { bg: '#E32017', icon: '🚇', label: 'Tube' };
      case 'dlr':
        return { bg: '#00A4A7', icon: '🚈', label: 'DLR' };
      case 'elizabeth-line':
        return { bg: '#9364CD', icon: '🚆', label: 'Elizabeth' };
      default:
        return { bg: '#8B7355', icon: '🚉', label: mode };
    }
  };

  const badge = getBadgeStyle();

  return (
    <View style={[styles.modeBadge, { backgroundColor: badge.bg }]}>
      <Text style={styles.modeBadgeIcon}>{badge.icon}</Text>
    </View>
  );
};

// Arrival Item Component
const ArrivalItem = ({ arrival }: { arrival: Arrival }) => {
  const lineColor = LINE_COLORS[arrival.lineId] || '#8B7355';
  
  return (
    <View style={styles.arrivalItem}>
      <View style={[styles.lineIndicator, { backgroundColor: lineColor }]} />
      <View style={styles.arrivalContent}>
        <View style={styles.arrivalHeader}>
          <Text style={styles.arrivalDestination}>{arrival.destinationName}</Text>
          <Text style={styles.arrivalTime}>{formatTimeToStation(arrival.timeToStation)}</Text>
        </View>
        <Text style={styles.arrivalPlatform}>{arrival.platformName}</Text>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [recentSearches, setRecentSearches] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [showRecentSearches, setShowRecentSearches] = useState(true);
  
  // Disambiguation state for stations with multiple options (e.g., Bank Underground vs Bank DLR)
  const [disambiguationOptions, setDisambiguationOptions] = useState<Station[]>([]);
  const [showDisambiguation, setShowDisambiguation] = useState(false);
  
  // Arrivals state
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [loadingArrivals, setLoadingArrivals] = useState(false);
  const [arrivalsError, setArrivalsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Line status state
  const [lineStatuses, setLineStatuses] = useState<LineStatus[]>([]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
    loadLineStatus();
  }, []);

  // Load arrivals when station is selected
  useEffect(() => {
    if (selectedStation) {
      fetchArrivals(selectedStation.id);
      // Set up auto-refresh
      refreshIntervalRef.current = setInterval(() => {
        fetchArrivals(selectedStation.id, true);
      }, AUTO_REFRESH_INTERVAL);
    } else {
      // Clear arrivals and stop refresh when no station selected
      setArrivals([]);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [selectedStation]);

  // Animate search results
  useEffect(() => {
    if (stations.length > 0 || recentSearches.length > 0 || arrivals.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [stations, recentSearches, arrivals]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load recent searches:', err);
    }
  };

  const saveRecentSearch = async (station: Station) => {
    try {
      const filtered = recentSearches.filter((s) => s.id !== station.id);
      const updated = [station, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (err) {
      console.error('Failed to save recent search:', err);
    }
  };

  const clearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (err) {
      console.error('Failed to clear recent searches:', err);
    }
  };

  const loadLineStatus = async () => {
    try {
      const statuses = await getAllLineStatus();
      setLineStatuses(statuses);
    } catch (err) {
      console.error('Failed to load line status:', err);
    }
  };

  const fetchArrivals = async (stationId: string, silent = false) => {
    if (!silent) {
      setLoadingArrivals(true);
    }
    setArrivalsError(null);

    try {
      const arrivalsData = await getStationArrivals(stationId);
      setArrivals(arrivalsData);
      setShowDisambiguation(false); // Clear any disambiguation UI
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load arrivals';
      
      // Check if error is about multiple stations (disambiguation needed)
      if (errorMessage.includes('Multiple stations found')) {
        // Try to get alternatives
        try {
          const resolution = await checkStationDisambiguation(stationId);
          if (resolution.alternatives && resolution.alternatives.length > 0) {
            setDisambiguationOptions(resolution.alternatives);
            setShowDisambiguation(true);
            setArrivalsError('Please select which station you want');
          } else {
            setArrivalsError(errorMessage);
          }
        } catch {
          setArrivalsError(errorMessage);
        }
      } else {
        setArrivalsError(errorMessage);
      }
      setArrivals([]);
    } finally {
      setLoadingArrivals(false);
    }
  };

  const handleRefresh = async () => {
    if (!selectedStation) return;
    
    setRefreshing(true);
    await Promise.all([
      fetchArrivals(selectedStation.id, true),
      loadLineStatus(),
    ]);
    setRefreshing(false);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    setError(null);
    setShowRecentSearches(text.trim().length === 0);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim().length < 2) {
      setStations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchStations(text);
        setStations(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search stations');
        setStations([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
    setSearchQuery(station.name);
    setStations([]);
    setShowRecentSearches(false);
    saveRecentSearch(station);
  };

  const renderStationItem = ({ item }: { item: Station }) => (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleSelectStation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.resultContent}>
          <Text style={styles.resultName}>{item.name}</Text>
          <View style={styles.modesContainer}>
            {item.modes?.map((mode, idx) => (
              <TransportModeBadge key={idx} mode={mode} />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const groupedArrivals = groupArrivalsByLine(arrivals);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#9364CD"
          colors={['#9364CD']}
        />
      }
    >
      {/* Logo Header */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/stationly_with_slogan.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Search Container */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a station..."
            placeholderTextColor="#8B7355"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {loading && (
            <ActivityIndicator style={styles.loader} size="small" color="#9364CD" />
          )}
        </View>
        <Text style={styles.searchHint}>
          Search for Underground, DLR, or Elizabeth Line stations
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </Animated.View>
      )}

      {/* Selected Station Card */}
      {selectedStation && (
        <Animated.View style={[styles.selectedCard, { opacity: fadeAnim }]}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedTitle}>Selected Station</Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedStation(null);
                setSearchQuery('');
                setShowRecentSearches(true);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.stationName}>{selectedStation.name}</Text>
          <View style={styles.stationDetails}>
            <View style={styles.modesContainer}>
              {selectedStation.modes?.map((mode, idx) => (
                <TransportModeBadge key={idx} mode={mode} />
              ))}
            </View>
          </View>
        </Animated.View>
      )}

      {/* Arrivals Section */}
      {selectedStation && (
        <View style={styles.arrivalsSection}>
          <View style={styles.arrivalsSectionHeader}>
            <Text style={styles.sectionTitle}>Live Arrivals</Text>
            <Text style={styles.refreshHint}>Pull down to refresh</Text>
          </View>

          {loadingArrivals && !refreshing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#9364CD" />
              <Text style={styles.loadingText}>Loading arrivals...</Text>
            </View>
          )}

          {arrivalsError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {arrivalsError}</Text>
              
              {/* Show disambiguation options if multiple stations found */}
              {showDisambiguation && disambiguationOptions.length > 0 && (
                <View style={styles.disambiguationContainer}>
                  <Text style={styles.disambiguationTitle}>Select a station:</Text>
                  {disambiguationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.disambiguationOption}
                      onPress={() => {
                        handleSelectStation(option);
                      }}
                    >
                      <View style={styles.disambiguationContent}>
                        <Text style={styles.disambiguationName}>{option.name}</Text>
                        <View style={styles.modesContainer}>
                          {option.modes.map((mode, idx) => (
                            <TransportModeBadge key={idx} mode={mode} />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.disambiguationId}>ID: {option.id}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {!loadingArrivals && !arrivalsError && arrivals.length === 0 && (
            <View style={styles.emptyArrivals}>
              <Text style={styles.emptyArrivalsIcon}>🚇</Text>
              <Text style={styles.emptyArrivalsText}>No upcoming arrivals</Text>
            </View>
          )}

          {!loadingArrivals && arrivals.length > 0 && (
            <View>
              {Object.entries(groupedArrivals).map(([lineName, lineArrivals]) => {
                const lineId = lineArrivals[0].lineId;
                const lineColor = LINE_COLORS[lineId] || '#8B7355';
                
                return (
                  <Animated.View key={lineName} style={{ opacity: fadeAnim }}>
                    <View style={[styles.lineHeader, { backgroundColor: lineColor + '20' }]}>
                      <View style={[styles.lineColorDot, { backgroundColor: lineColor }]} />
                      <Text style={styles.lineName}>{lineName}</Text>
                    </View>
                    {lineArrivals.slice(0, 3).map((arrival, index) => (
                      <ArrivalItem key={`${arrival.id}-${arrival.platformName}-${arrival.timeToStation}-${index}`} arrival={arrival} />
                    ))}
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Search Results */}
      {stations.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          <FlatList
            data={stations}
            keyExtractor={(item) => item.id}
            renderItem={renderStationItem}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Recent Searches */}
      {showRecentSearches && recentSearches.length > 0 && (
        <View style={styles.resultsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            keyExtractor={(item) => item.id}
            renderItem={renderStationItem}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Empty State */}
      {!loading &&
        !error &&
        !selectedStation &&
        stations.length === 0 &&
        searchQuery.length === 0 &&
        recentSearches.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>Start Searching</Text>
            <Text style={styles.emptyStateText}>
              Search for any London Underground, DLR, or Elizabeth Line station to see live arrivals
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
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: '100%',
    height: 80,
  },
  searchWrapper: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#5C4B37',
    borderWidth: 2,
    borderColor: '#E0CFFC',
    shadowColor: '#E0CFFC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loader: {
    position: 'absolute',
    right: 20,
  },
  searchHint: {
    fontSize: 12,
    color: '#8B7355',
    paddingHorizontal: 4,
  },
  errorContainer: {
    backgroundColor: '#FFD4C9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#5C4B37',
    fontSize: 14,
    textAlign: 'center',
  },
  selectedCard: {
    backgroundColor: '#B8E6D5',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#B8E6D5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4B37',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C4B37',
  },
  stationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5C4B37',
    marginBottom: 12,
  },
  stationDetails: {
    marginBottom: 8,
  },
  resultsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5C4B37',
    marginBottom: 12,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9364CD',
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0CFFC',
    shadowColor: '#E0CFFC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  resultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5C4B37',
    flex: 1,
    marginRight: 12,
  },
  modesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  modeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  modeBadgeIcon: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5C4B37',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Arrivals styles
  arrivalsSection: {
    marginBottom: 20,
  },
  arrivalsSectionHeader: {
    marginBottom: 16,
  },
  refreshHint: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#8B7355',
    fontSize: 14,
  },
  emptyArrivals: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0CFFC',
  },
  emptyArrivalsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyArrivalsText: {
    fontSize: 16,
    color: '#8B7355',
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    marginTop: 8,
  },
  lineColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  lineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5C4B37',
  },
  arrivalItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0CFFC',
    flexDirection: 'row',
  },
  lineIndicator: {
    width: 4,
  },
  arrivalContent: {
    flex: 1,
    padding: 12,
  },
  arrivalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  arrivalDestination: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5C4B37',
    flex: 1,
  },
  arrivalTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9364CD',
  },
  arrivalPlatform: {
    fontSize: 13,
    color: '#8B7355',
  },
  disambiguationContainer: {
    marginTop: 16,
    backgroundColor: '#F8F5FF',
    borderRadius: 12,
    padding: 16,
  },
  disambiguationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4B37',
    marginBottom: 12,
  },
  disambiguationOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0CFFC',
  },
  disambiguationContent: {
    marginBottom: 8,
  },
  disambiguationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5C4B37',
    marginBottom: 6,
  },
  disambiguationId: {
    fontSize: 12,
    color: '#8B7355',
    fontStyle: 'italic',
  },
});
