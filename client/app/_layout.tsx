import { Slot } from "expo-router";
import { MenuProvider } from "../context/MenuContext";
import { ThemeProvider } from "../context/ThemeContext";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

export default function RootLayout() {

  return (
    <Provider store={store}>
      <ThemeProvider>
        <MenuProvider>
          <Slot />
        </MenuProvider>
      </ThemeProvider>
    </Provider>
  );
}
