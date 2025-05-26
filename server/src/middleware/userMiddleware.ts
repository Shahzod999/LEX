import type { NextFunction, Request, Response } from "express";
import asyncHandler from "./asyncHandler";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "../types/RequestTypes";
import User from "../models/User";

// Middleware to check if the user is an admin
export const isAdmin = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: () => void) => {
    console.log(req.user);
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
  }
);

export const isOwnerOrAdmin = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: () => void) => {
    const targetUserId = req.params.id;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Админам разрешаем сразу
    if (currentUser.role === "admin") {
      return next();
    }

    // Проверка владельца
    if (currentUser.userId !== targetUserId) {
      return res.status(403).json({
        error: "Access denied. Not owner or admin.",
      });
    }

    next();
  }
);

export const validateUser = asyncHandler(
  async (req: Request, res: Response, next: () => void) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
    } else {
      next();
    }
  }
);

export const authenticate = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401);
      throw new Error("Not authorized, no token");
    }

    const token = authHeader.split(" ")[1];

    if (token) {
      try {
        const decode = jwt.verify(
          token,
          process.env.JWT_SECRET!
        ) as jwt.JwtPayload;

        // ✅ Сохраняем в req.user
        req.user = {
          userId: decode.userId,
          role: decode.role,
        };

        const userExists = await User.findById(decode.userId);
        if (!userExists) {
          res.status(401);
          throw new Error("User not found");
        }

        next();
      } catch (error) {
        res.status(401);
        throw new Error("Not authorized, token failed");
      }
    } else {
      res.status(401);
      throw new Error("No auth No token");
    }
  }
);
