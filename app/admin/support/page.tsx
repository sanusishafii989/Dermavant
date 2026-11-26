"use client";

import { useEffect, useState, useCallback } from "react";
import { PortalDashboardShell } from "@/components/layout/PortalDashboardShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SupportResponseModal, type SupportTicketDetail } from "@/components/admin/SupportResponseModal";
import { adminNavLinks } from "@/lib/portal-nav";
import { Headphones, RefreshCw, MessageSquare, CheckCircle, Clock, Filter, Mail } from "lucide-react";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicketDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketDetail | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const res = await fetch(`/api/admin/support?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleRespond = async (ticketId: string, status: string, responseText: string) => {
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminResponse: responseText }),
      });
      const data = await res.json();
      if (data.ok) {
        await fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PortalDashboardShell title="Admin Portal" links={adminNavLinks}>
      <div className="space-y-6">
        <PageHeader 
          title="User Support Queue"
          description="Manage inbound support requests, technical issues, and user resolution"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTickets}
              disabled={loading}
              className="text-accent-cyan hover:bg-accent-cyan/10"
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Inbox
            </Button>
          }
        />

        {/* Filter Controls Bar */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { label: "All Tickets", value: "all" },
                { label: "Open Queue", value: "open" },
                { label: "In Progress", value: "in_progress" },
                { label: "Resolved", value: "resolved" },
                { label: "Closed", value: "closed" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === tab.value
                      ? "bg-[var(--accent-primary)] text-white font-semibold"
                      : "bg-surface-elevated text-secondary hover:text-primary border border-border"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl bg-input px-3 py-1.5 text-xs text-primary border border-border focus:border-accent-cyan focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="billing">Billing & Wallet</option>
                <option value="technical">Technical Issue</option>
                <option value="clinical">Clinical Consultation</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Support Tickets Queue List */}
        <div className="space-y-3">
          {loading ? (
            <Card className="py-12 text-center text-muted">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-accent-cyan mb-2" />
              Loading support tickets...
            </Card>
          ) : tickets.length === 0 ? (
            <Card className="py-12 text-center text-muted">
              <MessageSquare className="mx-auto h-8 w-8 text-accent-cyan/40 mb-2" />
              No support tickets found matching the selected filters.
            </Card>
          ) : (
            tickets.map((t) => (
              <Card
                key={t._id}
                hover
                onClick={() => setSelectedTicket(t)}
                className="cursor-pointer transition-all hover:border-accent-cyan/40 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-primary hover:text-accent-cyan transition-colors">
                        {t.subject}
                      </h3>
                      <Badge variant="cyan">{t.category}</Badge>
                      <Badge
                        variant={
                          t.priority === "urgent" || t.priority === "high"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {t.priority} priority
                      </Badge>
                    </div>
                    {t.user && (
                      <p className="text-xs text-muted flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-accent-cyan" /> {t.user.fullName} ({t.user.role}) —{" "}
                        <span className="text-muted">{t.user.email}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        t.status === "resolved"
                          ? "success"
                          : t.status === "in_progress"
                          ? "warning"
                          : t.status === "open"
                          ? "cyan"
                          : "default"
                      }
                    >
                      {t.status}
                    </Badge>
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(t.createdAt).toLocaleDateString("en-US", {
                        dateStyle: "short",
                      })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-secondary line-clamp-2 bg-surface-elevated p-3 rounded-lg border border-border">
                  {t.message}
                </p>

                {t.adminResponse && (
                  <div className="text-xs text-success-text flex items-center gap-1.5 pt-1">
                    <CheckCircle className="h-3.5 w-3.5 text-success" /> Replied by Admin:{" "}
                    <span className="truncate italic text-secondary">{t.adminResponse}</span>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Support Ticket Response Modal */}
        <SupportResponseModal
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onRespond={handleRespond}
        />
      </div>
    </PortalDashboardShell>
  );
}
