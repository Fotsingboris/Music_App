import {
    View,
    Text,
    FlatList,
    Button,
    Alert,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
  } from 'react-native';
  import { useState } from 'react';
  import TextTicker from 'react-native-text-ticker'; // Add this import
  
  export default function PlaylistScreen({ playlists, setPlaylists, playSong, songs }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [selectedSongs, setSelectedSongs] = useState([]);
  
    function createPlaylist() {
      setModalVisible(true);
    }
  
    function savePlaylist() {
      if (newPlaylistName && !playlists[newPlaylistName]) {
        setPlaylists((prev) => ({
          ...prev,
          [newPlaylistName]: selectedSongs,
        }));
        setModalVisible(false);
        setNewPlaylistName('');
        setSelectedSongs([]);
      } else if (!newPlaylistName) {
        Alert.alert('Error', 'Please enter a playlist name.');
      } else {
        Alert.alert('Error', 'Playlist name already exists.');
      }
    }
  
    function toggleSongSelection(song) {
      setSelectedSongs((prev) =>
        prev.includes(song)
          ? prev.filter((s) => s.id !== song.id)
          : [...prev, song]
      );
    }
  
    return (
      <View style={styles.container}>
        <Button title="Create Playlist" onPress={createPlaylist} />
        {Object.keys(playlists).map((playlistName) => (
          <View key={playlistName}>
            <Text style={styles.sectionTitle}>{playlistName}</Text>
            <FlatList
              data={playlists[playlistName]}
              renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => playSong(index, playlistName)}>
                  <TextTicker
                    style={styles.songTitle}
                    duration={10000}
                    loop
                    bounce={false}
                    repeatSpacer={50}
                    marqueeDelay={1000}
                  >
                    {item.filename}
                  </TextTicker>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
            />
          </View>
        ))}
  
        {/* Modal for creating playlist */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Playlist</Text>
              <TextInput
                style={styles.input}
                placeholder="Playlist Name"
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
              />
              <Text style={styles.sectionTitle}>Select Songs</Text>
              <FlatList
                data={songs}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.songItem,
                      selectedSongs.includes(item) && styles.selectedSongItem,
                    ]}
                    onPress={() => toggleSongSelection(item)}
                  >
                    <TextTicker
                      style={styles.songTitle}
                      duration={10000}
                      loop
                      bounce={false}
                      repeatSpacer={50}
                      marqueeDelay={1000}
                    >
                      {item.filename}
                    </TextTicker>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                style={styles.songList}
              />
              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} />
                <Button title="Save" onPress={savePlaylist} />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
    },
    sectionTitle: {
      fontSize: 18,
      marginVertical: 10,
    },
    songTitle: {
      fontSize: 16,
      padding: 10,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '80%',
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      marginBottom: 10,
      textAlign: 'center',
    },
    input: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 10,
      marginBottom: 10,
      borderRadius: 5,
    },
    songList: {
      maxHeight: '60%',
    },
    songItem: {
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#ccc',
    },
    selectedSongItem: {
      backgroundColor: '#e0f7fa',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
    },
  });