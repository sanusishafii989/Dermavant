export type MedicalRecordCategory =
  | "ai_triage"
  | "consultation"
  | "prescription"
  | "vitals_update";

export interface PrescriptionDetail {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface MedicalHistoryItem {
  id: string;
  category: MedicalRecordCategory;
  title: string;
  date: string;
  doctorName?: string;
  doctorSpecialization?: string;
  symptoms?: string;
  diagnosis?: Array<{ condition: string; confidence: number; reasoning?: string }> | string[];
  recommendation?: string;
  clinicalNotes?: string;
  prescriptions?: PrescriptionDetail[];
  confidenceScore?: number;
  consultationType?: "video" | "voice" | "chat";
  status?: string;
  attachments?: string[];
}

export interface PatientVitalsSummary {
  bloodGroup?: string;
  allergies: string[];
  height?: number;
  weight?: number;
  bloodPressure?: string;
  chronicConditions: string[];
  currentMedications: string[];
  pastSurgeries: string[];
  emergencyContact?: {
    name: string;
    phone: string;
  };
}

export type WalletTransactionType =
  | "top_up"
  | "consultation_fee"
  | "pharmacy_purchase"
  | "refund"
  | "bonus";

export interface WalletTransactionItem {
  id: string;
  type: WalletTransactionType;
  amount: number;
  direction: "credit" | "debit";
  currency: string;
  status: "completed" | "pending" | "failed";
  reference: string;
  description: string;
  createdAt: string;
}

export interface WalletSummary {
  balance: number;
  currency: string;
  transactions: WalletTransactionItem[];
}
