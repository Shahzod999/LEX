import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

type ThemedCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
  titleStyle?: TextStyle;
  onPress?: () => void;
};

export const ThemedCard: React.FC<ThemedCardProps> = ({
  children,
  style,
  title,
  titleStyle,
  onPress,
}) => {
  const { colors, isDarkMode } = useTheme();

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          shadowColor: isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.2)",
          borderColor: isDarkMode ? "#444444" : "#E0E0E0",
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}>
      {title && (
        <Text style={[styles.title, { color: colors.text }, titleStyle]}>
          {title}
        </Text>
      )}
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 0.3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
});

export default ThemedCard;
