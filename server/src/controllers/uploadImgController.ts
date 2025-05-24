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
  type: "image" | "document";
}

interface UploadResult {
  images: FileInfo[];
  documents: FileInfo[];
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
    if (!type || !["docs", "image"].includes(type)) {
      res.status(400);
      throw new Error("Type must be either 'docs' or 'image'");
    }

    // Create user-specific directory
    const userDir = path.join(
      "uploads",
      req.user.userId.toString(),
      type === "image" ? "images" : "docs"
    );
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Generate unique filename
    const newFileName = `${Date.now()}-${req.file.originalname}`;
    const newFilePath = path.join(userDir, newFileName);

    // Move file to user-specific directory
    fs.renameSync(req.file.path, newFilePath);

    res.status(201).json({
      success: true,
      filePath: `/${type === "image" ? "images" : "docs"}/${newFileName}`,
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

    const result: UploadResult = {
      images: [],
      documents: [],
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
            filePath,
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
            filePath,
            size: stats.size,
            createdAt: stats.birthtime,
            lastModified: stats.mtime,
            type: "document" as const,
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
