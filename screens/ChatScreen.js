import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { Button, useTheme } from "react-native-elements";
import axios from "axios";
import { useUser } from "../UserContext";
import { useIsFocused } from "@react-navigation/native"; // To check if the screen is focused

const simpleEncrypt = (text, key) => {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let encoded = "";
  for (let i = 0; i < result.length; i += 3) {
    const a = result.charCodeAt(i) || 0;
    const b = result.charCodeAt(i + 1) || 0;
    const c = result.charCodeAt(i + 2) || 0;
    const chunk = (a << 16) | (b << 8) | c;
    encoded +=
      chars[(chunk >> 18) & 63] +
      chars[(chunk >> 12) & 63] +
      chars[(chunk >> 6) & 63] +
      chars[chunk & 63];
  }
  return encoded;
};

export default function ChatScreen({ navigation, route }) {
  const { userHash } = useUser();
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [originalMessages, setOriginalMessages] = useState({}); // Local cache for original messages
  const contactHash = route.params.contactHash;
  const contactNickname = route.params.contactNickname;
  const isFocused = useIsFocused(); // Check if the screen is focused

  const loadMessages = async () => {
    try {
      const response = await axios.post(
        "http://192.168.1.111:8000/api/get_messages/",
        {
          user_hash: userHash,
          contact_hash: contactHash,
        },
        { timeout: 10000 }
      );
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Get messages failed:", error);
    }
  };

  useEffect(() => {
    if (userHash && contactHash && isFocused) {
      loadMessages();
    }

    // Poll for new messages every 2 seconds, only if the screen is focused
    const interval = setInterval(() => {
      if (userHash && contactHash && isFocused) {
        loadMessages();
      }
    }, 2000); // Reverted to 2 seconds for faster updates

    return () => clearInterval(interval);
  }, [userHash, contactHash, isFocused]);

  const handleSendMessage = async () => {
    if (!newMessage) return;

    try {
      const encryptedContent = simpleEncrypt(newMessage, userHash);
      // Store the original message locally for the sender
      setOriginalMessages((prev) => ({
        ...prev,
        [encryptedContent]: newMessage,
      }));
      // Send both the encrypted and original message to the backend
      await axios.post(
        "http://192.168.1.111:8000/api/send_message/",
        {
          sender_hash: userHash,
          receiver_hash: contactHash,
          hashed_content: encryptedContent,
          original_content: newMessage, // Add original content to the request
        },
        { timeout: 10000 }
      );

      // Immediately load messages to show the sent message
      await loadMessages();
      setNewMessage("");
    } catch (error) {
      console.error("Send message failed:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
      }
      Alert.alert("Error", "Failed to send message");
    }
  };

  const unhashMessage = async (encryptedContent, isSent) => {
    try {
      // Check if the original message is in local state (sender's device)
      if (originalMessages[encryptedContent]) {
        Alert.alert("Decrypted Message", originalMessages[encryptedContent]);
        return;
      }

      // If not in local state, fetch from the backend
      const response = await axios.post(
        "http://192.168.1.111:8000/api/get_original_message/",
        {
          user_hash: userHash,
          contact_hash: contactHash,
          hashed_content: encryptedContent,
        },
        { timeout: 10000 }
      );

      if (response.data.original_content) {
        // Cache the original message locally
        setOriginalMessages((prev) => ({
          ...prev,
          [encryptedContent]: response.data.original_content,
        }));
        Alert.alert("Decrypted Message", response.data.original_content);
      } else {
        Alert.alert("Error", "Message not available");
      }
    } catch (error) {
      console.error("Unhash failed:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
      }
      Alert.alert("Error", "Failed to decrypt message");
    }
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.message,
        item.is_sent ? styles.sentMessage : styles.receivedMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.hashed_content}</Text>
      <Button
        title="Unhash"
        onPress={() => unhashMessage(item.hashed_content, item.is_sent)}
        buttonStyle={{ backgroundColor: theme.colors.button }}
        containerStyle={styles.messageButton}
      />
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.headerText, { color: theme.colors.text }]}>
        Chat with {contactNickname || contactHash}
      </Text>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messageList}
      />
      <TextInput
        style={[
          styles.input,
          {
            borderColor: theme.colors.border,
            color: theme.colors.text,
            backgroundColor: "#FFF",
          },
        ]}
        value={newMessage}
        onChangeText={setNewMessage}
        placeholder="Type a message"
        placeholderTextColor={theme.colors.text}
      />
      <Button
        title="Send"
        onPress={handleSendMessage}
        buttonStyle={{ backgroundColor: theme.colors.button }}
        containerStyle={styles.buttonContainer}
      />
    </View>
  );
}

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.05,
    paddingTop: Platform.OS === "ios" ? height * 0.05 : height * 0.03,
  },
  headerText: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginBottom: height * 0.02,
  },
  messageList: {
    flex: 1,
    marginBottom: height * 0.02,
  },
  message: {
    padding: width * 0.03,
    marginVertical: height * 0.01,
    borderRadius: 12,
    maxWidth: width * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sentMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#D4AF37",
  },
  receivedMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#666",
  },
  messageText: {
    color: "#FFF",
    fontSize: width * 0.04,
    marginBottom: height * 0.01,
  },
  messageButton: {
    paddingHorizontal: width * 0.02,
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
});
