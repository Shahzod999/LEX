// WebSocketMessage определяет структуру сообщений между клиентом и сервером
interface WebSocketMessage {
  type: "message" | "join_chat" | "create_chat" | "switch_chat";
  data: {
    message?: string;
    chatId?: string;
    token?: string;
    chatType?: "documents" | "messages";
  };
}

// WebSocketResponse определяет структуру ответов от сервера
interface WebSocketResponse {
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

// WebSocketChatService - класс, который управляет WebSocket соединениями и отправкой сообщений
export class WebSocketChatService {
  private socket: WebSocket | null = null;
  private token: string;
  private chatId: string | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(token: string) {
    this.token = token;
  }

  // соединение с сервером
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl =
          process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:3000/ws/chat";
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;

          // Authenticate immediately upon connection
          this.send({
            type: "join_chat",
            data: {
              token: this.token,
            },
          });

          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const response: WebSocketResponse = JSON.parse(event.data);
            this.handleMessage(response);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.socket.onclose = (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason);
          this.handleReconnect();
        };

        this.socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // обработка сообщений от сервера
  private handleMessage(response: WebSocketResponse) {
    const handler = this.messageHandlers.get(response.type);
    if (handler) {
      handler(response.data);
    }

    // Handle specific message types
    switch (response.type) {
      case "connected":
        console.log("WebSocket connection established");
        break;
      case "authenticated":
        console.log("User authenticated:", response.data.userId);
        break;
      case "chat_joined":
        this.chatId = response.data.chatId;
        console.log("Joined chat:", response.data.chatId);
        break;
      case "chat_created":
        this.chatId = response.data.chatId;
        console.log("Chat created:", response.data.chatId);
        break;
      case "chat_switched":
        this.chatId = response.data.chatId;
        console.log("Switched to chat:", response.data.chatId);
        break;
      case "error":
        console.error("WebSocket error:", response.data.message);
        break;
    }
  }

  // обработка переподключения
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  // соединение с чатом
  joinChat(chatId: string) {
    this.chatId = chatId;
    this.send({
      type: "join_chat",
      data: {
        token: this.token,
        chatId,
      },
    });
  }

  // создание нового чата // можно удалить не используется логика старая
  createChat() {
    this.send({
      type: "create_chat",
      data: {
        token: this.token,
      },
    });
  }

  // переключение между чатами
  switchChat(chatId: string) {
    this.chatId = chatId;
    this.send({
      type: "switch_chat",
      data: {
        chatId,
      },
    });
  }

  // отправка сообщения
  sendMessage(message: string) {
    if (!this.chatId) {
      console.error("No chat joined. Create or join a chat first.");
      return;
    }

    this.send({
      type: "message",
      data: {
        message,
      },
    });
  }

  // отправка сообщения
  private send(message: WebSocketMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not connected");
    }
  }

  // обработка сообщений от сервера
  onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  // удаление обработчика сообщений
  offMessage(type: string) {
    this.messageHandlers.delete(type);
  }

  // удаление всех обработчиков сообщений
  clearAllHandlers() {
    this.messageHandlers.clear();
  }

  // отключение от сервера
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  // проверка соединения
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // получение текущего чата
  getCurrentChatId(): string | null {
    return this.chatId;
  }
}

// Singleton instance for global use
let chatService: WebSocketChatService | null = null;

// инициализация сервиса
export const initializeChatService = (token: string): WebSocketChatService => {
  if (chatService) {
    chatService.clearAllHandlers();
    chatService.disconnect();
  }
  chatService = new WebSocketChatService(token);
  return chatService;
};

// получение сервиса
export const getChatService = (): WebSocketChatService | null => {
  return chatService;
};

// отключение сервиса
export const disconnectChatService = () => {
  if (chatService) {
    chatService.disconnect();
    chatService = null;
  }
};
