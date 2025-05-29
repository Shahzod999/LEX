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
import React, { useState, useCallback } from "react";
import Header from "@/components/Card/Header";
import ToggleTabsRN from "@/components/ToggleTabs/ToggleTabsRN";
import HomeCard from "@/components/Card/HomeCard";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import CameraView from "@/components/Camera/CameraView";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useAppSelector } from "@/hooks/reduxHooks";
import { selectToken } from "@/redux/features/tokenSlice";
import { useWebSocketChat } from "@/hooks/useWebSocketChat";
import {
  useDeleteDocumentMutation,
  useUploadDocumentMutation,
} from "@/redux/api/endpoints/documentApiSlice";
import { Loading } from "@/components/LoadingScreen";

// WebSocket message interface
interface ChatMessage {
  messageId?: string;
  content: string;
  role: "user" | "assistant";
  timestamp?: Date;
}

// UI message interface
interface Message {
  id: number;
  text: string;
  isBot: boolean;
  isTyping?: boolean;
  messageId?: string;
  timestamp?: Date;
}

const tabs = [
  { id: "1", label: "Scan", type: "scan" },
  { id: "2", label: "Upload", type: "upload" },
];

const ScanScreen = () => {
  const { colors } = useTheme();
  const token = useAppSelector(selectToken);
  const [activeTab, setActiveTab] = useState<string>("1");
  const [showCamera, setShowCamera] = useState(false);
  const [scannedDocument, setScannedDocument] = useState<{
    uri: string;
    type: string;
    name?: string;
  } | null>(null);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [uploadDocument, { isLoading: isUploading }] =
    useUploadDocumentMutation();
  const [deleteDocument, { isLoading: isDeleting }] =
    useDeleteDocumentMutation();

  console.log(chatId, "scan");

  // WebSocket chat integration
  const {
    isConnected,
    isConnecting,
    isTyping,
    streamingMessage,
    sendMessage: sendWebSocketMessage,
    joinChat,
  } = useWebSocketChat({
    token: token || "",
    onMessage: useCallback((wsMessage: ChatMessage) => {
      const newMessage: Message = {
        id: Date.now(),
        text: wsMessage.content,
        isBot: wsMessage.role === "assistant",
        messageId: wsMessage.messageId,
        timestamp: wsMessage.timestamp,
      };

      setMessages((prev) => {
        const filteredMessages = prev.filter((m) => !m.isTyping);
        return [...filteredMessages, newMessage];
      });
    }, []),
    onError: useCallback((error: string) => {
      console.error("WebSocket error:", error);
    }, []),
    onChatJoined: useCallback(
      (data: { chatId: string; messages: any[]; title: string }) => {
        const historyMessages: Message[] = data.messages.map(
          (msg: any, index: number) => ({
            id: Date.now() + index,
            text: msg.content,
            isBot: msg.role === "assistant",
            messageId: msg._id,
            timestamp: new Date(msg.createdAt),
          })
        );
        setMessages(historyMessages);
      },
      []
    ),
  });

  const sanitizeFileName = (
    fileName: string,
    maxLength: number = 50
  ): string => {
    if (!fileName) return `document_${Date.now()}`;

    const lastDotIndex = fileName.lastIndexOf(".");
    const name =
      lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";

    const sanitized = name
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, maxLength - extension.length - 10)
      .trim();

    return `${sanitized}_${Date.now()}${extension}`;
  };

  // Handle streaming message display
  React.useEffect(() => {
    if (isTyping && streamingMessage) {
      setMessages((prev) => {
        const filteredMessages = prev.filter((m) => !m.isTyping);
        const typingMessage: Message = {
          id: Date.now(),
          text: streamingMessage,
          isBot: true,
          isTyping: true,
        };
        return [...filteredMessages, typingMessage];
      });
    } else if (!isTyping) {
      setMessages((prev) => prev.filter((m) => !m.isTyping));
    }
  }, [isTyping, streamingMessage]);

  const handleDocumentUpload = async (
    documentUri: string,
    documentType: string,
    fileName?: string
  ) => {
    if (!token) return;

    try {
      const formData = new FormData();
      const sanitizedFileName = sanitizeFileName(
        fileName || `document_${Date.now()}`
      );

      formData.append("files", {
        uri: documentUri,
        type: documentType,
        name: sanitizedFileName,
      } as any);

      formData.append("title", `Document Analysis - ${sanitizedFileName}`);
      formData.append("language", "Russian");

      const response = await uploadDocument(formData).unwrap();

      if (response.chat?._id) {
        setChatId(response.chat._id);
        setDocumentId(response.document._id);

        // Join the chat after successful upload
        joinChat(response.chat._id);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
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
          const asset = result.assets[0];
          const sanitizedFileName = sanitizeFileName(`image_${Date.now()}.jpg`);
          setScannedDocument({
            uri: asset.uri,
            type: "image/jpeg",
            name: sanitizedFileName,
          });
          await handleDocumentUpload(
            asset.uri,
            "image/jpeg",
            sanitizedFileName
          );
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          const sanitizedFileName = sanitizeFileName(
            asset.name || `document_${Date.now()}`
          );
          setScannedDocument({
            uri: asset.uri,
            type: asset.mimeType || "application/octet-stream",
            name: sanitizedFileName,
          });
          await handleDocumentUpload(
            asset.uri,
            asset.mimeType || "application/octet-stream",
            sanitizedFileName
          );
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const handlePhotoTaken = async (uri: string) => {
    if (uri) {
      // Close camera immediately after photo is taken
      setShowCamera(false);

      const sanitizedFileName = sanitizeFileName(`scanned_${Date.now()}.jpg`);
      setScannedDocument({
        uri,
        type: "image/jpeg",
        name: sanitizedFileName,
      });
      try {
        await handleDocumentUpload(uri, "image/jpeg", sanitizedFileName);
      } catch (error) {
        console.error("Error uploading document:", error);
      }
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim() === "" || !isConnected || !chatId) return;

    sendWebSocketMessage(inputText);
    setInputText("");

    const typingIndicator: Message = {
      id: Date.now() + 1,
      text: "Thinking...",
      isBot: true,
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingIndicator]);
  };

  const handleDeleteDocument = async () => {
    if (documentId) {
      try {
        await deleteDocument(documentId).unwrap();
        setScannedDocument(null);
        setMessages([]);
        setDocumentId(null);
        setChatId(null);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleSaveDocument = () => {
    setScannedDocument(null);
    setMessages([]);
    setDocumentId(null);
    setChatId(null);
  };

  const getDocumentIcon = (type: string) => {
    if (type.includes("pdf")) return "document-text";
    if (type.includes("word") || type.includes("doc")) return "document";
    if (type.includes("excel") || type.includes("sheet")) return "grid";
    if (type.includes("image")) return "image";
    return "document-outline";
  };

  const getDocumentTypeName = (type: string) => {
    if (type.includes("pdf")) return "PDF";
    if (type.includes("word") || type.includes("doc")) return "Word";
    if (type.includes("excel") || type.includes("sheet")) return "Excel";
    if (type.includes("image")) return "Image";
    return "Document";
  };

  if (showCamera) {
    return <CameraView onPhotoTaken={handlePhotoTaken} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isDeleting && <Loading />}
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.chatContent}>
          <Header
            title="Document Scanner"
            subtitle="Scan and analyze legal documents instantly"
          />

          <View style={styles.scanCard}>
            <ToggleTabsRN tabs={tabs} onTabChange={setActiveTab} />

            {!scannedDocument ? (
              <Pressable
                onPress={activeTab === "1" ? handleScan : handleUpload}>
                {({ pressed }) => (
                  <View
                    style={[
                      styles.scanCardContent,
                      pressed && styles.scanCardContentPressed,
                      { borderColor: colors.accent },
                    ]}>
                    <HomeCard
                      title={
                        activeTab === "1"
                          ? "Click to scan document"
                          : "Click to upload document"
                      }
                      description="Upload a clear photo or document for AI analysis"
                      icon={
                        activeTab === "1"
                          ? "camera-outline"
                          : "cloud-upload-outline"
                      }
                      color={colors.accent}
                    />
                  </View>
                )}
              </Pressable>
            ) : (
              <View
                style={[
                  styles.scanCardContent,
                  { borderColor: colors.accent },
                ]}>
                <View style={styles.documentContainer}>
                  {scannedDocument.type.includes("image") ? (
                    <Image
                      source={{ uri: scannedDocument.uri }}
                      style={styles.documentImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.documentIconContainer,
                        { backgroundColor: colors.accent + "20" },
                      ]}>
                      <Ionicons
                        name={getDocumentIcon(scannedDocument.type)}
                        size={60}
                        color={colors.accent}
                      />
                      <Text
                        style={[
                          styles.documentCaption,
                          { color: colors.text },
                        ]}>
                        {getDocumentTypeName(scannedDocument.type)}
                      </Text>
                      <Text
                        style={[styles.documentName, { color: colors.hint }]}>
                        {scannedDocument.name}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.clearButton}>
                  <Text
                    style={[styles.clearButtonText, { color: colors.warning }]}
                    onPress={handleDeleteDocument}>
                    Delete
                  </Text>
                  <Text
                    style={[styles.clearButtonText, { color: colors.success }]}
                    onPress={handleSaveDocument}>
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Connection Status */}
            {scannedDocument && (
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor: isUploading
                        ? "#ffaa00"
                        : isConnected
                        ? "#44ff44"
                        : "#ff4444",
                    },
                  ]}
                />
                <Text style={[styles.statusText, { color: colors.text }]}>
                  {isUploading
                    ? "Uploading document..."
                    : isConnecting
                    ? "Connecting..."
                    : !isConnected
                    ? "Disconnected"
                    : "Connected"}
                </Text>
              </View>
            )}

            {/* Chat Messages */}
            {scannedDocument && chatId && isConnected && (
              <View style={styles.chatContainer}>
                <View style={styles.messagesContainer}>
                  {messages.map((message) => (
                    <View
                      key={message.id}
                      style={[
                        styles.messageWrapper,
                        !message.isBot && styles.userMessageWrapper,
                      ]}>
                      <View
                        style={[
                          styles.messageBubble,
                          { backgroundColor: colors.card },
                          !message.isBot && {
                            backgroundColor: colors.userAccent,
                          },
                          message.isTyping && { opacity: 0.7 },
                        ]}>
                        <Text
                          style={[styles.messageText, { color: colors.text }]}>
                          {message.text}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Input for additional questions */}
        {scannedDocument && chatId && !isUploading && isConnected && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.background },
              ]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ask questions about your document..."
                placeholderTextColor={colors.hint}
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={inputText.trim() === "" || !isConnected || isTyping}>
                <Ionicons
                  name="send"
                  size={20}
                  color={
                    inputText.trim() && isConnected && !isTyping
                      ? colors.accent
                      : colors.hint
                  }
                />
              </TouchableOpacity>
            </View>
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
  },
  scanCard: {
    marginVertical: 16,
  },
  chatContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
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
  scanCardContentPressed: {
    borderWidth: 2,
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
  documentName: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
  clearButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    width: "100%",
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  clearButtonText: {
    fontSize: 14,
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    opacity: 0.7,
  },
  chatContainer: {
    marginTop: 16,
    borderRadius: 10,
    minHeight: 200,
  },
  messagesContainer: {
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
  messageBubble: {
    maxWidth: "95%",
    borderRadius: 16,
    padding: 16,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
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
});
