import { View, Text, Animated, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useEffect, useRef, useState } from 'react';
import PlayerControls from '../components/PlayerControls';

export default function HomeScreen({ sound, isPlaying, currentSong, playSong, pauseSong, playNext, playPrevious, fastForward, rewind }) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isPlaying]);

  useEffect(() => {
    let interval;
    if (sound) {
      const initializeProgress = async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setDuration(status.durationMillis || 0);
          setPosition(status.positionMillis || 0);
        }
      };
      initializeProgress();

      interval = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          if (status.didJustFinish && isPlaying) {
            playNext();
          }
        }
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sound, isPlaying, playNext]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${paddedMinutes}:${paddedSeconds}`;
  };

  return (
    <View style={styles.container}>
      {/* Header with Song Title */}
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          {currentSong ? currentSong.filename : 'No Song Playing'}
        </Text>
      </View>

      {/* Disc Section */}
      <View style={styles.discContainer}>
        <Animated.View style={[styles.disc, { transform: [{ rotate: spin }] }]}>
          <View style={styles.discInner} />
        </Animated.View>
      </View>

      {/* Progress Slider */}
      {sound && duration > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={(value) => {
              sound.setPositionAsync(value);
              if (isPlaying) sound.playAsync();
            }}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#fff"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      )}

      {/* Spacer to push controls to the bottom */}
      <View style={styles.spacer} />

      {/* Player Controls at the Bottom, Centered */}
      <View style={styles.controlsContainer}>
        <PlayerControls
          isPlaying={isPlaying}
          playSong={playSong}
          pauseSong={pauseSong}
          playNext={playNext}
          playPrevious={playPrevious}
          fastForward={fastForward}
          rewind={rewind}
          iconColor="#fff" // Pass white color for icons
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background
    paddingVertical: 20,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff', // White text
    textAlign: 'center',
    fontWeight: 'bold',
  },
  discContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disc: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#007AFF', // Blue disc
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  discInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  progressContainer: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: 15,
  },
  timeText: {
    fontSize: 14,
    color: '#fff', // White text
    fontFamily: 'monospace',
  },
  spacer: {
    flex: 1,
  },
  controlsContainer: {
    width: '100%',
    paddingBottom: 20,
    alignItems: 'center', // Center controls horizontally
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slight white overlay
    borderTopWidth: 1,
    borderTopColor: '#007AFF', // Blue border
  },
});