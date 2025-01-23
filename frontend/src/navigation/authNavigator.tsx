import React, { useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Search from "../pages/Search"; // Import the new Search page
import { getAuth, signOut } from "firebase/auth";
import { Button } from "react-native";

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Search: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AuthNavigator: React.FC = () => {
  const auth = getAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={Home}
        options={({ navigation }) => ({
          headerTitle: "Home",
          headerLeft: () => (
            <Button
              title="Search"
              onPress={() => navigation.navigate("Search")} // Navigate to Search page
            />
          ),
          headerRight: () => (
            <Button
              title="Logout"
              onPress={async () => {
                await handleLogout();
                navigation.navigate("Login");
              }}
            />
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

export default AuthNavigator;
