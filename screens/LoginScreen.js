import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useTheme } from "react-native-elements";
import { useUser } from "../UserContext";

export default function LoginScreen({ navigation }) {
  const { setUserHash } = useUser();
  const [email, setEmail] = useState("");
  const [existingHash, setExistingHash] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [useExistingHash, setUseExistingHash] = useState(false);
  const { theme } = useTheme();

  // Check if userHash exists in AsyncStorage on mount
  useEffect(() => {
    const checkUserHash = async () => {
      const hash = await AsyncStorage.getItem("userHash");
      if (hash) {
        setUserHash(hash);
        navigation.navigate("Messages");
      }
    };
    checkUserHash();
  }, [navigation, setUserHash]);

  // Check if this is the user's first login for the welcome message
  useEffect(() => {
    const checkFirstLogin = async () => {
      const hasLoggedIn = await AsyncStorage.getItem("hasLoggedIn");
      if (!hasLoggedIn) {
        setShowWelcome(true);
        await AsyncStorage.setItem("hasLoggedIn", "true");
      }
    };
    checkFirstLogin();
  }, []);

  const handleLoginWithEmail = async () => {
    try {
      if (!email) {
        Alert.alert("Error", "Email is required");
        return;
      }
      const response = await axios.post(
        "http://192.168.1.111:8000/api/login/",
        { email },
        { timeout: 10000 }
      );
      const hash = response.data.hash;
      await AsyncStorage.setItem("userHash", hash);
      setUserHash(hash);
      navigation.navigate("Messages");
    } catch (error) {
      console.error("Login failed:", error);
      if (error.response) {
        Alert.alert("Error", error.response.data.error || "Failed to get hash");
      } else {
        Alert.alert("Error", "Network error");
      }
    }
  };

  const handleLoginWithHash = async () => {
    try {
      if (!existingHash) {
        Alert.alert("Error", "Hash is required");
        return;
      }
      if (!/^[0-9a-fA-F]{32}$/.test(existingHash)) {
        Alert.alert(
          "Error",
          "Invalid hash format (must be a 32-character hex string)"
        );
        return;
      }
      // Verify the hash exists on the server
      const response = await axios.post(
        "http://192.168.1.111:8000/api/verify_hash/",
        {
          user_hash: existingHash,
        },
        { timeout: 10000 }
      );
      if (response.data.exists) {
        // Delete all messages for this user
        await axios.post(
          "http://192.168.1.111:8000/api/delete_messages/",
          {
            user_hash: existingHash,
          },
          { timeout: 10000 }
        );
        await AsyncStorage.setItem("userHash", existingHash);
        setUserHash(existingHash);
        navigation.navigate("Messages");
      } else {
        Alert.alert("Error", "Invalid hash");
      }
    } catch (error) {
      console.error("Login with hash failed:", error);
      if (error.response) {
        Alert.alert(
          "Error",
          error.response.data.error || "Failed to verify hash"
        );
      } else {
        Alert.alert("Error", "Network error");
      }
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const hash = await AsyncStorage.getItem("userHash");
      if (hash) {
        await axios.post(
          "http://192.168.1.111:8000/api/delete_account/",
          {
            user_hash: hash,
          },
          { timeout: 10000 }
        );
        await AsyncStorage.removeItem("userHash");
        setUserHash(null);
        Alert.alert("Success", "Account deleted");
      }
    } catch (error) {
      console.error("Delete account failed:", error);
      Alert.alert("Error", "Failed to delete account");
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Modal
        visible={showWelcome}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWelcome(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Welcome to Prometheus
            </Text>
            <Text style={[styles.modalText, { color: theme.colors.text }]}>
              Prometheus is one of the most secure messaging apps, where all
              your data is hashed for maximum privacy. We collect little to no
              personal information, ensuring your conversations remain
              confidential.
            </Text>
            <Button
              title="Got It"
              onPress={() => setShowWelcome(false)}
              color={theme.colors.button}
            />
          </View>
        </View>
      </Modal>
      <Text style={{ color: theme.colors.text, marginBottom: 10 }}>
        {useExistingHash
          ? "Enter your existing hash to login"
          : "Enter your email to get a new hash for Prometheus"}
      </Text>
      <Text style={{ color: theme.colors.text, marginBottom: 20 }}>
        Note: Logging in will delete all your messages.
      </Text>
      {useExistingHash ? (
        <>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: "#FFF",
              },
            ]}
            value={existingHash}
            onChangeText={setExistingHash}
            placeholder="Your Hash (32-character hex)"
            placeholderTextColor={theme.colors.text}
          />
          <Button
            title="Login with Hash"
            onPress={handleLoginWithHash}
            color={theme.colors.button}
          />
        </>
      ) : (
        <>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                color: theme.colors.text,
                backgroundColor: "#FFF",
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={theme.colors.text}
            keyboardType="email-address"
          />
          <Button
            title="Get Login Hash"
            onPress={handleLoginWithEmail}
            color={theme.colors.button}
          />
        </>
      )}
      <Button
        title={useExistingHash ? "Use Email Instead" : "Use Existing Hash"}
        onPress={() => setUseExistingHash(!useExistingHash)}
        color={theme.colors.button}
        containerStyle={{ marginTop: 10 }}
      />
      <Button
        title="Delete Account"
        onPress={handleDeleteAccount}
        color="red"
        containerStyle={{ marginTop: 10 }}
      />
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: width * 0.05,
  },
  input: {
    borderWidth: 1,
    padding: width * 0.03,
    marginVertical: height * 0.015,
    borderRadius: 8,
    fontSize: width * 0.04,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    padding: width * 0.05,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginBottom: height * 0.02,
  },
  modalText: {
    fontSize: width * 0.04,
    textAlign: "center",
    marginBottom: height * 0.03,
  },
});
