import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import axios from "axios";
import { OPEN_AI_KEY } from "@env";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const RecommendationsTab: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnime, setSelectedAnime] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const auth = getAuth();

  const generateRecommendationPrompt = (watched: any[], planned: any[]) => {
    const watchedJSON = JSON.stringify(watched);
    const plannedJSON = JSON.stringify(planned);

    const genreCount: Record<string, number> = {};
    watched.forEach((anime) => {
      (anime.genres || []).forEach((genre: string) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);

    const genresJSON = JSON.stringify(topGenres);

    return `USER PREFERENCES:
- Watched anime (with their genres): ${watchedJSON}
- Planned to watch: ${plannedJSON}
- Top genres based on watch history: ${genresJSON}

RECOMMENDATIONS TASK:
1. Analyze the user's watched list to identify patterns in genres, themes, art styles, and storytelling approaches they enjoy.
2. Consider their planned-to-watch list to avoid recommending shows they already know about.
3. Based on your analysis, recommend 8 anime titles they would likely enjoy but aren't in either list.
4. Include a diverse mix that matches their preferences but also introduce 1-2 hidden gems they might not know about.

RESPONSE FORMAT:
- Present each recommendation with its title, year, studio, main genres, and a compelling 1-2 sentence description highlighting why they'll enjoy it based on their specific preferences.
- For each recommendation, briefly mention which anime in their watched list it's similar to and why.
- Order recommendations from most likely to enjoy (based on their preferences) to more exploratory options.
- Include a mix of classic and newer shows.
- Don't include lengthy explanations - keep each recommendation concise but informative.

Return ONLY the recommendations in JSON format with the following structure:
{
  "recommendations": [
    {
      "title": "Anime Title",
      "year": "Year",
      "studio": "Studio Name",
      "genres": ["Genre1", "Genre2"],
      "description": "Brief description",
      "similar_to": "Similar to [anime they watched] because [specific reason]"
    }
  ]}`;
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const { watched = [], planned = [] } = userDoc.data() || {};

      const prompt = generateRecommendationPrompt(watched, planned);

      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a helpful anime recommendation engine.",
            },
            { role: "user", content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${OPEN_AI_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const parsed = JSON.parse(
        res.data.choices[0].message.content
      ).recommendations;

      const enriched = await Promise.all(
        parsed.map(async (anime: any) => {
          try {
            const response = await axios.get(
              `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(
                anime.title
              )}&limit=1`
            );
            const result = response.data.data[0];
            return {
              ...anime,
              id: result.mal_id,
              image: result.images?.jpg?.image_url,
            };
          } catch {
            return anime;
          }
        })
      );

      setRecommendations(enriched);
    } catch (error) {
      console.error("Recommendation fetch failed:", error);
      Alert.alert("Error", "Failed to fetch recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (
    anime: any,
    listType: "watched" | "planned"
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        [listType]: arrayUnion({
          id: anime.id,
          title: anime.title,
          image: anime.image,
          genres: anime.genres,
        }),
      });

      Alert.alert("Success", `${anime.title} added to your ${listType} list.`);
      setModalVisible(false);
    } catch (error) {
      console.error("Error adding to list:", error);
      Alert.alert("Error", "Failed to add anime to your list.");
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const openAnimeDetails = (anime: any) => {
    setSelectedAnime(anime);
    setModalVisible(true);
  };

  const renderAnimeModal = () => {
    if (!selectedAnime) return null;

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
                  {selectedAnime.year} • {selectedAnime.studio}
                </Text>
                <View style={styles.genreContainer}>
                  {selectedAnime.genres?.map((genre: string, index: number) => (
                    <View key={index} style={styles.genreTag}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Text style={styles.descriptionHeading}>Description</Text>
              <Text style={styles.description}>
                {selectedAnime.description}
              </Text>

              <Text style={styles.similarityHeading}>Why you'll like it</Text>
              <Text style={styles.similarTo}>{selectedAnime.similar_to}</Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={() => handleAddToList(selectedAnime, "watched")}
                  style={styles.buttonGreen}
                >
                  <Text style={styles.buttonText}>Add to Watched</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAddToList(selectedAnime, "planned")}
                  style={styles.buttonPurple}
                >
                  <Text style={styles.buttonText}>Add to Planned</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
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
              {item.year} • {item.studio}
            </Text>
            <View style={styles.genrePills}>
              {item.genres?.slice(0, 2).map((genre: string, idx: number) => (
                <View key={idx} style={styles.genrePill}>
                  <Text style={styles.genrePillText}>{genre}</Text>
                </View>
              ))}
              {(item.genres?.length || 0) > 2 && (
                <Text style={styles.moreGenres}>+{item.genres.length - 2}</Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recommendations</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchRecommendations}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F1C40F" />
          <Text style={styles.loadingText}>Generating recommendations...</Text>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item, index) =>
            item.id?.toString() || index.toString()
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No recommendations available. Tap refresh to generate new
              recommendations.
            </Text>
          }
        />
      )}

      {renderAnimeModal()}
    </View>
  );
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
  refreshButton: {
    backgroundColor: "#2980B9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ccc",
    marginTop: 16,
    fontSize: 16,
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
  similarityHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E67E22",
    marginBottom: 8,
  },
  similarTo: {
    fontSize: 16,
    lineHeight: 22,
    color: "#bbb",
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  buttonGreen: {
    backgroundColor: "#27AE60",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
    alignItems: "center",
  },
  buttonPurple: {
    backgroundColor: "#9B59B6",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
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
});

export default RecommendationsTab;
