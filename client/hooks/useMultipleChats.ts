import { useEffect, useState, useCallback, useRef } from 'react';
import { getChatService, initializeChatService, disconnectChatService } from '../services/websocketService';

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

interface UseMultipleChatsProps {
  token: string;
  onError?: (error: string) => void;
}

export const useMultipleChats = ({ token, onError }: UseMultipleChatsProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Separate states for different chat types
  const [messagesChat, setMessagesChat] = useState<ChatState>({
    chatId: null,
    messages: [],
    isTyping: false,
    streamingMessage: ''
  });
  
  const [documentsChat, setDocumentsChat] = useState<ChatState>({
    chatId: null,
    messages: [],
    isTyping: false,
    streamingMessage: ''
  });

  const [activeChatType, setActiveChatType] = useState<'messages' | 'documents'>('messages');
  
  const chatServiceRef = useRef(getChatService());
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;
    
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
          console.log('Authenticated as user:', data.userId);
        },

        chat_joined: (data: any) => {
          const chatType = data.chatType || 'messages';
          console.log(`Joined ${chatType} chat:`, data.chatId);
          
          if (chatType === 'messages') {
            setMessagesChat(prev => ({
              ...prev,
              chatId: data.chatId,
              messages: data.messages?.map((msg: any, index: number) => ({
                messageId: msg._id,
                content: msg.content,
                role: msg.role,
                timestamp: new Date(msg.createdAt)
              })) || []
            }));
          } else if (chatType === 'documents') {
            setDocumentsChat(prev => ({
              ...prev,
              chatId: data.chatId,
              messages: data.messages?.map((msg: any, index: number) => ({
                messageId: msg._id,
                content: msg.content,
                role: msg.role,
                timestamp: new Date(msg.createdAt)
              })) || []
            }));
          }
        },

        chat_created: (data: any) => {
          const chatType = data.chatType || 'messages';
          console.log(`Created ${chatType} chat:`, data.chatId);
          
          if (chatType === 'messages') {
            setMessagesChat(prev => ({
              ...prev,
              chatId: data.chatId
            }));
          } else if (chatType === 'documents') {
            setDocumentsChat(prev => ({
              ...prev,
              chatId: data.chatId
            }));
          }
        },

        chat_switched: (data: any) => {
          const chatType = data.chatType || 'messages';
          console.log(`Switched to ${chatType} chat:`, data.chatId);
          
          if (chatType === 'messages') {
            setMessagesChat(prev => ({
              ...prev,
              chatId: data.chatId,
              messages: data.messages?.map((msg: any, index: number) => ({
                messageId: msg._id,
                content: msg.content,
                role: msg.role,
                timestamp: new Date(msg.createdAt)
              })) || []
            }));
          } else if (chatType === 'documents') {
            setDocumentsChat(prev => ({
              ...prev,
              chatId: data.chatId,
              messages: data.messages?.map((msg: any, index: number) => ({
                messageId: msg._id,
                content: msg.content,
                role: msg.role,
                timestamp: new Date(msg.createdAt)
              })) || []
            }));
          }
        },

        user_message: (data: any) => {
          const message: ChatMessage = {
            messageId: data.messageId,
            content: data.content,
            role: 'user',
            timestamp: new Date(data.timestamp)
          };

          // Determine which chat this message belongs to based on current active chat
          if (activeChatType === 'messages') {
            setMessagesChat(prev => ({
              ...prev,
              messages: [...prev.messages.filter(m => !m.messageId || m.messageId !== data.messageId), message]
            }));
          } else {
            setDocumentsChat(prev => ({
              ...prev,
              messages: [...prev.messages.filter(m => !m.messageId || m.messageId !== data.messageId), message]
            }));
          }
        },

        assistant_message_start: () => {
          if (activeChatType === 'messages') {
            setMessagesChat(prev => ({
              ...prev,
              isTyping: true,
              streamingMessage: ''
            }));
          } else {
            setDocumentsChat(prev => ({
              ...prev,
              isTyping: true,
              streamingMessage: ''
            }));
          }
        },

        assistant_message_token: (data: any) => {
          if (activeChatType === 'messages') {
            setMessagesChat(prev => ({
              ...prev,
              streamingMessage: prev.streamingMessage + data.token
            }));
          } else {
            setDocumentsChat(prev => ({
              ...prev,
              streamingMessage: prev.streamingMessage + data.token
            }));
          }
        },

        assistant_message_complete: (data: any) => {
          const message: ChatMessage = {
            messageId: data.messageId,
            content: data.content,
            role: 'assistant',
            timestamp: new Date(data.timestamp)
          };

          if (activeChatType === 'messages') {
            setMessagesChat(prev => ({
              ...prev,
              isTyping: false,
              streamingMessage: '',
              messages: [...prev.messages.filter(m => !m.messageId || m.messageId !== data.messageId), message]
            }));
          } else {
            setDocumentsChat(prev => ({
              ...prev,
              isTyping: false,
              streamingMessage: '',
              messages: [...prev.messages.filter(m => !m.messageId || m.messageId !== data.messageId), message]
            }));
          }
        },

        error: (data: any) => {
          console.error('WebSocket error:', data.message);
          if (onError) {
            onError(data.message);
          }
        }
      };

      // Register all handlers
      Object.entries(handlers).forEach(([type, handler]) => {
        service.onMessage(type, handler);
        messageHandlersRef.current.set(type, handler);
      });

      await service.connect();
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnecting(false);
      if (onError) {
        onError('Failed to connect to chat server');
      }
    }
  }, [token, isConnecting, isConnected, onError, activeChatType]);

  // Send message to specific chat type
  const sendMessage = useCallback((message: string, chatType: 'messages' | 'documents' = 'messages') => {
    const service = chatServiceRef.current;
    if (service && service.isConnected()) {
      setActiveChatType(chatType);
      
      // Switch to the appropriate chat before sending message
      const targetChat = chatType === 'messages' ? messagesChat : documentsChat;
      if (targetChat.chatId) {
        service.switchChat(targetChat.chatId, chatType);
      }
      
      service.sendMessage(message);
    } else {
      console.error('WebSocket not connected');
      if (onError) {
        onError('Not connected to chat server');
      }
    }
  }, [onError, messagesChat, documentsChat]);

  // Create new chat for specific type
  const createChat = useCallback((chatType: 'messages' | 'documents' = 'messages') => {
    const service = chatServiceRef.current;
    if (service && service.isConnected()) {
      setActiveChatType(chatType);
      service.createChat(chatType);
    } else {
      console.error('WebSocket not connected');
      if (onError) {
        onError('Not connected to chat server');
      }
    }
  }, [onError]);

  // Join existing chat
  const joinChat = useCallback((chatId: string, chatType: 'messages' | 'documents' = 'messages') => {
    const service = chatServiceRef.current;
    if (service && service.isConnected()) {
      setActiveChatType(chatType);
      service.joinChat(chatId, chatType);
    } else {
      console.error('WebSocket not connected');
      if (onError) {
        onError('Not connected to chat server');
      }
    }
  }, [onError]);

  // Switch between chats
  const switchChat = useCallback((chatId: string, chatType: 'messages' | 'documents') => {
    const service = chatServiceRef.current;
    if (service && service.isConnected()) {
      setActiveChatType(chatType);
      service.switchChat(chatId, chatType);
    } else {
      console.error('WebSocket not connected');
      if (onError) {
        onError('Not connected to chat server');
      }
    }
  }, [onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    disconnectChatService();
    setIsConnected(false);
    setIsConnecting(false);
    setMessagesChat({
      chatId: null,
      messages: [],
      isTyping: false,
      streamingMessage: ''
    });
    setDocumentsChat({
      chatId: null,
      messages: [],
      isTyping: false,
      streamingMessage: ''
    });
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (token && !isConnected && !isConnecting) {
      connect();
    }

    return () => {
      // Don't disconnect on unmount to maintain connection across components
    };
  }, [token, connect, isConnected, isConnecting]);

  return {
    isConnected,
    isConnecting,
    messagesChat,
    documentsChat,
    activeChatType,
    sendMessage,
    createChat,
    joinChat,
    switchChat,
    connect,
    disconnect
  };
}; 