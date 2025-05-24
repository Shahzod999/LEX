import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useTheme } from "@/context/ThemeContext";
type ImmigrationCardData = {
  title: string;
  subtitle: string;
  quote: string;
  legalRef: string;
  agencies: string[];
};

const ImmigrationCard = ({
  data,
  onPress,
}: {
  data: ImmigrationCardData;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  // Data for each card type

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}>
      <Text style={[styles.title, { color: colors.text }]}>{data.title}</Text>
      <Text style={[styles.subtitle, { color: colors.hint }]}>
        {data.subtitle}
      </Text>
      <Text style={[styles.quote, { color: colors.text }]}>{data.quote}</Text>
      <Text
        style={[
          styles.legalRef,
          { color: colors.text, backgroundColor: colors.background },
        ]}>
        {data.legalRef}
      </Text>
      <Text style={[styles.agenciesTitle, { color: colors.text }]}>
        Key Agencies:
      </Text>
      <View style={styles.agenciesContainer}>
        {data.agencies.map((agency: string, index: number) => (
          <Text
            key={index}
            style={[
              styles.agency,
              { color: colors.text, backgroundColor: colors.background },
            ]}>
            {agency}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  quote: {
    fontSize: 14,
    fontStyle: "italic",
    marginVertical: 15,
    paddingLeft: 10,
  },

  legalRef: {
    fontSize: 12,
    marginBottom: 10,
    borderRadius: 10,
    padding: 10,
  },
  agenciesTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  agenciesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  agency: {
    fontSize: 12,
    marginRight: 15,
    marginBottom: 5,
    padding: 10,
    borderRadius: 10,
  },
});

export default ImmigrationCard;
