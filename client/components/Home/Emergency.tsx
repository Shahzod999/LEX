import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

const Emergency = () => {
  const { colors } = useTheme();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <View style={styles.container}>
      {showInfo && (
        <View
          style={[
            styles.infoContainer,
            { backgroundColor: colors.darkBackground },
          ]}>
          <Text style={styles.infoTitle}>Need Urgent Help?</Text>
          <Text style={[styles.infoText, { color: colors.hint }]}>
            We&apos;re here for you in critical situations
          </Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Access Emergency Resources</Text>
          </TouchableOpacity>
          <Text style={[styles.infoText, { color: colors.hint }]}>
            For life-threatening emergencies, please call local emergency
            services immediately
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => setShowInfo(!showInfo)}>
        <Ionicons name="shield-checkmark-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default Emergency;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: "100%",
    bottom: 50,
    right: 0,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 10,
  },

  emergencyButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 50,
  },
  infoContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "90%",
    borderWidth: 0.2,
    borderColor: "grey",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "red",
    textAlign: "center",
  },
  infoText: {
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
});
