import "react-native-gesture-handler"; // Must be at the very top
import React, { useState, useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Button, ThemeProvider } from "react-native-elements";
import { View, Alert, Platform, TouchableOpacity } from "react-native";
import { Text, Provider as PaperProvider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context"; // Ensure SafeAreaView is imported
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import UserContext from "./UserContext";
import LoginScreen from "./screens/LoginScreen";
import MessagesScreen from "./screens/MessagesScreen";
import AddContactScreen from "./screens/AddContactScreen";
import PendingInvitesScreen from "./screens/PendingInvitesScreen";
import UpdateNicknameScreen from "./screens/UpdateNicknameScreen";
import ContactsScreen from "./screens/ContactsScreen";
import ChatScreen from "./screens/ChatScreen";
import SettingsScreen from "./screens/SettingsScreen";

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const dayTheme = {
  colors: {
    background: "#FFFFFF",
    text: "#D4AF37",
    button: "#D4AF37",
    border: "#D4AF37",
  },
};

const nightTheme = {
  colors: {
    background: "#2E2E2E", // Cool dark gray background
    text: "#D4AF37", // Gold text
    button: "#D4AF37", // Gold buttons
    border: "#D4AF37", // Gold borders
  },
};

// Define a static navigation theme to avoid dynamic issues
const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: dayTheme.colors.button,
    background: dayTheme.colors.background,
    card: dayTheme.colors.background,
    text: "#000",
    border: dayTheme.colors.border,
  },
};

