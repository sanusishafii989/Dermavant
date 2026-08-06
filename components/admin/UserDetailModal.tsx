"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { CheckCircle, XCircle, ShieldAlert, Mail, Phone, Calendar, Award, Building, FileText } from "lucide-react";

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

  if (!user) return null;

  const isPending =
    user.status === "pending_verification" ||
    user.roleDetails?.verificationStatus === "pending";

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
    <Modal open={open} onClose={onClose} title="User Profile & Access Control" className="max-w-xl">
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

        {/* Detailed Metadata Grid */}
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
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                dateStyle: "medium",
              })}
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

        {/* Credential Verification Action Banner */}
        {isPending && onVerifyChange && (
          <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/30">
            <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> Pending Credential Verification
            </h4>
            <p className="mt-1 text-xs text-amber-200/80">
              Review documents and license before verifying account access for this provider.
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
