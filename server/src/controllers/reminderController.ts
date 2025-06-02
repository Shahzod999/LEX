import { Request, Response } from "express";
import Reminder from "../models/Reminder";
import asyncHandler from "../middleware/asyncHandler";
import { AuthenticatedRequest } from "../types/RequestTypes";

export const createReminder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, description, deadline, schedule, status } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const reminder = await Reminder.create({
      title,
      description,
      deadline,
      schedule,
      status,
      userId: req.user?.userId,
    });
    res
      .status(200)
      .json({ message: "Reminder created", reminderId: reminder?._id });
  }
);

export const getReminders = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const reminders = await Reminder.find({ userId: req.user?.userId });
    res.status(200).json(reminders);
  }
);

export const updateReminder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, description, deadline, schedule, status } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const reminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      { title, description, deadline, schedule, status },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "Reminder updated", reminderId: reminder?._id });
  }
);

export const deleteReminder = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await Reminder.findByIdAndDelete({
      _id: req.params.id,
      userId: req.user?.userId,
    });
    res.status(200).json({ message: "Reminder deleted" });
  }
);
