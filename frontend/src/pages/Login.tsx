import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { getAuth } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Register: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const Login: React.FC<Props> = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const auth = getAuth();
  
  const handleAuth = async () => {
    try {
      if (isLogin) {
        // Login functionality
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        Alert.alert("Success", `Logged in as ${userCredential.user.email}`);
        navigation.navigate("Home");
      } else {
        // Registration functionality
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        Alert.alert("Success", `Registered as ${userCredential.user.email}`);
        navigation.navigate("Home");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? "Login" : "Register"}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={isLogin ? "Login" : "Register"} onPress={handleAuth} />
      <Button
        title={isLogin ? "Go to Register" : "Go to Login"}
        onPress={() => setIsLogin(!isLogin)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
});

export default Login;
