import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  Image,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "react-native-elements";
import { useUser } from "../UserContext";
import axios from "axios";

export default function MessagesScreen({ navigation, route }) {
  const { userHash } = useUser();
  const { theme } = useTheme();
  const [contacts, setContacts] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0)); // For security animation

  // Fetch contacts and their last messages
  useEffect(() => {
    const loadContactsAndMessages = async () => {
      try {
        // Fetch contacts
        const contactsResponse = await axios.post(
          "http://192.168.1.111:8000/api/get_contacts/",
          {
            user_hash: userHash,
          },
          { timeout: 10000 }
        );
        const contactsData = contactsResponse.data.contacts;

        // Fetch last message and unread status for each contact
        const contactsWithMessages = await Promise.all(
          contactsData.map(async (contact) => {
            try {
              const messagesResponse = await axios.post(
                "http://192.168.1.111:8000/api/get_messages/",
                {
                  user_hash: userHash,
                  contact_hash: contact.hash,
                },
                { timeout: 10000 }
              );
              const messages = messagesResponse.data.messages;
              const lastMessage =
                messages.length > 0 ? messages[messages.length - 1] : null;

              // Check for unread messages (received messages not yet viewed)
              const unreadMessages = messages.filter(
                (msg) => !msg.is_sent && !msg.viewed // Assuming backend tracks viewed status
              );
              const hasUnread = unreadMessages.length > 0;

              return {
                ...contact,
                lastMessage: lastMessage
                  ? lastMessage.hashed_content
                  : "No messages yet",
                hasUnread,
              };
            } catch (error) {
              console.error(
                `Failed to fetch messages for contact ${contact.hash}:`,
                error
              );
              return {
                ...contact,
                lastMessage: "Error loading message",
                hasUnread: false,
              };
            }
          })
        );

        setContacts(contactsWithMessages);
      } catch (error) {
        console.error("Get contacts failed:", error);
      }
    };

    if (userHash) {
      loadContactsAndMessages();
    }

    // Refresh contacts and messages every 5 seconds
    const interval = setInterval(() => {
      if (userHash) {
        loadContactsAndMessages();
      }
    }, 5000);

    // Refresh contacts when returning from another screen
    const unsubscribe = navigation.addListener("focus", () => {
      if (userHash) {
        loadContactsAndMessages();
      }
    });

    // Start security animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [userHash, navigation, fadeAnim]);

  const handleSelectContact = (contact) => {
    navigation.navigate("Chat", {
      contactHash: contact.hash,
      contactNickname: contact.nickname,
    });
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.contact,
        {
          backgroundColor:
            theme.colors.background === "#2E2E2E"
              ? "#3A3A3A" // Slightly lighter gray for contrast in dark mode
              : "rgba(255, 255, 255, 0.1)", // Light mode background
        },
      ]}
      onPress={() => handleSelectContact(item)}
    >
      <Image
        source={{ uri: "https://via.placeholder.com/50" }} // Placeholder image
        style={styles.contactImage}
      />
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: theme.colors.text }]}>
          {item.nickname || item.hash}
        </Text>
        <Text style={[styles.lastMessage, { color: theme.colors.text }]}>
          {item.lastMessage}
        </Text>
      </View>
      {item.hasUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: theme.colors.text }]}>
          Messages
        </Text>
        <Animated.View
          style={[
            styles.securityIndicator,
            {
              opacity: fadeAnim,
              backgroundColor:
                theme.colors.background === "#2E2E2E"
                  ? "rgba(0, 255, 0, 0.2)" // Darker green in dark mode
                  : "rgba(0, 255, 0, 0.1)", // Light mode green
            },
          ]}
        >
          <Text style={styles.securityText}>🔒 Secure Messaging</Text>
        </Animated.View>
      </View>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.hash}
        style={[
          styles.contactList,
          { backgroundColor: theme.colors.background },
        ]}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyContainer,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No contacts yet. Add a contact to start messaging!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Math.min(width * 0.05, 20),
    paddingTop:
      Platform.OS === "ios"
        ? Math.min(height * 0.05, 40)
        : Math.min(height * 0.03, 30),
  },
  header: {
    alignItems: "center",
    marginBottom: height * 0.03,
  },
  headerText: {
    fontSize: width * 0.06,
    fontWeight: "bold",
  },
  securityIndicator: {
    marginTop: height * 0.01,
    padding: 10,
    borderRadius: 20,
  },
  securityText: {
    fontSize: width * 0.035,
    color: "#00FF00",
    fontWeight: "600",
  },
  contactList: {
    marginBottom: height * 0.02,
  },
  contact: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: height * 0.015,
    padding: width * 0.04,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  contactImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: width * 0.03,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: width * 0.045,
    fontWeight: "600",
    marginBottom: height * 0.005,
  },
  lastMessage: {
    fontSize: width * 0.035,
    opacity: 0.7,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "red",
    position: "absolute",
    top: 10,
    right: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: height * 0.2,
  },
  emptyText: {
    fontSize: width * 0.045,
    textAlign: "center",
  },
});
