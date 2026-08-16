"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Send, Headphones, Plus, Clock, CheckCircle } from "lucide-react";

interface Ticket {
  _id: string;
  ticket_id?: string;
  subject: string;
  message: string;
  status: string;
  category: string;
  created_at: string;
  response?: string;
}

const CATEGORY_OPTIONS = [
  { value: "technical", label: "Technical Issue" },
  { value: "bug", label: "Bug Report" },
  { value: "feedback", label: "Feedback" },
  { value: "question", label: "General Question" },
  { value: "billing", label: "Billing/Wallet" },
  { value: "account", label: "Account Issue" },
];

const STATUS_CONFIG: Record<string, { variant: "default" | "cyan" | "gold" | "success" | "warning" | "danger"; label: string }> = {
  open: { variant: "warning", label: "Open" },
  in_progress: { variant: "cyan", label: "In Progress" },
  resolved: { variant: "success", label: "Resolved" },
  closed: { variant: "default", label: "Closed" },
};

export function SupportPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", category: "technical" });

  useEffect(() => {
    void loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support");
      const data = await res.json();
      if (data.ok) {
        setTickets(data.tickets || []);
      } else {
        setError(data.error || "Failed to load tickets");
      }
    } catch {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      setError("Subject and message are required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setShowModal(false);
        setForm({ subject: "", message: "", category: "technical" });
        void loadTickets();
      } else {
        setError(data.error || "Failed to submit ticket");
      }
    } catch {
      setError("Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Support</p>
              <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Help &amp; Support</h1>
            </div>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div>
      ) : null}

      {loading ? (
        <Card className="p-6 text-[var(--text-secondary)]">Loading tickets...</Card>
      ) : tickets.length === 0 ? (
        <Card className="p-6 text-center text-[var(--text-secondary)]">
          <Headphones className="mx-auto h-12 w-12 text-[var(--accent-cyan)]/40" />
          <p className="mt-3">No support tickets yet. Click &ldquo;New Ticket&rdquo; to report an issue or ask a question.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
            return (
              <Card key={ticket._id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)]">{ticket.subject}</h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{ticket.message}</p>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                  <span className="capitalize">{ticket.category}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(ticket.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>

                {ticket.response ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <p className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-3 w-3" /> Admin Response</p>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">{ticket.response}</p>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      {/* New ticket modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Support Ticket">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief description of your issue" required />
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Category</label>
            <select
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-[var(--text-primary)] focus:border-[var(--accent-cyan)] focus:outline-none"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Message</label>
            <textarea
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-4 py-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-cyan)] focus:outline-none"
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Describe your issue in detail..."
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Ticket"}
              {!submitting ? <Send className="ml-2 h-3 w-3" /> : null}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
