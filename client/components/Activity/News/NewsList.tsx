import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import News from "./News";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useLocation } from "@/hooks/useLocation";
import { selectUser } from "@/redux/features/userSlice";
import { useGetOpenAIMutation } from "@/redux/api/endpoints/openAI";
import { useTheme } from "@/context/ThemeContext";
import LoadingText from "@/components/common/LoadingText";

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
  const [getOpenAI, { data, isLoading: newsLoading }] = useGetOpenAIMutation();
  const [news, setNews] = useState<NewsItem[]>([]);
  const {
    location,
    address,
    error: locationError,
    loading: locationLoading,
  } = useLocation();

  useEffect(() => {
    if (location && profile?.nationality && profile?.language) {
      getOpenAI({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that provides factual news about immigration topics. Always respond in ${profile.language} language with valid JSON format.`,
          },
          {
            role: "user",
            content: `Please provide the latest real, factual and neutral news related to immigrants from ${profile.nationality} living in ${address}. Focus on official or trusted news sources, and summarize key updates or events. Do not include opinions or speculation. Return the response as a valid JSON array with the following structure: [{"title": "News Title", "description": "Brief description", "source": "Source Name", "time": "Time ago", "link": "https://example.com"}]. Provide 3-5 relevant news items with real working links.`,
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });
    }
  }, [location, profile?.nationality, profile?.language, address]);

  // Обрабатываем данные от OpenAI
  useEffect(() => {
    if (data?.choices?.[0]?.message?.content) {
      try {
        const content = data.choices[0].message.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          const newsData = JSON.parse(jsonMatch[0]);
          if (Array.isArray(newsData) && newsData.length > 0) {
            setNews(newsData);
          }
        }
      } catch (error) {
        console.error("Ошибка парсинга новостей:", error);
      }
    }
  }, [data]);

  return (
    <View>
      {!locationLoading && <LoadingText text="Получение местоположения..." />}

      {!newsLoading && <LoadingText text="Загрузка новостей..." />}

      {location && !locationLoading && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            📍 {address || "Определение адреса..."}
          </Text>
          <Text style={styles.coordsText}>
            Координаты: {location.coords.latitude.toFixed(4)},{" "}
            {location.coords.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      {locationError && !locationLoading && (
        <View style={styles.errorInfo}>
          <Text style={styles.errorText}>⚠️ {locationError}</Text>
          <Text style={styles.errorSubText}>
            Новости не могут быть персонализированы без доступа к геолокации
          </Text>
        </View>
      )}

      {news.length > 0 &&
        news.map((item: NewsItem, index: number) => (
          <News
            key={index}
            title={item.title}
            description={item.description}
            source={item.source}
            time={item.time}
            link={item.link}
          />
        ))}

      {!newsLoading &&
        !locationLoading &&
        news.length === 0 &&
        !locationError && (
          <View style={styles.noNewsInfo}>
            <Text style={styles.noNewsText}>
              Новости не найдены. Попробуйте позже.
            </Text>
          </View>
        )}
    </View>
  );
};

export default NewsList;

const styles = StyleSheet.create({
  locationInfo: {
    backgroundColor: "#e8f5e8",
    padding: 10,
    margin: 10,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#2d5a2d",
    fontWeight: "600",
  },
  coordsText: {
    fontSize: 11,
    color: "#5a5a5a",
    marginTop: 2,
  },
  errorInfo: {
    backgroundColor: "#ffe8e8",
    padding: 10,
    margin: 10,
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
    margin: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  noNewsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
