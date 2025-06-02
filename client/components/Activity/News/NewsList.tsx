import { StyleSheet, Text, View } from "react-native";
import React, { useMemo } from "react";
import News from "./News";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useLocation } from "@/hooks/useLocation";
import { selectUser } from "@/redux/features/userSlice";
import { useTheme } from "@/context/ThemeContext";
import LoadingText from "@/components/common/LoadingText";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { useGetOpenAIQuery } from "@/redux/api/endpoints/openAI";

export interface NewsItem {
  title: string;
  description: string;
  source: string;
  time: string;
  link: string;
}

const NewsList = () => {
  const { colors } = useTheme();
  const profile = useAppSelector(selectUser);
  const { location, address, error: locationError, loading: locationLoading } = useLocation();

  const isReadyForNewsQuery = !!(
    location && 
    profile?.nationality && 
    profile?.language && 
    address
  );

  const { data, isLoading: newsLoading } = useGetOpenAIQuery(
    {
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that provides factual news about immigration topics. Always respond in ${profile?.language} language with valid JSON format.`,
        },
        {
          role: "user",
          content: `Please provide the latest real, factual and neutral news related to immigrants from ${profile?.nationality} living in ${address}. Focus on official or trusted news sources, and summarize key updates or events. Return the response as a valid JSON array with the following structure: [{'title': 'News Title', 'description': 'Brief description', 'source': 'Source Name', 'time': 'Time ago', 'link': 'https://example.com'}]. Provide 3-5 relevant news items with real working links.`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    },
    { skip: !isReadyForNewsQuery }
  );

  const news = useMemo(() => {
    if (!data?.data) return [];

    try {
      const content = data.data;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (error) {
      console.error("News parsing error:", error);
      return [];
    }
  }, [data?.data]);

  const isLoading = locationLoading || newsLoading;

  return (
    <View>
      {locationLoading ? (
        <LoadingText text="Получение местоположения..." />
      ) : location ? (
        <View style={styles.locationInfo}>
          <Ionicons name="navigate" size={16} color={colors.success} />
          <Text style={[styles.locationText, { color: colors.success }]}>
            {address || "Определение адреса..."}
          </Text>
        </View>
      ) : locationError ? (
        <View style={styles.errorInfo}>
          <Text style={styles.errorText}>⚠️ {locationError}</Text>
          <Text style={styles.errorSubText}>
            Новости не могут быть персонализированы без доступа к геолокации
          </Text>
        </View>
      ) : null}

      {newsLoading && <LoadingText text="Загрузка новостей..." />}

      {news.map((item: NewsItem, index: number) => (
        <News 
          key={`${item.title}-${index}`} 
          {...item} 
        />
      ))}

      {!isLoading && news.length === 0 && isReadyForNewsQuery && (
        <View style={styles.noNewsInfo}>
          <Text style={styles.noNewsText}>Новости не найдены. Попробуйте позже.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  errorInfo: {
    backgroundColor: "#ffe8e8",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#d32f2f",
    fontWeight: "600",
  },
  errorSubText: {
    fontSize: 11,
    color: "#d32f2f",
    marginTop: 2,
    opacity: 0.8,
  },
  noNewsInfo: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  noNewsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});

export default NewsList;