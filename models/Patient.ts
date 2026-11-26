import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const EmergencyContactSchema = new Schema(
  {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
  },
  { _id: false }
);

const PatientSchema = new Schema(
  {
    patient_id: {
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
    },
    blood_group: { type: String },
    allergies: [{ type: String }],
    height: { type: Number },
    weight: { type: Number },
    medical_history: { type: String },
    chronic_conditions: [{ type: String }],
    current_medications: [{ type: String }],
    past_surgeries: [{ type: String }],
    blood_pressure: { type: String, default: "" },
    primary_physician: { type: String, default: "" },
    emergency_contact: { type: EmergencyContactSchema },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);


export type IPatient = InferSchemaType<typeof PatientSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Patient: Model<IPatient> =
  mongoose.models.Patient ?? mongoose.model<IPatient>("Patient", PatientSchema);
