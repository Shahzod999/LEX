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
    const allFileContents: {
      fileName: string;
      content: string;
      fileType: string;
    }[] = [];

    // Создание директории для пользователя
    const userUploadsDir = path.join(
      "uploads",
      req.user.userId.toString(),
      "docs"
    );
    if (!fs.existsSync(userUploadsDir)) {
      fs.mkdirSync(userUploadsDir, { recursive: true });
    }

    // Загрузка файлов и извлечение текста
    for (const file of req.files) {
      const fileType = path.extname(file.originalname).toLowerCase();
      const newFileName = `${Date.now()}-${file.originalname}`;
      const newFilePath = path.join(userUploadsDir, newFileName);

      fs.renameSync(file.path, newFilePath);
      fileUrls.push(newFilePath);

      const fileContent = await extractText(newFilePath, fileType);
      allFileContents.push({
        fileName: file.originalname,
        content: fileContent,
        fileType: fileType,
      });
    }

    // Комбинированный контент для анализа
    const combinedContent = allFileContents
      .map(
        (file) =>
          `=== ${file.fileName} (${file.fileType}) ===\n${file.content}\n\n`
      )
      .join("");

    // Создаем чат
    const chat = await Chat.create({
      userId: req.user.userId,
      title:
        req.body.title || `Analysis of ${allFileContents.length} Documents`,
      description: "Document analysis chat",
      sourceType: "document",
      messages: [],
    });

    // Системное сообщение
    const systemMessage = await Message.create({
      content: "I will analyze your documents and extract key information.",
      role: "assistant",
    });
    messages.push(systemMessage);

    // Сообщение о загруженных файлах
    const filesList = allFileContents.map((file) => file.fileName).join(", ");
    const userMessage = await Message.create({
      role: "user",
      content: `Uploaded documents: ${filesList}`,
    });
    messages.push(userMessage);

    // Единый запрос к OpenAI для анализа и извлечения деталей
    let assistantMessageContent = "";
    let extractedDetails = {
      deadline: "",
      expirationDate: null,
      description: "",
    };

    try {
      const combinedPrompt = `
        DOCUMENT ANALYSIS TASK

        1. EXTRACT KEY DETAILS:
        - Deadline (format: YYYY-MM-DD or empty)
        - Expiration date (format: YYYY-MM-DD or null)
        - Brief description (1-2 sentences)

        2. PROVIDE FULL ANALYSIS:
        - Summary of each document
        - Key findings and risks
        - Recommendations

        DOCUMENTS:
        ${combinedContent}

        Respond in: ${language}
        Format: JSON with {details: {deadline, expirationDate, description}, analysis: string}
      `;

      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a professional document analyst. Extract key details first, then provide full analysis.",
          },
          {
            role: "user",
            content: combinedPrompt,
          },
        ],
        model: "gpt-4o",
        response_format: { type: "json_object" },
      });

      const response = JSON.parse(
        completion.choices[0].message.content || "{}"
      );
      extractedDetails = response.details;
      assistantMessageContent = response.analysis;
    } catch (error) {
      console.error("OpenAI error:", error);
      assistantMessageContent =
        "Error analyzing documents. Please review manually.";
      extractedDetails = {
        deadline: "",
        expirationDate: null,
        description: "Analysis failed",
      };
    }

    // Сохраняем ответ ассистента
    const assistantMessage = await Message.create({
      content: assistantMessageContent,
      role: "assistant",
    });
    messages.push(assistantMessage);

    // Обновляем чат
    chat.messages.push(...messages.map((m) => m._id));
    await chat.save();

    // Создаем документ
    const document = await Document.create({
      userId: req.user.userId,
      title:
        req.body.title || `Analysis of ${allFileContents.length} Documents`,
      filesUrl: fileUrls,
      chatId: chat._id,
      info: {
        deadline: req.body.deadline || extractedDetails.deadline,
        description: assistantMessageContent || extractedDetails.description,
        expirationDate:
          req.body.expirationDate || extractedDetails.expirationDate,
      },
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

    res.status(200).json({
      message:
        "Document, files, chat and associated messages deleted successfully",
    });
  }
);
