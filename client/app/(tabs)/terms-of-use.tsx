import { Text, View, StyleSheet } from "react-native";

export default function TermsOfUseScreen() {
  return (
    <View style={styles.container}>
      <Text>Terms of Use Screen</Text>
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