import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PartnerSchema = new Schema(
  {
    partner_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    business_name: { type: String, required: true },
    license: { type: String, required: true, default: "PENDING" },
    owner_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true },
    address: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "inactive"],
      default: "pending",
    },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

PartnerSchema.index({ status: 1, rating: -1 });
PartnerSchema.index({ latitude: 1, longitude: 1 });

export type IPartner = InferSchemaType<typeof PartnerSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Partner: Model<IPartner> =
  mongoose.models.Partner ?? mongoose.model<IPartner>("Partner", PartnerSchema);
