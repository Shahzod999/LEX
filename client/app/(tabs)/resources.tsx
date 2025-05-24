import { StyleSheet, ScrollView, Text, TextInput, View } from "react-native";
import ThemedScreen from "@/components/ThemedScreen";
import Header from "@/components/Card/Header";
import Quotes from "@/components/Quotes";
import ThemedCard from "@/components/ThemedCard";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import ToggleTabsRN from "@/components/ToggleTabs/ToggleTabsRN";
import { useState } from "react";

const tabs = [
  { id: "1", label: "All Resources", type: "all" },
  { id: "2", label: "Legal Aid", type: "legal" },
  { id: "3", label: "Immigration", type: "immigration" },
  { id: "4", label: "Housing", type: "housing" },
  { id: "5", label: "Hotlines", type: "hotlines" },
];

export default function ResourcesScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("1");
  return (
    <ThemedScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Header
          title="Local Legal and Community Help"
          subtitle="Find real-world support when you need it most."
        />
        <Quotes />

        <ThemedCard>
          <Text style={[styles.locationTitle, { color: colors.text }]}>
            Your location
          </Text>
          <View
            style={[
              styles.locationInputContainer,
              {
                borderColor: colors.border,
                backgroundColor: colors.darkBackground,
              },
            ]}>
            <Ionicons name="location-outline" size={24} color={colors.hint} />
            <TextInput
              style={{ color: colors.text }}
              placeholder="Enter your location"
              placeholderTextColor={colors.hint}
            />
          </View>
        </ThemedCard>

        <View style={styles.tabsContainer}>
          <ToggleTabsRN tabs={tabs} onTabChange={setActiveTab} />
        </View>
      </ScrollView>
    </ThemedScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 16,
  },
  locationTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  locationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  tabsContainer: {
    marginVertical: 16,
  },
});
