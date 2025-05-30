import mongoose from "mongoose";

const infoSchema = new mongoose.Schema({
  deadline: { type: String, default: "" },
  description: { type: String, default: "" },
  expirationDate: { type: Date, default: null },
  status: { type: String, default: "pending" },
});

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    filesUrl: { type: [String], required: true },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    info: infoSchema,
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model("Document", documentSchema);

export default Document;
