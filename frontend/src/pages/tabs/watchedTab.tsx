import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  Image,
  StyleSheet,
  Button,
  Alert,
} from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import { doc, getDoc, updateDoc, arrayRemove, onSnapshot } from "firebase/firestore";

const WatchedTab: React.FC = () => {
  const [watchedList, setWatchedList] = useState<any[]>([]);
  const auth = getAuth();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setWatchedList(doc.data()?.watched || []);
      }
    });

    return () => unsubscribe(); // Clean up the listener
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

      // Update the state locally
      setWatchedList((prevList) =>
        prevList.filter((item) => item.id !== anime.id)
      );

      Alert.alert("Success", `${anime.title} removed from your watched list.`);
    } catch (error) {
      console.error("Error removing anime:", error);
      Alert.alert("Error", "Failed to remove anime from the list.");
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={watchedList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Image source={{ uri: item.image }} style={styles.thumbnail} />
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Button title="Remove" onPress={() => removeFromWatched(item)} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No anime in your watched list.</Text>
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
  emptyText: {
    textAlign: "center",
    fontSize: 18,
    color: "#888",
    marginTop: 20,
  },
});

export default WatchedTab;
