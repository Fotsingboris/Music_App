import { StyleSheet, View, Alert } from 'react-native';
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
  const [currentIndex, setCurrentIndex] = useState(-1); // Will set to 0 after songs load
  const [screen, setScreen] = useState('Home');
  const [soundCache, setSoundCache] = useState({});
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Set up audio mode, load songs, and select first song
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentMode: true,
          interruptionModeAndroid: 1,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });

        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const media = await MediaLibrary.getAssetsAsync({ mediaType: 'audio', first: 1000 });
          console.log('Media assets loaded:', media.assets);
          if (media.assets.length > 0) {
            setSongs(media.assets);
            setCurrentIndex(0); // Select first song by default
          } else {
            Alert.alert('No Songs Found', 'No audio files were found on your device.');
          }
        } else {
          Alert.alert('Permission Denied', 'Please grant media permissions to load songs.');
        }
      } catch (error) {
        console.error('Error setting up audio or loading songs:', error);
        Alert.alert('Error', 'Failed to initialize app: ' + error.message);
      }
    })();
  }, []);

  // Monitor playback and auto-play next song when finished
  useEffect(() => {
    if (!sound) return;

    const handlePlaybackStatusUpdate = (status) => {
      if (status.isLoaded) {
        setPosition(status.positionMillis || 0);
        setDuration(status.durationMillis || 0);
        setIsPlaying(status.isPlaying);
        if (status.didJustFinish) {
          console.log('Song finished, playing next...');
          playNext(); // Auto-play next song
        }
      }
    };

    sound.setOnPlaybackStatusUpdate(handlePlaybackStatusUpdate);

    return () => {
      sound.setOnPlaybackStatusUpdate(null); // Cleanup listener
    };
  }, [sound, playNext]);

  const cleanCache = () => {
    const now = Date.now();
    setSoundCache((prevCache) => {
      const newCache = { ...prevCache };
      for (const uri in newCache) {
        if (now - newCache[uri].timestamp > 24 * 60 * 60 * 1000) {
          newCache[uri].sound.unloadAsync().catch((err) => console.error('Cache unload error:', err));
          delete newCache[uri];
        }
      }
      return newCache;
    });
  };

  async function playSong(index, playlistName = null) {
    const songList = playlistName ? playlists[playlistName] : songs;
    if (!songList || index >= songList.length || index < 0) {
      Alert.alert('Error', 'Invalid song index or empty playlist.');
      return;
    }

    const song = songList[index];
    const songUri = song.uri;

    cleanCache();

    try {
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
        await cachedSound.setStatusAsync({ shouldPlay: true });
      } else {
        if (sound) await sound.unloadAsync();
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: songUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setCurrentIndex(index);
        setCurrentPlaylist(playlistName);
        setIsPlaying(true);
        setSoundCache((prevCache) => ({
          ...prevCache,
          [songUri]: { sound: newSound, timestamp: Date.now() },
        }));
      }
    } catch (error) {
      console.error('Error playing song:', error);
      Alert.alert('Playback Error', 'Failed to play song: ' + error.message);
    }
  }

  async function pauseSong() {
    if (sound) {
      try {
        await sound.pauseAsync();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error pausing song:', error);
      }
    }
  }

  async function playNext() {
    const songList = currentPlaylist ? playlists[currentPlaylist] : songs;
    const nextIndex = currentIndex + 1;
    if (nextIndex < songList.length) {
      console.log('Moving to next song, index:', nextIndex);
      await playSong(nextIndex, currentPlaylist);
    } else {
      console.log('End of list reached, resetting to first song');
      setIsPlaying(false);
      setCurrentIndex(0); // Reset to first song
    }
  }

  async function playPrevious() {
    const songList = currentPlaylist ? playlists[currentPlaylist] : songs;
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) await playSong(prevIndex, currentPlaylist);
  }

  async function fastForward() {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        const newPosition = Math.min(status.positionMillis + 10000, status.durationMillis);
        await sound.setPositionAsync(newPosition);
      } catch (error) {
        console.error('Error fast forwarding:', error);
      }
    }
  }

  async function rewind() {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        const newPosition = Math.max(status.positionMillis - 10000, 0);
        await sound.setPositionAsync(newPosition);
      } catch (error) {
        console.error('Error rewinding:', error);
      }
    }
  }

  useEffect(() => {
    return sound ? () => sound.unloadAsync().catch((err) => console.error('Unload error:', err)) : undefined;
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
            setSongs={setSongs}
            playSong={playSong}
            playlists={playlists}
            setPlaylists={setPlaylists}
            currentIndex={currentIndex}
            currentPlaylist={currentPlaylist}
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