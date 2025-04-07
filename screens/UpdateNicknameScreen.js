import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import axios from "axios";
import { useTheme } from "react-native-elements";
import { useUser } from "../UserContext";

export default function UpdateNicknameScreen({ navigation, route }) {
  const { userHash } = useUser();
  const { contactHash, currentNickname } = route.params;
  const [nickname, setNickname] = useState(currentNickname || "");
  const { theme } = useTheme();

  const handleUpdateNickname = async () => {
    try {
      await axios.post(
        "http://192.168.1.111:8000/api/update_nickname/",
        {
          user_hash: userHash,
          contact_hash: contactHash,
          nickname,
        },
        { timeout: 10000 }
      );
      navigation.goBack();
    } catch (error) {
      console.error("Update nickname failed:", error);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={{ color: theme.colors.text }}>
        Update Nickname for {contactHash}
      </Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: theme.colors.border, color: theme.colors.text },
        ]}
        value={nickname}
        onChangeText={setNickname}
        placeholder="New Nickname"
        placeholderTextColor={theme.colors.text}
      />
      <Button
        title="Update Nickname"
        onPress={handleUpdateNickname}
        color={theme.colors.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
});
