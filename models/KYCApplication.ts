import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const KYCApplicationSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["doctor", "partner"],
      required: true,
    },
    // Doctor fields
    license_number: { type: String, default: "" },
    specialization: { type: String, default: "" },
    hospital: { type: String, default: "" },
    years_of_experience: { type: Number, default: 0 },
    medical_school: { type: String, default: "" },
    // Pharmacy fields
    business_name: { type: String, default: "" },
    business_registration_number: { type: String, default: "" },
    pharmacist_license: { type: String, default: "" },
    // Shared
    id_document_url: { type: String, default: "" },
    license_document_url: { type: String, default: "" },
    phone_number: { type: String, default: "" },
    address: { type: String, default: "" },
    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    reviewed_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    review_notes: { type: String, default: "" },
    submitted_at: { type: Date, default: Date.now },
    reviewed_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export type IKYCApplication = InferSchemaType<typeof KYCApplicationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const KYCApplication: Model<IKYCApplication> =
  mongoose.models.KYCApplication ??
  mongoose.model<IKYCApplication>("KYCApplication", KYCApplicationSchema);
