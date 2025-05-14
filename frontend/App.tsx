import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./src/navigation/authNavigator";
import { ToastProvider } from "react-native-toast-notifications";

const App: React.FC = () => {
  return (
    <ToastProvider
      placement="top"
      duration={3000}
      animationType="slide-in"
      offset={50}
      successColor="#9B59B6"
      dangerColor="#E74C3C"
      warningColor="#F1C40F"
      textStyle={{ color: "#fff", fontWeight: "600" }}
    >
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    </ToastProvider>
  );
};

export default App;
