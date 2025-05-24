import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useTheme } from "@/context/ThemeContext";
import Title from "./Title";

interface LanguagePickerProps {
  selectedLanguage?: string;
  onLanguageSelect: (lang: string) => void;
}

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
];

const LanguagePicker: React.FC<LanguagePickerProps> = ({
  selectedLanguage,
  onLanguageSelect,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Title
        title="Choose Your Language"
        subtitle="Select your preferred language for the app"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageItem,
              { backgroundColor: colors.card },
              selectedLanguage === lang.code && [
                styles.selectedItem,
                { borderLeftColor: colors.accent },
              ],
            ]}
            onPress={() => onLanguageSelect(lang.code)}>
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text style={[styles.languageName, { color: colors.text }]}>
              {lang.name}
            </Text>
            {selectedLanguage === lang.code && (
              <Text style={[styles.checkmark, { color: colors.accent }]}>
                ✓
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default LanguagePicker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  scrollContainer: {
    paddingVertical: 10,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedItem: {
    borderLeftWidth: 4,
  },
  flag: {
    fontSize: 28,
    marginRight: 15,
  },
  languageName: {
    flex: 1,
    fontSize: 18,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
