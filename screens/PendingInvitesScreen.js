import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { Button, useTheme } from "react-native-elements";
import axios from "axios";
import { useUser } from "../UserContext";

export default function PendingInvitesScreen({ navigation }) {
  const { userHash } = useUser();
  const { theme } = useTheme();
  const [invites, setInvites] = useState([]);
  const [contacts, setContacts] = useState([]); // To store existing contacts

  useEffect(() => {
    const loadInvites = async () => {
      try {
        const response = await axios.post(
          "http://192.168.1.111:8000/api/get_invites/",
          {
            user_hash: userHash,
          },
          { timeout: 10000 }
        );
        setInvites(response.data.invites);
      } catch (error) {
        console.error("Get invites failed:", error);
        Alert.alert("Error", "Failed to load invites");
      }
    };

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
      loadInvites();
      loadContacts();
    }
  }, [userHash]);

  const handleInvite = async (inviteId, accept) => {
    try {
      // Find the invite to get the sender's hash
      const invite = invites.find((i) => i.id === inviteId);
      if (!invite) {
        Alert.alert("Error", "Invite not found");
        return;
      }

      // Check if the sender is already a contact
      const isAlreadyContact = contacts.some(
        (contact) => contact.hash === invite.sender_hash
      );
      if (isAlreadyContact) {
        Alert.alert("Info", "This user is already in your contacts");
        return;
      }

      const response = await axios.post(
        "http://192.168.1.111:8000/api/handle_invite/",
        {
          user_hash: userHash, // Add user_hash to the request
          invite_id: inviteId,
          action: accept ? "accept" : "reject", // Ensure action is 'accept' or 'reject'
        },
        { timeout: 10000 }
      );

      if (response.status === 200) {
        Alert.alert("Success", accept ? "Invite accepted" : "Invite declined");
        // Refresh invites after handling
        const updatedInvites = await axios.post(
          "http://192.168.1.111:8000/api/get_invites/",
          {
            user_hash: userHash,
          },
          { timeout: 10000 }
        );
        setInvites(updatedInvites.data.invites);
        // Refresh contacts after accepting an invite
        if (accept) {
          const updatedContacts = await axios.post(
            "http://192.168.1.111:8000/api/get_contacts/",
            {
              user_hash: userHash,
            },
            { timeout: 10000 }
          );
          setContacts(updatedContacts.data.contacts);
        }
      }
    } catch (error) {
      console.error("Handle invite failed:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        Alert.alert(
          "Error",
          `Failed to handle invite: ${
            error.response.data.error || "Server error. Check backend logs."
          }`
        );
      } else {
        Alert.alert("Error", "Failed to handle invite: Network error");
      }
    }
  };

  const renderInvite = ({ item }) => (
    <View style={styles.invite}>
      <Text style={[styles.inviteText, { color: theme.colors.text }]}>
        Invite from: {item.sender_hash}
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Accept"
          onPress={() => handleInvite(item.id, true)}
          buttonStyle={{
            backgroundColor: theme.colors.button,
            marginRight: 10,
          }}
        />
        <Button
          title="Decline"
          onPress={() => handleInvite(item.id, false)}
          buttonStyle={{ backgroundColor: "#FF0000" }}
        />
      </View>
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.headerText, { color: theme.colors.text }]}>
        Pending Invites
      </Text>
      <FlatList
        data={invites}
        renderItem={renderInvite}
        keyExtractor={(item) => item.id.toString()}
        style={styles.inviteList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No pending invites
            </Text>
          </View>
        }
      />
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.05,
    paddingTop: Platform.OS === "ios" ? height * 0.05 : height * 0.03,
  },
  headerText: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginBottom: height * 0.03,
  },
  inviteList: {
    marginBottom: height * 0.02,
  },
  invite: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: height * 0.01,
    padding: width * 0.03,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  inviteText: {
    fontSize: width * 0.04,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
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
