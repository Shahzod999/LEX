import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";

interface Props {
  children: React.ReactNode;
  handleDelete: () => void;
}

const renderRightActions = (handleDelete: () => void) => (
  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
    <Ionicons name="trash" size={24} color="#9b67f5" />
  </TouchableOpacity>
);

const SwipeDelete = ({ children, handleDelete }: Props) => {
  return (
    <Swipeable renderRightActions={() => renderRightActions(handleDelete)}>
      {children}
    </Swipeable>
  );
};

export default SwipeDelete;

const styles = StyleSheet.create({
  deleteButton: {
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
