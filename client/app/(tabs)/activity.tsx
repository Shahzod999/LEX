import Header from "@/components/Card/Header";
import ThemedScreen from "@/components/ThemedScreen";
import ToggleTabsRN from "@/components/ToggleTabs/ToggleTabsRN";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import DocumnetsList from "@/components/Activity/Documents/DocumnetsList";
import NewsList from "@/components/Activity/News/NewsList";
import ReindersList from "@/components/Activity/Reminders/ReindersList";
const tabs = [
  { id: "1", label: "Documents", type: "documents" },
  { id: "2", label: "News", type: "news" },
  { id: "3", label: "Reminders", type: "reminders" },
];

export default function ActivityScreen() {
  const [activeTab, setActiveTab] = useState<string>("1");
  return (
    <ThemedScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <Header
          title="Document Scanner"
          subtitle="Scan and analyze legal documents instantly"
        />
        <View style={styles.tabsContainer}>
          <ToggleTabsRN tabs={tabs} onTabChange={setActiveTab} />
        </View>

        <View>
          {activeTab === "1" && <DocumnetsList />}
          {activeTab === "2" && <NewsList />}
          {activeTab === "3" && <ReindersList />}
        </View>
      </ScrollView>
    </ThemedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  tabsContainer: {
    marginVertical: 16,
  },
});
