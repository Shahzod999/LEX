// import { Pressable, StyleSheet, Text, View } from "react-native";
// import React from "react";
// import { useTheme } from "@/context/ThemeContext";
// import { Ionicons } from "@expo/vector-icons";
// const Button = ({
//   children,
//   onPress,
//   disabled,
//   icon,
// }: {
//   children: React.ReactNode;
//   onPress: () => void;
//   disabled?: boolean;
//   icon: any;
// }) => {
//   const { colors } = useTheme();
//   return (
//     <Pressable
//       style={[styles.button, { backgroundColor: colors.accent }]}
//       onPress={onPress}
//       disabled={disabled}>
//       <Ionicons name={icon} size={24} color="white" />
//       <Text style={[styles.buttonText, { color: disabled ? "gray" : "white" }]}>
//         {children}
//       </Text>
//     </Pressable>
//   );
// };

// export default Button;

// const styles = StyleSheet.create({
//   button: {
//     padding: 10,
//     borderRadius: 10,
//     width: "100%",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 10,
//   },
//   buttonText: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
// });
