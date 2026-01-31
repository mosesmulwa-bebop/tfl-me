import { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  View, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import { searchStations } from '@/services/api/stations';
import { Station } from '@/types/station';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  const handleSearch = useCallback(async (text: string) => {
    setSearchQuery(text);
    setError(null);

    if (text.trim().length < 2) {
      setStations([]);
      return;
    }

    setLoading(true);
    try {
      const results = await searchStations(text);
      setStations(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search stations');
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
    setSearchQuery(station.name);
    setStations([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}> TfL Station Search</Text>
      <Text style={styles.subtitle}>Test the API Integration</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a station..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && (
          <ActivityIndicator style={styles.loader} size="small" color="#9364CD" />
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}> {error}</Text>
        </View>
      )}

      {selectedStation && (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedTitle}>Selected Station:</Text>
          <Text style={styles.stationName}>{selectedStation.name}</Text>
          <Text style={styles.stationInfo}>ID: {selectedStation.id}</Text>
          <Text style={styles.stationInfo}>
            Modes: {selectedStation.modes.join(', ')}
          </Text>
        </View>
      )}

      {stations.length > 0 && (
        <FlatList
          data={stations}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelectStation(item)}
            >
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultModes}>
                {item.modes.map(mode => {
                  if (mode === 'tube') return '';
                  if (mode === 'dlr') return '';
                  if (mode === 'elizabeth-line') return '';
                  return mode;
                }).join(' ')}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5C4B37',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E0CFFC',
  },
  loader: {
    position: 'absolute',
    right: 16,
  },
  errorContainer: {
    backgroundColor: '#FFD4C9',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#5C4B37',
    fontSize: 14,
  },
  selectedCard: {
    backgroundColor: '#B8E6D5',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5C4B37',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5C4B37',
    marginBottom: 4,
  },
  stationInfo: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 4,
  },
  resultsList: {
    marginTop: 12,
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0CFFC',
  },
  resultName: {
    fontSize: 16,
    color: '#5C4B37',
    flex: 1,
  },
  resultModes: {
    fontSize: 18,
  },
});
