import { StyleSheet, View } from "react-native";
import React, { useState } from "react";
import ThemedScreen from "@/components/ThemedScreen";
import LanguagePicker from "@/components/Register/LanguagePicker";
import RegistrationForm from "@/components/Register/RegistrationForm";
import ThemedButton from "@/components/ThemedButton";
import { router } from "expo-router";

const RegisterScreen = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<
    string | undefined
  >();
  const [step, setStep] = useState<number>(0);
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
      setStep(1);
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
    router.replace("/(tabs)");
  };

  return (
    <ThemedScreen>
      {step === 0 ? (
        <View style={styles.container}>
          <LanguagePicker
            selectedLanguage={selectedLanguage}
            onLanguageSelect={handleLanguageSelect}
          />
          <View style={styles.buttonContainer}>
            <ThemedButton title="Login" onPress={() => router.back()} />
            <ThemedButton
              title="Continue"
              onPress={handleContinue}
              disabled={!selectedLanguage}
              style={styles.button}
            />
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          <RegistrationForm
            onSubmit={handleRegistrationSubmit}
            setStep={setStep}
            step={step}
          />
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
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 20,
  },
});

export default RegisterScreen;
