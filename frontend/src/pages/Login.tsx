import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? "Login" : "Register"}</Text>
      <TextInput style={styles.input} placeholder="Email" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry />
      {!isLogin && (
        <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry />
      )}
      <Button
        title={isLogin ? "Login" : "Register"}
        onPress={() => navigation.navigate("Home")}
      />
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