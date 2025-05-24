import { Slot } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import { MenuProvider } from "../context/MenuContext";
import { ThemeProvider } from "../context/ThemeContext";
import { useState } from "react";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return (
    <Provider store={store}>
      <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
        <ThemeProvider>
          <MenuProvider>
            <Slot />
          </MenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    </Provider>
  );
}
