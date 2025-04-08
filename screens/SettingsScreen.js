import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  Button,
} from "react-native";
import { useTheme } from "react-native-elements";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function SettingsScreen({
  navigation,
  isDayMode,
  setIsDayMode,
  userHash,
}) {
  const { theme } = useTheme();
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [autoDeleteMessages, setAutoDeleteMessages] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load dark mode setting
        const savedDayMode = await AsyncStorage.getItem("isDayMode");
        if (savedDayMode !== null) {
          const isDay = JSON.parse(savedDayMode);
          setIsDayMode(isDay);
        }

        // Load notification setting
        const notifications = await AsyncStorage.getItem("enableNotifications");
        if (notifications !== null) {
          setEnableNotifications(JSON.parse(notifications));
        }

        // Load auto-delete setting
        const autoDelete = await AsyncStorage.getItem("autoDeleteMessages");
        if (autoDelete !== null) {
          setAutoDeleteMessages(JSON.parse(autoDelete));
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, [setIsDayMode]);

  // Auto-delete messages logic
  useEffect(() => {
    const deleteOldMessages = async () => {
      if (!autoDeleteMessages || !userHash) return;

      try {
        const response = await axios.post(
          "http://192.168.1.111:8000/api/get_messages/",
          {
            user_hash: userHash,
            contact_hash: "", // Empty contact_hash to fetch all messages
          },
          { timeout: 10000 }
        );

        const messages = response.data.messages;
        const now = new Date();
        const messagesToDelete = messages.filter((message) => {
          const messageDate = new Date(message.timestamp);
          const diffInHours = (now - messageDate) / (1000 * 60 * 60);
          return diffInHours >= 24;
        });

        for (const message of messagesToDelete) {
          await axios.post(
            "http://192.168.1.111:8000/api/delete_message/",
            {
              user_hash: userHash,
              message_id: message.id,
            },
            { timeout: 10000 }
          );
        }
      } catch (error) {
        console.error("Failed to auto-delete messages:", error);
      }
    };

    if (autoDeleteMessages) {
      // Check every hour for messages to delete
      const interval = setInterval(deleteOldMessages, 60 * 60 * 1000);
      // Run immediately on toggle
      deleteOldMessages();
      return () => clearInterval(interval);
    }
  }, [autoDeleteMessages, userHash]);

  const toggleDarkMode = async () => {
    const newDayMode = !isDayMode;
    setIsDayMode(newDayMode);
    await AsyncStorage.setItem("isDayMode", JSON.stringify(newDayMode));
  };

  const toggleNotifications = async () => {
    const newValue = !enableNotifications;
    setEnableNotifications(newValue);
    await AsyncStorage.setItem("enableNotifications", JSON.stringify(newValue));
  };

  const toggleAutoDelete = async () => {
    const newValue = !autoDeleteMessages;
    setAutoDeleteMessages(newValue);
    await AsyncStorage.setItem("autoDeleteMessages", JSON.stringify(newValue));
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.headerText, { color: theme.colors.text }]}>
        Settings
      </Text>
      <View style={styles.setting}>
        <Text style={[styles.settingText, { color: theme.colors.text }]}>
          Dark Mode
        </Text>
        <Switch
          value={!isDayMode}
          onValueChange={toggleDarkMode}
          trackColor={{ false: "#767577", true: theme.colors.button }}
          thumbColor={isDayMode ? "#f4f3f4" : "#f4f3f4"}
        />
      </View>
      <View style={styles.setting}>
        <Text style={[styles.settingText, { color: theme.colors.text }]}>
          Enable Notifications
        </Text>
        <Switch
          value={enableNotifications}
          onValueChange={toggleNotifications}
          trackColor={{ false: "#767577", true: theme.colors.button }}
          thumbColor={enableNotifications ? "#f4f3f4" : "#f4f3f4"}
        />
      </View>
      <View style={styles.setting}>
        <Text style={[styles.settingText, { color: theme.colors.text }]}>
          Auto-Delete Messages After 24 Hours
        </Text>
        <Switch
          value={autoDeleteMessages}
          onValueChange={toggleAutoDelete}
          trackColor={{ false: "#767577", true: theme.colors.button }}
          thumbColor={autoDeleteMessages ? "#f4f3f4" : "#f4f3f4"}
        />
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Math.min(width * 0.05, 20), // Cap padding at 20px
    paddingTop:
      Platform.OS === "ios"
        ? Math.min(height * 0.05, 40)
        : Math.min(height * 0.03, 30),
  },
  headerText: {
    fontSize: Math.min(width * 0.05, 24), // Cap font size at 24px
    fontWeight: "bold",
    marginBottom: Math.min(height * 0.03, 20),
  },
  setting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: Math.min(height * 0.015, 10),
  },
  settingText: {
    fontSize: Math.min(width * 0.04, 18), // Cap font size at 18px
  },
});
