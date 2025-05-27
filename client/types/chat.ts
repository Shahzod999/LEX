export interface ChatResponseType {
  chatId: string;
  userMessage: UserMessageType;
  assistantMessage: AssistantMessageType;
}

export interface UserMessageType {
  content: string;
  role: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AssistantMessageType {
  content: string;
  role: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// ChatHistoryType // oneChat
export interface ChatHistoryType {
  _id: string;
  userId: string;
  messages: Message[];
  title: string;
  description: string;
  sourceType: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Message {
  _id: string;
  content: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
