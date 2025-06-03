import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import OpenAI from "openai";
import jwt from "jsonwebtoken";
import { Chat, Message } from "../models/Chat";
import User from "../models/User";
import { getWebSocketConfig, WebSocketConfig } from "../config/websocketConfig";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AuthenticatedWebSocket - расширяет стандартный WebSocket, добавляя пользовательские поля
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  subscribedChats?: Set<string>; // множественные активные чаты
  connectionId?: string;
  lastActivity?: number;
  messageCount?: number;
}

// WebSocketMessage определяет структуру сообщений между клиентом и сервером
interface WebSocketMessage {
  type: "message" | "subscribe_chat" | "unsubscribe_chat" | "create_chat" | "get_chat_history";
  data: {
    message?: string;
    chatId?: string;
    token?: string;
  };
}

// UserConnection теперь отслеживает подписки на чаты
interface UserConnection {
  connections: Map<string, AuthenticatedWebSocket>; // connectionId -> WebSocket
  lastActivity: number;
  messageCount: number;
  activeChats: Set<string>; // все активные чаты пользователя
}

export class ChatWebSocketServer {
  private wss: WebSocketServer;
  private users: Map<string, UserConnection> = new Map(); // userId -> UserConnection
  private connectionCount: number = 0;
  private config: WebSocketConfig;

  constructor(server: Server) {
    this.config = getWebSocketConfig();

    this.wss = new WebSocketServer({
      server,
      path: "/ws/chat",
      maxPayload: this.config.maxPayload,
    });

    this.wss.on("connection", this.handleConnection.bind(this));

    // Периодическая очистка неактивных соединений
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, this.config.cleanupInterval);

