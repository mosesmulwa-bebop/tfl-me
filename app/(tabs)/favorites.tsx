import { StationCard } from '@/components/station/StationCard';
import { Dialog } from '@/components/ui/dialog';
import { Toast } from '@/components/ui/toast';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

/**
 * Favorites Screen - List and manage all favorite stations
 */
export default function FavoritesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    actions: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }>;
  }>({
    visible: false,
    title: '',
    message: '',
    actions: [],
  });
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });
  const router = useRouter();

  const {
    favorites,
    loadFavorites,
    removeFavorite,
    setMainStation,
    isLoading,
  } = useFavoritesStore();

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleSetMain = async (stationId: string, stationName: string) => {
    setDialogConfig({
      visible: true,
      title: 'Set Main Station',
      message: `Set ${stationName} as your main station?`,
      actions: [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {} 
        },
        {
          text: 'Set as Main',
          style: 'default',
          onPress: async () => {
            try {
              await setMainStation(stationId);
              setToast({
                visible: true,
                message: 'Main station updated!',
                type: 'success',
              });
            } catch (error) {
              setToast({
                visible: true,
                message: 'Failed to set main station',
                type: 'error',
              });
            }
          },
        },
      ],
    });
  };

  const handleRemove = async (stationId: string, stationName: string) => {
    setDialogConfig({
      visible: true,
      title: 'Remove Station',
      message: `Remove ${stationName} from favorites?`,
      actions: [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {} 
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFavorite(stationId);
              setToast({
                visible: true,
                message: 'Station removed',
                type: 'success',
              });
            } catch (error) {
              setToast({
                visible: true,
                message: 'Failed to remove station',
                type: 'error',
              });
            }
          },
        },
      ],
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#B8E6D5" />
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyMessage}>
            Search and add stations to quickly access their arrivals
          </Text>
          <Pressable 
            style={styles.addButton}
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.addButtonText}>+ Add Stations</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Stations</Text>
        <Text style={styles.subtitle}>{favorites.length} favorite{favorites.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Main Station */}
      {favorites.filter(station => station.isMain).map(station => (
        <View key={station.id}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Main Station</Text>
          </View>
          <StationCard
            station={station}
            showMainBadge={true}
            onPress={() => {
              // Navigate to station detail or home
              router.push('/');
            }}
            onLongPress={() => handleRemove(station.id, station.name)}
          />
          <Text style={styles.hintText}>Long press to remove • Shown on Home screen</Text>
        </View>
      ))}

      {/* Other Favorites */}
      {favorites.filter(station => !station.isMain).length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Other Favorites</Text>
          </View>
          {favorites
            .filter(station => !station.isMain)
            .map(station => (
              <View key={station.id}>
                <StationCard
                  station={station}
                  showMainBadge={false}
                  onPress={() => handleSetMain(station.id, station.name)}
                  onLongPress={() => handleRemove(station.id, station.name)}
                />
                <View style={styles.actionHints}>
                  <Text style={styles.hintText}>Tap to set as main • Long press to remove</Text>
                </View>
              </View>
            ))}
        </>
      )}

      {/* Add More Button */}
      <Pressable 
        style={styles.addMoreButton}
        onPress={() => router.push('/explore')}
      >
        <Text style={styles.addMoreButtonText}>+ Add More Stations</Text>
      </Pressable>

      {/* Dialog */}
      <Dialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        actions={dialogConfig.actions}
        onClose={() => setDialogConfig({ ...dialogConfig, visible: false })}
      />

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
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
  subtitle: {
    fontSize: 16,
    color: '#8B7355',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5C4B37',
  },
  hintText: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 8,
  },
  actionHints: {
    marginTop: -4,
    marginBottom: 8,
  },
  addMoreButton: {
    backgroundColor: '#E0CFFC',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  addMoreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5C4B37',
  },
});
