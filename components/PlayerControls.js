import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function PlayerControls({
  isPlaying,
  playSong,
  pauseSong,
  playNext,
  playPrevious,
  fastForward,
  rewind,
  iconColor = '#fff', // Default to white
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={rewind}>
        <Icon name="replay-10" size={30} color={iconColor} />
      </TouchableOpacity>
      <TouchableOpacity onPress={playPrevious}>
        <Icon name="skip-previous" size={30} color={iconColor} />
      </TouchableOpacity>
      <TouchableOpacity onPress={isPlaying ? pauseSong : playSong}>
        <Icon name={isPlaying ? 'pause' : 'play-arrow'} size={40} color={iconColor} />
      </TouchableOpacity>
      <TouchableOpacity onPress={playNext}>
        <Icon name="skip-next" size={30} color={iconColor} />
      </TouchableOpacity>
      <TouchableOpacity onPress={fastForward}>
        <Icon name="forward-10" size={30} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%', // Adjust width as needed
  },
});