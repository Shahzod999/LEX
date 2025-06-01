import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { getTokenFromSecureStore } from "@/utils/secureStore";
import { selectToken, setToken } from "@/redux/features/tokenSlice";
import LoadingScreen from "@/components/common/LoadingScreen";

export default function Index() {
  const router = useRouter();
  const dispatch = useAppDispatch();
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

  return <LoadingScreen />;
}
