import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function Footer({ screen, setScreen }) {
  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.footerItem} onPress={() => setScreen('Home')}>
        <Icon name="home" size={30} color={screen === 'Home' ? '#007AFF' : '#000'} />
        <Text>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerItem} onPress={() => setScreen('AllSongs')}>
        <Icon name="music-note" size={30} color={screen === 'AllSongs' ? '#007AFF' : '#000'} />
        <Text>All Songs</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerItem} onPress={() => setScreen('Playlist')}>
        <Icon name="playlist-play" size={30} color={screen === 'Playlist' ? '#007AFF' : '#000'} />
        <Text>Playlist</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  footerItem: {
    alignItems: 'center',
  },
});