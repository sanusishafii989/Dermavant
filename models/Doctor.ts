import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const DoctorSchema = new Schema(
  {
    doctor_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    license_number: { type: String, required: true, default: "PENDING" },
    specialization: { type: String, required: true, default: "General Practice" },
    hospital: { type: String },
    experience: { type: Number, default: 0 },
    consultation_fee: { type: Number, default: 500000 },
    rating: { type: Number, default: 0 },
    bio: { type: String },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    available_today: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

DoctorSchema.index({ latitude: 1, longitude: 1 });
DoctorSchema.index({ specialization: 1, status: 1, available_today: 1 });

export type IDoctor = InferSchemaType<typeof DoctorSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor ?? mongoose.model<IDoctor>("Doctor", DoctorSchema);
