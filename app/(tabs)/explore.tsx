import { CollapsibleLineArrivals } from '@/components/arrival/CollapsibleLineArrivals';
import { DisruptionCard } from '@/components/disruption/DisruptionCard';
import { searchStations } from '@/services/api/stations';
import { useArrivalsStore } from '@/store/arrivalsStore';
import { useDisruptionsStore } from '@/store/disruptionsStore';
import { useFavoritesStore } from '@/store/favoritesStore';
import { Arrival } from '@/types/arrival';
import { Station } from '@/types/station';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

/**
 * Explore Screen - Search stations and view their live arrivals
 */
export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Station[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const { favorites, addFavorite, removeFavorite } = useFavoritesStore();
  const { arrivals, fetchArrivals, isLoading: arrivalsLoading } = useArrivalsStore();
  const { lineStatuses, fetchLineStatus, getDisruptedLines } = useDisruptionsStore();

  const allDisruptedLines = getDisruptedLines();

  // Get disruptions affecting the selected station
  const stationDisruptions = useMemo(() => {
    if (!selectedStation || !selectedStation.lines) return [];

    return allDisruptedLines.filter((disruptedLine) =>
      selectedStation.lines?.some(
        (stationLine) =>
          stationLine.toLowerCase().includes(disruptedLine.lineName.toLowerCase()) ||
          disruptedLine.lineName.toLowerCase().includes(stationLine.toLowerCase())
      )
    );
  }, [selectedStation, allDisruptedLines]);

  // Load line status on mount
  useEffect(() => {
    fetchLineStatus();
  }, []);

  // Fetch arrivals when station is selected
  useEffect(() => {
    if (selectedStation) {
      fetchArrivals(selectedStation.id);
    }
  }, [selectedStation?.id]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSelectedStation(null);
    try {
      const results = await searchStations(searchQuery);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search stations');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
    setSearchResults([]);
  };

  const handleAddFavorite = async (station: Station) => {
    try {
      await addFavorite(station);
      Alert.alert('Success', `${station.name} added to favorites!`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add favorite');
    }
  };

  const handleRemoveFavorite = async (stationId: string) => {
    try {
      await removeFavorite(stationId);
      Alert.alert('Success', 'Station removed from favorites');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove favorite');
    }
  };

  const isStationFavorited = (stationId: string) => {
    return favorites.some((fav) => fav.id === stationId);
  };

  const stationArrivals = selectedStation ? arrivals[selectedStation.id] || [] : [];

  // Group arrivals by line
  const arrivalsByLine = stationArrivals.reduce((acc, arrival) => {
    if (!acc[arrival.lineName]) {
      acc[arrival.lineName] = [];
    }
    acc[arrival.lineName].push(arrival);
    return acc;
  }, {} as Record<string, Arrival[]>);

  return (
    <ScrollView style={styles.container}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <Text style={styles.title}>Explore Stations</Text>

        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for any station..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Pressable style={styles.searchButton} onPress={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <ActivityIndicator color="#5C4B37" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </Pressable>
        </View>

        {/* Quick Search Buttons */}
        <View style={styles.quickSearchSection}>
          <Text style={styles.sectionTitle}>Quick Search</Text>
          <View style={styles.quickButtons}>
            <Pressable
              style={styles.quickButton}
              onPress={() => {
                setSearchQuery('Bank');
                handleSearch();
              }}
            >
              <Text style={styles.quickButtonText}>Bank</Text>
            </Pressable>
            <Pressable
              style={styles.quickButton}
              onPress={() => {
                setSearchQuery('Paddington');
                handleSearch();
              }}
            >
              <Text style={styles.quickButtonText}>Paddington</Text>
            </Pressable>
            <Pressable
              style={styles.quickButton}
              onPress={() => {
                setSearchQuery("King's Cross");
                handleSearch();
              }}
            >
              <Text style={styles.quickButtonText}>King's Cross</Text>
            </Pressable>
            <Pressable
              style={styles.quickButton}
              onPress={() => {
                setSearchQuery('Liverpool Street');
                handleSearch();
              }}
            >
              <Text style={styles.quickButtonText}>Liverpool St</Text>
            </Pressable>
          </View>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Search Results - Tap to View</Text>
            {searchResults.map((station) => (
              <Pressable
                key={station.id}
                style={styles.resultItem}
                onPress={() => handleSelectStation(station)}
              >
                <View style={styles.stationInfo}>
                  <Text style={styles.stationName}>{station.name}</Text>
                  <Text style={styles.stationModes}>{station.modes.join(' • ')}</Text>
                </View>
                <Text style={styles.viewArrow}>→</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Selected Station Details */}
      {selectedStation && (
        <View style={styles.stationDetailsSection}>
          {/* Station Header */}
          <View style={styles.stationHeader}>
            <View style={styles.stationHeaderTop}>
              <View style={styles.stationTitleContainer}>
                <Text style={styles.stationTitle}>{selectedStation.name}</Text>
                {selectedStation.lines && selectedStation.lines.length > 0 && (
                  <View style={styles.linesContainer}>
                    {selectedStation.lines.slice(0, 3).map((line, index) => (
                      <View key={index} style={styles.linePill}>
                        <Text style={styles.lineText}>{line}</Text>
                      </View>
                    ))}
                    {selectedStation.lines.length > 3 && (
                      <Text style={styles.moreLines}>+{selectedStation.lines.length - 3}</Text>
                    )}
                  </View>
                )}
              </View>

              {isStationFavorited(selectedStation.id) ? (
                <Pressable
                  style={[styles.favoriteButton, styles.removeFavoriteButton]}
                  onPress={() => handleRemoveFavorite(selectedStation.id)}
                >
                  <Text style={styles.favoriteButtonText}>★ Remove</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.favoriteButton}
                  onPress={() => handleAddFavorite(selectedStation)}
                >
                  <Text style={styles.favoriteButtonText}>☆ Add</Text>
                </Pressable>
              )}
            </View>

            <Pressable style={styles.backButton} onPress={() => setSelectedStation(null)}>
              <Text style={styles.backButtonText}>← Back to Search</Text>
            </Pressable>
          </View>

          {/* Station Disruptions */}
          {stationDisruptions.length > 0 && (
            <View style={styles.disruptionsSection}>
              <Text style={styles.sectionTitle}>⚠️ Service Alerts</Text>
              {stationDisruptions.map((disruption) => (
                <DisruptionCard key={disruption.lineId} lineStatus={disruption} />
              ))}
            </View>
          )}

          {/* Live Arrivals */}
          <View style={styles.arrivalsSection}>
            <View style={styles.arrivalsSectionHeader}>
              <Text style={styles.sectionTitle}>Live Arrivals</Text>
              {arrivalsLoading && <ActivityIndicator size="small" color="#B8E6D5" />}
            </View>

            {stationArrivals.length === 0 && !arrivalsLoading ? (
              <View style={styles.noArrivals}>
                <Text style={styles.noArrivalsText}>No upcoming arrivals</Text>
              </View>
            ) : (
              Object.entries(arrivalsByLine).map(([lineName, lineArrivals]) => (
                <CollapsibleLineArrivals
                  key={lineArrivals[0].lineId}
                  lineName={lineName}
                  lineId={lineArrivals[0].lineId}
                  arrivals={lineArrivals}
                  persistCollapse={false}
                />
              ))
            )}
          </View>
        </View>
      )}

      {/* Empty State */}
      {!selectedStation && searchResults.length === 0 && !isSearching && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Discover Stations</Text>
          <Text style={styles.emptyText}>
            Search for any station to see live arrivals and service status
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
  searchSection: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#5C4B37',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0CFFC',
  },
  searchButton: {
    backgroundColor: '#B8E6D5',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    minWidth: 80,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4B37',
  },
  quickSearchSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5C4B37',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    backgroundColor: '#FFF4C9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4B37',
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4B37',
    marginBottom: 4,
  },
  stationModes: {
    fontSize: 12,
    color: '#8B7355',
    textTransform: 'capitalize',
  },
  viewArrow: {
    fontSize: 20,
    color: '#B8E6D5',
    marginLeft: 12,
  },
  stationDetailsSection: {
    paddingBottom: 32,
  },
  stationHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stationTitleContainer: {
    flex: 1,
  },
  stationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5C4B37',
    marginBottom: 8,
  },
  linesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  linePill: {
    backgroundColor: '#E0CFFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
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
  favoriteButton: {
    backgroundColor: '#B8E6D5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  removeFavoriteButton: {
    backgroundColor: '#FFD4C9',
  },
  favoriteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4B37',
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#8B7355',
  },
  disruptionsSection: {
    marginBottom: 16,
  },
  arrivalsSection: {
    marginHorizontal: 16,
  },
  arrivalsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noArrivals: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  noArrivalsText: {
    fontSize: 16,
    color: '#8B7355',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
    marginTop: 60,
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
  emptyText: {
    fontSize: 16,
    color: '#8B7355',
    textAlign: 'center',
  },
});
