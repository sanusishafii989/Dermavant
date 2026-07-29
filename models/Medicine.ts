import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const MedicineSchema = new Schema(
  {
    medicine_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    partner_id: {
      type: Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
      index: true,
    },
    name: { type: String, required: true, index: true },
    brand: { type: String, default: "" },
    category: { type: String, default: "General" },
    price: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true, default: 0 },
    expiry_date: { type: Date, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    qr_code: {
      type: String,
      required: true,
      unique: true,
      default: () => `QR-${new mongoose.Types.ObjectId().toString()}`,
    },
    status: {
      type: String,
      enum: ["active", "delisted"],
      default: "active",
      index: true,
    },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

MedicineSchema.index({ name: "text", brand: "text", category: "text", description: "text" });

export type IMedicine = InferSchemaType<typeof MedicineSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Medicine: Model<IMedicine> =
  mongoose.models.Medicine ?? mongoose.model<IMedicine>("Medicine", MedicineSchema);
