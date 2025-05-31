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
  chatId: string;
  messages: ChatMessage[];
  isTyping: boolean;
  streamingMessage: string;
  lastActivity: Date;
}

interface ChatContextType {
  isConnected: boolean;
  isConnecting: boolean;
  chats: Map<string, ChatState>;
  activeChatId: string | null;
  sendMessage: (message: string, chatId?: string) => void;
  createChat: () => void;
  joinChat: (chatId: string) => void;
  switchChat: (chatId: string) => void;
  setActiveChat: (chatId: string) => void;
  getChatState: (chatId: string) => ChatState | undefined;
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
  const [chats, setChats] = useState<Map<string, ChatState>>(new Map());
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

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
          const chatState: ChatState = {
            chatId: data.chatId,
            messages: data.messages?.map((msg: any) => ({
              messageId: msg._id,
              content: msg.content,
              role: msg.role,
              timestamp: new Date(msg.createdAt),
            })) || [],
            isTyping: false,
            streamingMessage: "",
            lastActivity: new Date(),
          };

          setChats(prev => {
            const updated = new Map(prev);
            updated.set(data.chatId, chatState);
            return updated;
          });

          // Set as active chat if none is set
          if (!activeChatId) {
            setActiveChatId(data.chatId);
          }
        },

        chat_created: (data: any) => {
          console.log(`Created chat:`, data.chatId);
          const chatState: ChatState = {
            chatId: data.chatId,
            messages: [],
            isTyping: false,
            streamingMessage: "",
            lastActivity: new Date(),
          };

          setChats(prev => {
            const updated = new Map(prev);
            updated.set(data.chatId, chatState);
            return updated;
          });

          // Set as active chat
          setActiveChatId(data.chatId);
        },

        chat_switched: (data: any) => {
          console.log(`Switched to chat:`, data.chatId);
          const chatState: ChatState = {
            chatId: data.chatId,
            messages: data.messages?.map((msg: any) => ({
              messageId: msg._id,
              content: msg.content,
              role: msg.role,
              timestamp: new Date(msg.createdAt),
            })) || [],
            isTyping: false,
            streamingMessage: "",
            lastActivity: new Date(),
          };

          setChats(prev => {
            const updated = new Map(prev);
            updated.set(data.chatId, chatState);
            return updated;
          });

          setActiveChatId(data.chatId);
        },

        user_message: (data: any) => {
          const message: ChatMessage = {
            messageId: data.messageId,
            content: data.content,
            role: "user",
            timestamp: new Date(data.timestamp),
          };

          const targetChatId = data.chatId || activeChatId;
          console.log(`📤 User message for chat: ${targetChatId}`);

          setChats(prev => {
            const updated = new Map(prev);
            const chatState = updated.get(targetChatId || "");
            
            if (chatState) {
              const updatedMessages = [
                ...chatState.messages.filter(
                  (m) => !m.messageId || m.messageId !== data.messageId
                ),
                message,
              ];

              updated.set(chatState.chatId, {
                ...chatState,
                messages: updatedMessages,
                lastActivity: new Date(),
              });
            }
            
            return updated;
          });
        },

        assistant_message_start: (data: any) => {
          const targetChatId = data.chatId || activeChatId;
          console.log(`🤖 Assistant starting to type in chat: ${targetChatId}`);
          if (!targetChatId) return;

          setChats(prev => {
            const updated = new Map(prev);
            const chatState = updated.get(targetChatId);
            
            if (chatState) {
              updated.set(targetChatId, {
                ...chatState,
                isTyping: true,
                streamingMessage: "",
                lastActivity: new Date(),
              });
            }
            
            return updated;
          });
        },

        assistant_message_token: (data: any) => {
          const targetChatId = data.chatId || activeChatId;
          if (!targetChatId) return;

          setChats(prev => {
            const updated = new Map(prev);
            const chatState = updated.get(targetChatId);
            
            if (chatState) {
              updated.set(targetChatId, {
                ...chatState,
                streamingMessage: chatState.streamingMessage + data.token,
                lastActivity: new Date(),
              });
            }
            
            return updated;
          });
        },

        assistant_message_complete: (data: any) => {
          const message: ChatMessage = {
            messageId: data.messageId,
            content: data.content,
            role: "assistant",
            timestamp: new Date(data.timestamp),
          };

          const targetChatId = data.chatId || activeChatId;
          console.log(`✅ Assistant message complete for chat: ${targetChatId}`);
          if (!targetChatId) return;

          setChats(prev => {
            const updated = new Map(prev);
            const chatState = updated.get(targetChatId);
            
            if (chatState) {
              const updatedMessages = [
                ...chatState.messages.filter(
                  (m) => !m.messageId || m.messageId !== data.messageId
                ),
                message,
              ];

              updated.set(targetChatId, {
                ...chatState,
                messages: updatedMessages,
                isTyping: false,
                streamingMessage: "",
                lastActivity: new Date(),
              });
            }
            
            return updated;
          });
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
  }, [token, isConnecting, isConnected, onError, activeChatId]);

  // Send message to specific chat or active chat
  const sendMessage = useCallback(
    (message: string, chatId?: string) => {
      const service = chatServiceRef.current;
      const targetChatId = chatId || activeChatId;
      
      console.log(`🚀 Sending message to chat: ${targetChatId}, WebSocket current chat: ${service?.getCurrentChatId()}`);
      
      if (service && service.isConnected() && targetChatId) {
        // Switch to target chat if it's not currently active on WebSocket
        if (service.getCurrentChatId() !== targetChatId) {
          console.log(`🔄 Switching WebSocket from ${service.getCurrentChatId()} to ${targetChatId}`);
          service.switchChat(targetChatId);
        }
        service.sendMessage(message);
      } else {
        console.error("No chat available. Create or join a chat first.");
        if (onError) {
          onError("No active chat. Please select or create a chat first.");
        }
      }
    },
    [onError, activeChatId]
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

  // Set active chat (UI level)
  const setActiveChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
  }, []);

  // Get specific chat state
  const getChatState = useCallback((chatId: string): ChatState | undefined => {
    return chats.get(chatId);
  }, [chats]);

  // Disconnect
  const disconnect = useCallback(() => {
    disconnectChatService();
    setIsConnected(false);
    setIsConnecting(false);
    setChats(new Map());
    setActiveChatId(null);
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
    chats,
    activeChatId,
    sendMessage,
    createChat,
    joinChat,
    switchChat,
    setActiveChat,
    getChatState,
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

// Hook for working with specific chat by ID
export const useChatById = (chatId: string) => {
  const { 
    getChatState, 
    sendMessage, 
    joinChat, 
    setActiveChat, 
    isConnected 
  } = useChat();
  
  const chatState = chatId ? getChatState(chatId) : null;
  
  const sendMessageToChat = useCallback((message: string) => {
    if (chatId && isConnected) {
      setActiveChat(chatId);
      sendMessage(message, chatId);
    }
  }, [chatId, isConnected, setActiveChat, sendMessage]);
  
  const joinThisChat = useCallback(() => {
    if (chatId && isConnected) {
      setActiveChat(chatId);
      joinChat(chatId);
    }
  }, [chatId, isConnected, setActiveChat, joinChat]);
  
  return {
    chatState,
    sendMessage: sendMessageToChat,
    joinChat: joinThisChat,
    isConnected,
    messages: chatState?.messages || [],
    isTyping: chatState?.isTyping || false,
    streamingMessage: chatState?.streamingMessage || ""
  };
}; 