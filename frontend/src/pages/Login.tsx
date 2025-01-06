import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Modal,
  Text,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { auth } from "../firebaseConfig";
import { sendEmailVerification } from "firebase/auth";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
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
  const [username, setUsername] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        // Login functionality
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Show the success modal
        setShowModal(true);

        // Hide modal after 1 second, then navigate to Home
        setTimeout(() => {
          setShowModal(false);
          setTimeout(() => {
            navigation.navigate("Home");
          }, 1000);
        }, 2000);
      } else {
        // Registration functionality
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Save the username to Firestore
        const usernameDoc = doc(db, "users", user.uid);
        await setDoc(usernameDoc, { username, email: user.email });

        await sendEmailVerification(user);
        Alert.alert("Please verify your email before logging in.");
        navigation.navigate("Login");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
      )}
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

      {/* Modal for custom alert */}
      <Modal
        transparent={true}
        visible={showModal}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Successfully Logged In!</Text>
          </View>
        </View>
      </Modal>
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
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 16,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: 200,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Login;
