import asyncHandler from "../middleware/asyncHandler";
import { AuthenticatedRequest } from "../types/RequestTypes";
import type { Response } from "express";
import Document from "../models/Document";
import { Chat, Message } from "../models/Chat";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { promisify } from "util";

import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

const readFileAsync = promisify(fs.readFile);

async function extractText(
  filePath: string,
  fileType: string
): Promise<string> {
  try {
    if ([".txt", ".json", ".csv", ".md"].includes(fileType)) {
      return await readFileAsync(filePath, "utf-8");
    }

    if (fileType === ".pdf") {
      const data = await readFileAsync(filePath);
      const pdf = await pdfParse(data);
      return pdf.text;
    }

    if (fileType === ".docx") {
      const data = await readFileAsync(filePath);
      const result = await mammoth.extractRawText({ buffer: data });
      return result.value;
    }

    if ([".png", ".jpg", ".jpeg", ".bmp", ".webp"].includes(fileType)) {
      const {
        data: { text },
      } = await Tesseract.recognize(filePath, "eng"); // можно заменить на "rus" или по языку
      return text;
    }

    return "Unsupported file type or empty content.";
  } catch (err) {
    console.error("Error extracting text:", err);
    return "Failed to extract content from the file.";
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const uploadDocument = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.userId) {
      res.status(401);
      throw new Error("Not authorized");
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400);
      throw new Error("No files uploaded");
    }

    const language = req.body.language || "English";
    const fileUrls: string[] = [];
    const messages = [];

    // Create user-specific directory structure
    const userUploadsDir = path.join("uploads", req.user.userId.toString(), "docs");
    if (!fs.existsSync(userUploadsDir)) {
      fs.mkdirSync(userUploadsDir, { recursive: true });
    }

    const chat = await Chat.create({
      userId: req.user.userId,
      title: req.body.title || "Multiple Documents Analysis",
      description: "Multiple documents analysis chat",
      sourceType: "document",
      messages: [],
    });

    const systemMessage = await Message.create({
      content: "I will analyze the documents and provide insights.",
      role: "assistant",
    });

    messages.push(systemMessage);

    for (const file of req.files) {
      const fileType = path.extname(file.originalname).toLowerCase();
      const newFileName = `${Date.now()}-${file.originalname}`;
      const newFilePath = path.join(userUploadsDir, newFileName);

      // Move file to user-specific directory
      fs.renameSync(file.path, newFilePath);
      fileUrls.push(newFilePath);

      const fileContent = await extractText(newFilePath, fileType);

      const userPrompt = `Please analyze this ${fileType} file. Here's the content:\n\n${fileContent}\n\nReply in: ${language}`;
      const userMessage = await Message.create({
        role: "user",
        content: file.originalname,
      });

      messages.push(userMessage);

      let assistantMessageContent = "I'll analyze this file for you.";
      try {
        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are a document analysis assistant. Analyze the provided ${fileType} file and give insights in:\n${language}`,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          model: "gpt-4o",
        });

        assistantMessageContent = completion.choices[0].message.content || "";
      } catch (error) {
        console.error("OpenAI error:", error);
      }

      const assistantMessage = await Message.create({
        content: assistantMessageContent,
        role: "assistant",
      });

      messages.push(assistantMessage);

      chat.messages.push(userMessage._id, assistantMessage._id);
    }

    chat.messages.unshift(systemMessage._id);
    await chat.save();

    const document = await Document.create({
      userId: req.user.userId,
      title: req.body.title || "Multiple Documents",
      filesUrl: fileUrls,
      chatId: chat._id,
    });

    res.status(201).json({
      document,
      chat,
      messages,
    });
  }
);

export const getUserAllDocs = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const docs = await Document.find({
      userId: req.user?.userId,
    });

    res.status(200).json(docs);
  }
);

export const getUserCurrentDoc = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const docs = await Document.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    }).populate({
      path: "chatId",
      populate: {
        path: "messages",
      },
    });

    if (!docs) {
      res.status(404);
      throw new Error("docs not found");
    }

    res.status(200).json(docs);
  }
);

export const deleteDocs = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    }).populate<{ chatId: { _id: string; messages: string[] } }>("chatId");

    if (!doc) {
      res.status(404);
      throw new Error("Document not found");
    }

    // Delete physical files
    for (const fileUrl of doc.filesUrl) {
      try {
        await fs.promises.unlink(fileUrl);
      } catch (error) {
        console.error(`Error deleting file ${fileUrl}:`, error);
      }
    }

    // Delete all messages associated with the chat
    await Message.deleteMany({ _id: { $in: doc.chatId.messages } });

    // Delete the associated chat
    await Chat.findByIdAndDelete(doc.chatId._id);

    // Delete the document
    await doc.deleteOne();

    res.status(200).json({ message: "Document, files, chat and associated messages deleted successfully" });
  }
);
