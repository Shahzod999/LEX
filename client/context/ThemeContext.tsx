import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";

// Define theme colors
export const Colors = {
  light: {
    darkBackground: "#dbdbdb",
    background: "#FFFFFF",
    card: "#F5F5F5",
    text: "#000000",
    hint: "#666666",
    border: "#E0E0E0",
    accent: "#785ff7",
    success: "#08823b",
    error: "#c41414",
    warning: "#fab71b",
  },
  dark: {
    darkBackground: "#25272e",
    background: "#2d3039",
    card: "#353b46",
    text: "#FFFFFF",
    hint: "#8a8a8a",
    border: "#4A4A4A",
    accent: "#785ff7",
    success: "#08823b",
    error: "#c41414",
    warning: "#fab71b",
  },
};

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: typeof Colors.light | typeof Colors.dark;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");

  // Update theme if system theme changes
  useEffect(() => {
    setIsDarkMode(systemColorScheme === "dark");
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
