import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models";
import mongoose from "mongoose";

export interface LogAuditParams {
  actorId: string | mongoose.Types.ObjectId;
  actorRole: string;
  action: string;
  targetType?: string;
  targetId?: string | mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
}

export async function logAuditAction(params: LogAuditParams): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({
      actorId:
        typeof params.actorId === "string"
          ? new mongoose.Types.ObjectId(params.actorId)
          : params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId
        ? typeof params.targetId === "string"
          ? new mongoose.Types.ObjectId(params.targetId)
          : params.targetId
        : undefined,
      metadata: params.metadata || {},
    });
  } catch (error) {
    console.error("[AUDIT LOG ERROR]", error);
  }
}
