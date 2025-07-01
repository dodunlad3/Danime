import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
} from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const WatchingTab: React.FC = () => {
  const [watchingList, setWatchingList] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [episodeInput, setEpisodeInput] = useState("");
  const auth = getAuth();

  const fetchWatchingList = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const data = userDoc.data();

    setWatchingList(data?.currentlyWatching || []);
  };

  useEffect(() => {
    fetchWatchingList();
  }, []);

  const updateEpisode = async (anime: any, newEpisode: number) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const updatedList = watchingList.map((a) =>
        a.id === anime.id ? { ...a, episode: newEpisode } : a
      );

      await updateDoc(userDocRef, { currentlyWatching: updatedList });
      setWatchingList(updatedList);
    } catch (error) {
      console.error("Update episode failed", error);
    }
  };

  const markAsCompleted = async (anime: any) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const userDocRef = doc(db, "users", user.uid);

      const updatedList = watchingList.filter((a) => a.id !== anime.id);
      await updateDoc(userDocRef, {
        currentlyWatching: updatedList,
        watched: arrayUnion(anime),
      });

      setWatchingList(updatedList);
      setModalVisible(false);
    } catch (error) {
      console.error("Error marking completed", error);
    }
  };

  const removeFromWatching = async (anime: any) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const updatedList = watchingList.filter((a) => a.id !== anime.id);

      await updateDoc(userDocRef, { currentlyWatching: updatedList });
      setWatchingList(updatedList);
      setModalVisible(false);
    } catch (error) {
      console.error("Error removing", error);
    }
  };

  const openAnimeDetails = (anime: any) => {
    setSelectedAnime(anime);
    setEpisodeInput(anime.episode?.toString() || "0");
    setModalVisible(true);
  };

  const renderModal = () => {
    if (!selectedAnime) return null;
    return (
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.buttonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Image
                source={{ uri: selectedAnime.image }}
                style={styles.fullImage}
              />
              <Text style={styles.animeTitle}>{selectedAnime.title}</Text>
              <Text style={styles.label}>Episode:</Text>
              <TextInput
                value={episodeInput}
                onChangeText={setEpisodeInput}
                style={styles.input}
                keyboardType="numeric"
              />
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    updateEpisode(selectedAnime, Number(episodeInput) + 1)
                  }
                >
                  <Text style={styles.buttonText}>+1 Episode</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    updateEpisode(selectedAnime, Number(episodeInput))
                  }
                >
                  <Text style={styles.buttonText}>Update</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => markAsCompleted(selectedAnime)}
                >
                  <Text style={styles.buttonText}>Completed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => removeFromWatching(selectedAnime)}
                >
                  <Text style={styles.buttonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={watchingList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openAnimeDetails(item)}>
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.thumbnail} />
              <View style={styles.info}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>Episode: {item.episode}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No anime currently being watched.</Text>
        }
      />
      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0D0D0D" },
  card: {
    flexDirection: "row",
    backgroundColor: "#1C1C1C",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  thumbnail: { width: 60, height: 90, borderRadius: 5, marginRight: 16 },
  info: { flex: 1, justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "bold", color: "#F1C40F" },
  subtitle: { fontSize: 14, color: "#bbb", marginTop: 4 },
  empty: { textAlign: "center", color: "#888", fontSize: 16, marginTop: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.8,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    padding: 16,
  },
  closeButton: { position: "absolute", top: 10, right: 10, zIndex: 2 },
  fullImage: { width: "100%", height: 200, borderRadius: 8, marginBottom: 16 },
  animeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F1C40F",
    marginBottom: 12,
  },
  label: { fontSize: 16, color: "#fff", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  actionButton: {
    flex: 0.48,
    backgroundColor: "#2980B9",
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  modalScroll: { paddingBottom: 20 },
});

export default WatchingTab;
