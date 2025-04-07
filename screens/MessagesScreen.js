import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { useTheme, Button } from "react-native-elements";
import { useUser } from "../UserContext";
import axios from "axios";

export default function MessagesScreen({ navigation, route }) {
  const { userHash } = useUser();
  const { theme } = useTheme();
  const [contacts, setContacts] = useState([]);
  const [fadeAnim] = useState(new Animated.Value(0)); // For security animation

  // Fetch contacts when the screen mounts or when returning from UpdateNicknameScreen
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await axios.post(
          "http://192.168.1.111:8000/api/get_contacts/",
          {
            user_hash: userHash,
          },
          { timeout: 10000 }
        );
        setContacts(response.data.contacts);
      } catch (error) {
        console.error("Get contacts failed:", error);
      }
    };
    if (userHash) {
      loadContacts();
    }

    // Refresh contacts when returning from UpdateNicknameScreen
    const unsubscribe = navigation.addListener("focus", () => {
      if (userHash) {
        loadContacts();
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

    return unsubscribe;
  }, [userHash, navigation, fadeAnim]);

  const handleSelectContact = (contact) => {
    // Navigate to the Chat screen, which is part of the MainStackNavigator
    navigation.navigate("Chat", {
      contactHash: contact.hash,
      contactNickname: contact.nickname,
    });
  };

  const renderContact = ({ item }) => (
    <View
      style={[
        styles.contact,
        {
          backgroundColor:
            theme.colors.background === "#2E2E2E"
              ? "#3A3A3A" // Slightly lighter gray for contrast in dark mode
              : "rgba(255, 255, 255, 0.1)", // Light mode background
        },
      ]}
    >
      <Button
        title={item.nickname || item.hash}
        onPress={() => handleSelectContact(item)}
        buttonStyle={{ backgroundColor: theme.colors.button }}
        containerStyle={styles.buttonContainer}
        titleStyle={styles.buttonTitle} // Remove color override to use default white text
      />
      <Button
        title="Edit Nickname"
        onPress={() =>
          navigation.navigate("UpdateNickname", {
            contactHash: item.hash,
            currentNickname: item.nickname,
          })
        }
        buttonStyle={{ backgroundColor: theme.colors.button }}
        containerStyle={styles.buttonContainer}
        titleStyle={styles.buttonTitle} // Remove color override to use default white text
      />
    </View>
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
    padding: width * 0.05,
    paddingTop: Platform.OS === "ios" ? height * 0.05 : height * 0.03,
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
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: height * 0.01,
    padding: width * 0.03,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContainer: {
    marginHorizontal: width * 0.01,
    borderRadius: 8,
  },
  buttonTitle: {
    fontSize: width * 0.04,
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
