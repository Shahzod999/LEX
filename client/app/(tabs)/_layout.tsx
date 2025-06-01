import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, View, TouchableOpacity } from "react-native";
import { useMenu } from "../../context/MenuContext";
import { useTheme } from "../../context/ThemeContext";
import { ChatProvider } from "../../context/ChatContext";
import SlideMenu from "../../components/SlideMenu";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAppSelector } from "@/hooks/reduxHooks";
import { selectToken } from "@/redux/features/tokenSlice";
import { getTokenFromSecureStore } from "@/utils/secureStore";
import LoadingScreen from "@/components/common/LoadingScreen";
import { useGetProfileQuery } from "@/redux/api/endpoints/authApiSlice";

export default function TabsLayout() {
  const { toggleMenu } = useMenu();
  const { isDarkMode, colors } = useTheme();
  const router = useRouter();
  const token = useAppSelector(selectToken);
  const [checkingToken, setCheckingToken] = useState(true);

  useGetProfileQuery(undefined, { skip: !token });

  useEffect(() => {
    if (token) {
      setCheckingToken(false);
    } else {
      getTokenFromSecureStore().then((storedToken) => {
        if (!storedToken) {
          router.replace("/login");
        }
        setCheckingToken(false);
      });
    }
  }, [token]);

  if (checkingToken) {
    return <LoadingScreen />;
  }

  const handleChatError = (error: string) => {
    console.error("Global chat error:", error);
  };

  return (
    <ChatProvider token={token || ""} onError={handleChatError}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: isDarkMode ? "#AAAAAA" : "#666666",
            tabBarStyle: {
              backgroundColor: colors.card,
              borderTopColor: isDarkMode ? "#444444" : "#E0E0E0",
            },
            headerShown: false,
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              title: "Chat",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="chatbubble" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="scan"
            options={{
              title: "Scan",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="scan" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="activity"
            options={{
              title: "Activity",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="pulse" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="menu"
            options={{
              title: "Menu",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="menu" size={size} color={color} />
              ),
              tabBarButton: () => (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={toggleMenu}>
                  <Ionicons name="menu" size={24} color={colors.text} />
                  <Text
                    style={{ fontSize: 10, marginTop: 2, color: colors.text }}>
                    Menu
                  </Text>
                </TouchableOpacity>
              ),
            }}
          />

          {/* Hidden screens - not shown in tab bar */}
          <Tabs.Screen name="account-settings" options={{ href: null }} />
          <Tabs.Screen name="subscription" options={{ href: null }} />
          <Tabs.Screen name="help-center" options={{ href: null }} />
          <Tabs.Screen name="immigration" options={{ href: null }} />
          <Tabs.Screen name="resources" options={{ href: null }} />
          <Tabs.Screen name="privacy-policy" options={{ href: null }} />
          <Tabs.Screen name="terms-of-use" options={{ href: null }} />
        </Tabs>

        {/* Slide Menu Component */}
        <SlideMenu />
      </View>
    </ChatProvider>
  );
}
