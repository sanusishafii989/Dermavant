import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, default: "" },
    role: {
      type: String,
      required: true,
      enum: ["patient", "doctor", "partner", "admin"],
    },
    profilePhoto: { type: String },
    gender: { type: String },
    dateOfBirth: { type: Date },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    status: {
      type: String,
      enum: ["active", "suspended", "pending_verification"],
      default: "pending_verification",
    },
  },
  { timestamps: true }
);

export type IUser = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
