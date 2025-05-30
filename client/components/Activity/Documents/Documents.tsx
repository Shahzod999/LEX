import { StyleSheet, Text, View } from "react-native";
import React from "react";
import ThemedCard from "../../ThemedCard";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { formatDate, formatDayMonthYear } from "@/utils/formatDate";

const Documents = ({
  title,
  documentType,
  status,
  uploadedDate,
  deadline,
  description,
  expirationDate,
}: {
  title: string;
  documentType: string;
  status: string;
  uploadedDate: string;
  deadline?: string;
  description?: string;
  expirationDate?: string | null;
}) => {
  const { colors } = useTheme();
  return (
    <ThemedCard style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Ionicons name="document-outline" size={24} color={colors.hint} />
          <Text style={{ color: colors.hint }}>{formatDate(uploadedDate)}</Text>
        </View>
        <View style={[styles.status, { backgroundColor: colors.accent }]}>
          <Text style={{ color: "white" }}>{status}</Text>
        </View>
      </View>

      <View style={[styles.content, { borderColor: colors.border }]}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {title}
        </Text>

        <Text
          style={[styles.documentType, { color: colors.hint }]}
          numberOfLines={3}
          ellipsizeMode="tail">
          {description}
        </Text>

        {deadline && (
          <View style={styles.documentContainer}>
            <Ionicons name="calendar-outline" size={24} color={colors.text} />
            <Text style={{ color: colors.text }}>Deadline: </Text>
            <Text style={{ color: colors.text }}>
              {formatDayMonthYear(deadline)}
            </Text>
          </View>
        )}
        {expirationDate && (
          <View style={styles.documentContainer}>
            <Ionicons name="calendar-outline" size={24} color={colors.text} />
            <Text style={{ color: colors.text }}>Expiration Date: </Text>
            <Text style={{ color: colors.text }}>
              {formatDayMonthYear(expirationDate)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.viewDetails}>
        <Text style={[styles.viewDetailsText, { color: colors.accent }]}>
          View Details
        </Text>
        <Ionicons
          name="chevron-forward-outline"
          size={18}
          color={colors.accent}
        />
      </View>
    </ThemedCard>
  );
};

export default Documents;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  status: {
    padding: 8,
    borderRadius: 16,
  },
  content: {
    flexDirection: "column",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },

  documentType: {
    fontSize: 16,
  },
  documentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
