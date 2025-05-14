import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
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
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
          setTimeout(() => {
            navigation.navigate("Home");
          }, 1000);
        }, 2000);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        await saveUsername(user.uid, username, email);
        await sendEmailVerification(user);
        Alert.alert("Success", "Please verify your email before logging in.");
        navigation.navigate("Login");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const saveUsername = async (uid: string, username: string, email: string) => {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, { username, email, watched: [] });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Danime</Text>
      {!isLogin && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleAuth}>
        <Text style={styles.buttonText}>{isLogin ? "Login" : "Register"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonAlt]}
        onPress={() => setIsLogin(!isLogin)}
      >
        <Text style={styles.buttonText}>
          {isLogin ? "Go to Register" : "Go to Login"}
        </Text>
      </TouchableOpacity>

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
    backgroundColor: "#0D0D0D",
    padding: 20,
    justifyContent: "center",
  },
  header: {
    fontSize: 32,
    color: "#9B59B6",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    height: 45,
    borderRadius: 10,
    borderColor: "#444",
    borderWidth: 1,
    paddingHorizontal: 12,
    backgroundColor: "#1C1C1C",
    color: "#fff",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#9B59B6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonAlt: {
    backgroundColor: "#333",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContainer: {
    width: 250,
    padding: 24,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1C40F",
  },
  modalText: {
    color: "#F1C40F",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default Login;
