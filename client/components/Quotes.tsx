import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useTheme } from "@/context/ThemeContext";

const Quotes = () => {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        styles.quote,
        { color: colors.hint, borderColor: colors.accent },
      ]}>
      Trust the proccess
    </Text>
  );
};

export default Quotes;

const styles = StyleSheet.create({
  quote: {
    fontSize: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderRadius: 4,
    marginVertical: 16,
  },
});
