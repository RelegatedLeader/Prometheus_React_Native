import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { Button, useTheme } from "react-native-elements";
import axios from "axios";
import { useUser } from "../UserContext";

export default function ContactsScreen({ navigation }) {
  const { userHash } = useUser();
  const [contacts, setContacts] = useState([]);
  const { theme } = useTheme();

  // Log when the screen mounts and the values of userHash and theme
  useEffect(() => {
    console.log("ContactsScreen mounted");
    console.log("userHash:", userHash);
    console.log("theme:", theme);
  }, [userHash]);

  // Fetch contacts when the screen mounts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await axios.post(
          "http://192.168.1.111:8000/api/get_contacts/",
          {
            user_hash: userHash,
          },
          { timeout: 10000 }
        );
        console.log("Fetched contacts:", response.data.contacts);
        setContacts(response.data.contacts);
      } catch (error) {
        console.error("Get contacts failed:", error);
      }
    };
    if (userHash) {
      fetchContacts();
    }
  }, [userHash]);

  // Navigate to Chat screen to message a contact
  const handleMessageContact = (contact) => {
    // Navigate to the Chat screen, which is nested under Main in the DrawerNavigator
    navigation.navigate("Main", {
      screen: "Chat",
      params: { contactHash: contact.hash, contactNickname: contact.nickname },
    });
  };

  const renderContact = ({ item }) => (
    <View style={styles.contact}>
      <Text style={{ color: theme.colors.text, fontSize: width * 0.04 }}>
        {item.nickname || item.hash}
      </Text>
      <Button
        title="Message"
        onPress={() => handleMessageContact(item)}
        color={theme.colors.button}
        containerStyle={styles.buttonContainer}
      />
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Your Contacts
      </Text>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.hash}
        style={styles.contactList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No contacts yet. Add a contact to start messaging!
            </Text>
          </View>
        }
      />
    </View>
  );
}

// Consistent styles with one-size-fits-all approach
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
  sectionTitle: {
    fontSize: width * 0.04,
    fontWeight: "600",
    marginVertical: height * 0.015,
  },
  contactList: {
    marginBottom: height * 0.02,
  },
  contact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: height * 0.01,
    padding: width * 0.02,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  buttonContainer: {
    marginHorizontal: width * 0.01,
    borderRadius: 8,
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
