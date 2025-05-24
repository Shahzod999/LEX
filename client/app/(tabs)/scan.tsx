import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import React, { useState, useEffect } from "react";
import Header from "@/components/Card/Header";
import ThemedCard from "@/components/ThemedCard";
import ToggleTabsRN from "@/components/ToggleTabs/ToggleTabsRN";
import HomeCard from "@/components/Card/HomeCard";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import CameraView from "@/components/Camera/CameraView";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useGetOpenAIMutation } from "@/redux/api/endpoints/openAI";
import * as FileSystem from "expo-file-system";
import ThemedButton from "@/components/ThemedButton";

// Message interface
interface Message {
  id: number;
  text: string;
  isBot: boolean;
  isTyping?: boolean;
}

const tabs = [
  { id: "1", label: "Scan", type: "scan" },
  { id: "2", label: "Upload", type: "upload" },
];

const ScanScreen = () => {
  const [activeTab, setActiveTab] = useState<string>("1");
  const [showCamera, setShowCamera] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [messageHistory, setMessageHistory] = useState([
    {
      role: "system",
      content:
        "You are a legal document analysis assistant specialized in analyzing legal documents. Help users understand the content of their scanned documents, identify important legal terms, and clarify any legal implications. Provide helpful, concise information about the document's content.",
    },
  ]);
  const { colors } = useTheme();

  const [getOpenAI, { isLoading, error }] = useGetOpenAIMutation();

  useEffect(() => {
    if (scannedImage && !messages.length) {
      analyzeDocument();
    }
  }, [scannedImage]);

  const generateImageMessage = async (imageUri: string) => {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      role: "user",
      content: [
        {
          type: "text",
          text: "Please analyze this document and summarize the key information.",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64}`,
          },
        },
      ],
    };
  };

  const analyzeDocument = async () => {
    if (!scannedImage) return;
    setIsAnalyzing(true);

    try {
      const imageMessage = await generateImageMessage(scannedImage);

      const updatedHistory = [...messageHistory, imageMessage];

      const response = await getOpenAI({
        model: process.env.EXPO_PUBLIC_OPENAI_MODEL,
        messages: updatedHistory,
      }).unwrap();

      const botResponse = response.choices[0].message.content;

      setMessages([
        {
          id: 1,
          text: botResponse,
          isBot: true,
        },
      ]);

      setMessageHistory([
        ...updatedHistory,
        {
          role: "assistant",
          content: botResponse,
        },
      ]);
    } catch (err) {
      console.error("OpenAI error during document analysis:", err);
      setMessages([
        {
          id: 1,
          text: "⚠️ Не удалось проанализировать документ. Попробуй ещё раз.",
          isBot: true,
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleScan = () => {
    setShowCamera(true);
  };

  const handleUpload = async () => {
    try {
      if (activeTab === "1") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
          setScannedImage(result.assets[0].uri);
          setDocumentType("image");
        }
      } else {
        await handlePickFile();
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const handlePhotoTaken = (uri: string) => {
    if (uri) {
      setScannedImage(uri);
      setDocumentType("image");
    }
    setShowCamera(false);
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      isBot: false,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageHistory((prev) => [
      ...prev,
      { role: "user", content: inputText },
    ]);
    setInputText("");

    // Add typing indicator
    const typingIndicator = {
      id: messages.length + 2,
      text: "Thinking...",
      isBot: true,
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingIndicator]);

    try {
      const response = await getOpenAI({
        model: process.env.EXPO_PUBLIC_OPENAI_MODEL,
        messages: [...messageHistory, { role: "user", content: inputText }],
      }).unwrap();

      const botResponse = {
        id: messages.length + 3,
        text: response.choices[0].message.content,
        isBot: true,
      };

      setMessages((prev) => [...prev.filter((m) => !m.isTyping), botResponse]);
      setMessageHistory((prev) => [
        ...prev,
        { role: "assistant", content: response.choices[0].message.content },
      ]);
    } catch (err) {
      console.error("OpenAI error:", err);

      // Remove typing indicator and add error message
      setMessages((prev) => [
        ...prev.filter((m) => !m.isTyping),
        {
          id: messages.length + 3,
          text: "Sorry, I encountered an error while processing your question. Please try again.",
          isBot: true,
        },
      ]);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allow all file types
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const { uri, mimeType, name } = asset;

        setScannedImage(uri);

        // Determine document type based on mimeType or file extension
        if (mimeType?.includes("pdf") || name?.endsWith(".pdf")) {
          setDocumentType("pdf");
        } else if (
          mimeType?.includes("word") ||
          name?.endsWith(".doc") ||
          name?.endsWith(".docx")
        ) {
          setDocumentType("word");
        } else if (
          mimeType?.includes("excel") ||
          name?.endsWith(".xls") ||
          name?.endsWith(".xlsx") ||
          name?.endsWith(".csv")
        ) {
          setDocumentType("excel");
        } else if (
          mimeType?.includes("image") ||
          name?.match(/\.(jpeg|jpg|png|gif|webp)$/i)
        ) {
          setDocumentType("image");
        } else {
          setDocumentType("document");
        }

        // Add a typing indicator message while analyzing
        setMessages([
          {
            id: 1,
            text: "Analyzing document...",
            isBot: true,
            isTyping: true,
          },
        ]);

        // Analyze the document with OpenAI
        try {
          // For non-image files, we would need to extract content or use a different API
          // Currently only handling images directly with GPT-4o
          let updatedHistory;

          if (
            mimeType?.includes("image") ||
            name?.match(/\.(jpeg|jpg|png|gif|webp)$/i)
          ) {
            // If it's an image, use the existing image analysis function
            const imageMessage = await generateImageMessage(uri);
            updatedHistory = [...messageHistory, imageMessage];
          } else {
            // For other file types, just send metadata
            updatedHistory = [
              ...messageHistory,
              {
                role: "user",
                content: `I've uploaded a ${documentType} file named "${name}". Please explain what information you would need to analyze this type of document.`,
              },
            ];
          }

          const response = await getOpenAI({
            model: process.env.EXPO_PUBLIC_OPENAI_MODEL,
            messages: updatedHistory,
          }).unwrap();

          const botResponse = response.choices[0].message.content;

          setMessages([
            {
              id: 1,
              text: botResponse,
              isBot: true,
            },
          ]);

          setMessageHistory([
            ...updatedHistory,
            {
              role: "assistant",
              content: botResponse,
            },
          ]);
        } catch (err) {
          console.error("OpenAI error during document analysis:", err);
          setMessages([
            {
              id: 1,
              text: "⚠️ Failed to analyze the document. Please try again.",
              isBot: true,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  if (showCamera) {
    return <CameraView onPhotoTaken={handlePhotoTaken} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.chatContent}>
          <Header
            title="Document Scanner"
            subtitle="Scan and analyze legal documents instantly"
          />

          <ThemedCard style={styles.scanCard}>
            <ToggleTabsRN tabs={tabs} onTabChange={setActiveTab} />
            <Pressable
              onPress={activeTab === "1" ? handleScan : handleUpload}
              disabled={scannedImage !== null}>
              {({ pressed }) => (
                <View
                  style={[
                    styles.scanCardContent,
                    pressed && styles.scanCardContentPressed,
                    { borderColor: colors.accent },
                    scannedImage && styles.scanCardWithDocument,
                  ]}>
                  {scannedImage ? (
                    <View style={styles.documentContainer}>
                      {documentType === "image" || documentType === null ? (
                        <Image
                          source={{ uri: scannedImage }}
                          style={styles.documentImage}
                        />
                      ) : (
                        <View
                          style={[
                            styles.documentIconContainer,
                            { backgroundColor: colors.accent + "20" },
                          ]}>
                          <Ionicons
                            name={
                              documentType === "pdf"
                                ? "document-text"
                                : documentType === "word"
                                ? "document"
                                : documentType === "excel"
                                ? "grid"
                                : "document-outline"
                            }
                            size={60}
                            color={colors.accent}
                          />
                          <Text
                            style={[
                              styles.documentCaption,
                              { color: colors.text },
                            ]}>
                            {documentType?.toUpperCase()} Document
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <HomeCard
                      title={
                        activeTab === "1"
                          ? "Click to scan document"
                          : "Click to upload document"
                      }
                      description={
                        activeTab === "1"
                          ? "Upload a clear photo or PDF of your legal document for analysis"
                          : "Upload a clear photo or PDF of your legal document for analysis"
                      }
                      icon={
                        activeTab === "1"
                          ? "camera-outline"
                          : "cloud-upload-outline"
                      }
                      color={colors.accent}
                    />
                  )}
                  {scannedImage && (
                    <View style={styles.imagePreviewContainer}>
                      <Pressable
                        style={styles.clearButton}
                        onPress={() => {
                          setScannedImage(null);
                          setDocumentType(null);
                          setMessages([]);
                          setMessageHistory([
                            {
                              role: "system",
                              content:
                                "You are a legal document analysis assistant specialized in analyzing legal documents. Help users understand the content of their scanned documents, identify important legal terms, and clarify any legal implications. Provide helpful, concise information about the document's content.",
                            },
                          ]);
                        }}>
                        <Text
                          style={[
                            styles.clearButtonText,
                            { color: colors.warning },
                          ]}>
                          Очистить
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}
            </Pressable>

            {scannedImage && (
              <View style={styles.chatContainer}>
                {isAnalyzing ? (
                  <View style={styles.analyzingContainer}>
                    <Ionicons
                      name="scan-outline"
                      size={24}
                      color={colors.accent}
                    />
                    <Text
                      style={[styles.analyzingText, { color: colors.text }]}>
                      Analyzing document...
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.messagesContainer}>
                      {messages.map((message) => (
                        <View
                          key={message.id}
                          style={[
                            styles.messageWrapper,
                            !message.isBot && styles.userMessageWrapper,
                          ]}>
                          {message.isBot && (
                            <View
                              style={[
                                styles.avatarContainer,
                                { backgroundColor: colors.accent },
                              ]}>
                              <Ionicons
                                name="shield-half-outline"
                                size={20}
                                color={"white"}
                              />
                            </View>
                          )}
                          <View
                            style={[
                              styles.messageBubble,
                              { backgroundColor: colors.background },
                              !message.isBot && {
                                backgroundColor: colors.accent,
                              },
                              message.isTyping && { opacity: 0.7 },
                            ]}>
                            <Text
                              style={[
                                styles.messageText,
                                {
                                  color: message.isBot ? colors.text : "white",
                                },
                              ]}>
                              {message.text}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}
          </ThemedCard>

          <ThemedButton
            title="Save"
            onPress={() => {
              console.log("Save");
            }}
          />
        </ScrollView>
        {scannedImage && !isAnalyzing && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={[
              styles.inputContainer,
              {
                borderColor: colors.border,
              },
            ]}>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.background },
              ]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ask me anything about scanned document..."
                placeholderTextColor={colors.hint}
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={inputText.trim() === "" || isLoading}>
                <Ionicons
                  name="send"
                  size={20}
                  color={
                    inputText.trim() && !isLoading ? colors.accent : colors.hint
                  }
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.disclaimer, { color: colors.hint }]}>
              Your conversations are confidential and protected
            </Text>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
};

export default ScanScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scanCard: {
    marginVertical: 16,
  },
  chatContent: {
    paddingVertical: 16,
  },
  scanCardContent: {
    minHeight: 300,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  scanCardWithDocument: {
    minHeight: 200,
  },
  scanCardContentPressed: {
    borderWidth: 2,
  },
  imagePreviewContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  clearButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  clearButtonText: {
    fontSize: 14,
  },
  documentContainer: {
    alignItems: "center",
    width: "100%",
  },
  documentImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    resizeMode: "contain",
  },
  documentIconContainer: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  documentCaption: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  chatContainer: {
    marginTop: 16,
    borderRadius: 10,
    minHeight: 300,
  },
  analyzingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  analyzingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  messagesContainer: {
    minHeight: 220,
    paddingHorizontal: 10,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  userMessageWrapper: {
    justifyContent: "flex-end",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: 16,
    padding: 12,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingTop: 12,
    paddingBottom: 12,
  },
  sendButton: {
    paddingLeft: 10,
    paddingBottom: 12,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: "center",
    marginVertical: 10,
  },
});
