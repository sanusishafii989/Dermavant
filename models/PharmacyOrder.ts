import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PharmacyOrderItemSchema = new Schema(
  {
    medicine_id: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    name: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
    unit_price: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const PharmacyOrderSchema = new Schema(
  {
    order_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    patient_id: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    partner_id: {
      type: Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
      index: true,
    },
    items: { type: [PharmacyOrderItemSchema], required: true, default: [] },
    total: { type: Number, required: true, default: 0 },
    delivery_status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    delivery_address: { type: String, default: "" },
    payment_reference: { type: String, default: "" },
    fulfillment_type: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
    },
    patient_confirmed: { type: Boolean, default: false },
    patient_confirmed_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export type IPharmacyOrder = InferSchemaType<typeof PharmacyOrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PharmacyOrder: Model<IPharmacyOrder> =
  mongoose.models.PharmacyOrder ?? mongoose.model<IPharmacyOrder>("PharmacyOrder", PharmacyOrderSchema);
