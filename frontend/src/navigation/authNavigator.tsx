import React, { useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Search from "../pages/Search"; // Import the new Search page
import { getAuth, signOut } from "firebase/auth";
import { View, Button, StyleSheet } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Search: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

const Stack = createStackNavigator<RootStackParamList>();

const AuthNavigator: React.FC = () => {
  const auth = getAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: "#0D0D0D",
        },
        headerTintColor: "#F1C40F",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={Home}
        options={({
          navigation,
        }: {
          navigation: HomeScreenNavigationProp;
        }) => ({
          headerTitle: "Home",
          headerLeft: () => (
            <View style={styles.headerButtonContainer}>
              <Button
                title="Search"
                onPress={() => navigation.navigate("Search")}
                color="#F1C40F"
              />
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerButtonContainer}>
              <Button
                title="Logout"
                onPress={async () => {
                  await handleLogout();
                  navigation.navigate("Login");
                }}
                color="#F1C40F"
              />
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="Search"
        component={Search} // Add the Search page
        options={{ headerTitle: "Search Anime" }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  headerButtonContainer: {
    paddingHorizontal: 10,
  },
});

export default AuthNavigator;
