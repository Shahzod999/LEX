import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import OpenAI from "openai";
import jwt from "jsonwebtoken";
import { Chat, Message } from "../models/Chat";
import User from "../models/User";
import { getWebSocketConfig, WebSocketConfig } from "../config/websocketConfig";
import { wsMonitor } from "../middleware/websocketMonitoring";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  chatId?: string;
  connectionId?: string;
  lastActivity?: number;
  messageCount?: number;
}

interface WebSocketMessage {
  type: "message" | "join_chat" | "create_chat" | "switch_chat";
  data: {
    message?: string;
    chatId?: string;
    token?: string;
  };
}

interface UserConnection {
  connections: Map<string, AuthenticatedWebSocket>; // connectionId -> WebSocket
  lastActivity: number;
  messageCount: number;
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

    // Обновление метрик каждые 30 секунд
    setInterval(() => {
      wsMonitor.updateConnectionCount(this.connectionCount, this.users.size);
    }, 30000);

    console.log("WebSocket server initialized", {
      maxConnections: this.config.maxConnections,
      maxConnectionsPerUser: this.config.maxConnectionsPerUser,
      rateLimitMaxMessages: this.config.rateLimitMaxMessages,
    });
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

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

  private incrementMessageCount(userId: string): void {
    const userConnection = this.users.get(userId);
    if (userConnection) {
      userConnection.messageCount++;
      userConnection.lastActivity = Date.now();
    }
  }

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

