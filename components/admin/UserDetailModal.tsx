"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { CheckCircle, XCircle, ShieldAlert, Mail, Phone, Calendar, Award, Building, FileText, MapPin, Briefcase, GraduationCap } from "lucide-react";

export interface UserDetail {
  _id: string;
  clerkId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: "patient" | "doctor" | "partner" | "admin";
  status: "active" | "suspended" | "pending_verification";
  profilePhoto?: string;
  createdAt: string;
  roleDetails?: any;
}

interface KYCDetail {
  _id: string;
  status: string;
  role: string;
  license_number?: string;
  specialization?: string;
  hospital?: string;
  years_of_experience?: number;
  medical_school?: string;
  business_name?: string;
  business_registration_number?: string;
  pharmacist_license?: string;
  phone_number?: string;
  address?: string;
  id_document_url?: string;
  license_document_url?: string;
  submitted_at?: string;
  reviewed_at?: string;
  review_notes?: string;
  user?: { _id: string; fullName: string; email: string; clerkId: string };
}

interface UserDetailModalProps {
  user: UserDetail | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (userId: string, newStatus: string) => Promise<void>;
  onVerifyChange?: (userId: string, status: "verified" | "rejected") => Promise<void>;
}

export function UserDetailModal({
  user,
  open,
  onClose,
  onStatusChange,
  onVerifyChange,
}: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [kyc, setKyc] = useState<KYCDetail | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (open && user && (user.role === "doctor" || user.role === "partner")) {
      void fetchKYC(user._id);
    } else {
      setKyc(null);
      setReviewNotes("");
    }
  }, [open, user]);

  const fetchKYC = async (userId: string) => {
    setKycLoading(true);
    try {
      const res = await fetch("/api/admin/kyc");
      const data = await res.json();
      if (data.ok) {
        const found = data.applications?.find((app: KYCDetail) => app.user?._id === userId);
        setKyc(found || null);
        if (found?.review_notes) setReviewNotes(found.review_notes);
      }
    } catch {
      setKyc(null);
    } finally {
      setKycLoading(false);
    }
  };

  const handleKYCAction = async (status: "approved" | "rejected") => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          status,
          notes: reviewNotes,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchKYC(user._id);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const isPending =
    user.status === "pending_verification" ||
    user.roleDetails?.verificationStatus === "pending" ||
    kyc?.status === "pending";

  const canReviewKYC = (user.role === "doctor" || user.role === "partner") && kyc;

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="User Profile & Access Control" className="max-w-2xl">
      <div className="space-y-6">
        {/* User Header */}
        <div className="flex items-center gap-4 rounded-xl bg-white/5 p-4 border border-white/10">
          <Avatar src={user.profilePhoto} name={user.fullName} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-bold text-white truncate">{user.fullName}</h3>
              <Badge variant={user.role === "admin" ? "gold" : user.role === "doctor" ? "cyan" : "default"}>
                {user.role}
              </Badge>
              <Badge
                variant={
                  user.status === "active"
                    ? "success"
                    : user.status === "suspended"
                    ? "danger"
                    : "warning"
                }
              >
                {user.status}
              </Badge>
              {kyc && (
                <Badge variant={kyc.status === "approved" ? "success" : kyc.status === "rejected" ? "danger" : "warning"}>
                  KYC: {kyc.status}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-white/60 truncate flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> {user.email}
            </p>
            {user.phone && (
              <p className="mt-0.5 text-sm text-white/60 truncate flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" /> {user.phone}
              </p>
            )}
          </div>
        </div>

        {/* Basic Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-white/5 p-3 border border-white/5">
            <span className="text-xs text-white/50 block">Account ID</span>
            <span className="font-mono text-white/80 text-xs truncate block">{user._id}</span>
          </div>
          <div className="rounded-lg bg-white/5 p-3 border border-white/5">
            <span className="text-xs text-white/50 block">Clerk Auth ID</span>
            <span className="font-mono text-white/80 text-xs truncate block">{user.clerkId}</span>
          </div>
          <div className="col-span-2 rounded-lg bg-white/5 p-3 border border-white/5 flex items-center justify-between">
            <span className="text-xs text-white/50 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Joined Date
            </span>
            <span className="text-white text-xs">
              {new Date(user.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
            </span>
          </div>
        </div>

        {/* Role Specific Details */}
        {user.roleDetails && (
          <div className="rounded-xl bg-cyan/5 p-4 border border-cyan/20 space-y-2">
            <h4 className="text-xs uppercase font-semibold text-cyan tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4" /> Role Credentials & Info
            </h4>

            {user.role === "doctor" && (
              <div className="grid grid-cols-2 gap-2 text-sm text-white/80 pt-1">
                <div>
                  <span className="text-xs text-white/50 block">License Number</span>
                  <span className="font-medium text-white">{user.roleDetails.license_number || "N/A"}</span>
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Specialization</span>
                  <span className="font-medium text-white">{user.roleDetails.specialization}</span>
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Hospital</span>
                  <span className="font-medium text-white">{user.roleDetails.hospital || "Independent"}</span>
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Verification</span>
                  <Badge variant={user.roleDetails.verificationStatus === "verified" ? "success" : "warning"}>
                    {user.roleDetails.verificationStatus}
                  </Badge>
                </div>
              </div>
            )}

            {user.role === "partner" && (
              <div className="grid grid-cols-2 gap-2 text-sm text-white/80 pt-1">
                <div>
                  <span className="text-xs text-white/50 block">Business Name</span>
                  <span className="font-medium text-white">{user.roleDetails.business_name}</span>
                </div>
                <div>
                  <span className="text-xs text-white/50 block">License</span>
                  <span className="font-medium text-white">{user.roleDetails.license}</span>
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Owner Name</span>
                  <span className="font-medium text-white">{user.roleDetails.owner_name}</span>
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Verification</span>
                  <Badge variant={user.roleDetails.verificationStatus === "verified" ? "success" : "warning"}>
                    {user.roleDetails.verificationStatus}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        {/* KYC Application Details (Doctors & Pharmacists only) */}
        {(user.role === "doctor" || user.role === "partner") && (
          <div className="rounded-xl bg-white/5 p-4 border border-white/10 space-y-3">
            <h4 className="text-xs uppercase font-semibold text-cyan tracking-wider flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> KYC Application Details
            </h4>

            {kycLoading ? (
              <p className="text-sm text-white/50">Loading KYC data...</p>
            ) : kyc ? (
              <div className="space-y-3">
                {/* Doctor-specific KYC fields */}
                {kyc.role === "doctor" && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {kyc.license_number && (
                      <div className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 text-white/40" />
                        <div>
                          <span className="text-xs text-white/50 block">Medical License</span>
                          <span className="font-medium text-white">{kyc.license_number}</span>
                        </div>
                      </div>
                    )}
                    {kyc.specialization && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-white/40" />
                        <div>
                          <span className="text-xs text-white/50 block">Specialization</span>
                          <span className="font-medium text-white">{kyc.specialization}</span>
                        </div>
                      </div>
                    )}
                    {kyc.hospital && (
                      <div className="flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-white/40" />
                        <div>
                          <span className="text-xs text-white/50 block">Hospital</span>
                          <span className="font-medium text-white">{kyc.hospital}</span>
                        </div>
                      </div>
                    )}
                    {kyc.medical_school && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 text-white/40" />
                        <div>
                          <span className="text-xs text-white/50 block">Medical School</span>
                          <span className="font-medium text-white">{kyc.medical_school}</span>
                        </div>
                      </div>
                    )}
                    {kyc.years_of_experience !== undefined && (
                      <div>
                        <span className="text-xs text-white/50 block">Years of Experience</span>
                        <span className="font-medium text-white">{kyc.years_of_experience}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Pharmacy-specific KYC fields */}
                {kyc.role === "partner" && (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {kyc.business_name && (
                      <div className="flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-white/40" />
                        <div>
                          <span className="text-xs text-white/50 block">Business Name</span>
                          <span className="font-medium text-white">{kyc.business_name}</span>
                        </div>
                      </div>
                    )}
                    {kyc.business_registration_number && (
                      <div>
                        <span className="text-xs text-white/50 block">CAC Registration No.</span>
                        <span className="font-medium text-white">{kyc.business_registration_number}</span>
                      </div>
                    )}
                    {kyc.pharmacist_license && (
                      <div className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 text-white/40" />
                        <div>
                          <span className="text-xs text-white/50 block">Pharmacist License</span>
                          <span className="font-medium text-white">{kyc.pharmacist_license}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Shared KYC fields */}
                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-white/5">
                  {kyc.phone_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-white/40" />
                      <div>
                        <span className="text-xs text-white/50 block">Phone</span>
                        <span className="font-medium text-white">{kyc.phone_number}</span>
                      </div>
                    </div>
                  )}
                  {kyc.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-white/40" />
                      <div>
                        <span className="text-xs text-white/50 block">Address</span>
                        <span className="font-medium text-white">{kyc.address}</span>
                      </div>
                    </div>
                  )}
                  {kyc.submitted_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-white/40" />
                      <div>
                        <span className="text-xs text-white/50 block">Submitted</span>
                        <span className="font-medium text-white">
                          {new Date(kyc.submitted_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {kyc.review_notes && (
                  <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-sm text-amber-200/80">
                    <span className="text-xs text-amber-300 font-medium block mb-1">Previous Review Notes</span>
                    {kyc.review_notes}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/40">No KYC application submitted yet.</p>
            )}
          </div>
        )}

        {/* KYC Review Action Banner (Doctors & Pharmacists only) */}
        {canReviewKYC && kyc.status === "pending" && (
          <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/30">
            <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> KYC Review Required
            </h4>
            <p className="mt-1 text-xs text-amber-200/80">
              Review the credentials above before approving. You can add notes below.
            </p>
            <input
              type="text"
              placeholder="Review notes (optional)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="mt-3 w-full rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
            />
            <div className="mt-3 flex gap-3">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1"
                disabled={loading}
                onClick={() => handleKYCAction("approved")}
              >
                <CheckCircle className="mr-1.5 h-4 w-4" /> Approve KYC
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="border-red-500/40 text-red-300 hover:bg-red-500/20 flex-1"
                disabled={loading}
                onClick={() => handleKYCAction("rejected")}
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Reject KYC
              </Button>
            </div>
          </div>
        )}

        {/* Legacy Verify button (for users without KYC application) */}
        {isPending && onVerifyChange && !canReviewKYC && (
          <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/30">
            <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Pending Credential Verification
            </h4>
            <p className="mt-1 text-xs text-amber-200/80">
              No KYC application on file. Verify based on role profile status.
            </p>
            <div className="mt-3 flex gap-3">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1"
                disabled={loading}
                onClick={() => handleAction(() => onVerifyChange(user._id, "verified"))}
              >
                <CheckCircle className="mr-1.5 h-4 w-4" /> Approve & Verify
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="border-red-500/40 text-red-300 hover:bg-red-500/20 flex-1"
                disabled={loading}
                onClick={() => handleAction(() => onVerifyChange(user._id, "rejected"))}
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Reject License
              </Button>
            </div>
          </div>
        )}

        {/* Account Status Control Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          {user.status === "active" ? (
            <Button
              variant="secondary"
              size="sm"
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
              disabled={loading}
              onClick={() => handleAction(() => onStatusChange(user._id, "suspended"))}
            >
              <XCircle className="mr-1.5 h-4 w-4" /> Suspend User Account
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
              disabled={loading}
              onClick={() => handleAction(() => onStatusChange(user._id, "active"))}
            >
              <CheckCircle className="mr-1.5 h-4 w-4" /> Reactivate Account
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
