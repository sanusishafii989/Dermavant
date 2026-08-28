import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const WalletTransactionSchema = new Schema(
  {
    transaction_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    wallet_id: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    patient_id: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      index: true,
    },
    type: {
      type: String,
      enum: ["top_up", "consultation_fee", "pharmacy_purchase", "refund", "bonus", "withdrawal"],
      required: true,
    },
    amount: { type: Number, required: true },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: {} },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

WalletTransactionSchema.index({ patient_id: 1, created_at: -1 });
WalletTransactionSchema.index({ wallet_id: 1, created_at: -1 });

export type IWalletTransaction = InferSchemaType<typeof WalletTransactionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const WalletTransaction: Model<IWalletTransaction> =
  mongoose.models.WalletTransaction ??
  mongoose.model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);
