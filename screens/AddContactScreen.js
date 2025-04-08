import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { Button, useTheme } from "react-native-elements";
import axios from "axios";
import { useUser } from "../UserContext"; // Fix the import path

export default function AddContactScreen({ navigation }) {
  const { userHash } = useUser();
  const { theme } = useTheme();
  const [contactHash, setContactHash] = useState("");

  const handleAddContact = async () => {
    if (!contactHash) {
      Alert.alert("Error", "Please enter a contact hash");
      return;
    }

    try {
      const response = await axios.post(
        "http://192.168.1.111:8000/api/send_invite/",
        {
          sender_hash: userHash,
          receiver_hash: contactHash,
        },
        { timeout: 10000 }
      );

      if (response.status === 200 || response.status === 201) {
        // Handle both 200 and 201 status codes
        Alert.alert("Success", "Invite sent successfully");
        setContactHash("");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Handle invite failed:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        Alert.alert(
          "Error",
          `Failed to send invite: ${
            error.response.data.message ||
            error.response.data.error ||
            "Server error. Check backend logs."
          }`
        );
      } else {
        Alert.alert("Error", "Failed to send invite: Network error");
      }
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.headerText, { color: theme.colors.text }]}>
        Add Contact
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.colors.border,
            color: theme.colors.text,
            backgroundColor:
              theme.colors.background === "#2E2E2E" ? "#3A3A3A" : "#FFF",
          },
        ]}
        value={contactHash}
        onChangeText={setContactHash}
        placeholder="Enter contact hash"
        placeholderTextColor={theme.colors.text}
      />
      <Button
        title="Send Invite"
        onPress={handleAddContact}
        buttonStyle={{ backgroundColor: theme.colors.button }}
        containerStyle={styles.buttonContainer}
        titleStyle={styles.buttonTitle}
      />
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Math.min(width * 0.05, 20),
    paddingTop:
      Platform.OS === "ios"
        ? Math.min(height * 0.05, 40)
        : Math.min(height * 0.03, 30),
  },
  headerText: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginBottom: height * 0.03,
  },
  input: {
    borderWidth: 1,
    padding: width * 0.03,
    marginVertical: height * 0.015,
    borderRadius: 8,
    fontSize: width * 0.04,
  },
  buttonContainer: {
    marginHorizontal: width * 0.01,
    borderRadius: 8,
  },
  buttonTitle: {
    fontSize: width * 0.04,
  },
});
