import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Button, ThemeProvider } from "react-native-elements";
import { View, Alert, Platform } from "react-native";
import { Text, Provider as PaperProvider } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
// import * as Notifications from 'expo-notifications'; // Comment out push notifications
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

// Comment out push notification setup
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

const CustomHeader = ({ navigation, route, isDayMode, setIsDayMode }) => {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        backgroundColor: isDayMode
          ? dayTheme.colors.background
          : nightTheme.colors.background,
      }}
    >
      <Button
        title="☰"
        onPress={() => navigation.openDrawer()}
        color={isDayMode ? dayTheme.colors.button : nightTheme.colors.button}
        containerStyle={{ marginRight: 10 }}
      />
      <Button
        title={`Switch to ${isDayMode ? "Night" : "Day"} Mode`}
        onPress={() => setIsDayMode(!isDayMode)}
        color={isDayMode ? dayTheme.colors.button : nightTheme.colors.button}
      />
    </View>
  );
};

const MainStackNavigator = ({ isDayMode, setIsDayMode, userHash }) => (
  <Stack.Navigator
    screenOptions={({ navigation, route }) => ({
      header:
        route.name === "Chat"
          ? undefined
          : () => (
              <CustomHeader
                navigation={navigation}
                route={route}
                isDayMode={isDayMode}
                setIsDayMode={setIsDayMode}
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
  // const [notificationToken, setNotificationToken] = useState(null); // Comment out push notifications

  useEffect(() => {
    const loadUserHash = async () => {
      try {
        const hash = await AsyncStorage.getItem("userHash");
        if (hash) {
          setUserHash(hash);
        }
      } catch (error) {
        console.error("Failed to load userHash:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserHash();
  }, []);

  // Comment out push notification registration
  // useEffect(() => {
  //   const registerForPushNotifications = async () => {
  //     try {
  //       const { status: existingStatus } = await Notifications.getPermissionsAsync();
  //       let finalStatus = existingStatus;
  //       if (existingStatus !== 'granted') {
  //         const { status } = await Notifications.requestPermissionsAsync();
  //         finalStatus = status;
  //       }
  //       if (finalStatus !== 'granted') {
  //         console.log('Failed to get push token for push notification!');
  //         return;
  //       }
  //       const token = (await Notifications.getExpoPushTokenAsync()).data;
  //       setNotificationToken(token);

  //       if (userHash) {
  //         try {
  //           await axios.post('http://192.168.1.111:8000/api/register_push_token/', {
  //             user_hash: userHash,
  //             push_token: token,
  //           }, { timeout: 10000 });
  //         } catch (error) {
  //           console.error('Failed to register push token with backend:', error);
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Failed to register for push notifications:', error);
  //     }
  //   };

  //   registerForPushNotifications();

  //   if (Platform.OS === 'android') {
  //     Notifications.setNotificationChannelAsync('default', {
  //       name: 'default',
  //       importance: Notifications.AndroidImportance.MAX,
  //       vibrationPattern: [0, 250, 250, 250],
  //       lightColor: '#FF231F7C',
  //     });
  //   }
  // }, [userHash]);

  if (isLoading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <UserContext.Provider value={{ userHash, setUserHash }}>
      <ThemeProvider theme={isDayMode ? dayTheme : nightTheme}>
        <PaperProvider>
          <NavigationContainer>
            <Stack.Navigator>
              {userHash ? (
                <Stack.Screen name="MainApp" options={{ headerShown: false }}>
                  {() => (
                    <Drawer.Navigator
                      initialRouteName="Main"
                      screenOptions={{
                        drawerStyle: {
                          backgroundColor: isDayMode
                            ? dayTheme.colors.background
                            : nightTheme.colors.background,
                          width: 250,
                        },
                        drawerLabelStyle: {
                          color: isDayMode ? "#000" : nightTheme.colors.text, // Use gold text in dark mode
                          fontSize: 16,
                        },
                      }}
                    >
                      <Drawer.Screen
                        name="Main"
                        options={{
                          title: "Messages",
                          drawerIcon: () => <Text>📩</Text>,
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
                          drawerIcon: () => <Text>➕</Text>,
                        }}
                      />
                      <Drawer.Screen
                        name="PendingInvites"
                        component={PendingInvitesScreen}
                        options={{
                          title: "Pending Invites",
                          drawerIcon: () => <Text>📬</Text>,
                        }}
                      />
                      <Drawer.Screen
                        name="Contacts"
                        component={ContactsScreen}
                        options={{
                          title: "Contacts",
                          drawerIcon: () => <Text>👥</Text>,
                        }}
                      />
                      <Drawer.Screen
                        name="Settings"
                        options={{
                          title: "Settings",
                          drawerIcon: () => <Text>⚙️</Text>,
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
                          drawerIcon: () => <Text>🚪</Text>,
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
                              color={
                                isDayMode
                                  ? dayTheme.colors.button
                                  : nightTheme.colors.button
                              }
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
