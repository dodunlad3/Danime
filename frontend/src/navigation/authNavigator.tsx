import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Login from "../pages/Login";
import Home from "../pages/Home";
import { getAuth, signOut } from "firebase/auth";
import { Button } from "react-native";

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
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
          headerTitle: "Hello, User", // Placeholder, updated dynamically in Home.tsx
          headerLeft: () => null,
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
    </Stack.Navigator>
  );
};

export default AuthNavigator;
