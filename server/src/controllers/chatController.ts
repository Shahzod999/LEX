import asyncHandler from "../middleware/asyncHandler";
import { AuthenticatedRequest } from "../types/RequestTypes";
import type { Response } from "express";
import { Chat, Message } from "../models/Chat";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get all chats for a user
export const getUserChats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.userId) {
      res.status(401);
      throw new Error("Not authorized");
    }

    const chats = await Chat.find({
      userId: req.user.userId,
      sourceType: "manual",
    })
      .populate("messages")
      .sort({ updatedAt: -1 });
    res.status(200).json(chats);
  }
);

// Get a specific chat
export const getChat = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    const chat = await Chat.findOne({
      _id: id,
      userId,
      sourceType: "manual",
    })
      .populate("messages")
      .exec();

    // Если ID не указан, ищем или создаем чат по умолчанию
    if (!id || !chat) {
      const defaultChat = await Chat.findOne({
        userId,
        sourceType: "manual",
      })
        .populate("messages")
        .sort({ updatedAt: -1 })
        .exec();

      if (defaultChat) {
        return res.status(200).json(defaultChat);
      }

      // Если чат не найден, создаем новый
      const newChat = await Chat.create({
        userId,
        title: "New chat",
        description: "New conversation",
        messages: [],
      });

      return res.status(200).json(newChat);
    }

    // Если ID указан, ищем конкретный чат

    res.status(200).json(chat);
  }
);

// Send a message in a chat
export const sendMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.userId) {
      res.status(401);
      throw new Error("Not authorized");
    }

    const { content } = req.body;
    let chatId = req.body.chatId;

    // Find or create chat
    let chat = chatId
      ? await Chat.findOne({ _id: chatId, userId: req.user.userId })
      : null;

    if (!chat) {
      // Create a new chat with the first message as title
      chat = await Chat.create({
        userId: req.user.userId,
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""), // Use first 50 chars as title
        description: "New conversation",
        messages: [],
      });
      chatId = chat._id.toString();
    }

    // Create user message
    const userMessage = await Message.create({
      content,
      role: "user",
    });

    // Get chat history for context
    const messages = await Message.find({ _id: { $in: chat.messages } }).sort({
      createdAt: 1,
    });

    // Prepare messages for OpenAI
    const openaiMessages = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Add the new user message
    openaiMessages.push({
      role: "user",
      content,
    });

    let assistantMessageContent = "Ups We'll fix that";
    try {
      // Get response from OpenAI
      const completion = await openai.chat.completions.create({
        messages: openaiMessages,
        model: "gpt-4o",
      });
      assistantMessageContent = completion.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI error:", error);
    }

    // Create assistant message in database
    const savedAssistantMessage = await Message.create({
      content: assistantMessageContent,
      role: "assistant",
    });

    // Update chat with both messages
    chat.messages.push(userMessage._id, savedAssistantMessage._id);
    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({
      chatId: chat._id,
      userMessage,
      assistantMessage: savedAssistantMessage,
    });
  }
);

export const deleteUserChat = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    });

    if (!chat) {
      res.status(404);
      throw new Error("Chat not found");
    }

    // Delete all messages associated with this chat
    await Message.deleteMany({ _id: { $in: chat.messages } });

    // Delete the chat
    await chat.deleteOne();

    const nextChat = await Chat.findOne({
      userId: req.user?.userId,
      sourceType: "manual",
    })
      .sort({ updatedAt: -1 })
      .exec();

    res.status(200).json({
      message: "Chat and associated messages deleted successfully ",
      nextChatId: nextChat?._id,
    });
  }
);

export const createChat = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const chat = await Chat.create({
      userId: req.user?.userId,
      title: "New chat",
      description: "New conversation",
      messages: [],
    });

    res.status(200).json(chat);
  }
);
