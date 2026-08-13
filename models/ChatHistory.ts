import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { _id: false, timestamps: { createdAt: "created_at" } }
);

const ChatHistorySchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
    },
    title: { type: String, default: "Untitled conversation" },
    messages: { type: [ChatMessageSchema], default: [] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

ChatHistorySchema.index({ user_id: 1, updated_at: -1 });

export type IChatHistory = InferSchemaType<typeof ChatHistorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ChatHistory: Model<IChatHistory> =
  mongoose.models.ChatHistory ??
  mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);
