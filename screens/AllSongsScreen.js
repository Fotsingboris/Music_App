import { View, FlatList, StyleSheet, TextInput, Text } from 'react-native';
import { useState, useMemo } from 'react';
import SongItem from '../components/SongItem';
import { Picker } from '@react-native-picker/picker';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AllSongsScreen({ songs, setSongs, playSong, playlists, setPlaylists, currentIndex, currentPlaylist }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('A-Z');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const batchSize = 50;

  // Memoize filtered and sorted songs
  const filteredAndSortedSongs = useMemo(() => {
    const filtered = songs.filter((song) =>
      song.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'Latest':
          return (b.creationTime || 0) - (a.creationTime || 0);
        case 'Oldest':
          return (a.creationTime || 0) - (b.creationTime || 0);
        case 'Modified':
          return (b.modificationTime || 0) - (a.modificationTime || 0);
        case 'A-Z':
          return a.filename.localeCompare(b.filename);
        case 'Z-A':
          return b.filename.localeCompare(a.filename);
        default:
          return 0;
      }
    });
  }, [songs, searchQuery, sortOption]);

  // Lazy load more songs
  const loadMoreSongs = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const currentCount = songs.length;
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'audio',
      first: currentCount + batchSize,
      after: songs[songs.length - 1].id, // Start after the last loaded song
    });

    if (media.assets.length > 0) {
      const newSongs = [...songs, ...media.assets.filter((song) => !songs.some((s) => s.id === song.id))];
      setSongs(newSongs);
      await AsyncStorage.setItem('cachedSongs', JSON.stringify(newSongs));
      setHasMore(media.hasNextPage);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search songs..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Sort Picker */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <Picker
          selectedValue={sortOption}
          style={styles.picker}
          onValueChange={(itemValue) => setSortOption(itemValue)}
        >
          <Picker.Item label="A-Z" value="A-Z" />
          <Picker.Item label="Z-A" value="Z-A" />
          <Picker.Item label="Latest" value="Latest" />
          <Picker.Item label="Oldest" value="Oldest" />
          <Picker.Item label="Modified" value="Modified" />
        </Picker>
      </View>

      {/* Song List */}
      <FlatList
        data={filteredAndSortedSongs}
        renderItem={({ item, index }) => {
          const originalIndex = songs.indexOf(item); // Get the original index in the songs array
          const isPlaying = currentPlaylist === null && originalIndex === currentIndex; // Only highlight if not in a playlist
          return (
            <SongItem
              song={item}
              index={originalIndex}
              playSong={playSong}
              playlists={playlists}
              setPlaylists={setPlaylists}
              isPlaying={isPlaying} // Pass isPlaying prop to SongItem
            />
          );
        }}
        keyExtractor={(item) => item.id}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        onEndReached={loadMoreSongs}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <Text>Loading more...</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sortLabel: {
    fontSize: 16,
    marginRight: 10,
    
  },
  picker: {
    marginBottom: 10,
    margintop: 10,
    flex: 1,
    height: 40,
  },
});