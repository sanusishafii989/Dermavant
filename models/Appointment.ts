import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AppointmentSchema = new Schema(
  {
    appointment_id: {
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
    doctor_id: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    time: { type: String, required: true },
    type: {
      type: String,
      enum: ["video", "voice", "chat"],
      default: "video",
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    consultation_status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no_show"],
      default: "scheduled",
    },
    meeting_link: { type: String, default: "" },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

AppointmentSchema.index({ patient_id: 1, date: 1 });
AppointmentSchema.index({ doctor_id: 1, date: 1 });

export type IAppointment = InferSchemaType<typeof AppointmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ??
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);
