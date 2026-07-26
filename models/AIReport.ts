import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AIReportSchema = new Schema(
  {
    report_id: {
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
    symptoms_text: { type: String, required: true },
    diagnosis: [
      {
        condition: { type: String, required: true },
        confidence: { type: Number, required: true },
        reasoning: { type: String, required: true },
      },
    ],
    confidence_score: { type: Number, default: 0 },
    recommendation: { type: String, default: "" },
    follow_up_guidance: { type: String, default: "" },
    needs_immediate_professional_care: { type: Boolean, default: false },
    image_path: { type: String, default: "" },
    generated_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

AIReportSchema.index({ patient_id: 1, generated_at: -1 });

export type IAIReport = InferSchemaType<typeof AIReportSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AIReport: Model<IAIReport> =
  mongoose.models.AIReport ?? mongoose.model<IAIReport>("AIReport", AIReportSchema);
