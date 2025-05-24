import express from "express";
import {
  deleteUserChat,
  getChat,
  getUserChats,
  sendMessage,
} from "../controllers/chatController";
import { authenticate } from "../middleware/userMiddleware";

const router = express.Router();

router
  .get("/", authenticate, getUserChats)
  .get("/:id", authenticate, getChat)
  .post("/", authenticate, sendMessage)
  .delete("/:id", authenticate, deleteUserChat);

export default router;
