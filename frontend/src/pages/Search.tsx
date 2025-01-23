import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { db } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import axios from "axios";
const MAL_CLIENT_ID = process.env.MAL_CLIENT_ID;

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  const fetchAnimeFromMAL = async () => {
    const clientId = process.env.MAL_CLIENT_ID; // Ensure this is set up correctly

    if (!query.trim()) {
      Alert.alert("Error", "Please enter a search query.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(
        `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(
          query.trim()
        )}&limit=50&fields=title,main_picture,popularity`,
        {
          headers: {
            "X-MAL-CLIENT-ID": clientId,
          },
        }
      );

      let data = response.data?.data || [];

      // Prioritize exact matches
      const exactMatches = data.filter(
        (item: { node: { title: string; }; }) => item.node.title.toLowerCase() === query.trim().toLowerCase()
      );

      // Remaining results, sorted by relevance or popularity
      const otherResults = data
        .filter(
          (item: { node: { title: string; }; }) => item.node.title.toLowerCase() !== query.trim().toLowerCase()
        )
        .sort((a: { node: { popularity: number; }; }, b: { node: { popularity: number; }; }) => a.node.popularity - b.node.popularity);

      // Combine exact matches and sorted results
      const sortedResults = [...exactMatches, ...otherResults];

      setResults(sortedResults);
    } catch (error) {
      console.error("Error fetching anime:", error);
      Alert.alert("Error", "Failed to fetch anime. Please try again.");
    } finally {
      setLoading(false);
    }
  };




  const addToList = async (anime: any, listType: "watched" | "planned") => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to add to a list.");
        return;
      }

      // Ensure all required fields exist
      if (!anime.id || !anime.title || !anime.main_picture?.medium) {
        Alert.alert(
          "Error",
          "Failed to add to the list. Missing required data."
        );
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        [listType]: arrayUnion({
          id: anime.id,
          title: anime.title,
          image: anime.main_picture.medium,
        }),
      });

      Alert.alert("Success", `${anime.title} added to your ${listType} list.`);
    } catch (error) {
      console.error("Error adding to list:", error);
      Alert.alert("Error", "Failed to add anime to the list.");
    }
  };


  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search anime..."
        value={query}
        onChangeText={setQuery}
      />
      <Button title="Search" onPress={fetchAnimeFromMAL} />

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.node.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <Image
              source={{
                uri: item.node?.main_picture?.medium || "fallback-image-url",
              }}
              style={styles.thumbnail}
            />
            <View style={styles.info}>
              <Text style={styles.title}>
                {item.node?.title || "Unknown Title"}
              </Text>
              <View style={styles.actions}>
                <Button
                  title="Add to Watched"
                  onPress={() => addToList(item.node, "watched")}
                />
                <Button
                  title="Add to Planned"
                  onPress={() => addToList(item.node, "planned")}
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>No results found.</Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },
  thumbnail: {
    width: 60,
    height: 90,
    marginRight: 16,
    borderRadius: 5,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 18,
    color: "#888",
  },
});

export default SearchPage;
