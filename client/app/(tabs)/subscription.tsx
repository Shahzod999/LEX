import { Text, View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import ThemedCard from "../../components/ThemedCard";
import ThemedButton from "../../components/ThemedButton";
import { Ionicons } from "@expo/vector-icons";
import InfoCard from "@/components/Info/InfoCard";
import PlanCards from "@/components/Subscription/PlanCards";

export default function SubscriptionScreen() {
  const { colors, isDarkMode } = useTheme();

  // Simple progress bar component
  const ProgressBar = ({ progress = 0 }) => (
    <View
      style={[
        styles.progressBarContainer,
        { backgroundColor: isDarkMode ? "#444444" : "#E0E0E0" },
      ]}>
      <View
        style={[
          styles.progressBarFill,
          {
            backgroundColor: colors.accent,
            width: `${progress}%`,
          },
        ]}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]}>Subscription</Text>

        <ThemedCard style={{ ...styles.currentPlanCard }}>
          <Text style={[styles.planTitle, { color: colors.text }]}>
            Current Plan: Free
          </Text>
          <Text style={[styles.planDescription, { color: colors.hint }]}>
            You are on the free plan.
          </Text>

          <View style={styles.usageContainer}>
            <Text style={[styles.usageTitle, { color: colors.text }]}>
              Usage
            </Text>
            <View style={styles.usageItemContainer}>
              <View style={styles.usageTextContainer}>
                <Text style={[styles.usageItemText, { color: colors.text }]}>
                  AI Queries
                </Text>
                <Text style={[styles.usageCount, { color: colors.text }]}>
                  0 / 10
                </Text>
              </View>
              <ProgressBar progress={0} />
            </View>
          </View>
        </ThemedCard>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Plans & Pricing
        </Text>

        <PlanCards
          title="Free"
          subtitle="Basic legal support"
          price="$0"
          features={[
            "Access to basic legal information",
            "10 AI chat queries per month",
            "5 document scans per month",
            "Save up to 5 documents",
            "7 days chat history",
          ]}
          buttonTitle="Current Plan"
          currentPlan
        />

        <PlanCards
          title="Pro"
          subtitle="Enhanced legal support"
          price="$14.99"
          features={[
            "All Free features",
            "50 AI chat queries per month",
            "20 document scans per month",
            "Save up to 25 documents",
            "30 days chat history",
            "Document deadline reminders",
            "Legal resource recommendations",
          ]}
          buttonTitle="Upgrade to Pro"
        />
        <PlanCards
          title="Premium"
          subtitle="Premium legal assistance"
          price="$24.99"
          features={[
            "All Pro features",
            "Unlimited AI chat queries",
            "50 document scans per month",
            "Unlimited document storage",
            "90 days chat history",
            "Priority support",
            "Advanced document analysis",
            "Custom legal form assistance",
          ]}
          buttonTitle="Upgrade to Premium"
        />

        <InfoCard
          title="Subscription Information"
          content="Subscriptions are billed monthly and can be canceled at any time. Upgrades take effect immediately, while downgrades will take effect at the end of your current billing cycle."
          icon="information-circle-outline"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  currentPlanCard: {
    marginBottom: 24,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 16,
    marginBottom: 20,
  },
  usageContainer: {
    marginTop: 8,
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 12,
  },
  usageItemContainer: {
    marginBottom: 8,
  },
  usageTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  usageItemText: {
    fontSize: 16,
  },
  usageCount: {
    fontSize: 16,
    fontWeight: "500",
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 16,
  },
});
