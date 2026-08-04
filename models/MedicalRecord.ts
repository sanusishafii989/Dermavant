import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const PrescriptionItemSchema = new Schema(
  {
    medication_name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String, default: "" },
  },
  { _id: false }
);

const MedicalRecordSchema = new Schema(
  {
    record_id: {
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
      index: true,
    },
    appointment_id: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      index: true,
    },
    record_type: {
      type: String,
      enum: ["consultation_note", "prescription", "lab_result", "diagnosis_summary"],
      required: true,
      default: "consultation_note",
    },
    title: { type: String, required: true },
    clinical_notes: { type: String, default: "" },
    diagnosis: [{ type: String }],
    prescriptions: [PrescriptionItemSchema],
    attachments: [{ type: String }],
    recorded_at: { type: Date, default: Date.now, index: true },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

MedicalRecordSchema.index({ patient_id: 1, recorded_at: -1 });

export type IMedicalRecord = InferSchemaType<typeof MedicalRecordSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const MedicalRecord: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord ??
  mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);
