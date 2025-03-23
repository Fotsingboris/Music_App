import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import TextTicker from 'react-native-text-ticker';

export default function SongItem({ song, index, playSong, playlists, setPlaylists, isPlaying }) {
  const addToPlaylist = (playlistName) => {
    setPlaylists((prev) => ({
      ...prev,
      [playlistName]: prev[playlistName] ? [...prev[playlistName], song] : [song],
    }));
  };

  return (
    <View style={[styles.songItem, isPlaying ? styles.playing : null]}>
      <TouchableOpacity onPress={() => playSong(index)}>
        <TextTicker
          style={[styles.songTitle, isPlaying ? styles.playingText : null]}
          duration={10000} // Animation duration in ms
          loop
          bounce={false}
          repeatSpacer={50}
          marqueeDelay={1000}
        >
          {song.filename}
        </TextTicker>
      </TouchableOpacity>
      <Menu>
        <MenuTrigger>
          <Icon name="more-vert" size={24} color={isPlaying ? '#fff' : '#000'} />
        </MenuTrigger>
        <MenuOptions>
          {Object.keys(playlists).map((playlistName) => (
            <MenuOption
              key={playlistName}
              onSelect={() => addToPlaylist(playlistName)}
              text={`Add to ${playlistName}`}
            />
          ))}
          <MenuOption
            onSelect={() => {
              Alert.prompt('New Playlist', 'Enter playlist name:', (newName) => {
                if (newName && !playlists[newName]) {
                  setPlaylists((prev) => ({ ...prev, [newName]: [song] }));
                } else if (newName) {
                  addToPlaylist(newName);
                }
              });
            }}
            text="Add to New Playlist"
          />
        </MenuOptions>
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  songItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  songTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 10,
    color: '#000', // Default text color
  },
  playing: {
    backgroundColor: '#007AFF', // Blue background for playing song
  },
  playingText: {
    color: '#fff', // White text for contrast when playing
  },
});