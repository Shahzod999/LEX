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
  info: Info;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
export interface Info {
  deadline: string;
  description: string;
  expirationDate: string;
  status: string;
  _id: string;
}

export interface UpdateDocumentType {
  title?: string;
  status?: string;
  deadline?: string;
  expirationDate?: string;
}

export interface CurrentDocumentResponseType {
  _id: string;
  userId: string;
  title: string;
  filesUrl: string[];
  chatId: ChatHistoryType;
  info: Info;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
