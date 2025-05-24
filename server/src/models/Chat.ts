import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    title: { type: String, required: true },
    description: { type: String, required: true },
    sourceType: {
      type: String,
      enum: ["manual", "document"],
      default: "manual",
    },
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model("Chat", chatSchema);

const messageSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

export { Message, Chat };
