import React, { useEffect, useRef } from "react";
import { Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  duration?: number;
  onHide: () => void;
  position?: "top" | "bottom";
}

// const { width } = Dimensions.get('window');

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type,
  duration = 3000,
  onHide,
  position = "top",
}) => {
  const { colors } = useTheme();
  const translateY = useRef(
    new Animated.Value(position === "top" ? -100 : 100)
  ).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#4CAF50",
          icon: "checkmark-circle" as const,
          iconColor: "#FFFFFF",
        };
      case "error":
        return {
          backgroundColor: "#F44336",
          icon: "close-circle" as const,
          iconColor: "#FFFFFF",
        };
      case "warning":
        return {
          backgroundColor: "#FF9800",
          icon: "warning" as const,
          iconColor: "#FFFFFF",
        };
      case "info":
        return {
          backgroundColor: colors.accent,
          icon: "information-circle" as const,
          iconColor: "#FFFFFF",
        };
      default:
        return {
          backgroundColor: colors.accent,
          icon: "information-circle" as const,
          iconColor: "#FFFFFF",
        };
    }
  };

  const config = getToastConfig();

  useEffect(() => {
    if (visible) {
      // Показываем toast
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Автоматически скрываем через заданное время
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === "top" ? -100 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: config.backgroundColor,
          top: position === "top" ? 60 : undefined,
          bottom: position === "bottom" ? 60 : undefined,
        },
      ]}>
      <TouchableOpacity
        style={styles.content}
        onPress={hideToast}
        activeOpacity={0.8}>
        <Ionicons
          name={config.icon}
          size={24}
          color={config.iconColor}
          style={styles.icon}
        />
        <Text style={[styles.message, { color: config.iconColor }]}>
          {message}
        </Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={config.iconColor} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default Toast;
