import { StyleSheet, View } from 'react-native';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import { useState, useEffect } from 'react';
import { MenuProvider } from 'react-native-popup-menu';
import Footer from './components/Footer';
import HomeScreen from './screens/HomeScreen';
import AllSongsScreen from './screens/AllSongsScreen';
import PlaylistScreen from './screens/PlaylistScreen';

export default function App() {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState({});
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [screen, setScreen] = useState('Home');
  const [soundCache, setSoundCache] = useState({}); // New state for caching sounds

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const media = await MediaLibrary.getAssetsAsync({ mediaType: 'audio', first: 1000 });
        setSongs(media.assets);
      }
    })();
  }, []);

  // Function to clean up expired cache entries
  const cleanCache = () => {
    const now = Date.now();
    setSoundCache((prevCache) => {
      const newCache = { ...prevCache };
      for (const uri in newCache) {
        if (now - newCache[uri].timestamp > 24 * 60 * 60 * 1000) { // 1 day in milliseconds
          newCache[uri].sound.unloadAsync(); // Unload expired sound
          delete newCache[uri];
        }
      }
      return newCache;
    });
  };

  async function playSong(index, playlistName = null) {
    const songList = playlistName ? playlists[playlistName] : songs;
    const song = songList[index];
    const songUri = song.uri;

    // Clean cache before playing to ensure we don't keep expired sounds
    cleanCache();

    // Check if song is in cache
    if (soundCache[songUri] && soundCache[songUri].sound) {
      if (sound && currentIndex === index && currentPlaylist === playlistName) {
        await sound.playAsync();
        setIsPlaying(true);
        return;
      }
      if (sound) await sound.unloadAsync();
      const cachedSound = soundCache[songUri].sound;
      setSound(cachedSound);
      setCurrentIndex(index);
      setCurrentPlaylist(playlistName);
      setIsPlaying(true);
      await cachedSound.playAsync();
    } else {
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: songUri });
      setSound(newSound);
      setCurrentIndex(index);
      setCurrentPlaylist(playlistName);
      setIsPlaying(true);
      // Add to cache with timestamp
      setSoundCache((prevCache) => ({
        ...prevCache,
        [songUri]: { sound: newSound, timestamp: Date.now() },
      }));
      await newSound.playAsync();
    }
  }

  async function pauseSong() {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  }

  async function playNext() {
    const songList = currentPlaylist ? playlists[currentPlaylist] : songs;
    const nextIndex = currentIndex + 1;
    if (nextIndex < songList.length) await playSong(nextIndex, currentPlaylist);
  }

  async function playPrevious() {
    const songList = currentPlaylist ? playlists[currentPlaylist] : songs;
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) await playSong(prevIndex, currentPlaylist);
  }

  async function fastForward() {
    if (sound) {
      const status = await sound.getStatusAsync();
      const newPosition = Math.min(status.positionMillis + 10000, status.durationMillis);
      await sound.setPositionAsync(newPosition);
    }
  }

  async function rewind() {
    if (sound) {
      const status = await sound.getStatusAsync();
      const newPosition = Math.max(status.positionMillis - 10000, 0);
      await sound.setPositionAsync(newPosition);
    }
  }

  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  const renderScreen = () => {
    switch (screen) {
      case 'Home':
        return (
          <HomeScreen
            sound={sound}
            isPlaying={isPlaying}
            currentSong={
              currentIndex >= 0
                ? (currentPlaylist ? playlists[currentPlaylist][currentIndex] : songs[currentIndex])
                : null
            }
            playSong={() => playSong(currentIndex, currentPlaylist)}
            pauseSong={pauseSong}
            playNext={playNext}
            playPrevious={playPrevious}
            fastForward={fastForward}
            rewind={rewind}
          />
        );
      case 'AllSongs':
        return (
          <AllSongsScreen
            songs={songs}
            setSongs={setSongs} // Pass setSongs to update songs state
            playSong={playSong}
            playlists={playlists}
            setPlaylists={setPlaylists}
            currentIndex={currentIndex} // Pass currentIndex
            currentPlaylist={currentPlaylist} // Pass currentPlaylist
          />
        );
      case 'Playlist':
        return (
          <PlaylistScreen
            playlists={playlists}
            setPlaylists={setPlaylists}
            playSong={playSong}
            songs={songs}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MenuProvider>
      <View style={styles.container}>
        <View style={styles.content}>{renderScreen()}</View>
        <Footer screen={screen} setScreen={setScreen} />
      </View>
    </MenuProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingTop: 50,
  },
});