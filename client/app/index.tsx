import { useEffect, useContext, useState } from "react";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { View, ActivityIndicator } from "react-native";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { getTokenFromSecureStore } from "@/utils/secureStore";
import { selectToken, setToken } from "@/redux/features/tokenSlice";

export default function Index() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const token = useAppSelector(selectToken);

  useEffect(() => {
    const loadToken = async () => {
      const token = await getTokenFromSecureStore();
      if (token) {
        dispatch(setToken(token));
      }
      setIsLoading(false);
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (token) {
        router.replace("/(tabs)");
      } else {
        router.replace("/register");
      }
    }
  }, [isLoading, token]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
      }}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}
