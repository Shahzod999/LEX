import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Header from "@/components/Card/Header";
import ChatHistoryMenu from "@/components/ChatHistoryMenu";
import { useTheme } from "@/context/ThemeContext";
import { useChat } from "@/context/ChatContext";
import { useGetUserOneChatQuery } from "@/redux/api/endpoints/chatApiSlice";
import { usePathname } from "expo-router";

// Interface for UI messages that includes all possible fields
interface UIMessage {
  _id?: string;
  messageId?: string;
  content: string;
  role: "user" | "assistant";
  createdAt?: string;
  timestamp?: Date;
  isTyping?: boolean;
}

const ChatScreen = () => {
  const { colors } = useTheme();
  const [inputText, setInputText] = useState("");
  const [chatHistoryVisible, setChatHistoryVisible] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [userSelectedChat, setUserSelectedChat] = useState(false); // Flag to track if user manually selected a chat

  const { data: currentChatData, isLoading: isLoadingChat } =
    useGetUserOneChatQuery(selectedChatId || "", {
      refetchOnMountOrArgChange: true,
    });
  console.log(selectedChatId, "selectedChatId");

  const {
    isConnected,
    isConnecting,
    currentChat,
    sendMessage,
    createChat,
    joinChat,
  } = useChat();

  // Auto-connect to API chat data only if user hasn't manually selected a chat
  useEffect(() => {
    if (isConnected && currentChatData?._id) {
      setSelectedChatId(currentChatData._id);
      joinChat(currentChatData._id);
    }
  }, [isConnected, currentChatData?._id]);

  // Determine which messages to show
  const getDisplayMessages = (): UIMessage[] => {
    // If we have WebSocket messages and they match current selection, use them (real-time)
    if (currentChat.messages && currentChat.chatId === selectedChatId) {
      return currentChat.messages;
    }

    // Otherwise use API data if it matches selection
    if (currentChatData?.messages && currentChatData._id === selectedChatId) {
      return currentChatData.messages.map((msg) => ({
        _id: msg._id,
        content: msg.content,
        role: msg.role as "user" | "assistant",
        createdAt: msg.createdAt,
      }));
    }

    return [];
  };

  const displayMessages = getDisplayMessages();
  const currentChatId = currentChat.chatId;

  const handleSendMessage = () => {
    if (inputText.trim() === "" || !isConnected) return;

    sendMessage(inputText);
    setInputText("");
  };

  const handleSwipeGesture = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      if (translationX > 50 && velocityX > 0) {
        setChatHistoryVisible(true);
      }
    }
  };

  const handleChatHistoryToggle = () => {
    setChatHistoryVisible(!chatHistoryVisible);
  };

  const handleSelectChat = (chatId: string) => {
    if (isConnected && chatId) {
      setUserSelectedChat(true); // Mark that user manually selected a chat
      setSelectedChatId(chatId);
      joinChat(chatId);
    }
  };

  const handleCreateNewChat = () => {
    if (isConnected) {
      setUserSelectedChat(true); // Mark that user initiated action
      setSelectedChatId(""); // Clear selection first
      createChat();
    }
  };

  // Reset user selection flag when chat is actually joined
  useEffect(() => {
    if (currentChat.chatId && userSelectedChat) {
      setSelectedChatId(currentChat.chatId);
      // Don't reset userSelectedChat flag here to prevent auto-switching back
    }
  }, [currentChat.chatId, userSelectedChat]);

  // Connection status
  const getConnectionStatus = () => {
    if (isConnecting) return "Connecting...";
    if (!isConnected) return "Disconnected";
    if (!currentChatId) return "Ready to chat...";
    return "Connected";
  };

  const getConnectionColor = () => {
    if (isConnecting) return "#ffaa00";
    if (!isConnected) return "#ff4444";
    return "#44ff44";
  };

  // Prepare final messages for display
  const finalMessages: UIMessage[] = [...displayMessages];

  // Add welcome message if no messages
  if (finalMessages.length === 0) {
    finalMessages.push({
      _id: "welcome",
      content:
        "Hello! I'm your AI legal companion. How can I help you today with visa or migration questions?",
      role: "assistant",
      createdAt: new Date().toISOString(),
    });
  }

  // Add streaming message if typing
  if (currentChat.isTyping && currentChat.streamingMessage) {
    finalMessages.push({
      _id: "typing",
      content: currentChat.streamingMessage,
      role: "assistant",
      createdAt: new Date().toISOString(),
      isTyping: true,
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
          <ScrollView contentContainerStyle={styles.chatContent}>
            <Header
              title="Ask Lex - Your Legal Companion"
              subtitle="Get clear, calm answers to your legal questions"
              secondIcon="chatbubbles"
              secondIconFunction={handleChatHistoryToggle}
            />

            {/* Connection Status Indicator */}
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getConnectionColor() },
                ]}
              />
              <Text style={[styles.statusText, { color: colors.text }]}>
                {getConnectionStatus()}
              </Text>
            </View>

            <View style={styles.chatContainer}>
              {isLoadingChat ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                finalMessages.map((message, index) => (
                  <View
                    key={message._id || message.messageId || index}
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
                        message.isTyping && { opacity: 0.7 },
                      ]}>
                      <Text
                        style={[styles.messageText, { color: colors.text }]}>
                        {message.content}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </PanGestureHandler>

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
              placeholder="Your conversations are confidential and protected"
              placeholderTextColor={colors.hint}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={
                inputText.trim() === "" || !isConnected || currentChat.isTyping
              }>
              <Ionicons
                name="send"
                size={20}
                color={
                  inputText.trim() && isConnected && !currentChat.isTyping
                    ? colors.accent
                    : colors.hint
                }
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <ChatHistoryMenu
          visible={chatHistoryVisible}
          onClose={() => setChatHistoryVisible(false)}
          onSelectChat={handleSelectChat}
          onCreateNewChat={handleCreateNewChat}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
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
    flex: 1,
    borderRadius: 10,
    marginVertical: 16,
  },
  chatContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
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
    fontSize: 16,
    lineHeight: 22,
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

export default ChatScreen;
