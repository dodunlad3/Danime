import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Button,
  ActivityIndicator,
  Alert,
} from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import { doc, DocumentData, DocumentReference, getDoc } from "firebase/firestore";
import axios from "axios";

const RecommendationsTab: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Get user data
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      const watched = userData?.watched || [];
      const planned = userData?.planned || [];

      // Example: Use AI API to fetch recommendations (replace with your AI logic)
      const response = await axios.post(
        "https://api.your-ai-service.com/recommendations", // Replace with your API URL
        { watched, planned },
        { headers: { Authorization: `Bearer YOUR_API_KEY` } }
      );

      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
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
        }),
      });

      Alert.alert("Success", `${anime.title} added to your ${listType} list.`);
    } catch (error) {
      console.error("Error adding to list:", error);
      Alert.alert("Error", "Failed to add anime to the list.");
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : recommendations.length > 0 ? (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Image source={{ uri: item.image }} style={styles.thumbnail} />
              <View style={styles.info}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={styles.actions}>
                  <Button
                    title="Add to Watched"
                    onPress={() => handleAddToList(item, "watched")}
                  />
                  <Button
                    title="Add to Planned"
                    onPress={() => handleAddToList(item, "planned")}
                  />
                </View>
              </View>
            </View>
          )}
        />
      ) : (
        <Text style={styles.emptyText}>No recommendations available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  thumbnail: {
    width: 60,
    height: 90,
    borderRadius: 5,
    marginRight: 16,
  },
  info: {
    flex: 1,
    flexDirection: "column",
  },
  itemTitle: {
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
    marginTop: 20,
  },
});

function arrayUnion(arg0: { id: any; title: any; image: any }) {
  throw new Error("Function not implemented.");
}

function updateDoc(
  userDocRef: DocumentReference<DocumentData, DocumentData>,
  arg1: { [x: string]: void }
) {
  throw new Error("Function not implemented.");
}
export default RecommendationsTab;




