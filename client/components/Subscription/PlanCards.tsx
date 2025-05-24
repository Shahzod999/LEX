import { StyleSheet, Text, View } from "react-native";
import React from "react";
import ThemedCard from "../ThemedCard";
import ThemedButton from "../ThemedButton";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface PlanCardsProps {
  title: string;
  subtitle: string;
  price: string;
  features: string[];
  buttonTitle: string;
  currentPlan?: boolean;
}
const PlanCards = ({
  title,
  subtitle,
  price,
  features,
  buttonTitle,
  currentPlan,
}: PlanCardsProps) => {
  const { colors } = useTheme();
  const renderFeatureItem = (text: string) => (
    <View style={styles.featureItem} key={text}>
      <Ionicons
        name="checkmark"
        size={18}
        color="#08823b"
        style={styles.checkIcon}
      />
      <Text style={[styles.featureText, { color: colors.hint }]}>{text}</Text>
    </View>
  );

  return (
    <ThemedCard>
      <Text style={[styles.planCardTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.planCardSubtitle, { color: colors.hint }]}>
        {subtitle}
      </Text>

      <Text style={[styles.priceText, { color: colors.text }]}>
        {price}
        <Text style={[styles.monthText, { color: colors.hint }]}>/mo</Text>
      </Text>

      {features.map((feature) => renderFeatureItem(feature))}

      <ThemedButton
        title={buttonTitle}
        variant={currentPlan ? "secondary" : "primary"}
        onPress={() => {}}
        style={styles.planButton}
      />
    </ThemedCard>
  );
};

export default PlanCards;

const styles = StyleSheet.create({
  planCardTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  planCardSubtitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  priceText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  monthText: {
    fontSize: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 16,
  },
  planButton: {
    marginTop: 16,
  },
});
