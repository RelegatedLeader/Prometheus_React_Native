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
  Clipboard,
} from "react-native";
import { useTheme } from "react-native-elements";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen({
  navigation,
  isDayMode,
  setIsDayMode,
  userHash,
}) {
  const { theme } = useTheme();
  const [useSystemLanguage, setUseSystemLanguage] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [autoDeleteMessages, setAutoDeleteMessages] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const systemLanguage = await AsyncStorage.getItem("useSystemLanguage");
        const language = await AsyncStorage.getItem("selectedLanguage");
        const notifications = await AsyncStorage.getItem("enableNotifications");
        const autoDelete = await AsyncStorage.getItem("autoDeleteMessages");
        if (systemLanguage !== null) {
          setUseSystemLanguage(JSON.parse(systemLanguage));
        }
        if (language) {
          setSelectedLanguage(language);
        } else {
          const systemLocale = Localization.locale.split("-")[0];
          setSelectedLanguage(systemLocale);
          await AsyncStorage.setItem("selectedLanguage", systemLocale);
        }
        if (notifications !== null) {
          setEnableNotifications(JSON.parse(notifications));
        }
        if (autoDelete !== null) {
          setAutoDeleteMessages(JSON.parse(autoDelete));
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  const toggleSystemLanguage = async () => {
    const newValue = !useSystemLanguage;
    setUseSystemLanguage(newValue);
    await AsyncStorage.setItem("useSystemLanguage", JSON.stringify(newValue));
    if (newValue) {
      const systemLocale = Localization.locale.split("-")[0];
      setSelectedLanguage(systemLocale);
      await AsyncStorage.setItem("selectedLanguage", systemLocale);
    }
  };

  const handleLanguageChange = async (language) => {
    setSelectedLanguage(language);
    await AsyncStorage.setItem("selectedLanguage", language);
    if (useSystemLanguage) {
      setUseSystemLanguage(false);
      await AsyncStorage.setItem("useSystemLanguage", "false");
    }
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

  const copyHash = async () => {
    await Clipboard.setString(userHash);
    Alert.alert("Success", "Your hash has been copied to the clipboard");
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
          onValueChange={() => setIsDayMode(!isDayMode)}
          trackColor={{ false: "#767577", true: theme.colors.button }}
          thumbColor={isDayMode ? "#f4f3f4" : "#f4f3f4"}
        />
      </View>
      <View style={styles.setting}>
        <Text style={[styles.settingText, { color: theme.colors.text }]}>
          Use System Language
        </Text>
        <Switch
          value={useSystemLanguage}
          onValueChange={toggleSystemLanguage}
          trackColor={{ false: "#767577", true: theme.colors.button }}
          thumbColor={useSystemLanguage ? "#f4f3f4" : "#f4f3f4"}
        />
      </View>
      {!useSystemLanguage && (
        <View style={styles.setting}>
          <Text style={[styles.settingText, { color: theme.colors.text }]}>
            Select Language
          </Text>
          <View style={styles.languageOptions}>
            <Button
              title="English"
              onPress={() => handleLanguageChange("en")}
              color={
                selectedLanguage === "en" ? theme.colors.button : "#767577"
              }
            />
            <Button
              title="Spanish"
              onPress={() => handleLanguageChange("es")}
              color={
                selectedLanguage === "es" ? theme.colors.button : "#767577"
              }
            />
            <Button
              title="French"
              onPress={() => handleLanguageChange("fr")}
              color={
                selectedLanguage === "fr" ? theme.colors.button : "#767577"
              }
            />
          </View>
        </View>
      )}
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
      <View style={styles.setting}>
        <Text style={[styles.settingText, { color: theme.colors.text }]}>
          Your Hash:
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={[styles.hashText, { color: theme.colors.text }]}>
            {userHash}
          </Text>
          <Button
            title="Copy"
            onPress={copyHash}
            color={theme.colors.button}
            containerStyle={{ marginLeft: 10 }}
          />
        </View>
      </View>
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
  setting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: height * 0.015,
  },
  settingText: {
    fontSize: width * 0.04,
  },
  languageOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: height * 0.01,
  },
  hashText: {
    fontSize: width * 0.035,
    flex: 1,
    flexWrap: "wrap",
  },
});
