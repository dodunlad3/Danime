import React, { useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { db } from "../firebaseConfig";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import axios from "axios";
import Constants from "expo-constants";
import { useToast } from "react-native-toast-notifications";

const MAL_CLIENT_ID = Constants.expoConfig?.extra?.MAL_CLIENT_ID;

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const auth = getAuth();

  const fetchAnimeFromMAL = async () => {
    if (!query.trim()) {
      toast.show("Please enter a search query.", { type: "warning" });
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      const response = await axios.get(
        `https://api.myanimelist.net/v2/anime?q=${encodeURIComponent(
          query.trim()
        )}&limit=50&fields=title,main_picture,popularity`,
        {
          headers: {
            "X-MAL-CLIENT-ID": MAL_CLIENT_ID,
          },
        }
      );

      const data = response.data?.data || [];
      const exactMatches = data.filter(
        (item: { node: { title: string } }) =>
          item.node.title.toLowerCase() === query.trim().toLowerCase()
      );
      const otherResults = data
        .filter(
          (item: { node: { title: string } }) =>
            item.node.title.toLowerCase() !== query.trim().toLowerCase()
        )
        .sort(
          (
            a: { node: { popularity: number } },
            b: { node: { popularity: number } }
          ) => a.node.popularity - b.node.popularity
        );

      setResults([...exactMatches, ...otherResults]);
    } catch (error) {
      console.error("Error fetching anime:", error);
      toast.show("Failed to fetch anime. Please try again.", {
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToList = async (anime: any, listType: "watched" | "planned") => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.show("You must be logged in to add to a list.", {
          type: "warning",
        });
        return;
      }

      if (!anime.id || !anime.title || !anime.main_picture?.medium) {
        toast.show("Missing required data.", { type: "warning" });
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

      toast.show(`${anime.title} added to your ${listType} list.`, {
        type: "success",
      });
    } catch (error) {
      console.error("Error adding to list:", error);
      toast.show("Failed to add anime to the list.", { type: "danger" });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <TextInput
        style={styles.input}
        placeholder="Search anime..."
        value={query}
        onChangeText={setQuery}
        placeholderTextColor="#888"
      />
      <TouchableOpacity style={styles.searchButton} onPress={fetchAnimeFromMAL}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#9B59B6" />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.node.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{ uri: item.node.main_picture?.medium }}
              style={styles.thumbnail}
            />
            <View style={styles.info}>
              <Text style={styles.title}>{item.node.title}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => addToList(item.node, "watched")}
                >
                  <Text style={styles.actionButtonText}>Watched</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => addToList(item.node, "planned")}
                >
                  <Text style={styles.actionButtonText}>Planned</Text>
                </TouchableOpacity>
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0D0D0D",
  },
  input: {
    height: 45,
    borderRadius: 10,
    borderColor: "#444",
    borderWidth: 1,
    paddingHorizontal: 12,
    backgroundColor: "#1C1C1C",
    color: "#fff",
    marginBottom: 10,
  },
  searchButton: {
    backgroundColor: "#9B59B6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbnail: {
    width: 70,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F1C40F",
    marginBottom: 6,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#333",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    fontWeight: "600",
    color: "#fff",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    marginTop: 20,
  },
});

export default SearchPage;
