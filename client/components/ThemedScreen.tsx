import React from "react";
import { View, StyleSheet, ViewStyle, SafeAreaView } from "react-native";
import { useTheme } from "../context/ThemeContext";

type ThemedScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const ThemedScreen: React.FC<ThemedScreenProps> = ({
  children,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }, style]}>
      <SafeAreaView style={styles.titleContainer}>{children}</SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleContainer: {
    backgroundColor: "transparent",
  },
});

export default ThemedScreen;
