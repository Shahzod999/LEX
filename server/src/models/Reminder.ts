import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: String, default: null },
    schedule: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    userId: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
