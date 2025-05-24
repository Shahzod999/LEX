import { Text, View, ScrollView } from "react-native";
import ThemedScreen from "../../components/ThemedScreen";
import ThemedCard from "../../components/ThemedCard";
import ThemedButton from "../../components/ThemedButton";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function HelpCenterScreen() {
  const { colors } = useTheme();

  return (
    <ThemedScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ height: "100%" }}>
        <ThemedCard title="Frequently Asked Questions">
          <Text style={{ color: colors.text, marginBottom: 15 }}>
            Find answers to common questions about our app.
          </Text>
          <ThemedButton
            title="View FAQs"
            onPress={() => console.log("FAQs pressed")}
            variant="outline"
            icon="help-circle-outline"
          />
        </ThemedCard>

        <ThemedCard title="Contact Support">
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}>
            <Ionicons name="mail-outline" size={20} color={colors.text} />
            <Text style={{ color: colors.text, marginLeft: 10 }}>
              support@example.com
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 15,
            }}>
            <Ionicons name="call-outline" size={20} color={colors.text} />
            <Text style={{ color: colors.text, marginLeft: 10 }}>
              +1 (555) 123-4567
            </Text>
          </View>
          <ThemedButton
            title="Send Message"
            onPress={() => console.log("Send message pressed")}
            variant="primary"
            icon="paper-plane-outline"
          />
        </ThemedCard>

        <ThemedCard title="Tutorials">
          <Text style={{ color: colors.text, marginBottom: 15 }}>
            Learn how to use all features of our app with step-by-step guides.
          </Text>
          <ThemedButton
            title="View Tutorials"
            onPress={() => console.log("Tutorials pressed")}
            variant="secondary"
            icon="videocam-outline"
          />
        </ThemedCard>
      </ScrollView>
    </ThemedScreen>
  );
}
