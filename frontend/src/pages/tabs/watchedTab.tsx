import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Modal,
} from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import { doc, updateDoc, arrayRemove, onSnapshot } from "firebase/firestore";
import axios from "axios";
import { arrayUnion as firestoreArrayUnion } from "firebase/firestore";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const auth = getAuth();

const WatchedTab: React.FC = () => {
  const [watchedList, setWatchedList] = useState<any[]>([]);
  const [animeDetails, setAnimeDetails] = useState<Record<string, any>>({});
  const [selectedAnime, setSelectedAnime] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data()?.watched || [];
        setWatchedList(data);

        const fetchedDetails: Record<string, any> = {};
        for (const anime of data) {
          try {
            const res = await axios.get(
              `https://api.jikan.moe/v4/anime/${anime.id}`
            );
            const animeData = res.data.data;
            fetchedDetails[anime.id] = {
              synopsis: animeData.synopsis || "No description available.",
              year: animeData.aired?.prop?.from?.year || "Unknown",
              studio: animeData.studios?.[0]?.name || "Unknown Studio",
              genres:
                animeData.genres?.map((g: any) => g.name) || anime.genres || [],
            };
          } catch (error) {
            fetchedDetails[anime.id] = {
              synopsis: "Failed to fetch description.",
              year: "Unknown",
              studio: "Unknown Studio",
              genres: anime.genres || [],
            };
          }
        }
        setAnimeDetails(fetchedDetails);
      }
    });

    return () => unsubscribe();
  }, []);

  const removeFromWatched = async (anime: any) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to remove from a list.");
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        watched: arrayRemove(anime),
      });

      Alert.alert("Success", `${anime.title} removed from your watched list.`);
      setModalVisible(false);
    } catch (error) {
      console.error("Error removing anime:", error);
      Alert.alert("Error", "Failed to remove anime from the list.");
    }
  };

  const openAnimeDetails = (anime: any) => {
    setSelectedAnime(anime);
    setModalVisible(true);
  };

  const renderAnimeModal = () => {
    if (!selectedAnime) return null;
    const details = animeDetails[selectedAnime.id] || {};

    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.buttonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              style={styles.detailScrollContainer}
              contentContainerStyle={styles.detailScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <Image
                source={{ uri: selectedAnime.image }}
                style={styles.fullImage}
              />
              <View style={styles.detailHeader}>
                <Text style={styles.animeTitle}>{selectedAnime.title}</Text>
                <Text style={styles.animeMetadata}>
                  {details.year} • {details.studio}
                </Text>
                <View style={styles.genreContainer}>
                  {details.genres?.map((genre: string, index: number) => (
                    <View key={index} style={styles.genreTag}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Text style={styles.descriptionHeading}>Description</Text>
              <Text style={styles.description}>
                {details.synopsis || "No description available."}
              </Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => removeFromWatched(selectedAnime)}
                  style={styles.buttonRed}
                >
                  <Text style={styles.buttonText}>Remove from Watched</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const details = animeDetails[item.id] || {};

    return (
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => openAnimeDetails(item)}
      >
        <View style={styles.itemContainer}>
          <Image source={{ uri: item.image }} style={styles.thumbnail} />
          <View style={styles.info}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.yearStudio}>
              {details.year} • {details.studio}
            </Text>
            <View style={styles.genrePills}>
              {details.genres?.slice(0, 2).map((genre: string, idx: number) => (
                <View key={idx} style={styles.genrePill}>
                  <Text style={styles.genrePillText}>{genre}</Text>
                </View>
              ))}
              {(details.genres?.length || 0) > 2 && (
                <Text style={styles.moreGenres}>
                  +{details.genres.length - 2}
                </Text>
              )}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.moveButton}
                onPress={() => moveToWatching(item)}
              >
                <Text style={styles.buttonText}>Rewatch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Watched</Text>
      </View>

      <FlatList
        data={watchedList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No anime in your watched list.</Text>
        }
      />

      {renderAnimeModal()}
    </View>
  );
};

const moveToWatching = async (anime: any) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);

    await updateDoc(userDocRef, {
      watched: arrayRemove(anime),
      watching: arrayUnion({ ...anime, episode: 1 }),
    });

    Alert.alert("Success", `${anime.title} moved to your watching list.`);
  } catch (error) {
    console.error("Error moving to watching:", error);
    Alert.alert("Error", "Failed to move anime to watching list.");
  }
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0D0D0D",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F1C40F",
  },
  cardContainer: {
    marginBottom: 16,
  },
  itemContainer: {
    flexDirection: "row",
    backgroundColor: "#1C1C1C",
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  thumbnail: {
    width: 80,
    height: 120,
    borderRadius: 6,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F1C40F",
    marginBottom: 4,
  },
  yearStudio: {
    fontSize: 14,
    color: "#bbb",
    marginBottom: 8,
  },
  genrePills: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  genrePill: {
    backgroundColor: "rgba(52, 73, 94, 0.7)",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  genrePillText: {
    color: "#fff",
    fontSize: 12,
  },
  moreGenres: {
    color: "#bbb",
    fontSize: 12,
    alignSelf: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.85,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    overflow: "hidden",
  },
  detailScrollContainer: {
    flex: 1,
  },
  detailScrollContent: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 30,
  },
  fullImage: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    marginBottom: 16,
  },
  detailHeader: {
    marginBottom: 16,
  },
  animeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F1C40F",
    marginBottom: 4,
  },
  animeMetadata: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 8,
  },
  genreContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  genreTag: {
    backgroundColor: "rgba(52, 73, 94, 0.7)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    color: "#fff",
    fontSize: 14,
  },
  descriptionHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E74C3C",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: "#ccc",
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  buttonRed: {
    backgroundColor: "#E74C3C",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyText: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  moveButton: {
    backgroundColor: "#2980B9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
});

export default WatchedTab;
function arrayUnion(arg0: any): unknown {
  throw new Error("Function not implemented.");
}

