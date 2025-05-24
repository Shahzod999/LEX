import { Text, View } from "react-native";
import ThemedScreen from "../../components/ThemedScreen";
import { useTheme } from "../../context/ThemeContext";

export default function AccountSettings() {
  const { colors } = useTheme();
  
  return (
    <ThemedScreen  >
      <View style={{ alignItems: "center" }}>
        <Text style={{ color: colors.text }}>
          Your account settings will appear here
        </Text>
      </View>
    </ThemedScreen>
  );
} 