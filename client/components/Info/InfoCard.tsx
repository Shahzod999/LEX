import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

interface InfoCardProps {
  title: string;
  content: string | React.ReactNode;
  icon: any;
}
const InfoCard = ({ title, content, icon }: InfoCardProps) => {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.container, { backgroundColor: colors.darkBackground }]}>
      <Ionicons name={icon} size={24} color={colors.hint} />
      <View style={{ width: "90%" }}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.content, { color: colors.hint }]}>{content}</Text>
      </View>
    </View>
  );
};

export default InfoCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
});
