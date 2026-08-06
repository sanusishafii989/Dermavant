"use client";

import { useEffect, useState, useCallback } from "react";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { UserDetailModal, type UserDetail } from "@/components/admin/UserDetailModal";
import { adminNavLinks } from "@/lib/portal-nav";
import { Search, ShieldAlert, UserCheck, RefreshCw, Eye, CheckCircle, XCircle } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyChange = async (userId: string, status: "verified" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: status }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PortalDashboardShell title="Admin Portal" links={adminNavLinks}>
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">User Account Management</h1>
            <p className="text-sm text-white/60">
              Manage accounts, verify credentials, and govern system access
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="text-cyan hover:bg-cyan/10 self-start sm:self-auto"
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh List
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-dark/80 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { label: "All Roles", value: "all" },
                { label: "Patients", value: "patient" },
                { label: "Doctors", value: "doctor" },
                { label: "Pharmacists", value: "partner" },
                { label: "Admins", value: "admin" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setRoleFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    roleFilter === tab.value
                      ? "bg-cyan text-dark font-bold"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg bg-dark/80 px-3 py-2 text-xs text-white border border-white/20 focus:border-cyan focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </Card>

        {/* User Accounts Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/80">
              <thead className="border-b border-white/10 bg-white/5 text-xs text-white/60 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Credentials / Info</th>
                  <th className="px-5 py-3.5">Joined Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/50">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-cyan mb-2" />
                      Loading user accounts...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/40">
                      No user accounts found matching selected criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-white/5 transition-colors">
                      {/* User Avatar + Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar src={u.profilePhoto} name={u.fullName} size="sm" />
                          <div>
                            <span className="font-semibold text-white block">{u.fullName}</span>
                            <span className="text-white/50 text-[11px]">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-3.5 capitalize">
                        <Badge
                          variant={
                            u.role === "admin"
                              ? "gold"
                              : u.role === "doctor"
                              ? "cyan"
                              : u.role === "partner"
                              ? "warning"
                              : "default"
                          }
                        >
                          {u.role === "partner" ? "Pharmacist" : u.role}
                        </Badge>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            u.status === "active"
                              ? "success"
                              : u.status === "suspended"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {u.status}
                        </Badge>
                      </td>

                      {/* Credentials Summary */}
                      <td className="px-5 py-3.5 text-white/70">
                        {u.roleDetails ? (
                          u.role === "doctor" ? (
                            <span>Lic: {u.roleDetails.license_number} ({u.roleDetails.specialization})</span>
                          ) : u.role === "partner" ? (
                            <span>{u.roleDetails.business_name} (Lic: {u.roleDetails.license})</span>
                          ) : (
                            <span>Registered Patient</span>
                          )
                        ) : (
                          <span className="text-white/40">Standard Profile</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-5 py-3.5 text-white/50">
                        {new Date(u.createdAt).toLocaleDateString("en-US", { dateStyle: "short" })}
                      </td>

                      {/* Action Controls */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(u)}
                            className="text-cyan hover:bg-cyan/10 px-2.5 py-1 text-xs"
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" /> Details
                          </Button>

                          {u.status === "pending_verification" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleVerifyChange(u._id, "verified")}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 text-xs"
                            >
                              <CheckCircle className="mr-1 h-3.5 w-3.5" /> Verify
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Interactive User Detail Modal */}
        <UserDetailModal
          user={selectedUser}
          open={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onStatusChange={handleStatusChange}
          onVerifyChange={handleVerifyChange}
        />
      </div>
    </PortalDashboardShell>
  );
}
