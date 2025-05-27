import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Header from "@/components/Card/Header";
import ChatHistoryMenu from "@/components/ChatHistoryMenu";
import { useTheme } from "@/context/ThemeContext";
import { useAppSelector } from "@/hooks/reduxHooks";
import { selectToken } from "@/redux/features/tokenSlice";
import { useWebSocketChat } from "@/hooks/useWebSocketChat";
import { useGetUserChatsQuery } from "@/redux/api/endpoints/chatApiSlice";

// Define message interface
interface Message {
  id: number;
  text: string;
  isBot: boolean;
  isTyping?: boolean;
  isHelpful?: boolean | undefined;
  messageId?: string;
  timestamp?: Date;
}

// WebSocket message interface
interface ChatMessage {
  messageId?: string;
  content: string;
  role: "user" | "assistant";
  timestamp?: Date;
}

const ChatScreen = () => {
  const { colors } = useTheme();
  const token = useAppSelector(selectToken);
  const [inputText, setInputText] = useState("");
  const [chatHistoryVisible, setChatHistoryVisible] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Query for chat history to invalidate cache when needed
  const { data: chatHistory, refetch: refetchChats } = useGetUserChatsQuery();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI legal companion. How can I help you today with visa or migration questions?",
      isBot: true,
    },
  ]);
  const [hasLoadedInitialChat, setHasLoadedInitialChat] = useState(false);

  // WebSocket chat integration
  const {
    isConnected,
    isConnecting,
    currentChatId,
    isTyping,
    streamingMessage,
    sendMessage: sendWebSocketMessage,
    createChat,
    joinChat,
    connect,
  } = useWebSocketChat({
    token: token || "",
    onMessage: useCallback(
      (wsMessage: ChatMessage) => {
        const newMessage: Message = {
          id: Date.now(),
          text: wsMessage.content,
          isBot: wsMessage.role === "assistant",
          messageId: wsMessage.messageId,
          timestamp: wsMessage.timestamp,
        };

        setMessages((prev) => {
          // Remove typing indicator if it exists
          const filteredMessages = prev.filter((m) => !m.isTyping);
          return [...filteredMessages, newMessage];
        });

        // Reset sending state when we receive any message
        setIsSending(false);

        // Refetch chats to update history when new messages are added
        if (wsMessage.role === "assistant") {
          refetchChats();
        }
      },
      [refetchChats]
    ),
    onError: useCallback((error: string) => {
      console.error("WebSocket error:", error);
      setConnectionError(error);
      setIsSending(false); // Reset sending state on error
      // Clear error after 5 seconds
      setTimeout(() => setConnectionError(null), 5000);
    }, []),
    onChatJoined: useCallback(
      (data: { chatId: string; messages: any[]; title: string }) => {
        console.log("Chat joined with history:", data);

        // Convert server messages to UI format
        const historyMessages: Message[] = data.messages.map(
          (msg: any, index: number) => ({
            id: Date.now() + index,
            text: msg.content,
            isBot: msg.role === "assistant",
            messageId: msg._id,
            timestamp: new Date(msg.createdAt),
          })
        );

        // Set messages from history, or show welcome message if no history
        if (historyMessages.length === 0) {
          setMessages([
            {
              id: 1,
              text: "Hello! I'm your AI legal companion. How can I help you today with visa or migration questions?",
              isBot: true,
            },
          ]);
        } else {
          setMessages(historyMessages);
        }
      },
      []
    ),
    onChatCreated: useCallback(
      (data: { chatId: string; title: string }) => {
        console.log("New chat created:", data);
        // Refetch chats to update history
        refetchChats();
      },
      [refetchChats]
    ),
  });

  // Auto-connect when token is available
  useEffect(() => {
    if (token && !isConnected && !isConnecting) {
      setConnectionError(null);
      connect();
    }
  }, [token, isConnected, isConnecting, connect]);

  // Load last chat or create new one
  useEffect(() => {
    if (isConnected && !currentChatId && !hasLoadedInitialChat && chatHistory) {
      setHasLoadedInitialChat(true);

      if (chatHistory.length > 0) {
        // Join the most recent chat
        const lastChat = chatHistory[0]; // Assuming chats are sorted by most recent first
        console.log("Joining last chat:", lastChat._id);
        joinChat(lastChat._id);
      } else {
        // Create new chat if no history exists
        console.log("No chat history, creating new chat");
        createChat();
      }
    }
  }, [
    isConnected,
    currentChatId,
    hasLoadedInitialChat,
    chatHistory,
    joinChat,
    createChat,
  ]);

  // Handle streaming message display
  useEffect(() => {
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
      // Remove typing indicator when streaming is complete
      setMessages((prev) => prev.filter((m) => !m.isTyping));
    }
  }, [isTyping, streamingMessage]);

  const handleSendMessage = async () => {
    if (inputText.trim() === "" || !isConnected || isSending) return;

    setIsSending(true);

    // Send message via WebSocket
    sendWebSocketMessage(inputText);
    setInputText("");

    // Add typing indicator
    const typingIndicator: Message = {
      id: Date.now() + 1,
      text: "Thinking...",
      isBot: true,
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingIndicator]);
  };

  const handleSwipeGesture = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;

      // Swipe right to open chat history
      if (translationX > 50 && velocityX > 0) {
        setChatHistoryVisible(true);
      }
    }
  };

  const handleChatHistoryToggle = () => {
    setChatHistoryVisible(!chatHistoryVisible);
  };

  const handleSelectChat = (chatId: string) => {
    console.log("Selected chat:", chatId);
    if (isConnected) {
      // Clear current messages before joining new chat
      setMessages([]);
      setIsSending(false); // Reset sending state
      joinChat(chatId);
    }
  };

  const handleCreateNewChat = () => {
    console.log("Creating new chat");
    if (isConnected) {
      // Clear current messages and create new chat
      setMessages([
        {
          id: 1,
          text: "Hello! I'm your AI legal companion. How can I help you today with visa or migration questions?",
          isBot: true,
        },
      ]);
      setIsSending(false); // Reset sending state
      createChat();
    }
  };

  // Connection status indicator
  const getConnectionStatus = () => {
    if (connectionError) return `Error: ${connectionError}`;
    if (isConnecting) return "Connecting...";
    if (!isConnected) return "Disconnected";
    if (!currentChatId) return "Creating chat...";
    return "Connected";
  };

  const getConnectionColor = () => {
    if (connectionError) return "#ff4444";
    if (isConnecting) return "#ffaa00";
    if (!isConnected) return "#ff4444";
    if (!currentChatId) return "#ffaa00";
    return "#44ff44";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
          <ScrollView contentContainerStyle={styles.chatContent}>
            <Header
              title="Ask Lex - Your Legal Companion"
              subtitle={`Get clear, calm answers to your legal questions`}
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
              {messages.map((message, index) => (
                <View
                  key={message.id + index}
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
                    <Text style={[styles.messageText, { color: colors.text }]}>
                      {message.text}
                    </Text>
                  </View>
                </View>
              ))}
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
              placeholder=" Your conversations are confidential and protected"
              placeholderTextColor={colors.hint}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              disabled={
                inputText.trim() === "" || !isConnected || isTyping || isSending
              }>
              <Ionicons
                name="send"
                size={20}
                color={
                  inputText.trim() && isConnected && !isTyping && !isSending
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
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  messageBubble: {
    maxWidth: "95%",
    borderRadius: 16,
    padding: 16,
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },

  feedbackContainer: {
    flexDirection: "row",
    marginTop: 12,
  },
  feedbackButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  feedbackText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#757575",
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
