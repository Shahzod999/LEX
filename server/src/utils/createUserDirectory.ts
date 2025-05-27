import fs from "fs";
import { Types } from "mongoose";
import path from "path";

export function createUserDirectory(userId: Types.ObjectId) {
  const id = userId.toString();
  const rootDir = path.resolve(); // путь до корня проекта
  const userDir = path.join(rootDir, "uploads", id);
  const docsDir = path.join(userDir, "docs");
  const imagesDir = path.join(userDir, "images");
  const logoDir = path.join(userDir, "logo");

  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
    fs.mkdirSync(docsDir);
    fs.mkdirSync(imagesDir);
    fs.mkdirSync(logoDir);
  }
}
