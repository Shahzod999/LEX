import express from "express";
import {
  deleteUserChat,
  getChat,
  getUserChats,
  sendMessage,
  createChat,
} from "../controllers/chatController";
import { authenticate } from "../middleware/userMiddleware";

const router = express.Router();

router
  .get("/", authenticate, getUserChats)
  .get("/single/:id", authenticate, getChat)
  .get("/single", authenticate, getChat) // если есть id, то возвращается чат с этим id, если нет, то возвращается последний чат или создает новый чат если пусто
  .post("/", authenticate, sendMessage)
  .delete("/:id", authenticate, deleteUserChat)
  .post("/create", authenticate, createChat);

export default router;
