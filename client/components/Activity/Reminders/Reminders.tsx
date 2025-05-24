import { StyleSheet, Text, View } from "react-native";
import React from "react";
import ThemedCard from "@/components/ThemedCard";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

const Reminders = ({
  title,
  description,
  time,
  scheduledDate,
  deadline,
}: {
  title: string;
  description: string;
  time: string;
  scheduledDate?: string;
  deadline?: string;
}) => {
  const { colors } = useTheme();
  return (
    <ThemedCard>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={24} color={colors.hint} />
        <Text style={{ color: colors.hint }}>{time}</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      <Text style={[styles.description, { color: colors.hint }]}>
        {description}
      </Text>

      {scheduledDate && (
        <View style={styles.deadlineContainer}>
          <Ionicons name="time-outline" size={18} color={colors.hint} />
          <Text style={{ color: colors.hint }}>Scheduled for: </Text>
          <Text style={{ color: colors.hint }}>{scheduledDate}</Text>
        </View>
      )}
      {deadline && (
        <View style={styles.deadlineContainer}>
          <Ionicons name="calendar-outline" size={18} color={colors.hint} />
          <Text style={{ color: colors.hint }}>Deadline: </Text>
          <Text style={{ color: colors.hint }}>{deadline}</Text>
        </View>
      )}
    </ThemedCard>
  );
};

export default Reminders;

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

  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
});
