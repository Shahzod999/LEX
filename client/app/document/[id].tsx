import { StyleSheet, Text, View, ScrollView } from "react-native";
import React, { useState } from "react";
import {
  useGetUserCurrentDocumentQuery,
  useUpdateDocumentMutation,
} from "@/redux/api/endpoints/documentApiSlice";
import { useLocalSearchParams, Stack, router } from "expo-router";
import ThemedScreen from "@/components/ThemedScreen";
import LoadingScreen, { Loading } from "@/components/LoadingScreen";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { formatDate, formatDayMonthYear } from "@/utils/formatDate";
import { PanGestureHandler } from "react-native-gesture-handler";
import { Info, UpdateDocumentType } from "@/types/scan";
import { useToast } from "../../context/ToastContext";
import StatusBox from "@/components/Activity/Documents/StatusBox";

const statusVariants = ["Pending", "In Progress", "Expired", "Completed"];

const CurrentDocumentScreen = () => {
  const { id } = useLocalSearchParams();
  const idString = id as string;
  const { showSuccess, showError } = useToast();

  const { colors } = useTheme();
  //   const [updateValue, setUpdateValue] = useState<UpdateDocumentType>({});

  const {
    data: document,
    isLoading,
    error,
  } = useGetUserCurrentDocumentQuery(idString);
  const [updateDocument, { isLoading: isUpdating }] =
    useUpdateDocumentMutation();

  console.log(document?.filesUrl);

  const handleSwipeGesture = (event: any) => {
    if (event.nativeEvent.translationX > 150) {
      router.push("/(tabs)/activity");
    }
  };

  const handleUpdateDocument = async (updateValue: UpdateDocumentType) => {
    try {
      await updateDocument({ id: idString, body: updateValue });
      showSuccess("Document updated successfully");
    } catch (error) {
      showError("Failed to update document");
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !document) {
    return (
      <ThemedScreen>
        <Stack.Screen
          options={{
            title: "Document Details",
            headerShown: true,
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Document not found or error loading document
          </Text>
        </View>
      </ThemedScreen>
    );
  }

  return (
    <ThemedScreen>
      {isUpdating && <Loading />}
      <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}>
          {/* Document Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerRow}>
              <Ionicons
                name="document-text-outline"
                size={32}
                color={colors.accent}
              />
              <View style={styles.headerInfo}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {document.title}
                </Text>
                <Text style={[styles.uploadDate, { color: colors.hint }]}>
                  Uploaded: {formatDate(document.createdAt)}
                </Text>
              </View>
            </View>
            <View style={styles.statusContainer}>
              {statusVariants.map((status) => (
                <StatusBox
                  key={status}
                  status={status}
                  color={
                    status == document.info.status ? colors.accent : colors.hint
                  }
                  onPress={() => {
                    handleUpdateDocument({ status: status });
                  }}
                />
              ))}
            </View>
          </View>

          {/* Document Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Document Information
            </Text>

            {document.info.description && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.hint}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.hint }]}>
                    Description
                  </Text>
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    {document.info.description}
                  </Text>
                </View>
              </View>
            )}

            {document.info.deadline && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.hint}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.hint }]}>
                    Deadline
                  </Text>
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    {formatDayMonthYear(document.info.deadline)}
                  </Text>
                </View>
              </View>
            )}

            {document.info.expirationDate && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="warning-outline"
                  size={20}
                  color={colors.hint}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.hint }]}>
                    Expiration Date
                  </Text>
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    {formatDayMonthYear(document.info.expirationDate)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={colors.hint} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.hint }]}>
                  Last Updated
                </Text>
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {formatDate(document.updatedAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Document Messages/Chat */}
          {document.chatId &&
            document.chatId.messages &&
            document.chatId.messages.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Document Analysis
                </Text>
                <View
                  style={[
                    styles.chatContainer,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}>
                  {document.chatId.messages.map(
                    (message: any, index: number) => (
                      <View key={index} style={styles.messageContainer}>
                        <Text
                          style={[
                            styles.messageRole,
                            { color: colors.accent },
                          ]}>
                          {message.role === "assistant"
                            ? "AI Analysis:"
                            : "User:"}
                        </Text>
                        <Text
                          style={[styles.messageText, { color: colors.text }]}>
                          {message.content}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            )}
        </ScrollView>
      </PanGestureHandler>
    </ThemedScreen>
  );
};

export default CurrentDocumentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  header: {
    paddingBottom: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  uploadDate: {
    fontSize: 14,
  },
  statusContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  //   statusBadge: {
  //     alignSelf: "flex-start",
  //     paddingHorizontal: 12,
  //     paddingVertical: 6,
  //     borderRadius: 16,
  //   },
  //   statusText: {
  //     color: "white",
  //     fontSize: 12,
  //     fontWeight: "600",
  //   },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoText: {
    fontSize: 16,
  },
  chatContainer: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageRole: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
