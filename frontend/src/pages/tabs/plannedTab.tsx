import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Button,
  Alert,
} from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";

const PlannedTab: React.FC = () => {
  const [plannedList, setPlannedList] = useState<any[]>([]);
  const auth = getAuth();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setPlannedList(snapshot.data()?.planned || []);
      }
    });

    return () => unsubscribe(); // Clean up the listener
  }, []);

  const removeFromPlanned = async (anime: any) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to remove from the list.");
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        planned: arrayRemove(anime),
      });

      Alert.alert("Success", `${anime.title} removed from your planned list.`);
    } catch (error) {
      console.error("Error removing from list:", error);
      Alert.alert("Error", "Failed to remove anime from the list.");
    }
  };

  const moveToWatched = async (anime: any) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to move items.");
        return;
      }

      const userDocRef = doc(db, "users", user.uid);

      // Remove from planned and add to watched
      await updateDoc(userDocRef, {
        planned: arrayRemove(anime),
        watched: arrayUnion(anime),
      });

      Alert.alert("Success", `${anime.title} moved to your watched list.`);
    } catch (error) {
      console.error("Error moving to watched:", error);
      Alert.alert("Error", "Failed to move anime to watched list.");
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={plannedList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Image source={{ uri: item.image }} style={styles.thumbnail} />
            <View style={styles.info}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <View style={styles.actions}>
                <Button
                  title="Remove"
                  onPress={() => removeFromPlanned(item)}
                  color="#FF6347" // Optional: Red button
                />
                <Button
                  title="Move to Watched"
                  onPress={() => moveToWatched(item)}
                  color="#32CD32" // Optional: Green button
                />
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Your planned list is empty.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
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

export default PlannedTab;
