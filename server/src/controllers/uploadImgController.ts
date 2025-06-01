import { AuthenticatedRequest } from "../types/RequestTypes";
import { Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import fs from "fs";
import path from "path";

interface FileInfo {
  fileName: string;
  filePath: string;
  size: number;
  createdAt: Date;
  lastModified: Date;
  type: "image" | "document" | "logo";
}

interface UploadResult {
  images: FileInfo[];
  documents: FileInfo[];
  logo: FileInfo[];
}

export const uploadImg = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.userId) {
      res.status(401);
      throw new Error("Not authorized");
    }

    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    const { type } = req.body;
    if (!type || !["docs", "images", "logo"].includes(type)) {
      res.status(400);
      throw new Error("Type must be either 'docs' or 'images' or 'logo'");
    }

    // Create user-specific directory
    const userDir = path.join("uploads", req.user.userId.toString(), type);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // If type is logo, delete all existing files in the logo directory
    if (type === "logo" && fs.existsSync(userDir)) {
      const existingFiles = fs.readdirSync(userDir);
      existingFiles.forEach((file) => {
        const filePath = path.join(userDir, file);
        fs.unlinkSync(filePath);
      });
    }

    // Generate unique filename
    const newFileName = `${Date.now()}-${req.file.originalname}`;
    const newFilePath = path.join(userDir, newFileName);

    // Move file to user-specific directory
    fs.renameSync(req.file.path, newFilePath);

    res.status(201).json({
      success: true,
      filePath: `/${type}/${newFileName}`,
      fileName: newFileName,
    });
  }
);

export const getAllUploaded = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.userId) {
      res.status(401);
      throw new Error("Not authorized");
    }

    const userId = req.user.userId.toString();
    const userBaseDir = path.join("uploads", userId);
    const userImagesDir = path.join(userBaseDir, "images");
    const userDocsDir = path.join(userBaseDir, "docs");
    const userLogoDir = path.join(userBaseDir, "logo");

    const result: UploadResult = {
      images: [],
      documents: [],
      logo: [],
    };

    try {
      // Get images
      if (fs.existsSync(userImagesDir)) {
        const imageFiles = fs.readdirSync(userImagesDir);
        result.images = imageFiles.map((fileName) => {
          const filePath = path.join(userImagesDir, fileName);
          const stats = fs.statSync(filePath);

          return {
            fileName,
            filePath: `/images/${fileName}`,
            size: stats.size,
            createdAt: stats.birthtime,
            lastModified: stats.mtime,
            type: "image" as const,
          };
        });
      }

      // Get documents
      if (fs.existsSync(userDocsDir)) {
        const docFiles = fs.readdirSync(userDocsDir);
        result.documents = docFiles.map((fileName) => {
          const filePath = path.join(userDocsDir, fileName);
          const stats = fs.statSync(filePath);

          return {
            fileName,
            filePath: `/docs/${fileName}`,
            size: stats.size,
            createdAt: stats.birthtime,
            lastModified: stats.mtime,
            type: "document" as const,
          };
        });
      }

      if (fs.existsSync(userLogoDir)) {
        const logoFiles = fs.readdirSync(userLogoDir);
        result.logo = logoFiles.map((fileName) => {
          const filePath = path.join(userLogoDir, fileName);
          const stats = fs.statSync(filePath);

          return {
            fileName,
            filePath: `/logo/${fileName}`,
            size: stats.size,
            createdAt: stats.birthtime,
            lastModified: stats.mtime,
            type: "logo" as const,
          };
        });
      }

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error reading user's files:", error);
      res.status(500);
      throw new Error("Failed to retrieve files");
    }
  }
);

export const deleteUploads = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.userId) {
      res.status(401);
      throw new Error("Not authorized");
    }

    const { filePath } = req.body;
    if (!filePath) {
      res.status(400);
      throw new Error("File path is required");
    }

    // Construct the full path using user ID
    const fullPath = path.join(
      "uploads",
      req.user.userId.toString(),
      filePath.startsWith("/") ? filePath.slice(1) : filePath
    );

    // Verify the file path is within the user's directory
    const userBaseDir = path.join("uploads", req.user.userId.toString());
    const normalizedFilePath = path.normalize(fullPath);
    const normalizedUserDir = path.normalize(userBaseDir);

    if (!normalizedFilePath.startsWith(normalizedUserDir)) {
      res.status(403);
      throw new Error("Access denied");
    }

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      res.status(404);
      throw new Error("File not found");
    }

    try {
      // Delete the file
      fs.unlinkSync(fullPath);
      res.status(200).json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500);
      throw new Error("Failed to delete file");
    }
  }
);

export const getUploadedByRoute = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId, type, filename } = req.params;

    // 🔐 Проверка: пользователь может получить доступ только к своей папке
    if (req.user?.userId !== userId) {
      throw new Error("Access denied");
    }

    
    const filePath = path.join("uploads", userId, type, filename);
    console.log(filePath);

    // Проверка: существует ли файл
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    res.sendFile(path.resolve(filePath));
  }
);

// Публичный доступ к логотипам без аутентификации
export const getPublicLogo = asyncHandler(async (req: any, res: Response) => {
  const { userId, filename } = req.params;

  const filePath = path.join("uploads", userId, "logo", filename);

  // Проверка: существует ли файл
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error("File not found");
  }

  res.sendFile(path.resolve(filePath));
});
