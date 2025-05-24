import { ScrollView, StyleSheet, Text } from "react-native";
import ThemedScreen from "../../components/ThemedScreen";
import HomeCard from "@/components/Card/HomeCard";
import { useTheme } from "@/context/ThemeContext";
import Header from "@/components/Card/Header";
import Emergency from "@/components/Home/Emergency";
import { useRouter } from "expo-router";
import Quotes from "@/components/Quotes";
export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <ThemedScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Header
          title="Welcome to Lex - Your Legal Guardian"
          subtitle="You're not alone your legal journey"
        />
        <Quotes />

        <Text style={[styles.title, { color: colors.text }]}>
          How can we help you today?
        </Text>

        <HomeCard
          title="Upload Documents"
          description="Let AI analyze your legal papers"
          icon="cloud-upload-outline"
          color={colors.accent}
          onPress={() => {
            router.push("/scan");
          }}
        />
        <HomeCard
          title="Immigration Help"
          description="Navigate visa and status options"
          icon="document-text"
          color={colors.accent}
          onPress={() => {
            router.push("/immigration");
          }}
        />
        <HomeCard
          title="Ask Question"
          description="Chat with AI legal assistant"
          icon="chatbubble-outline"
          color={colors.success}
          onPress={() => {
            router.push("/chat");
          }}
        />
        <HomeCard
          title="Find Resources"
          description="local help and legal aid"
          icon="location-outline"
          color={colors.warning}
          onPress={() => {
            router.push("/resources");
          }}
        />
      </ScrollView>
      <Emergency />
    </ThemedScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 16,
  },

  content: {
    paddingVertical: 16,
  },
});
