import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MenuProvider } from "../context/MenuContext";
import { ThemeProvider } from "../context/ThemeContext";
import { ToastProvider } from "../context/ToastContext";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            <MenuProvider>
              <Slot />
            </MenuProvider>
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
