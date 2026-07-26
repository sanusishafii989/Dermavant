import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const WalletSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  ownerRole: {
    type: String,
    required: true,
    enum: ["patient", "doctor", "partner", "admin"],
  },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: "NGN" },
  updatedAt: { type: Date, default: Date.now },
});

export type IWallet = InferSchemaType<typeof WalletSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Wallet: Model<IWallet> =
  mongoose.models.Wallet ?? mongoose.model<IWallet>("Wallet", WalletSchema);
