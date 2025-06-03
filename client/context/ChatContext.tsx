import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { getChatService, initializeChatService, disconnectChatService } from "../services/websocketService";

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
  isSubscribed: boolean;
}

interface ChatContextType {
  isConnected: boolean;
  isConnecting: boolean;
  chats: Map<string, ChatState>;
  subscribedChats: Set<string>;
  subscribeToChat: (chatId: string) => void;
  unsubscribeFromChat: (chatId: string) => void;
  sendMessage: (message: string, chatId: string) => void;
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

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, token, onError }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chats, setChats] = useState<Map<string, ChatState>>(new Map());
  const [subscribedChats, setSubscribedChats] = useState<Set<string>>(new Set());

  const chatServiceRef = useRef(getChatService());
  const pendingSubscriptionsRef = useRef<Set<string>>(new Set());

  const connect = useCallback(async () => {
    if (isConnecting || isConnected || !token) return;

    setIsConnecting(true);

    try {
      const service = initializeChatService(token);
      chatServiceRef.current = service;

      service.clearAllHandlers();

      const handlers = {
        connected: () => {
          setIsConnected(true);
          setIsConnecting(false);
        },

        authenticated: (data: any) => {
          console.log("Authenticated as user:", data.userId);
        },

        chat_subscribed: (data: any) => {
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
            isSubscribed: true,
          };

          setChats((prev) => {
            const updated = new Map(prev);
            updated.set(data.chatId, chatState);
            return updated;
          });

          setSubscribedChats((prev) => new Set(prev).add(data.chatId));
          pendingSubscriptionsRef.current.delete(data.chatId);
        },

        chat_unsubscribed: (data: any) => {
          setChats((prev) => {
            const updated = new Map(prev);
            const chatState = updated.get(data.chatId);
            if (chatState) {
              updated.set(data.chatId, { ...chatState, isSubscribed: false });
            }
            return updated;
          });

          setSubscribedChats((prev) => {
            const updated = new Set(prev);
            updated.delete(data.chatId);
            return updated;
          });
          pendingSubscriptionsRef.current.delete(data.chatId);
        },

        chat_history: (data: any) => {
          const messages = data.messages?.map((msg: any) => ({
            messageId: msg._id,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.createdAt),
          })) || [];

          setChats((prev) => {
            const updated = new Map(prev);
            const chatState = updated.get(data.chatId);
            if (chatState) {
              updated.set(data.chatId, {
                ...chatState,
                messages,
                lastActivity: new Date(),
              });
            }
            return updated;
          });
        },

        user_message: (data: any) => {
          const message: ChatMessage = {
            messageId: data.messageId,
            content: data.content,
            role: "user",
            timestamp: new Date(data.timestamp),
          };

          setChats((prev) => {
            const updated = new Map(prev);
            const chatState = updated.get(data.chatId);

            if (chatState) {
              const updatedMessages = [
                ...chatState.messages.filter((m) => !m.messageId || m.messageId !== data.messageId),
                message
              ];

              updated.set(data.chatId, {
                ...chatState,
                messages: updatedMessages,
                lastActivity: new Date(),
              });
            }

            return updated;
          });
        },

        assistant_message_start: (data: any) => {
          if (!data.chatId) return;

          setChats((prev) => {
            const updated = new Map(prev);
            const chatState = updated.get(data.chatId);

            if (chatState) {
              updated.set(data.chatId, {
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
          if (!data.chatId) return;

          setChats((prev) => {
            const updated = new Map(prev);
            const chatState = updated.get(data.chatId);

            if (chatState) {
              updated.set(data.chatId, {
                ...chatState,
                streamingMessage: chatState.streamingMessage + data.token,
                lastActivity: new Date(),
              });
            }

            return updated;
          });
        },

        assistant_message_complete: (data: any) => {
          if (!data.chatId) return;

          const message: ChatMessage = {
            messageId: data.messageId,
            content: data.content,
            role: "assistant",
            timestamp: new Date(data.timestamp),
          };

          setChats((prev) => {
            const updated = new Map(prev);
            const chatState = updated.get(data.chatId);

            if (chatState) {
              const updatedMessages = [
                ...chatState.messages.filter((m) => !m.messageId || m.messageId !== data.messageId),
                message
              ];

              updated.set(data.chatId, {
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

      Object.entries(handlers).forEach(([type, handler]) => {
        service.onMessage(type, handler);
      });

      await service.connect();
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      setIsConnecting(false);
      if (onError) {
        onError("Failed to connect to chat server");
      }
    }
  }, [token, isConnecting, isConnected, onError]);

  const subscribeToChat = useCallback((chatId: string) => {
    const service = chatServiceRef.current;
    
    if (!service?.isConnected() || !chatId) {
      console.error("Cannot subscribe: not connected or no chatId");
      return;
    }

    if (subscribedChats.has(chatId) || pendingSubscriptionsRef.current.has(chatId)) {
      return;
    }

    pendingSubscriptionsRef.current.add(chatId);
    service.subscribeToChat(chatId);
  }, [subscribedChats]);

  const unsubscribeFromChat = useCallback((chatId: string) => {
    const service = chatServiceRef.current;
    
    if (service?.isConnected() && chatId) {
      service.unsubscribeFromChat(chatId);
      pendingSubscriptionsRef.current.delete(chatId);
    }
  }, []);

  const sendMessage = useCallback((message: string, chatId: string) => {
    const service = chatServiceRef.current;

    if (service?.isConnected() && chatId && subscribedChats.has(chatId)) {
      service.sendMessage(message, chatId);
    } else {
      console.error("Cannot send message: not connected or not subscribed to chat");
      if (onError) {
        onError("Not connected to chat or chat not subscribed");
      }
    }
  }, [subscribedChats, onError]);

  const getChatState = useCallback((chatId: string): ChatState | undefined => {
    return chats.get(chatId);
  }, [chats]);

  const disconnect = useCallback(() => {
    disconnectChatService();
    setIsConnected(false);
    setIsConnecting(false);
    setChats(new Map());
    setSubscribedChats(new Set());
    pendingSubscriptionsRef.current.clear();
  }, []);

  useEffect(() => {
    if (token && !isConnected && !isConnecting) {
      connect();
    }
  }, [token, connect, isConnected, isConnecting]);

  useEffect(() => {
    if (token) {
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
    subscribedChats,
    subscribeToChat,
    unsubscribeFromChat,
    sendMessage,
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

export const useChatById = (chatId: string) => {
  const { getChatState, sendMessage, subscribeToChat, unsubscribeFromChat, isConnected, subscribedChats } = useChat();

  const chatState = chatId ? getChatState(chatId) : null;
  const isSubscribed = chatId ? subscribedChats.has(chatId) : false;

  const sendMessageToChat = useCallback((message: string) => {
    if (chatId && isConnected && isSubscribed) {
      sendMessage(message, chatId);
    }
  }, [chatId, isConnected, isSubscribed, sendMessage]);

  const subscribeToThisChat = useCallback(() => {
    if (chatId && isConnected && !isSubscribed) {
      subscribeToChat(chatId);
    }
  }, [chatId, isConnected, isSubscribed, subscribeToChat]);

  const unsubscribeFromThisChat = useCallback(() => {
    if (chatId && isSubscribed) {
      unsubscribeFromChat(chatId);
    }
  }, [chatId, isSubscribed, unsubscribeFromChat]);

  return {
    chatState,
    sendMessage: sendMessageToChat,
    subscribeToChat: subscribeToThisChat,
    unsubscribeFromChat: unsubscribeFromThisChat,
    isConnected,
    isSubscribed,
    messages: chatState?.messages || [],
    isTyping: chatState?.isTyping || false,
    streamingMessage: chatState?.streamingMessage || "",
  };
};
