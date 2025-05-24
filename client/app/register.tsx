import { StyleSheet, View } from "react-native";
import React, { useState } from "react";
import ThemedScreen from "@/components/ThemedScreen";
import LanguagePicker from "@/components/Register/LanguagePicker";
import RegistrationForm from "@/components/Register/RegistrationForm";
import ThemedButton from "@/components/ThemedButton";
import { useTheme } from "@/context/ThemeContext";

const RegisterScreen = () => {
  const { colors } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<
    string | undefined
  >();
  const [step, setStep] = useState<"language" | "details">("language");
  const [registrationData, setRegistrationData] = useState<{
    dateOfBirth: Date;
    phoneNumber: string;
    nationality: string;
  } | null>(null);

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      setStep("details");
    }
  };

  const handleRegistrationSubmit = (data: {
    dateOfBirth: Date;
    phoneNumber: string;
    nationality: string;
  }) => {
    setRegistrationData(data);
    // Here you would typically send the data to your backend
    console.log("Registration data:", {
      language: selectedLanguage,
      ...data,
    });
  };

  return (
    <ThemedScreen>
      {step === "language" ? (
        <View style={styles.container}>
          <LanguagePicker
            selectedLanguage={selectedLanguage}
            onLanguageSelect={handleLanguageSelect}
          />
          <ThemedButton
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedLanguage}
            style={styles.button}
          />
        </View>
      ) : (
        <View style={styles.container}>
          <RegistrationForm onSubmit={handleRegistrationSubmit} />
        </View>
      )}
    </ThemedScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  button: {
    marginTop: 20,
  },
});

export default RegisterScreen;