// Custom header component with drawer toggle button (with fix for hamburger menu)
const CustomHeader = ({ navigation, route, isDayMode }) => {
  return (
    <SafeAreaView
      edges={["top"]} // Ensure the top edge respects the status bar
      style={{
        backgroundColor: isDayMode
          ? dayTheme.colors.background
          : nightTheme.colors.background,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 10,
          paddingVertical: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={{
            padding: 10, // Increase touchable area
          }}
        >
          <Text
            style={{
              fontSize: 24,
              color: isDayMode ? "#000" : nightTheme.colors.text,
            }}
          >
            ☰
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 20,
            color: isDayMode ? "#000" : nightTheme.colors.text,
            marginLeft: 10,
          }}
        >
          {route.name}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const MainStackNavigator = ({ isDayMode, setIsDayMode, userHash }) => (
  <Stack.Navigator
    screenOptions={({ navigation, route }) => ({
      headerShown: route.name !== "Chat", // Hide header for Chat screen
      header: ({ navigation, route }) => (
        <CustomHeader
          navigation={navigation}
          route={route}
          isDayMode={isDayMode}
        />
      ),
      gestureEnabled: route.name !== "Messages" || !userHash,
    })}
  >
    <Stack.Screen
      name="Messages"
      component={MessagesScreen}
      options={{ gestureEnabled: false }}
    />
    <Stack.Screen name="AddContact" component={AddContactScreen} />
    <Stack.Screen name="PendingInvites" component={PendingInvitesScreen} />
    <Stack.Screen name="UpdateNickname" component={UpdateNicknameScreen} />
    <Stack.Screen name="Contacts" component={ContactsScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);

export default function App() {
  const [isDayMode, setIsDayMode] = useState(true);
  const [userHash, setUserHash] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserHashAndSettings = async () => {
      try {
        const hash = await AsyncStorage.getItem("userHash");
        if (hash) {
          setUserHash(hash);
        }

        // Load dark mode setting
        const savedDayMode = await AsyncStorage.getItem("isDayMode");
        if (savedDayMode !== null) {
          const isDay = JSON.parse(savedDayMode);
          setIsDayMode(isDay);
        }
      } catch (error) {
        console.error("Failed to load userHash or settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserHashAndSettings();
  }, []);

  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: isDayMode
            ? dayTheme.colors.background
            : nightTheme.colors.background,
        }}
      >
        <Text style={{ color: isDayMode ? "#000" : nightTheme.colors.text }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <UserContext.Provider value={{ userHash, setUserHash }}>
      <ThemeProvider theme={isDayMode ? dayTheme : nightTheme}>
        <PaperProvider>
          <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator>
              {userHash ? (
                <Stack.Screen name="MainApp" options={{ headerShown: false }}>
                  {() => (
                    <Drawer.Navigator
                      initialRouteName="Main"
                      screenOptions={{
                        headerShown: false, // Keep header disabled for Drawer.Navigator
                        drawerStyle: {
                          backgroundColor: isDayMode
                            ? dayTheme.colors.background
                            : nightTheme.colors.background,
                          width: 250,
                        },
                        drawerLabelStyle: {
                          color: isDayMode ? "#000" : nightTheme.colors.text,
                          fontSize: 16,
                        },
                      }}
                    >
                      <Drawer.Screen
                        name="Main"
                        options={{
                          title: "Messages",
                          drawerIcon: () => (
                            <Text
                              style={{
                                color: isDayMode
                                  ? "#000"
                                  : nightTheme.colors.text,
                              }}
                            >
                              📩
                            </Text>
                          ),
                        }}
                      >
                        {(props) => (
                          <MainStackNavigator
                            {...props}
                            isDayMode={isDayMode}
                            setIsDayMode={setIsDayMode}
                            userHash={userHash}
                          />
                        )}
                      </Drawer.Screen>
                      <Drawer.Screen
                        name="AddContact"
                        component={AddContactScreen}
                        options={{
                          title: "Add Contact",
                          drawerIcon: () => (
                            <Text
                              style={{
                                color: isDayMode
                                  ? "#000"
                                  : nightTheme.colors.text,
                              }}
                            >
                              ➕
                            </Text>
                          ),
                        }}
                      />
                      <Drawer.Screen
                        name="PendingInvites"
                        component={PendingInvitesScreen}
                        options={{
                          title: "Pending Invites",
                          drawerIcon: () => (
                            <Text
                              style={{
                                color: isDayMode
                                  ? "#000"
                                  : nightTheme.colors.text,
                              }}
                            >
                              📬
                            </Text>
                          ),
                        }}
                      />
                      <Drawer.Screen
                        name="Contacts"
                        component={ContactsScreen}
                        options={{
                          title: "Contacts",
                          drawerIcon: () => (
                            <Text
                              style={{
                                color: isDayMode
                                  ? "#000"
                                  : nightTheme.colors.text,
                              }}
                            >
                              👥
                            </Text>
                          ),
                        }}
                      />
                      <Drawer.Screen
                        name="Settings"
                        options={{
                          title: "Settings",
                          drawerIcon: () => (
                            <Text
                              style={{
                                color: isDayMode
                                  ? "#000"
                                  : nightTheme.colors.text,
                              }}
                            >
                              ⚙️
                            </Text>
                          ),
                        }}
                      >
                        {(props) => (
                          <SettingsScreen
                            {...props}
                            isDayMode={isDayMode}
                            setIsDayMode={setIsDayMode}
                            userHash={userHash}
                          />
                        )}
                      </Drawer.Screen>
                      <Drawer.Screen
                        name="Logout"
                        options={{
                          title: "Logout",
                          drawerIcon: () => (
                            <Text
                              style={{
                                color: isDayMode
                                  ? "#000"
                                  : nightTheme.colors.text,
                              }}
                            >
                              🚪
                            </Text>
                          ),
                        }}
                      >
                        {(props) => (
                          <View
                            style={{
                              flex: 1,
                              justifyContent: "center",
                              alignItems: "center",
                              backgroundColor: isDayMode
                                ? dayTheme.colors.background
                                : nightTheme.colors.background,
                            }}
                          >
                            <Text
                              style={{
                                color: isDayMode
                                  ? "#000"
                                  : nightTheme.colors.text,
                                fontSize: 18,
                                marginBottom: 20,
                              }}
                            >
                              Are you sure you want to logout?
                            </Text>
                            <Button
                              title="Confirm Logout"
                              onPress={async () => {
                                try {
                                  try {
                                    await axios.post(
                                      "http://192.168.1.111:8000/api/delete_messages/",
                                      {
                                        user_hash: userHash,
                                      },
                                      { timeout: 10000 }
                                    );
                                  } catch (error) {
                                    console.error(
                                      "Delete messages failed:",
                                      error
                                    );
                                  }
                                  await AsyncStorage.removeItem("userHash");
                                  setUserHash(null);
                                } catch (error) {
                                  console.error("Logout failed:", error);
                                  Alert.alert("Error", "Failed to logout");
                                }
                              }}
                              buttonStyle={{
                                backgroundColor: isDayMode
                                  ? dayTheme.colors.button
                                  : nightTheme.colors.button,
                              }}
                              titleStyle={{
                                color: isDayMode ? "#000" : "#FFF",
                              }}
                            />
                          </View>
                        )}
                      </Drawer.Screen>
                    </Drawer.Navigator>
                  )}
                </Stack.Screen>
              ) : (
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </ThemeProvider>
    </UserContext.Provider>
  );
}
