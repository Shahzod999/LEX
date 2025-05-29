import React, { createContext, useContext, useEffect } from 'react';
import { useMultipleChats } from '@/hooks/useMultipleChats';
import { useAppSelector } from '@/hooks/reduxHooks';
import { selectToken } from '@/redux/features/tokenSlice';

interface ChatContextType {
  isConnected: boolean;
  isConnecting: boolean;
  messagesChat: {
    chatId: string | null;
    messages: any[];
    isTyping: boolean;
    streamingMessage: string;
  };
  documentsChat: {
    chatId: string | null;
    messages: any[];
    isTyping: boolean;
    streamingMessage: string;
  };
  activeChatType: 'messages' | 'documents';
  sendMessage: (message: string, chatType?: 'messages' | 'documents') => void;
  createChat: (chatType?: 'messages' | 'documents') => void;
  joinChat: (chatId: string, chatType?: 'messages' | 'documents') => void;
  switchChat: (chatId: string, chatType: 'messages' | 'documents') => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAppSelector(selectToken);
  
  const chatHook = useMultipleChats({
    token: token || "",
    onError: (error: string) => {
      console.error("Global chat error:", error);
    },
  });

  // Auto-connect when token is available
  useEffect(() => {
    if (token && !chatHook.isConnected && !chatHook.isConnecting) {
      chatHook.connect();
    }
  }, [token, chatHook.isConnected, chatHook.isConnecting, chatHook.connect]);

  return (
    <ChatContext.Provider value={chatHook}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 