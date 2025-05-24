import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
const Header = ({ title, subtitle }: { title: string; subtitle: string }) => {
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.iconContainer}>
        <Ionicons
          name="shield-half-outline"
          size={30}
          style={[styles.icon, { backgroundColor: colors.accent }]}
        />
        <Text style={[styles.iconText, { color: colors.text }]}>Lex</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.hint }]}>{subtitle}</Text>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  icon: {
    padding: 10,
    borderRadius: 10,
    color: "#fff",
  },
  iconText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  title: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
  },
});
