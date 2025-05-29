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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Header from "@/components/Card/Header";
import ChatHistoryMenu from "@/components/ChatHistoryMenu";
import { useTheme } from "@/context/ThemeContext";
import { useChat } from "@/context/ChatContext";
import {
  useGetUserChatsQuery,
  useGetUserOneChatQuery,
} from "@/redux/api/endpoints/chatApiSlice";
import { selectToken } from "@/redux/features/tokenSlice";
import { useAppSelector } from "@/hooks/reduxHooks";

// Define message interface
interface Message {
  id: number;
  text: string;
  isBot: boolean;
  isTyping?: boolean;
  messageId?: string;
  timestamp?: Date;
}

const ChatScreen = () => {
  const { colors } = useTheme();
  const [inputText, setInputText] = useState("");
  const [chatHistoryVisible, setChatHistoryVisible] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const token = useAppSelector(selectToken);

  // Use the global chat context
  const {
    isConnected,
    isConnecting,
    messagesChat,
    sendMessage: sendWebSocketMessage,
    createChat,
    joinChat,
    connect,
  } = useChat();

  // Query for chat data
  const { data: chatHistory, refetch: refetchChats } = useGetUserChatsQuery();
  const { data: currentChat, error: currentChatError, refetch: refetchCurrentChat } = useGetUserOneChatQuery(messagesChat.chatId || "");

  // Convert chat messages to UI format
  const convertToUIMessages = (chatMessages: any[]): Message[] => {
    if (!chatMessages) return [];
    return chatMessages.map((msg, index) => ({
      id: Date.now() + index,
      text: msg.content,
      isBot: msg.role === "assistant",
      messageId: msg.messageId,
      timestamp: msg.timestamp,
    }));
  };

  // Get messages from currentChat or fallback to messagesChat
  const getDisplayMessages = (): Message[] => {
    // If there's an error fetching current chat, use context data
    if (currentChatError) {
      console.warn("Error fetching current chat, using context data:", currentChatError);
      if (messagesChat.messages) {
        return convertToUIMessages(messagesChat.messages);
      }
      return [];
    }

    // Use currentChat data if available
    if (currentChat?.messages) {
      return convertToUIMessages(currentChat.messages);
    }
    
    // Fallback to messagesChat from context
    if (messagesChat.messages) {
      return convertToUIMessages(messagesChat.messages);
    }
    
    return [];
  };

  const displayMessages = getDisplayMessages();
  const isTyping = messagesChat.isTyping;
  const streamingMessage = messagesChat.streamingMessage;

  // Auto-connect when token is available
  useEffect(() => {
    if (token && !isConnected && !isConnecting) {
      connect();
    }
  }, [token, isConnected, isConnecting, connect]);

  // Check if current chat still exists, if not - switch to available chat or create new
  useEffect(() => {
    if (isConnected && messagesChat.chatId && chatHistory) {
      const messageChats = chatHistory.filter(
        (chat) => !chat.sourceType || chat.sourceType === "manual"
      );
      
      // Check if current chat exists in the list
      const currentChatExists = messageChats.some(chat => chat._id === messagesChat.chatId);
      
      if (!currentChatExists) {
        console.log("Current chat no longer exists, switching to available chat or creating new one");
        
        if (messageChats.length > 0) {
          // Switch to the first available chat
          joinChat(messageChats[0]._id, "messages");
        } else {
          // No chats available, create a new one
          createChat("messages");
        }
      }
    }
  }, [isConnected, messagesChat.chatId, chatHistory, joinChat, createChat]);

  // Load last chat or create new one
  useEffect(() => {
    if (isConnected && !messagesChat.chatId && chatHistory) {
      const messageChats = chatHistory.filter(
        (chat) => !chat.sourceType || chat.sourceType === "manual"
      );

      if (messageChats.length > 0) {
        joinChat(messageChats[0]._id, "messages");
      } else {
        createChat("messages");
      }
    }
  }, [isConnected, messagesChat.chatId, chatHistory, joinChat, createChat]);

  const handleSendMessage = async () => {
    if (inputText.trim() === "" || !isConnected || isSending) return;

    setIsSending(true);
    sendWebSocketMessage(inputText, "messages");
    setInputText("");
    
    // Refetch current chat to get updated messages
    setTimeout(() => {
      refetchCurrentChat();
      setIsSending(false);
    }, 1000);
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
    if (isConnected) {
      setIsSending(false);
      joinChat(chatId, "messages");
      refetchCurrentChat();
    }
  };

  const handleCreateNewChat = () => {
    if (isConnected) {
      setIsSending(false);
      createChat("messages");
      // Refetch chat history to include the new chat
      setTimeout(() => {
        refetchChats();
        refetchCurrentChat();
      }, 500);
    }
  };

  // Connection status
  const getConnectionStatus = () => {
    if (isConnecting) return "Connecting...";
    if (!isConnected) return "Disconnected";
    if (!messagesChat.chatId) return "Creating chat...";
    return "Connected";
  };

  const getConnectionColor = () => {
    if (isConnecting) return "#ffaa00";
    if (!isConnected) return "#ff4444";
    if (!messagesChat.chatId) return "#ffaa00";
    return "#44ff44";
  };

  // Prepare final messages for display
  const finalMessages = [...displayMessages];

  // Add welcome message if no messages
  if (finalMessages.length === 0) {
    finalMessages.push({
      id: 1,
      text: "Hello! I'm your AI legal companion. How can I help you today with visa or migration questions?",
      isBot: true,
    });
  }

  // Add streaming message if typing
  if (isTyping && streamingMessage) {
    finalMessages.push({
      id: Date.now(),
      text: streamingMessage,
      isBot: true,
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
              {finalMessages.map((message, index) => (
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
