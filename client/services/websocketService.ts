// WebSocketMessage определяет структуру сообщений между клиентом и сервером
interface WebSocketMessage {
  type: "message" | "subscribe_chat" | "unsubscribe_chat" | "get_chat_history";
  data: {
    message?: string;
    chatId?: string;
    token?: string;
  };
}

// WebSocketResponse определяет структуру ответов от сервера
interface WebSocketResponse {
  type:
    | "connected"
    | "authenticated"
    | "chat_subscribed"
    | "chat_unsubscribed"
    | "chat_history"
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
  private subscribedChats: Set<string> = new Set();
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
        const wsUrl = process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:3000/ws/chat";
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;
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
    console.log(`📨 Received WebSocket message:`, response);

    const handler = this.messageHandlers.get(response.type);
    if (handler) {
      console.log(`🎯 Found handler for message type: ${response.type}`);
      handler(response.data);
    } else {
      console.log(`⚠️ No handler found for message type: ${response.type}`);
    }

    // Handle specific message types
    switch (response.type) {
      case "connected":
        console.log("WebSocket connection established");
        break;
      case "authenticated":
        console.log("User authenticated:", response.data.userId);
        break;
      case "chat_subscribed":
        this.subscribedChats.add(response.data.chatId);
        console.log("✅ Successfully subscribed to chat:", response.data.chatId);
        console.log("📋 Current subscribed chats:", Array.from(this.subscribedChats));
        break;
      case "chat_unsubscribed":
        this.subscribedChats.delete(response.data.chatId);
        console.log("❌ Unsubscribed from chat:", response.data.chatId);
        break;
      case "error":
        console.error("❌ WebSocket error:", response.data.message);
        break;
      default:
        console.log(`📝 Unhandled message type: ${response.type}`);
    }
  }

  // обработка переподключения
  private handleReconnect() {
    if (this.socket) {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
          this.connect()
            .then(() => {
              // Переподключаемся ко всем чатам
              this.subscribedChats.forEach((chatId) => {
                this.subscribeToChat(chatId);
              });
            })
            .catch(console.error);
        }, this.reconnectDelay * this.reconnectAttempts);
      } else {
        console.error("Max reconnection attempts reached");
      }
    }
  }

  // подписка на чат
  subscribeToChat(chatId: string) {
    console.log(`🚀 WebSocketService: Subscribing to chat ${chatId}`);
    console.log(`📡 Current socket state: ${this.socket?.readyState}`);
    console.log(`🔑 Using token: ${this.token ? "present" : "missing"}`);

    this.send({
      type: "subscribe_chat",
      data: {
        token: this.token,
        chatId,
      },
    });
  }

  // отписка от чата
  unsubscribeFromChat(chatId: string) {
    this.send({
      type: "unsubscribe_chat",
      data: {
        chatId,
      },
    });
  }

  // отправка сообщения в конкретный чат
  sendMessage(message: string, chatId: string) {
    if (!this.subscribedChats.has(chatId)) {
      console.error(`Not subscribed to chat ${chatId}. Subscribe first.`);
      return;
    }

    this.send({
      type: "message",
      data: {
        message,
        chatId,
      },
    });
  }

  // получение истории чата
  getChatHistory(chatId: string) {
    this.send({
      type: "get_chat_history",
      data: {
        chatId,
      },
    });
  }

  // отправка сообщения
  private send(message: WebSocketMessage) {
    console.log(`📤 Sending WebSocket message:`, message);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      console.log(`✅ Message sent successfully: ${messageStr}`);
      this.socket.send(messageStr);
    } else {
      console.error("❌ WebSocket is not connected", {
        hasSocket: !!this.socket,
        readyState: this.socket?.readyState,
        message,
      });
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

  // очистка всех обработчиков
  clearAllHandlers() {
    this.messageHandlers.clear();
  }

  // отключение от сервера
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.subscribedChats.clear();
  }

  // проверка соединения
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // получение подписанных чатов
  getSubscribedChats(): Set<string> {
    return new Set(this.subscribedChats);
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
