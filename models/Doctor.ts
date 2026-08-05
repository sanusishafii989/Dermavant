import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const syncDoctorLocation = function (doc: any) {
  if (doc.location && Array.isArray(doc.location.coordinates) && doc.location.coordinates.length === 2) {
    doc.latitude = Number(doc.location.coordinates[1]);
    doc.longitude = Number(doc.location.coordinates[0]);
    return;
  }

  if (doc.latitude !== undefined || doc.longitude !== undefined) {
    const latitude = Number(doc.latitude ?? 0);
    const longitude = Number(doc.longitude ?? 0);
    doc.location = {
      type: "Point",
      coordinates: [longitude, latitude],
    };
  }
};

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
    address: { type: String, default: "" },
    experience: { type: Number, default: 0 },
    consultation_fee: { type: Number, default: 500000 },
    rating: { type: Number, default: 0 },
    bio: { type: String },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    available_today: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

DoctorSchema.pre("save", function () {
  syncDoctorLocation(this as any);
});

DoctorSchema.index({ location: "2dsphere" });
DoctorSchema.index({ latitude: 1, longitude: 1 });
DoctorSchema.index({ specialization: 1, status: 1, available_today: 1 });

export type IDoctor = InferSchemaType<typeof DoctorSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor ?? mongoose.model<IDoctor>("Doctor", DoctorSchema);
