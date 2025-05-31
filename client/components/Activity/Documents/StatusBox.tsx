import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";

const StatusBox = ({
  status,
  color,
  onPress,
}: {
  status: string;
  color: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      style={[styles.statusBadge, { backgroundColor: color }]}
      onPress={onPress}>
      <Text style={styles.statusText}>{status}</Text>
    </TouchableOpacity>
  );
};

export default StatusBox;

const styles = StyleSheet.create({
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
