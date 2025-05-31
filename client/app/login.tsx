import { useState, useContext } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import ThemedButton from "../components/ThemedButton";
import { useLoginMutation } from "@/redux/api/endpoints/authApiSlice";

export default function LoginScreen() {
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isDarkMode, colors } = useTheme();
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    console.log({
      email,
      password,
    });

    try {
      const response = await login({
        email,
        password,
      }).unwrap();
      console.log(response);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error logging in:", error);
      setError("Invalid email or password");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ width: "90%" }}>
        <View style={[styles.loginContainer, { backgroundColor: colors.card }]}>
          {error && (
            <Text style={{ color: "red", textAlign: "center" }}>{error}</Text>
          )}
          <Text style={[styles.title, { color: colors.text }]}>Login</Text>

          <TextInput
            style={[
              styles.input,
              {
                borderColor: isDarkMode ? "#4A4A4A" : "#ddd",
                color: colors.text,
                backgroundColor: isDarkMode ? "#2A2E38" : "white",
              },
            ]}
            placeholder="Email"
            placeholderTextColor={isDarkMode ? "#AAAAAA" : "#999999"}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={[
              styles.input,
              {
                borderColor: isDarkMode ? "#4A4A4A" : "#ddd",
                color: colors.text,
                backgroundColor: isDarkMode ? "#2A2E38" : "white",
              },
            ]}
            placeholder="Password"
            placeholderTextColor={isDarkMode ? "#AAAAAA" : "#999999"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <ThemedButton
            title="Login"
            onPress={handleLogin}
            loading={isLoading}
            icon="log-in-outline"
            iconPosition="right"
            style={{ marginTop: 15 }}
          />

          <Text style={styles.registerText}>
            Don&apos;t have an account?{" "}
            <Text
              style={{ color: colors.accent, fontWeight: "bold" }}
              onPress={() => router.push("/register")}>
              Register
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginContainer: {
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  registerText: {
    marginTop: 15,
    textAlign: "center",
    color: "#888",
  },
});
