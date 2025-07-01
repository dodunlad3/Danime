import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  TextInput,
} from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../firebaseConfig";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const Watching: React.FC = () => {
  const [watchingList, setWatchingList] = useState<any[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [customEpisode, setCustomEpisode] = useState("");

  const auth = getAuth();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      const list = docSnap.data()?.watching || [];
      setWatchingList(list);
    });

    return () => unsubscribe();
  }, []);

  const openModal = (anime: any) => {
    setSelectedAnime(anime);
    setCustomEpisode(String(anime.episode || 1));
    setModalVisible(true);
  };

  const updateEpisode = async (anime: any, newEpisode: number) => {
    const user = auth.currentUser;
    if (!user) return;

    const updatedAnime = { ...anime, episode: newEpisode };
    const userDocRef = doc(db, "users", user.uid);

    await updateDoc(userDocRef, {
      watching: arrayRemove(anime),
    });
    await updateDoc(userDocRef, {
      watching: arrayUnion(updatedAnime),
    });

    setModalVisible(false);
  };

  const removeFromWatching = async (anime: any) => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      watching: arrayRemove(anime),
    });

    setModalVisible(false);
  };

  const markAsCompleted = async (anime: any) => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, {
      watching: arrayRemove(anime),
      watched: arrayUnion({
        id: anime.id,
        title: anime.title,
        image: anime.image,
        genres: anime.genres || [],
      }),
    });

    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <View style={styles.cardContent}>
        <Image source={{ uri: item.image }} style={styles.thumbnail} />
        <View style={styles.info}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.episode}>Episode: {item.episode}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={watchingList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No anime currently being watched.
          </Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAnime && (
              <>
                <Image
                  source={{ uri: selectedAnime.image }}
                  style={styles.fullImage}
                />
                <Text style={styles.modalTitle}>{selectedAnime.title}</Text>

                <Text style={styles.label}>Current Episode</Text>
                <TextInput
                  style={styles.input}
                  value={customEpisode}
                  onChangeText={setCustomEpisode}
                  keyboardType="numeric"
                />

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                      updateEpisode(selectedAnime, parseInt(customEpisode))
                    }
                  >
                    <Text style={styles.buttonText}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                      updateEpisode(
                        selectedAnime,
                        (selectedAnime.episode || 1) + 1
                      )
                    }
                  >
                    <Text style={styles.buttonText}>+1 Episode</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => markAsCompleted(selectedAnime)}
                >
                  <Text style={styles.buttonText}>Mark as Completed</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFromWatching(selectedAnime)}
                >
                  <Text style={styles.buttonText}>Remove</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>✕</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0D0D0D",
  },
  emptyText: {
    color: "#888",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  card: {
    backgroundColor: "#1C1C1C",
    borderRadius: 8,
    marginBottom: 16,
    padding: 10,
  },
  cardContent: {
    flexDirection: "row",
  },
  thumbnail: {
    width: 60,
    height: 90,
    borderRadius: 5,
    marginRight: 16,
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F1C40F",
    marginBottom: 4,
  },
  episode: {
    color: "#ccc",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F1C40F",
    marginBottom: 16,
  },
  label: {
    color: "#fff",
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 6,
    width: "100%",
    padding: 10,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: "#3498DB",
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: "center",
  },
  completeButton: {
    backgroundColor: "#2ECC71",
    padding: 10,
    borderRadius: 6,
    width: "100%",
    marginBottom: 10,
    alignItems: "center",
  },
  removeButton: {
    backgroundColor: "#E74C3C",
    padding: 10,
    borderRadius: 6,
    width: "100%",
    marginBottom: 10,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#555",
    padding: 10,
    borderRadius: 6,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Watching;
