import { StyleSheet, View } from "react-native";
import React, { useState } from "react";
import ThemedScreen from "@/components/ThemedScreen";
import LanguagePicker from "@/components/Register/LanguagePicker";
import RegistrationForm from "@/components/Register/RegistrationForm";
import ThemedButton from "@/components/ThemedButton";
import { router } from "expo-router";
import { useRegisterMutation } from "@/redux/api/endpoints/authApiSlice";

const RegisterScreen = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<
    string | undefined
  >();
  const [step, setStep] = useState<number>(0);
  const [registrationData, setRegistrationData] = useState<{
    dateOfBirth: string;
    phoneNumber: string;
    nationality: string;
    name: string;
    email: string;
    password: string;
    bio: string;
  } | null>(null);

  const [register, { isLoading }] = useRegisterMutation();

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      setStep(1);
    }
  };

  const handleRegistrationSubmit = async (data: {
    dateOfBirth: string;
    phoneNumber: string;
    nationality: string;
    name: string;
    email: string;
    password: string;
    bio: string;
  }) => {
    setRegistrationData(data);

    try {
      console.log("Registration data:", {
        language: selectedLanguage,
        ...data,
      });

      await register({
        language: selectedLanguage,
        ...data,
      }).unwrap();

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Registration error:", error);
    }
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
            <ThemedButton title="Login" onPress={() => router.push("/login")} />
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
            isLoading={isLoading}
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
