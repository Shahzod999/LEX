import { ActivityIndicator, View } from "react-native";
import React from "react";
import { useTheme } from "@/context/ThemeContext";

const LoadingScreen = () => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}>
      <Loading />
    </View>
  );
};

export default LoadingScreen;

export const Loading = () => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        height: "100%",
        zIndex: 1000,
      }}>
      <ActivityIndicator size="large" color={colors.text} />
    </View>
  );
};



