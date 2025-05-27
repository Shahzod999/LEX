import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import OpenAI from "openai";
import jwt from "jsonwebtoken";
import { Chat, Message } from "../models/Chat";
import User from "../models/User";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  chatId?: string;
}

interface WebSocketMessage {
  type: "message" | "join_chat" | "create_chat";
  data: {
    message?: string;
    chatId?: string;
    token?: string;
  };
}

export class ChatWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: "/ws/chat"
    });

    this.wss.on("connection", this.handleConnection.bind(this));
  }

  private async authenticateUser(token: string): Promise<string | null> {
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET not configured");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
      
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

  private async handleConnection(ws: AuthenticatedWebSocket) {
    console.log("New WebSocket connection");

    ws.on("message", async (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error("Error parsing message:", error);
        ws.send(JSON.stringify({
          type: "error",
          data: { message: "Invalid message format" }
        }));
      }
    });

    ws.on("close", () => {
      if (ws.userId) {
        this.clients.delete(ws.userId);
      }
      console.log("WebSocket connection closed");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: "connected",
      data: { message: "WebSocket connection established" }
    }));
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case "join_chat":
        await this.handleJoinChat(ws, message);
        break;
      case "create_chat":
        await this.handleCreateChat(ws, message);
        break;
      case "message":
        await this.handleChatMessage(ws, message);
        break;
      default:
        ws.send(JSON.stringify({
          type: "error",
          data: { message: "Unknown message type" }
        }));
    }
  }

  private async handleJoinChat(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { token, chatId } = message.data;

    if (!token) {
      ws.send(JSON.stringify({
        type: "error",
        data: { message: "Authentication token required" }
      }));
      return;
    }

    const userId = await this.authenticateUser(token);
    if (!userId) {
      ws.send(JSON.stringify({
        type: "error",
        data: { message: "Invalid authentication token" }
      }));
      return;
    }

    ws.userId = userId;
    this.clients.set(userId, ws);

    if (chatId) {
      // Verify user has access to this chat
      const chat = await Chat.findOne({ _id: chatId, userId }).populate("messages");
      if (!chat) {
        ws.send(JSON.stringify({
          type: "error",
          data: { message: "Chat not found or access denied" }
        }));
        return;
      }

      ws.chatId = chatId;
      ws.send(JSON.stringify({
        type: "chat_joined",
        data: { 
          chatId,
          messages: chat.messages,
          title: chat.title
        }
      }));
    } else {
      ws.send(JSON.stringify({
        type: "authenticated",
        data: { userId }
      }));
    }
  }

  private async handleCreateChat(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!ws.userId) {
      ws.send(JSON.stringify({
        type: "error",
        data: { message: "Not authenticated" }
      }));
      return;
    }

    try {
      const chat = await Chat.create({
        userId: ws.userId,
        title: "Новый чат",
        description: "Новая беседа",
        messages: [],
      });

      ws.chatId = chat._id.toString();

      ws.send(JSON.stringify({
        type: "chat_created",
        data: { 
          chatId: chat._id,
          title: chat.title
        }
      }));
    } catch (error) {
      console.error("Error creating chat:", error);
      ws.send(JSON.stringify({
        type: "error",
        data: { message: "Failed to create chat" }
      }));
    }
  }

  private async handleChatMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!ws.userId || !ws.chatId) {
      ws.send(JSON.stringify({
        type: "error",
        data: { message: "Not authenticated or not in a chat" }
      }));
      return;
    }

    const { message: userMessage } = message.data;
    if (!userMessage) {
      ws.send(JSON.stringify({
        type: "error",
        data: { message: "Message content required" }
      }));
      return;
    }

    try {
      // Find the chat
      const chat = await Chat.findOne({ _id: ws.chatId, userId: ws.userId });
      if (!chat) {
        ws.send(JSON.stringify({
          type: "error",
          data: { message: "Chat not found" }
        }));
        return;
      }

      // Create user message in database
      const userMessageDoc = await Message.create({
        content: userMessage,
        role: "user",
      });

      // Add user message to chat
      chat.messages.push(userMessageDoc._id);
      chat.updatedAt = new Date();
      await chat.save();

      // Send user message confirmation
      ws.send(JSON.stringify({
        type: "user_message",
        data: {
          messageId: userMessageDoc._id,
          content: userMessage,
          role: "user",
          timestamp: userMessageDoc.createdAt
        }
      }));

      // Get chat history for context
      const messages = await Message.find({ _id: { $in: chat.messages } }).sort({
        createdAt: 1,
      });

      // Prepare messages for OpenAI
      const openaiMessages = [
        { 
          role: "system" as const, 
          content: "You are a legal assistant helping users with any legal issues, including visas, migration, deportation, documents, police, court, lawyers, legal translations, work permits, asylum, residence permits, study abroad, and legal statement filings. Automatically detect the user's language and reply in that language. If the question is not legal-related, politely explain you can only help with legal topics." 
        },
        ...messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))
      ];

      // Start streaming response from OpenAI
      ws.send(JSON.stringify({
        type: "assistant_message_start",
        data: { message: "Ассистент печатает..." }
      }));

      let assistantMessageContent = "";

      try {
        const stream = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: openaiMessages,
          stream: true,
          temperature: 0.7,
        });

        for await (const chunk of stream) {
          const token = chunk.choices?.[0]?.delta?.content || "";
          if (token) {
            assistantMessageContent += token;
            ws.send(JSON.stringify({
              type: "assistant_message_token",
              data: { token }
            }));
          }
        }

        // Create assistant message in database
        const assistantMessageDoc = await Message.create({
          content: assistantMessageContent,
          role: "assistant",
        });

        // Add assistant message to chat
        chat.messages.push(assistantMessageDoc._id);
        chat.updatedAt = new Date();
        
        // Update chat title if it's the first exchange
        if (chat.messages.length === 2) {
          chat.title = userMessage.slice(0, 50) + (userMessage.length > 50 ? "..." : "");
        }
        
        await chat.save();

        // Send completion message
        ws.send(JSON.stringify({
          type: "assistant_message_complete",
          data: {
            messageId: assistantMessageDoc._id,
            content: assistantMessageContent,
            role: "assistant",
            timestamp: assistantMessageDoc.createdAt
          }
        }));

      } catch (openaiError) {
        console.error("OpenAI error:", openaiError);
        
        const errorMessage = "Извините, произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.";
        
        // Create error message in database
        const assistantMessageDoc = await Message.create({
          content: errorMessage,
          role: "assistant",
        });

        chat.messages.push(assistantMessageDoc._id);
        chat.updatedAt = new Date();
        await chat.save();

        ws.send(JSON.stringify({
          type: "assistant_message_complete",
          data: {
            messageId: assistantMessageDoc._id,
            content: errorMessage,
            role: "assistant",
            timestamp: assistantMessageDoc.createdAt
          }
        }));
      }

    } catch (error) {
      console.error("Error handling chat message:", error);
      ws.send(JSON.stringify({
        type: "error",
        data: { message: "Failed to process message" }
      }));
    }
  }

  public broadcast(message: any) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  public sendToUser(userId: string, message: any) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
} 