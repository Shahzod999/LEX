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
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import Header from "@/components/Card/Header";
import ToggleTabsRN from "@/components/ToggleTabs/ToggleTabsRN";
import HomeCard from "@/components/Card/HomeCard";
import { useTheme } from "@/context/ThemeContext";
import { useChat } from "@/context/ChatContext";
import { Ionicons } from "@expo/vector-icons";
import CameraView from "@/components/Camera/CameraView";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useAppSelector } from "@/hooks/reduxHooks";
import { selectToken } from "@/redux/features/tokenSlice";
import {
  useDeleteDocumentMutation,
  useUploadDocumentMutation,
} from "@/redux/api/endpoints/documentApiSlice";
import { Loading } from "@/components/LoadingScreen";

// Document interface
interface ScannedDocument {
  id: string;
  uri: string;
  type: string;
  name?: string;
  documentId?: string;
}

// Add a counter for unique IDs
let documentCounter = 0;

const tabs = [
  { id: "1", label: "Scan", type: "scan" },
  { id: "2", label: "Upload", type: "upload" },
];

const ScanScreen = () => {
  const { colors } = useTheme();
  const token = useAppSelector(selectToken);
  const [activeTab, setActiveTab] = useState<string>("1");
  const [showCamera, setShowCamera] = useState(false);
  const [scannedDocuments, setScannedDocuments] = useState<ScannedDocument[]>(
    []
  );
  const [inputText, setInputText] = useState("");
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [documentChatId, setDocumentChatId] = useState<string>("");

  const [uploadDocument, { isLoading: isUploading }] =
    useUploadDocumentMutation();
  const [deleteDocument, { isLoading: isDeleting }] =
    useDeleteDocumentMutation();

  // Use chat context
  const { isConnected, isConnecting, currentChat, sendMessage, joinChat } =
    useChat();

  // Get current messages and state for documents chat
  const currentMessages = currentChat.messages || [];
  const isTyping = currentChat.isTyping;
  const streamingMessage = currentChat.streamingMessage;
  const currentChatId = currentChat.chatId;

  // Connect to document chat only when we have a chatId from uploaded document
  useEffect(() => {
    if (isConnected && documentChatId && documentChatId !== currentChatId) {
      joinChat(documentChatId);
    }
  }, [isConnected, documentChatId, currentChatId, joinChat]);

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

  // Массовая загрузка документов
  const handleMultipleDocumentsUpload = async (
    documents: ScannedDocument[]
  ) => {
    if (!token || documents.length === 0) return null;

    try {
      setUploadProgress(
        `Preparing ${documents.length} document(s) for upload...`
      );

      const formData = new FormData();

      // Добавляем все файлы в один FormData
      documents.forEach((document, index) => {
        setUploadProgress(
          `Processing document ${index + 1} of ${documents.length}...`
        );

        const sanitizedFileName = sanitizeFileName(
          document.name || `document_${Date.now()}_${index}`
        );

        formData.append("files", {
          uri: document.uri,
          type: document.type,
          name: sanitizedFileName,
        } as any);
      });

      // Создаем заголовок для множественных документов
      const documentNames = documents
        .map((doc) => doc.name || getDocumentTypeName(doc.type))
        .join(", ");

      formData.append("title", documentNames);
      formData.append("language", "Russian");

      setUploadProgress("Uploading and analyzing documents...");
      const response = await uploadDocument(formData).unwrap();

      if (response.chat?._id && response.document?._id) {
        setUploadProgress("Connecting to chat...");
        setDocumentChatId(response.chat._id);

        setUploadProgress("Upload completed successfully!");
        setTimeout(() => setUploadProgress(""), 2000);

        return {
          documentId: response.document._id,
          chatId: response.chat._id,
          filesUrl: response.document.filesUrl || [],
        };
      }
      return null;
    } catch (error) {
      console.error("Error uploading multiple documents:", error);
      setUploadProgress("Upload failed. Please try again.");
      setTimeout(() => setUploadProgress(""), 3000);
      return null;
    }
  };

  const addDocument = (uri: string, type: string, name?: string) => {
    documentCounter += 1;
    const newDocument: ScannedDocument = {
      id: `doc_${Date.now()}_${documentCounter}`,
      uri,
      type,
      name,
    };

    setScannedDocuments((prev) => [...prev, newDocument]);
  };

  const handleAnalyzeDocuments = async () => {
    if (scannedDocuments.length === 0) return;

    try {
      // Фильтруем документы, которые еще не загружены
      const documentsToUpload = scannedDocuments.filter(
        (doc) => !doc.documentId
      );

      if (documentsToUpload.length > 0) {
        // Загружаем все документы одновременно
        const uploadResult = await handleMultipleDocumentsUpload(
          documentsToUpload
        );

        if (uploadResult) {
          // Обновляем все документы с одним documentId
          const updatedDocuments = scannedDocuments.map((doc) => ({
            ...doc,
            documentId: uploadResult.documentId,
          }));

          setScannedDocuments(updatedDocuments);
        }
      }

      setIsAnalyzed(true);
    } catch (error) {
      console.error("Error analyzing documents:", error);
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
          allowsMultipleSelection: true,
        });

        if (!result.canceled && result.assets) {
          for (const asset of result.assets) {
            if (asset.uri) {
              const sanitizedFileName = sanitizeFileName(
                `image_${Date.now()}.jpg`
              );
              addDocument(asset.uri, "image/jpeg", sanitizedFileName);
            }
          }
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: true,
          multiple: true,
        });

        if (!result.canceled && result.assets) {
          for (const asset of result.assets) {
            const sanitizedFileName = sanitizeFileName(
              asset.name || `document_${Date.now()}`
            );
            addDocument(
              asset.uri,
              asset.mimeType || "application/octet-stream",
              sanitizedFileName
            );
          }
        }
      }
    } catch (error) {
      console.error("Error picking documents:", error);
    }
  };

  const handlePhotoTaken = (uri: string) => {
    if (uri) {
      setShowCamera(false);
      const sanitizedFileName = sanitizeFileName(`scanned_${Date.now()}.jpg`);
      addDocument(uri, "image/jpeg", sanitizedFileName);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim() === "" || !isConnected || !documentChatId) return;

    // Send message to current active documents chat
    sendMessage(inputText);
    setInputText("");
  };

  const handleDeleteDocument = async (documentToDelete: ScannedDocument) => {
    // Удаляем документ из локального состояния
    const updatedDocuments = scannedDocuments.filter(
      (doc) => doc.id !== documentToDelete.id
    );
    setScannedDocuments(updatedDocuments);

    // Если это был последний документ, сбрасываем состояние
    if (updatedDocuments.length === 0) {
      if (documentToDelete.documentId) {
        try {
          await deleteDocument(documentToDelete.documentId).unwrap();
        } catch (error) {
          console.log("Error deleting document from server:", error);
        }
      }

      setIsAnalyzed(false);
      setDocumentChatId("");
    } else if (isAnalyzed && documentToDelete.documentId) {
      // Если документ уже был загружен и анализирован, нужно перезагрузить оставшиеся документы
      const documentsWithoutIds = updatedDocuments.map((doc) => ({
        ...doc,
        documentId: undefined,
      }));
      setScannedDocuments(documentsWithoutIds);
      setIsAnalyzed(false);
      setDocumentChatId("");

      // Удаляем старый документ с сервера
      try {
        await deleteDocument(documentToDelete.documentId).unwrap();
      } catch (error) {
        console.log("Error deleting document from server:", error);
      }
    }
  };

  const handleDeleteAllDocuments = () => {
    Alert.alert(
      "Delete All Documents",
      "Are you sure you want to delete all documents?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Удаляем все документы с сервера
              for (const doc of scannedDocuments) {
                if (doc.documentId) {
                  await deleteDocument(doc.documentId).unwrap();
                }
              }

              // Сбрасываем локальное состояние
              setScannedDocuments([]);
              setIsAnalyzed(false);
              setDocumentChatId("");
            } catch (error) {
              console.log("Error deleting documents:", error);
            }
          },
        },
      ]
    );
  };

  const handleSaveDocuments = () => {
    setScannedDocuments([]);
    setIsAnalyzed(false);
    setDocumentChatId("");
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

  // Prepare messages for display
  const displayMessages = [...currentMessages];

  // Add streaming message if typing
  if (isTyping && streamingMessage) {
    displayMessages.push({
      messageId: `typing_${Date.now()}`,
      content: streamingMessage,
      role: "assistant",
      timestamp: new Date(),
    });
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

            {scannedDocuments.length === 0 ? (
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
                      description="Upload clear photos or documents for AI analysis"
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
                <View style={styles.documentsHeader}>
                  <Text style={[styles.documentsTitle, { color: colors.text }]}>
                    Documents ({scannedDocuments.length})
                  </Text>
                  <View style={styles.headerButtons}>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        { backgroundColor: colors.accent },
                      ]}
                      onPress={activeTab === "1" ? handleScan : handleUpload}>
                      <Ionicons name="add" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.documentsScroll}>
                  {scannedDocuments.map((document) => (
                    <View key={document.id} style={styles.documentItem}>
                      {document.type.includes("image") ? (
                        <Image
                          source={{ uri: document.uri }}
                          style={styles.documentThumbnail}
                        />
                      ) : (
                        <View
                          style={[
                            styles.documentIconThumbnail,
                            { backgroundColor: colors.accent + "20" },
                          ]}>
                          <Ionicons
                            name={getDocumentIcon(document.type)}
                            size={40}
                            color={colors.accent}
                          />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.documentItemName,
                          { color: colors.text },
                        ]}
                        numberOfLines={2}>
                        {document.name || getDocumentTypeName(document.type)}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteDocumentButton}
                        onPress={() => handleDeleteDocument(document)}>
                        <Ionicons
                          name="close-circle"
                          size={25}
                          color={colors.warning}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.warning + "20" },
                    ]}
                    onPress={handleDeleteAllDocuments}>
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: colors.warning },
                      ]}>
                      Delete All
                    </Text>
                  </TouchableOpacity>
                  {!isAnalyzed ? (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: colors.accent },
                      ]}
                      onPress={handleAnalyzeDocuments}
                      disabled={isUploading}>
                      <Text
                        style={[styles.actionButtonText, { color: "white" }]}>
                        {isUploading ? "Analyzing..." : "Analyze"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: colors.success + "20" },
                      ]}
                      onPress={handleSaveDocuments}>
                      <Text
                        style={[
                          styles.actionButtonText,
                          { color: colors.success },
                        ]}>
                        Continue
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Connection Status */}
            {scannedDocuments.length > 0 && isAnalyzed && (
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
                    ? uploadProgress || "Uploading documents..."
                    : isConnecting
                    ? "Connecting..."
                    : !isConnected
                    ? "Disconnected"
                    : `Connected - ${scannedDocuments.length} document(s) ready`}
                </Text>
              </View>
            )}

            {/* Upload Progress */}
            {isUploading && uploadProgress && (
              <View
                style={[
                  styles.progressContainer,
                  { backgroundColor: colors.card },
                ]}>
                <Text style={[styles.progressText, { color: colors.accent }]}>
                  {uploadProgress}
                </Text>
              </View>
            )}

            {/* Chat Messages */}
            {scannedDocuments.length > 0 &&
              documentChatId &&
              isConnected &&
              isAnalyzed && (
                <View style={styles.chatContainer}>
                  <View style={styles.messagesContainer}>
                    {displayMessages.map((message, index) => (
                      <View
                        key={message.messageId || index}
                        style={[
                          styles.messageWrapper,
                          message.role === "user" && styles.userMessageWrapper,
                        ]}>
                        <View
                          style={[
                            styles.messageBubble,
                            { backgroundColor: colors.card },
                            message.role === "user" && {
                              backgroundColor: colors.userAccent,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.messageText,
                              { color: colors.text },
                            ]}>
                            {message.content}
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
        {scannedDocuments.length > 0 &&
          documentChatId &&
          !isUploading &&
          isConnected &&
          isAnalyzed && (
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
                  placeholder="Ask questions about your documents..."
                  placeholderTextColor={colors.hint}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendMessage}
                  disabled={
                    inputText.trim() === "" || !isConnected || isTyping
                  }>
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
    paddingVertical: 16,
  },
  scanCardContentPressed: {
    borderWidth: 2,
  },
  documentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  documentsTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  documentsScroll: {
    width: "100%",
    marginBottom: 16,
  },
  documentItem: {
    width: 120,
    marginRight: 12,
    marginTop: 12,
    alignItems: "center",
    position: "relative",
  },
  documentThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    resizeMode: "cover",
  },
  documentIconThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  documentItemName: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  deleteDocumentButton: {
    position: "absolute",
    top: -5,
    right: 0,
    backgroundColor: "white",
    borderRadius: 10,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
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
  progressContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