    console.log("WebSocket server initialized with multi-chat support", {
      maxConnections: this.config.maxConnections,
      maxConnectionsPerUser: this.config.maxConnectionsPerUser,
      rateLimitMaxMessages: this.config.rateLimitMaxMessages,
    });
  }

  // генерация уникального идентификатора соединения
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // аутентификация пользователя по токену
  private async authenticateUser(token: string): Promise<string | null> {
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET not configured");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
        userId: string;
      };

      // Verify user exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        return null;
      }

      return decoded.userId;
    } catch (error) {
      console.error("Authentication error:", error);
      return null;
    }
  }

  // проверка лимита сообщений на пользователя
  private checkRateLimit(userId: string): boolean {
    const userConnection = this.users.get(userId);
    if (!userConnection) return true;

    const now = Date.now();
    const timeSinceLastReset = now - userConnection.lastActivity;

    // Сброс счетчика если прошло больше минуты
    if (timeSinceLastReset > this.config.rateLimitWindow) {
      userConnection.messageCount = 0;
      userConnection.lastActivity = now;
    }

    return userConnection.messageCount < this.config.rateLimitMaxMessages;
  }

  // увеличение счетчика сообщений
  private incrementMessageCount(userId: string): void {
    const userConnection = this.users.get(userId);
    if (userConnection) {
      userConnection.messageCount++;
      userConnection.lastActivity = Date.now();
    }
  }

  // периодическая проверка неактивных соединений
  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const inactiveUsers: string[] = [];

    this.users.forEach((userConnection, userId) => {
      const timeSinceActivity = now - userConnection.lastActivity;

      if (timeSinceActivity > this.config.inactiveTimeout) {
        // Закрываем все соединения неактивного пользователя
        userConnection.connections.forEach((ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, "Inactive connection cleanup");
          }
        });
        inactiveUsers.push(userId);
      } else {
        // Проверяем каждое соединение на активность
        const inactiveConnections: string[] = [];
        userConnection.connections.forEach((ws, connectionId) => {
          if (
            ws.readyState === WebSocket.CLOSED ||
            ws.readyState === WebSocket.CLOSING
          ) {
            inactiveConnections.push(connectionId);
          }
        });

        // Удаляем неактивные соединения
        inactiveConnections.forEach((connectionId) => {
          userConnection.connections.delete(connectionId);
          this.connectionCount--;
        });
      }
    });

    // Удаляем неактивных пользователей
    inactiveUsers.forEach((userId) => {
      this.users.delete(userId);
    });

    if (inactiveUsers.length > 0) {
      console.log(`Cleaned up ${inactiveUsers.length} inactive users`);
    }
  }

  // обработка нового подключения
  private async handleConnection(ws: AuthenticatedWebSocket) {
    // Проверка лимита соединений
    if (this.connectionCount >= this.config.maxConnections) {
      ws.close(1008, "Server at capacity");
      return;
    }

    const connectionId = this.generateConnectionId();
    ws.connectionId = connectionId;
    ws.lastActivity = Date.now();
    ws.messageCount = 0;

    this.connectionCount++;

    console.log(
      `New WebSocket connection: ${connectionId} (Total: ${this.connectionCount})`
    );

    ws.on("message", async (data) => {
      try {
        // Обновляем активность
        ws.lastActivity = Date.now();

        const message: WebSocketMessage = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error("Error parsing message:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: "Invalid message format" },
          })
        );
      }
    });

    ws.on("close", () => {
      this.handleDisconnection(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      this.handleDisconnection(ws);
    });

    // Отправляем приветственное сообщение
    ws.send(
      JSON.stringify({
        type: "connected",
        data: {
          message: "WebSocket connection established",
          connectionId: connectionId,
        },
      })
    );
  }

  // очистка при отключении
  private handleDisconnection(ws: AuthenticatedWebSocket): void {
    if (ws.userId && ws.connectionId) {
      const userConnection = this.users.get(ws.userId);
      if (userConnection) {
        userConnection.connections.delete(ws.connectionId);

        // Если у пользователя не осталось соединений, удаляем его
        if (userConnection.connections.size === 0) {
          this.users.delete(ws.userId);
        }
      }
    }

    this.connectionCount--;

    console.log(
      `WebSocket connection closed: ${ws.connectionId} (Total: ${this.connectionCount})`
    );
  }

  // обработка сообщений от клиента
  private async handleMessage(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ) {
    switch (message.type) {
      case "subscribe_chat":
        await this.handleSubscribeChat(ws, message);
        break;
      case "unsubscribe_chat":
        await this.handleUnsubscribeChat(ws, message);
        break;
      case "create_chat":
        await this.handleCreateChat(ws, message);
        break;
      case "get_chat_history":
        await this.handleGetChatHistory(ws, message);
        break;
      case "message":
        await this.handleChatMessage(ws, message);
        break;
      default:
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: "Unknown message type" },
          })
        );
    }
  }

  // обработка подписки на чат
  private async handleSubscribeChat(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ) {
    const { chatId, token } = message.data;

    // Аутентификация, если пользователь еще не авторизован
    if (!ws.userId) {
      if (!token) {
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: "Authentication token required" },
          })
        );
        return;
      }

      const userId = await this.authenticateUser(token);
      if (!userId) {
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: "Invalid authentication token" },
          })
        );
        return;
      }

      // Проверка лимита соединений на пользователя
      let userConnection = this.users.get(userId);
      if (!userConnection) {
        userConnection = {
          connections: new Map(),
          lastActivity: Date.now(),
          messageCount: 0,
          activeChats: new Set(),
        };
        this.users.set(userId, userConnection);
      }

      if (userConnection.connections.size >= this.config.maxConnectionsPerUser) {
        ws.close(1008, "Too many connections for user");
        return;
      }

      ws.userId = userId;
      userConnection.connections.set(ws.connectionId!, ws);
      userConnection.lastActivity = Date.now();

      // Отправляем подтверждение аутентификации
      ws.send(
        JSON.stringify({
          type: "authenticated",
          data: {
            userId,
            connectionId: ws.connectionId,
          },
        })
      );
    }

    if (!chatId) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Chat ID required" },
        })
      );
      return;
    }

    // Проверяем доступ к чату
    const chat = await Chat.findOne({ _id: chatId, userId: ws.userId }).populate(
      "messages"
    );
    if (!chat) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Chat not found or access denied" },
        })
      );
      return;
    }

    ws.subscribedChats = ws.subscribedChats || new Set();
    ws.subscribedChats.add(chatId);

    // Добавляем чат в активные чаты пользователя
    const userConnection = this.users.get(ws.userId);
    if (userConnection) {
      userConnection.activeChats.add(chatId);
    }

    ws.send(
      JSON.stringify({
        type: "chat_subscribed",
        data: {
          chatId,
          messages: chat.messages,
          title: chat.title,
        },
      })
    );
  }

  // обработка отписки от чата
  private async handleUnsubscribeChat(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ) {
    const { chatId } = message.data;

    if (!chatId) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Chat ID required" },
        })
      );
      return;
    }

    // Проверяем доступ к чату
    const chat = await Chat.findOne({ _id: chatId, userId: ws.userId }).populate(
      "messages"
    );
    if (!chat) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Chat not found or access denied" },
        })
      );
      return;
    }

    ws.subscribedChats = ws.subscribedChats || new Set();
    ws.subscribedChats.delete(chatId);

    ws.send(
      JSON.stringify({
        type: "chat_unsubscribed",
        data: {
          chatId,
          messages: chat.messages,
          title: chat.title,
        },
      })
    );
  }

  // создание нового чата используется только для тестировки в файле loadTest.js
  private async handleCreateChat(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ) {
    if (!ws.userId) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Not authenticated" },
        })
      );
      return;
    }

    try {
      const chat = await Chat.create({
        userId: ws.userId,
        title: "Новый чат",
        description: "Новая беседа",
        sourceType: "manual",
        messages: [],
      });

      ws.subscribedChats = ws.subscribedChats || new Set();
      ws.subscribedChats.add(chat._id.toString());

      ws.send(
        JSON.stringify({
          type: "chat_created",
          data: {
            chatId: chat._id,
            title: chat.title,
          },
        })
      );
    } catch (error) {
      console.error("Error creating chat:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Failed to create chat" },
        })
      );
    }
  }

  // обработка получения истории чата
  private async handleGetChatHistory(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ) {
    const { chatId } = message.data;

    if (!chatId) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Chat ID required" },
        })
      );
      return;
    }

    // Проверяем доступ к чату
    const chat = await Chat.findOne({ _id: chatId, userId: ws.userId }).populate(
      "messages"
    );
    if (!chat) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Chat not found or access denied" },
        })
      );
      return;
    }

    ws.send(
      JSON.stringify({
        type: "chat_history",
        data: {
          chatId,
          messages: chat.messages,
        },
      })
    );
  }

  // обработка сообщений от пользователя
  private async handleChatMessage(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ) {
    if (!ws.userId) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Not authenticated" },
        })
      );
      return;
    }

    const { message: userMessage, chatId } = message.data;

    if (!chatId) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Chat ID required" },
        })
      );
      return;
    }

    // Проверяем, что пользователь подписан на этот чат
    if (!ws.subscribedChats?.has(chatId)) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Not subscribed to this chat" },
        })
      );
      return;
    }

    // Проверка rate limiting
    if (!this.checkRateLimit(ws.userId)) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Rate limit exceeded. Please slow down." },
        })
      );
      return;
    }

    if (!userMessage || userMessage.trim().length === 0) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Message content required" },
        })
      );
      return;
    }

    // Ограничение длины сообщения
    if (userMessage.length > this.config.maxMessageLength) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: {
            message: `Message too long. Maximum ${this.config.maxMessageLength} characters.`,
          },
        })
      );
      return;
    }

    this.incrementMessageCount(ws.userId);

    try {
      // Находим конкретный чат
      const chat = await Chat.findOne({ _id: chatId, userId: ws.userId });
      if (!chat) {
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: "Chat not found" },
          })
        );
        return;
      }

      // Создаем сообщение пользователя
      const userMessageDoc = await Message.create({
        content: userMessage.trim(),
        role: "user",
      });

      chat.messages.push(userMessageDoc._id);
      chat.updatedAt = new Date();
      await chat.save();

      // Отправляем подтверждение пользователю в конкретный чат
      this.sendToChatSubscribers(ws.userId, chatId, {
        type: "user_message",
        data: {
          chatId: chatId,
          messageId: userMessageDoc._id,
          content: userMessage.trim(),
          role: "user",
          timestamp: userMessageDoc.createdAt,
        },
      });

      // Получаем историю сообщений для контекста
      const messages = await Message.find({ _id: { $in: chat.messages } }).sort({
        createdAt: 1,
      });

      // Простой промпт для всех чатов
      const systemPrompt =
        "You are a comprehensive legal assistant helping users with any legal issues, including document analysis, visas, migration, deportation, documents, police, court, lawyers, legal translations, work permits, asylum, residence permits, study abroad, and legal statement filings. Automatically detect the user's language and reply in that language. If the question is not legal-related, politely explain you can only help with legal topics.";

      const openaiMessages = [
        {
          role: "system" as const,
          content: systemPrompt,
        },
        ...messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ];

      // Начинаем стриминг ответа в конкретный чат
      this.sendToChatSubscribers(ws.userId, chatId, {
        type: "assistant_message_start",
        data: {
          chatId: chatId,
          message: "Ассистент печатает...",
        },
      });

      let assistantMessageContent = "";

      try {
        // Используем Promise для неблокирующего выполнения
        const streamPromise = openai.chat.completions.create({
          model: "gpt-4o",
          messages: openaiMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: this.config.maxTokens,
        });

        const stream = await streamPromise;

        for await (const chunk of stream) {
          // Проверяем, что соединение еще активно
          if (ws.readyState !== WebSocket.OPEN) {
            break;
          }

          const token = chunk.choices?.[0]?.delta?.content || "";
          if (token) {
            assistantMessageContent += token;
            this.sendToChatSubscribers(ws.userId, chatId, {
              type: "assistant_message_token",
              data: {
                chatId: chatId,
                token,
              },
            });
          }
        }

        // Создаем сообщение ассистента в базе данных
        const assistantMessageDoc = await Message.create({
          content: assistantMessageContent,
          role: "assistant",
        });

        chat.messages.push(assistantMessageDoc._id);
        chat.updatedAt = new Date();

        // Обновляем заголовок чата если это первый обмен
        if (chat.messages.length === 2) {
          chat.title =
            userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
        }

        await chat.save();

        // Отправляем завершение в конкретный чат
        this.sendToChatSubscribers(ws.userId, chatId, {
          type: "assistant_message_complete",
          data: {
            chatId: chatId,
            messageId: assistantMessageDoc._id,
            content: assistantMessageContent,
            role: "assistant",
            timestamp: assistantMessageDoc.createdAt,
          },
        });
      } catch (openaiError) {
        console.error("OpenAI error:", openaiError);

        const errorMessage =
          "Извините, произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.";

        const assistantMessageDoc = await Message.create({
          content: errorMessage,
          role: "assistant",
        });

        chat.messages.push(assistantMessageDoc._id);
        chat.updatedAt = new Date();
        await chat.save();

        this.sendToChatSubscribers(ws.userId, chatId, {
          type: "assistant_message_complete",
          data: {
            chatId: chatId,
            messageId: assistantMessageDoc._id,
            content: errorMessage,
            role: "assistant",
            timestamp: assistantMessageDoc.createdAt,
          },
        });
      }
    } catch (error) {
      console.error("Error handling chat message:", error);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: "Failed to process message" },
          })
        );
      }
    }
  }

  // отправка сообщения подписчикам конкретного чата
  private sendToChatSubscribers(userId: string, chatId: string, message: any) {
    const userConnection = this.users.get(userId);
    if (userConnection) {
      userConnection.connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN && ws.subscribedChats?.has(chatId)) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }

  // широковещательная отправка сообщений
  public broadcast(message: any) {
    this.users.forEach((userConnection) => {
      userConnection.connections.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    });
  }

  // отправка сообщения конкретному пользователю
  public sendToUser(userId: string, message: any) {
    const userConnection = this.users.get(userId);
    if (userConnection) {
      userConnection.connections.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  // отправка сообщения конкретному пользователю в конкретном чате
  public sendToUserChat(userId: string, chatId: string, message: any) {
    const userConnection = this.users.get(userId);
    if (userConnection) {
      userConnection.connections.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.subscribedChats?.has(chatId)) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  // получение статистики
  public getStats() {
    return {
      totalConnections: this.connectionCount,
      totalUsers: this.users.size,
      maxConnections: this.config.maxConnections,
      maxConnectionsPerUser: this.config.maxConnectionsPerUser,
      config: this.config,
    };
  }
}

// shoha
