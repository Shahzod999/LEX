import React, { useState } from "react";
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
import { useGetOpenAIMutation } from "@/redux/api/endpoints/openAI";

// Define message interface
interface Message {
  id: number;
  text: string;
  isBot: boolean;
  isTyping?: boolean;
  isHelpful?: boolean | undefined;
}

const ChatScreen = () => {
  const { colors } = useTheme();
  const [inputText, setInputText] = useState("");
  const [chatHistoryVisible, setChatHistoryVisible] = useState(false);
  const [messageHistory, setMessageHistory] = useState([
    {
      role: "system",
      content:
        "You are a legal assistant helping users with any legal issues, including visas, migration, deportation, documents, police, court, lawyers, legal translations, work permits, asylum, residence permits, study abroad, and legal statement filings. Automatically detect the user's language and reply in that language. If the question is not legal-related, politely explain you can only help with legal topics.",
    },
    {
      role: "assistant",
      content:
        "Hello! I'm your AI legal companion. How can I help you today with visa or migration questions?",
    },
  ]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI legal companion. How can I help you today with visa or migration questions?",
      isBot: true,
    },
  ]);
  // const [helpfulFeedback, setHelpfulFeedback] = useState<boolean | null>(null);

  const [getOpenAI, { data, isLoading, error }] = useGetOpenAIMutation();

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isBot: false,
      isHelpful: undefined,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageHistory((prev) => [
      ...prev,
      { role: "user", content: inputText },
    ]);
    setInputText("");

    const typingIndicator: Message = {
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

      const botResponse: Message = {
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
    }
  };

  const handleFeedback = (id: number, isHelpful: boolean) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === id ? { ...message, isHelpful: isHelpful } : message
      )
    );
    // setHelpfulFeedback(isHelpful);
    // You could add logic here to send feedback to your backend
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
    // Here you can load the selected chat history
    console.log("Selected chat:", chatId);
    // You can implement logic to load specific chat messages
  };

  console.log(messages);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <PanGestureHandler onHandlerStateChange={handleSwipeGesture}>
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.chatContent}>
              <Header
                title="Ask Lex - Your Legal Companion"
                subtitle="Get clear, calm answers to your legal questions"
                secondIcon="chatbubbles"
                secondIconFunction={handleChatHistoryToggle}
              />
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
                    !message.isBot && { backgroundColor: colors.userAccent },
                    message.isTyping && { opacity: 0.7 },
                  ]}>
                  <Text style={[styles.messageText, { color: colors.text }]}>
                    {message.text}
                  </Text>

                  {message.isBot && !message.isTyping && (
                    <View style={styles.feedbackContainer}>
                      <TouchableOpacity
                        style={styles.feedbackButton}
                        onPress={() => handleFeedback(message.id, true)}
                        disabled={message.isHelpful !== null}>
                        <Ionicons
                          name={
                            message.isHelpful === true
                              ? "thumbs-up"
                              : "thumbs-up-outline"
                          }
                          size={18}
                          color={
                            message.isHelpful === true ? "#4CAF50" : "#757575"
                          }
                        />
                        <Text
                          style={[
                            styles.feedbackText,
                            message.isHelpful === true && { color: "#4CAF50" },
                          ]}>
                          Helpful
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.feedbackButton}
                        onPress={() => handleFeedback(message.id, false)}
                        disabled={message.isHelpful !== null}>
                        <Ionicons
                          name={
                            message.isHelpful === false
                              ? "thumbs-down"
                              : "thumbs-down-outline"
                          }
                          size={18}
                          color={
                            message.isHelpful === false ? "#F44336" : "#757575"
                          }
                        />
                        <Text
                          style={[
                            styles.feedbackText,
                            message.isHelpful === false && { color: "#F44336" },
                          ]}>
                          Not helpful
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
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
        </KeyboardAvoidingView>
          </View>
        </PanGestureHandler>
        
        <ChatHistoryMenu
          visible={chatHistoryVisible}
          onClose={() => setChatHistoryVisible(false)}
          onSelectChat={handleSelectChat}
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
