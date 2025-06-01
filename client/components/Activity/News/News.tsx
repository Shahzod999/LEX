import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import ThemedCard from "@/components/ThemedCard";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Link } from "expo-router";
import { NewsItem } from "./NewsList";

const News = ({ title, description, source, time, link }: NewsItem) => {
  const { colors } = useTheme();
  return (
    <ThemedCard>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => Linking.openURL(link)}>
        <View style={styles.header}>
          <Ionicons name="time-outline" size={24} color={colors.hint} />
          <Text style={{ color: colors.hint }}>{time}</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

        <Text style={[styles.description, { color: colors.hint }]}>
          {description}
        </Text>

        <Text style={[styles.footerText, { color: colors.text }]}>
          Source: {source}
        </Text>
      </TouchableOpacity>
    </ThemedCard>
  );
};

export default News;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },
  description: {
    fontSize: 16,
  },
  footerText: {
    fontSize: 12,
    marginTop: 10,
  },
});
