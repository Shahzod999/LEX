import { Text, View, StyleSheet } from "react-native";

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <Text>Privacy Policy Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
}); 