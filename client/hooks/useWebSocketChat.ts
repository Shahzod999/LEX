import { useEffect, useState, useCallback, useRef } from 'react';
import { getChatService, initializeChatService, disconnectChatService } from '../services/websocketService';

interface ChatMessage {
  messageId?: string;
  content: string;
  role: "user" | "assistant";
  timestamp?: Date;
}

interface UseWebSocketChatProps {
  token: string;
  chatId?: string;
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
  onChatJoined?: (data: { chatId: string; messages: any[]; title: string }) => void;
  onChatCreated?: (data: { chatId: string; title: string }) => void;
}

export const useWebSocketChat = ({ 
  token, 
  chatId, 
  onMessage, 
  onError,
  onChatJoined,
  onChatCreated
}: UseWebSocketChatProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  
  const chatServiceRef = useRef(getChatService());

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    
    try {
      const service = initializeChatService(token);
      chatServiceRef.current = service;
      
      // Clear any existing handlers to prevent duplicates
      service.clearAllHandlers();
      
      // Set up message handlers
      service.onMessage('connected', () => {
        setIsConnected(true);
        setIsConnecting(false);
      });

      service.onMessage('authenticated', (data) => {
        console.log('Authenticated as user:', data.userId);
      });

      service.onMessage('chat_joined', (data) => {
        setCurrentChatId(data.chatId);
        console.log('Joined chat:', data.chatId);
        if (onChatJoined) {
          onChatJoined(data);
        }
      });

      service.onMessage('chat_created', (data) => {
        setCurrentChatId(data.chatId);
        console.log('Created chat:', data.chatId);
        if (onChatCreated) {
          onChatCreated(data);
        }
      });

      service.onMessage('user_message', (data) => {
        if (onMessage) {
          onMessage({
            messageId: data.messageId,
            content: data.content,
            role: 'user',
            timestamp: new Date(data.timestamp)
          });
        }
      });

      service.onMessage('assistant_message_start', () => {
        setIsTyping(true);
        setStreamingMessage('');
      });

      service.onMessage('assistant_message_token', (data) => {
        setStreamingMessage(prev => prev + data.token);
      });

      service.onMessage('assistant_message_complete', (data) => {
        setIsTyping(false);
        setStreamingMessage('');
        
        if (onMessage) {
          onMessage({
            messageId: data.messageId,
            content: data.content,
            role: 'assistant',
            timestamp: new Date(data.timestamp)
          });
        }
      });

      service.onMessage('error', (data) => {
        console.error('WebSocket error:', data.message);
        if (onError) {
          onError(data.message);
        }
      });

      await service.connect();
      
      // Join existing chat if chatId provided
      if (chatId) {
        service.joinChat(chatId);
      }
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnecting(false);
      if (onError) {
        onError('Failed to connect to chat server');
      }
    }
  }, [token, chatId, isConnecting, isConnected, onMessage, onError, onChatJoined, onChatCreated]);

  // Send message
  const sendMessage = useCallback((message: string) => {
    const service = chatServiceRef.current;
    if (service && service.isConnected()) {
      service.sendMessage(message);
    } else {
      console.error('WebSocket not connected');
      if (onError) {
        onError('Not connected to chat server');
      }
    }
  }, [onError]);

  // Create new chat
  const createChat = useCallback(() => {
    const service = chatServiceRef.current;
    if (service && service.isConnected()) {
      service.createChat();
    } else {
      console.error('WebSocket not connected');
      if (onError) {
        onError('Not connected to chat server');
      }
    }
  }, [onError]);

  // Join existing chat
  const joinChat = useCallback((newChatId: string) => {
    const service = chatServiceRef.current;
    if (service && service.isConnected()) {
      service.joinChat(newChatId);
      setCurrentChatId(newChatId);
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
    setCurrentChatId(null);
    setIsTyping(false);
    setStreamingMessage('');
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (token && !isConnected && !isConnecting) {
      connect();
    }

    return () => {
      // Don't disconnect on unmount to maintain connection across components
      // disconnect();
    };
  }, [token, connect, isConnected, isConnecting]);

  // Update chatId when prop changes
  useEffect(() => {
    if (chatId && chatId !== currentChatId && isConnected) {
      joinChat(chatId);
    }
  }, [chatId, currentChatId, isConnected, joinChat]);

  return {
    isConnected,
    isConnecting,
    currentChatId,
    isTyping,
    streamingMessage,
    sendMessage,
    createChat,
    joinChat,
    connect,
    disconnect
  };
}; 