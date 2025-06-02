import { StyleSheet, ScrollView, Text, TextInput, View } from "react-native";
import ThemedScreen from "@/components/ThemedScreen";
import Header from "@/components/Card/Header";
import ThemedCard from "@/components/ThemedCard";
import ThemedButton from "@/components/ThemedButton";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import ToggleTabsRN from "@/components/ToggleTabs/ToggleTabsRN";
import { useState, useMemo } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useGetOpenAIQuery } from "@/redux/api/endpoints/openAI";
import { useAppSelector } from "@/hooks/reduxHooks";
import { selectUser } from "@/redux/features/userSlice";
import ResourceCard from "@/components/Resource/ResourceCard";
import ResourceLoadingCard from "@/components/Resource/ResourceLoadingCard";
import { Resource } from "@/types/resource";

const tabs = [
  { id: "1", label: "All Resources", type: "all" },
  { id: "2", label: "Legal Aid", type: "legal" },
  { id: "3", label: "Immigration", type: "immigration" },
  { id: "4", label: "Housing", type: "housing" },
  { id: "5", label: "Hotlines", type: "hotlines" },
];

export default function ResourcesScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("1");
  const [customLocation, setCustomLocation] = useState<string>("");
  const [searchLocation, setSearchLocation] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const { location, address } = useLocation();
  const profile = useAppSelector(selectUser);

  const currentLocation = searchLocation || customLocation || address || (location ? "Current location" : "");
  const activeTabType = tabs.find((tab) => tab.id === activeTab)?.type || "all";

  const isReadyForResourcesQuery = !!(currentLocation && profile?.nationality && profile?.language);

  // Show search button when user has entered custom location and it's different from search location
  const showSearchButton = customLocation.trim() !== "" && customLocation !== searchLocation;

  const handleSearch = () => {
    setIsSearching(true);
    setSearchLocation(customLocation);
    // Reset searching state after a short delay to show feedback
    setTimeout(() => setIsSearching(false), 1000);
  };

  const handleLocationChange = (text: string) => {
    setCustomLocation(text);
    // If user clears the input, reset search location to use auto-detected location
    if (text.trim() === "") {
      setSearchLocation("");
    }
  };

  const {
    data: resourcesData,
    isLoading,
    isFetching,
    error,
  } = useGetOpenAIQuery(
    {
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that provides accurate information about local resources for immigrants. Always respond in ${profile?.language} language with valid JSON format. Focus on real, verified organizations and services.`,
        },
        {
          role: "user",
          content: `Find me ${activeTabType === "all" ? "various types of" : activeTabType} resources and services for immigrants from ${
            profile?.nationality
          } living in ${currentLocation}. 

          Please provide real organizations with accurate contact information including:
          - Legal aid organizations (if ${activeTabType === "all" || activeTabType === "legal"})
          - Immigration services (if ${activeTabType === "all" || activeTabType === "immigration"})
          - Housing assistance (if ${activeTabType === "all" || activeTabType === "housing"})
          - Hotlines and emergency services (if ${activeTabType === "all" || activeTabType === "hotlines"})

          Focus on organizations that serve ${profile?.nationality} immigrants and provide services in ${profile?.language}. 

          Return the response as a valid JSON array with the following structure:
          [
            {
              "id": "unique_id",
              "title": "Organization Name", 
              "description": "Brief description of services",
              "type": "${activeTabType === "all" ? "legal|immigration|housing|hotlines" : activeTabType}",
              "contactInfo": {
                "phone": "+1-xxx-xxx-xxxx",
                "email": "contact@org.com",
                "address": "Full address",
                "website": "https://website.com"
              },
              "languages": ["${profile?.language}", "English"],
              "nationality": "${profile?.nationality}",
              "hours": "Mon-Fri 9AM-5PM",
              "services": ["Service 1", "Service 2", "Service 3"],
              "rating": 4.5,
              "verified": true,
            }
          ]

          Provide 5-8 real, relevant resources with accurate contact information.`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    },
    { skip: !isReadyForResourcesQuery }
  );

  const resources = useMemo(() => {
    if (!resourcesData?.data) return [];

    try {
      const content = resourcesData.data;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsedData) ? parsedData : [];
      }
      return [];
    } catch (error) {
      console.error("Resources parsing error:", error);
      return [];
    }
  }, [resourcesData?.data]);

  const filteredResources = useMemo(() => {
    if (activeTabType === "all") return resources;
    return resources.filter((resource: Resource) => resource.type === activeTabType);
  }, [resources, activeTabType]);

  return (
    <ThemedScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Header title="Local Legal and Community Help" subtitle="Find real-world support when you need it most." />

        <ThemedCard>
          <Text style={[styles.locationTitle, { color: colors.hint }]}>Your location</Text>
          <View
            style={[
              styles.locationInputContainer,
              {
                borderColor: colors.border,
                backgroundColor: colors.darkBackground,
              },
            ]}
          >
            <Ionicons name="location-outline" size={24} color={colors.hint} />
            <TextInput
              style={{ color: colors.text, flex: 1 }}
              placeholder={currentLocation || "Enter your location"}
              placeholderTextColor={colors.hint}
              value={customLocation}
              onChangeText={handleLocationChange}
            />
          </View>

          {/* Current search location indicator */}
          {(searchLocation || address) && (
            <View style={styles.currentLocationContainer}>
              <Ionicons name="navigate-outline" size={16} color={colors.success} />
              <Text style={[styles.currentLocationText, { color: colors.success }]}>Searching in: {searchLocation || address}</Text>
            </View>
          )}
        </ThemedCard>

        {showSearchButton && (
          <View style={styles.searchButtonContainer}>
            <ThemedButton
              title={isSearching ? "Searching..." : `Search in "${customLocation}"`}
              onPress={handleSearch}
              icon={isSearching ? undefined : "search-outline"}
              variant="primary"
              style={styles.searchButton}
              loading={isSearching}
              disabled={isSearching}
            />
          </View>
        )}

        <View style={styles.tabsContainer}>
          <ToggleTabsRN tabs={tabs} onTabChange={setActiveTab} />
        </View>

        {/* Loading State */}
        {(isLoading || isFetching) && (
          <View style={styles.resourcesContainer}>
            <Text style={[styles.resourcesHeader, { color: colors.text }]}>
              Finding resources for {profile?.nationality} immigrants in {searchLocation || address || "your area"}...
            </Text>
            {[1, 2, 3].map((index) => (
              <ResourceLoadingCard key={index} />
            ))}
          </View>
        )}

        {/* Error State */}
        {error && (
          <ThemedCard>
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={32} color="#EF4444" />
              <Text style={[styles.errorText, { color: colors.text }]}>Unable to load resources. Please check your connection and try again.</Text>
            </View>
          </ThemedCard>
        )}

        {/* No Data State */}
        {!isLoading && !error && !isReadyForResourcesQuery && (
          <ThemedCard>
            <View style={styles.noDataContainer}>
              <Ionicons name="information-circle-outline" size={32} color={colors.hint} />
              <Text style={[styles.noDataText, { color: colors.text }]}>Please complete your profile to see personalized resources</Text>
              <Text style={[styles.noDataSubtext, { color: colors.hint }]}>
                We need your location, nationality, and language preferences to find the best resources for you.
              </Text>
            </View>
          </ThemedCard>
        )}

        {/* Resources List */}
        {!isLoading && !error && filteredResources.length > 0 && (
          <View style={styles.resourcesContainer}>
            <Text style={[styles.resourcesHeader, { color: colors.text }]}>
              {filteredResources.length} {activeTabType === "all" ? "resources" : `${activeTabType} resources`} found
            </Text>
            {filteredResources.map((resource: Resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </View>
        )}

        {/* No Resources Found */}
        {!isLoading && !error && isReadyForResourcesQuery && filteredResources.length === 0 && (
          <ThemedCard>
            <View style={styles.noDataContainer}>
              <Ionicons name="search-outline" size={32} color={colors.hint} />
              <Text style={[styles.noDataText, { color: colors.text }]}>No resources found</Text>
              <Text style={[styles.noDataSubtext, { color: colors.hint }]}>Try adjusting your location or browse different categories.</Text>
            </View>
          </ThemedCard>
        )}
      </ScrollView>
    </ThemedScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  locationTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  locationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  tabsContainer: {
    marginVertical: 16,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  noDataContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  noDataSubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  resourcesContainer: {
    marginTop: 8,
  },
  resourcesHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  searchButtonContainer: {
    marginVertical: 8,
  },
  searchButton: {
    marginHorizontal: 0,
  },
  currentLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  currentLocationText: {
    fontSize: 13,
    fontWeight: "500",
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
