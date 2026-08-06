"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { adminNavLinks } from "@/lib/portal-nav";
import { Shield, RefreshCw, ChevronDown, ChevronRight, User, Terminal, Calendar } from "lucide-react";

export interface AuditLogItem {
  _id: string;
  actorRole: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  actor?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.append("action", actionFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <PortalDashboardShell title="Admin Portal" links={adminNavLinks}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-cyan" /> System Security & Audit Logs
            </h1>
            <p className="text-sm text-white/60">
              Immutable accountability logs for system actions, user verification, and admin controls
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="text-cyan hover:bg-cyan/10 self-start sm:self-auto"
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Logs
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <Card className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { label: "All Actions", value: "all" },
              { label: "User Suspensions", value: "user_suspended" },
              { label: "User Reactivations", value: "user_reactivated" },
              { label: "Credential Verifications", value: "user_verified" },
              { label: "Support Ticket Resolutions", value: "support_ticket_resolved" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActionFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  actionFilter === tab.value
                    ? "bg-cyan text-dark font-bold"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Audit Log Table */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-white/80">
              <thead className="border-b border-white/10 bg-white/5 text-xs text-white/60 uppercase tracking-wider">
                <tr>
                  <th className="w-8 px-4 py-3.5"></th>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Actor</th>
                  <th className="px-4 py-3.5">Action Executed</th>
                  <th className="px-4 py-3.5">Target Entity</th>
                  <th className="px-4 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/50">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-cyan mb-2" />
                      Loading system audit trail...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-white/40">
                      No audit log entries found for selected filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <Fragment key={log._id}>
                      <tr
                        onClick={() => toggleExpand(log._id)}
                        className="cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3.5 text-white/40">
                          {expandedId === log._id ? (
                            <ChevronDown className="h-4 w-4 text-cyan" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-white/60 whitespace-nowrap font-mono">
                          {new Date(log.createdAt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </td>
                        <td className="px-4 py-3.5">
                          {log.actor ? (
                            <div>
                              <span className="font-semibold text-white block">{log.actor.fullName}</span>
                              <span className="text-[11px] text-white/50">{log.actor.email}</span>
                            </div>
                          ) : (
                            <span className="text-white/40 font-mono">System</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant={
                              log.action.includes("suspended") || log.action.includes("rejected")
                                ? "danger"
                                : log.action.includes("verified") || log.action.includes("resolved")
                                ? "success"
                                : "cyan"
                            }
                          >
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-white/70">
                          {log.targetType ? (
                            <span>
                              {log.targetType}{" "}
                              {log.targetId && (
                                <span className="font-mono text-[11px] text-white/40">({log.targetId.slice(-6)})</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-white/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right text-cyan font-medium">
                          {expandedId === log._id ? "Collapse" : "Inspect Payload"}
                        </td>
                      </tr>

                      {/* Expandable JSON Metadata Inspector */}
                      {expandedId === log._id && (
                        <tr className="bg-dark/80">
                          <td colSpan={6} className="p-4 border-t border-b border-cyan/20">
                            <div className="rounded-xl bg-dark/95 p-4 border border-white/10 space-y-2">
                              <div className="flex items-center justify-between text-xs text-cyan font-mono">
                                <span className="flex items-center gap-1.5">
                                  <Terminal className="h-3.5 w-3.5" /> Payload Metadata Inspection
                                </span>
                                <span>Log ID: {log._id}</span>
                              </div>
                              <pre className="overflow-x-auto text-[11px] font-mono text-emerald-300 leading-relaxed bg-black/60 p-3 rounded-lg border border-white/5">
                                {JSON.stringify(log.metadata || {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PortalDashboardShell>
  );
}
