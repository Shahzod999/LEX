import { ChatHistoryType, Message } from "./chat";

export interface DocumentUploadResponseTypes {
  document: DocumentTypes;
  chat: ChatHistoryType;
  messages: Message[];
}

export interface DocumentTypes {
  userId: string;
  title: string;
  filesUrl: string[];
  chatId: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
