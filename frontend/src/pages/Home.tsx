import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Firestore instance
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import WatchedTab from "./tabs/watchedTab";
import PlannedTab from "./tabs/plannedTab";
import RecommendationsTab from "./tabs/recommendationsTab";

type TabParamList = {
  Watched: undefined;
  Planned: undefined;
  Recommendations: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const Home: React.FC = ({ navigation }: any) => {
  const [username, setUsername] = useState<string | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const fetchUsername = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          const fetchedUsername = docSnap.data().username;
          setUsername(fetchedUsername);
          navigation.setOptions({ headerTitle: `Hello, ${fetchedUsername}` });
        }
      }
    };

    fetchUsername();
  }, [navigation]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#0D0D0D",
        },
        headerTintColor: "#F1C40F",
        tabBarStyle: {
          backgroundColor: "#1C1C1C",
          borderTopColor: "#444",
        },
        tabBarActiveTintColor: "#9B59B6",
        tabBarInactiveTintColor: "#ccc",
      }}
    >
      <Tab.Screen name="Watched" component={WatchedTab} />
      <Tab.Screen name="Planned" component={PlannedTab} />
      <Tab.Screen name="Recommendations" component={RecommendationsTab} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
});

export default Home;
