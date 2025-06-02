import express from "express";
import {
  updateReminder,
  createReminder,
  getReminders,
  deleteReminder,
} from "../controllers/reminderController";
import { authenticate } from "../middleware/userMiddleware";

const router = express.Router();

router.post("/", authenticate, createReminder);
router.get("/", authenticate, getReminders);
router.put("/:id", authenticate, updateReminder);
router.delete("/:id", authenticate, deleteReminder);

export default router;
