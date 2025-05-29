export interface WebSocketMessage {
  type: "message" | "join_chat" | "create_chat" | "switch_chat";
  data: {
    message?: string;
    chatId?: string;
    token?: string;
  };
}

export interface WebSocketResponse {
  type:
    | "connected"
    | "authenticated"
    | "chat_joined"
    | "chat_created"
    | "chat_switched"
    | "user_message"
    | "assistant_message_start"
    | "assistant_message_token"
    | "assistant_message_complete"
    | "error";
  data: any;
}

export interface ChatMessage {
  messageId?: string;
  content: string;
  role: "user" | "assistant";
  timestamp?: Date;
}

// shoha