  private async handleConnection(ws: AuthenticatedWebSocket) {
    // Проверка лимита соединений
    if (this.connectionCount >= this.config.maxConnections) {
      ws.close(1008, "Server at capacity");
      wsMonitor.recordError();
      return;
    }

    const connectionId = this.generateConnectionId();
    ws.connectionId = connectionId;
    ws.lastActivity = Date.now();
    ws.messageCount = 0;

    this.connectionCount++;
    wsMonitor.updateConnectionCount(this.connectionCount, this.users.size);

    console.log(
      `New WebSocket connection: ${connectionId} (Total: ${this.connectionCount})`
    );

    ws.on("message", async (data) => {
      const startTime = Date.now();

      try {
        // Обновляем активность
        ws.lastActivity = Date.now();

        const message: WebSocketMessage = JSON.parse(data.toString());
        await this.handleMessage(ws, message);

        wsMonitor.recordMessage();
        wsMonitor.recordResponseTime(Date.now() - startTime);
      } catch (error) {
        console.error("Error parsing message:", error);
        wsMonitor.recordError();
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
      wsMonitor.recordError();
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
    wsMonitor.updateConnectionCount(this.connectionCount, this.users.size);

    console.log(
      `WebSocket connection closed: ${ws.connectionId} (Total: ${this.connectionCount})`
    );
  }

  private async handleMessage(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ) {
    switch (message.type) {
      case "join_chat":
        await this.handleJoinChat(ws, message);
        break;
      case "create_chat":
        await this.handleCreateChat(ws, message);
        break;
      case "switch_chat":
        await this.handleSwitchChat(ws, message);
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

  private async handleJoinChat(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ) {
    const { token, chatId } = message.data;

    if (!token) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Authentication token required" },
        })
      );
      wsMonitor.recordError();
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
      wsMonitor.recordError();
      return;
    }

    // Проверка лимита соединений на пользователя
    let userConnection = this.users.get(userId);
    if (!userConnection) {
      userConnection = {
        connections: new Map(),
        lastActivity: Date.now(),
        messageCount: 0,
      };
      this.users.set(userId, userConnection);
    }

    if (userConnection.connections.size >= this.config.maxConnectionsPerUser) {
      ws.close(1008, "Too many connections for user");
      wsMonitor.recordError();
      return;
    }

    ws.userId = userId;
    userConnection.connections.set(ws.connectionId!, ws);
    userConnection.lastActivity = Date.now();

    if (chatId) {
      // Проверяем доступ к чату
      const chat = await Chat.findOne({ _id: chatId, userId }).populate(
        "messages"
      );
      if (!chat) {
        ws.send(
          JSON.stringify({
            type: "error",
            data: { message: "Chat not found or access denied" },
          })
        );
        wsMonitor.recordError();
        return;
      }

      ws.chatId = chatId;

      ws.send(
        JSON.stringify({
          type: "chat_joined",
          data: {
            chatId,
            messages: chat.messages,
            title: chat.title,
          },
        })
      );
    } else {
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
  }

  private async handleSwitchChat(
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
    const chat = await Chat.findOne({
      _id: chatId,
      userId: ws.userId,
    }).populate("messages");
    if (!chat) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Chat not found or access denied" },
        })
      );
      return;
    }

    ws.chatId = chatId;

    ws.send(
      JSON.stringify({
        type: "chat_switched",
        data: {
          chatId,
          messages: chat.messages,
          title: chat.title,
        },
      })
    );
  }

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

      ws.chatId = chat._id.toString();

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

  private async handleChatMessage(
    ws: AuthenticatedWebSocket,
    message: WebSocketMessage
  ) {
    if (!ws.userId || !ws.chatId) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Not authenticated or not in a chat" },
        })
      );
      wsMonitor.recordError();
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
      wsMonitor.recordError();
      return;
    }

    const { message: userMessage } = message.data;
    if (!userMessage || userMessage.trim().length === 0) {
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: "Message content required" },
        })
      );
      wsMonitor.recordError();
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
      wsMonitor.recordError();
      return;
    }

    this.incrementMessageCount(ws.userId);

    try {
      // Находим чат
      const chat = await Chat.findOne({ _id: ws.chatId, userId: ws.userId });
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

      // Отправляем подтверждение пользователю
      ws.send(
        JSON.stringify({
          type: "user_message",
          data: {
            messageId: userMessageDoc._id,
            content: userMessage.trim(),
            role: "user",
            timestamp: userMessageDoc.createdAt,
          },
        })
      );

      // Получаем историю сообщений для контекста
      const messages = await Message.find({ _id: { $in: chat.messages } }).sort(
        {
          createdAt: 1,
        }
      );

      // Простой промпт для всех чатов
      const systemPrompt = "You are a comprehensive legal assistant helping users with any legal issues, including document analysis, visas, migration, deportation, documents, police, court, lawyers, legal translations, work permits, asylum, residence permits, study abroad, and legal statement filings. Automatically detect the user's language and reply in that language. If the question is not legal-related, politely explain you can only help with legal topics.";

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

      // Начинаем стриминг ответа
      ws.send(
        JSON.stringify({
          type: "assistant_message_start",
          data: { message: "Ассистент печатает..." },
        })
      );

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
            ws.send(
              JSON.stringify({
                type: "assistant_message_token",
                data: { token },
              })
            );
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

        // Отправляем завершение
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "assistant_message_complete",
              data: {
                messageId: assistantMessageDoc._id,
                content: assistantMessageContent,
                role: "assistant",
                timestamp: assistantMessageDoc.createdAt,
              },
            })
          );
        }
      } catch (openaiError) {
        console.error("OpenAI error:", openaiError);
        wsMonitor.recordError();

        const errorMessage =
          "Извините, произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.";

        const assistantMessageDoc = await Message.create({
          content: errorMessage,
          role: "assistant",
        });

        chat.messages.push(assistantMessageDoc._id);
        chat.updatedAt = new Date();
        await chat.save();

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "assistant_message_complete",
              data: {
                messageId: assistantMessageDoc._id,
                content: errorMessage,
                role: "assistant",
                timestamp: assistantMessageDoc.createdAt,
              },
            })
          );
        }
      }
    } catch (error) {
      console.error("Error handling chat message:", error);
      wsMonitor.recordError();

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

  public broadcast(message: any) {
    this.users.forEach((userConnection) => {
      userConnection.connections.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    });
  }

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

  public sendToUserChat(userId: string, chatId: string, message: any) {
    const userConnection = this.users.get(userId);
    if (userConnection) {
      userConnection.connections.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.chatId === chatId) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  public getStats() {
    return {
      totalConnections: this.connectionCount,
      totalUsers: this.users.size,
      maxConnections: this.config.maxConnections,
      maxConnectionsPerUser: this.config.maxConnectionsPerUser,
      config: this.config,
      monitoring: wsMonitor.getMetrics(),
    };
  }
}

// shoha