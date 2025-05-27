import { Slot } from "expo-router";
import { MenuProvider } from "../context/MenuContext";
import { ThemeProvider } from "../context/ThemeContext";
import { ToastProvider } from "../context/ToastContext";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

export default function RootLayout() {

  return (
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <MenuProvider>
            <Slot />
          </MenuProvider>
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
}
