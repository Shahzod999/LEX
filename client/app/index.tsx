import { useEffect, useContext, useState } from "react";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isAuthenticated } = useContext(AuthContext);
  const { colors } = useTheme();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Подождём 1 рендер, чтобы убедиться, что всё смонтировано
    setTimeout(() => setIsReady(true), 0);
  }, []);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace("/(tabs)");
    } else if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: "center", 
      alignItems: "center",
      backgroundColor: colors.background
    }}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}
