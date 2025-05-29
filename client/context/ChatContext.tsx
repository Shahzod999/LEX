import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import {
  getChatService,
  initializeChatService,
  disconnectChatService,
} from "../services/websocketService";

interface ChatMessage {
  messageId?: string;
  content: string;
  role: "user" | "assistant";
  timestamp?: Date;
}

interface ChatState {
  chatId: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  streamingMessage: string;
}

interface ChatContextType {
  isConnected: boolean;
  isConnecting: boolean;
  currentChat: ChatState;
  sendMessage: (message: string) => void;
  createChat: () => void;
  joinChat: (chatId: string) => void;
  switchChat: (chatId: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  token: string;
  onError?: (error: string) => void;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  token,
  onError,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentChat, setCurrentChat] = useState<ChatState>({
    chatId: null,
    messages: [],
    isTyping: false,
    streamingMessage: "",
  });

  const chatServiceRef = useRef(getChatService());
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());
  const isInitializedRef = useRef(false);

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    if (isConnecting || isConnected || !token) return;

    setIsConnecting(true);

    try {
      const service = initializeChatService(token);
      chatServiceRef.current = service;

      // Clear any existing handlers to prevent duplicates
      service.clearAllHandlers();
      messageHandlersRef.current.clear();

      // Set up message handlers
      const handlers = {
        connected: () => {
          setIsConnected(true);
          setIsConnecting(false);
        },

        authenticated: (data: any) => {
          console.log("Authenticated as user:", data.userId);
        },

        chat_joined: (data: any) => {
          console.log(`Joined chat:`, data.chatId);
          setCurrentChat((prev) => ({
            ...prev,
            chatId: data.chatId,
            messages:
              data.messages?.map((msg: any) => ({
                messageId: msg._id,
                content: msg.content,
                role: msg.role,
                timestamp: new Date(msg.createdAt),
              })) || [],
          }));
        },

        chat_created: (data: any) => {
          console.log(`Created chat:`, data.chatId);
          setCurrentChat((prev) => ({
            ...prev,
            chatId: data.chatId,
            messages: [],
          }));
        },

        chat_switched: (data: any) => {
          console.log(`Switched to chat:`, data.chatId);
          setCurrentChat((prev) => ({
            ...prev,
            chatId: data.chatId,
            messages:
              data.messages?.map((msg: any) => ({
                messageId: msg._id,
                content: msg.content,
                role: msg.role,
                timestamp: new Date(msg.createdAt),
              })) || [],
          }));
        },

        user_message: (data: any) => {
          const message: ChatMessage = {
            messageId: data.messageId,
            content: data.content,
            role: "user",
            timestamp: new Date(data.timestamp),
          };

          setCurrentChat((prev) => ({
            ...prev,
            messages: [
              ...prev.messages.filter(
                (m) => !m.messageId || m.messageId !== data.messageId
              ),
              message,
            ],
          }));
        },

        assistant_message_start: () => {
          setCurrentChat((prev) => ({
            ...prev,
            isTyping: true,
            streamingMessage: "",
          }));
        },

        assistant_message_token: (data: any) => {
          setCurrentChat((prev) => ({
            ...prev,
            streamingMessage: prev.streamingMessage + data.token,
          }));
        },

        assistant_message_complete: (data: any) => {
          const message: ChatMessage = {
            messageId: data.messageId,
            content: data.content,
            role: "assistant",
            timestamp: new Date(data.timestamp),
          };

          setCurrentChat((prev) => ({
            ...prev,
            isTyping: false,
            streamingMessage: "",
            messages: [
              ...prev.messages.filter(
                (m) => !m.messageId || m.messageId !== data.messageId
              ),
              message,
            ],
          }));
        },

        error: (data: any) => {
          console.error("WebSocket error:", data.message);
          if (onError) {
            onError(data.message);
          }
        },
      };

      // Register all handlers
      Object.entries(handlers).forEach(([type, handler]) => {
        service.onMessage(type, handler);
        messageHandlersRef.current.set(type, handler);
      });

      await service.connect();
      isInitializedRef.current = true;
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      setIsConnecting(false);
      if (onError) {
        onError("Failed to connect to chat server");
      }
    }
  }, [token, isConnecting, isConnected, onError]);

  // Send message to current active chat
  const sendMessage = useCallback(
    (message: string) => {
      const service = chatServiceRef.current;
      if (service && service.isConnected() && currentChat.chatId) {
        service.sendMessage(message);
      } else {
        console.error("No chat joined. Create or join a chat first.");
        if (onError) {
          onError("No active chat. Please select or create a chat first.");
        }
      }
    },
    [onError, currentChat.chatId]
  );

  // Create new chat
  const createChat = useCallback(() => {
    const service = chatServiceRef.current;
    if (service && service.isConnected()) {
      service.createChat();
    } else {
      console.error("WebSocket not connected");
      if (onError) {
        onError("Not connected to chat server");
      }
    }
  }, [onError]);

  // Join existing chat by ID
  const joinChat = useCallback(
    (chatId: string) => {
      const service = chatServiceRef.current;
      if (service && service.isConnected()) {
        service.joinChat(chatId);
      } else {
        console.error("WebSocket not connected");
        if (onError) {
          onError("Not connected to chat server");
        }
      }
    },
    [onError]
  );

  // Switch between existing chats
  const switchChat = useCallback(
    (chatId: string) => {
      const service = chatServiceRef.current;
      if (service && service.isConnected()) {
        service.switchChat(chatId);
      } else {
        console.error("WebSocket not connected");
        if (onError) {
          onError("Not connected to chat server");
        }
      }
    },
    [onError]
  );

  // Disconnect
  const disconnect = useCallback(() => {
    disconnectChatService();
    setIsConnected(false);
    setIsConnecting(false);
    setCurrentChat({
      chatId: null,
      messages: [],
      isTyping: false,
      streamingMessage: "",
    });
    isInitializedRef.current = false;
  }, []);

  // Auto-connect on mount when token is available
  useEffect(() => {
    if (token && !isConnected && !isConnecting && !isInitializedRef.current) {
      connect();
    }
  }, [token, connect, isConnected, isConnecting]);

  // Handle token changes - reconnect if token changes
  useEffect(() => {
    if (token && isInitializedRef.current) {
      // If token changed, reconnect
      disconnect();
      setTimeout(() => {
        connect();
      }, 100);
    }
  }, [token]);

  const value: ChatContextType = {
    isConnected,
    isConnecting,
    currentChat,
    sendMessage,
    createChat,
    joinChat,
    switchChat,
    connect,
    disconnect,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}; 