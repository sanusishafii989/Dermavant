"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MobileList, MobileListItem } from "@/components/ui/MobileList";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
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

        {/* Responsive Lists & Tables */}
        <div className="w-full">
          {/* Mobile View */}
          <div className="block md:hidden">
            {loading ? (
              <div className="py-12 text-center text-white/50">
                <RefreshCw className="mx-auto h-6 w-6 animate-spin text-cyan mb-2" />
                Loading system audit trail...
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-white/40">
                No audit log entries found for selected filter.
              </div>
            ) : (
              <MobileList>
                {logs.map((log) => (
                  <MobileListItem
                    key={log._id}
                    icon={<Calendar className="h-5 w-5" />}
                    title={log.actor?.fullName || "System"}
                    subtitle={new Date(log.createdAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}
                    status={
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
                    }
                    actions={
                      <div className="flex w-full justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleExpand(log._id)}>
                          <Terminal className="mr-1 h-3.5 w-3.5" /> {expandedId === log._id ? "Hide Details" : "Details"}
                        </Button>
                      </div>
                    }
                  />
                ))}
              </MobileList>
            )}

            {/* Mobile Expanded JSON Inspector */}
            {expandedId && (
              <div className="mt-4 rounded-xl bg-dark/95 p-4 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-cyan font-mono">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5" /> Payload Metadata
                  </span>
                </div>
                <pre className="overflow-x-auto text-[11px] font-mono text-emerald-300 leading-relaxed bg-black/60 p-3 rounded-lg border border-white/5">
                  {JSON.stringify(logs.find(l => l._id === expandedId)?.metadata || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Desktop View */}
          <Card className="hidden md:block p-0 overflow-hidden border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action Executed</TableHead>
                  <TableHead>Target Entity</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-secondary">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-accent-cyan mb-2" />
                      Loading system audit trail...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-secondary">
                      No audit log entries found for selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <Fragment key={log._id}>
                      <TableRow
                        onClick={() => toggleExpand(log._id)}
                        className="cursor-pointer"
                      >
                        <TableCell className="text-muted">
                          {expandedId === log._id ? (
                            <ChevronDown className="h-4 w-4 text-accent-cyan" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="text-secondary whitespace-nowrap font-mono text-sm">
                          {new Date(log.createdAt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </TableCell>
                        <TableCell>
                          {log.actor ? (
                            <div>
                              <span className="font-semibold text-primary block">{log.actor.fullName}</span>
                              <span className="text-[11px] text-secondary">{log.actor.email}</span>
                            </div>
                          ) : (
                            <span className="text-muted font-mono">System</span>
                          )}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell className="text-secondary">
                          {log.targetType ? (
                            <span>
                              {log.targetType}{" "}
                              {log.targetId && (
                                <span className="font-mono text-[11px] text-muted">({log.targetId.slice(-6)})</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-accent-cyan font-medium">
                          {expandedId === log._id ? "Collapse" : "Inspect Payload"}
                        </TableCell>
                      </TableRow>

                      {/* Expandable JSON Metadata Inspector */}
                      {expandedId === log._id && (
                        <TableRow className="bg-surface-elevated/50 hover:bg-surface-elevated/50">
                          <TableCell colSpan={6} className="p-4 border-t border-b border-accent-cyan/20">
                            <div className="rounded-xl bg-surface p-4 border border-border space-y-2">
                              <div className="flex items-center justify-between text-xs text-accent-cyan font-mono">
                                <span className="flex items-center gap-1.5">
                                  <Terminal className="h-3.5 w-3.5" /> Payload Metadata Inspection
                                </span>
                                <span>Log ID: {log._id}</span>
                              </div>
                              <pre className="overflow-x-auto text-[11px] font-mono text-emerald-300 leading-relaxed bg-black/60 p-3 rounded-lg border border-white/5">
                                {JSON.stringify(log.metadata || {}, null, 2)}
                              </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </PortalDashboardShell>
  );
}
