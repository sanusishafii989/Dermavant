"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Send, CheckCircle, Mail, Clock, MessageSquare, AlertCircle } from "lucide-react";

export interface SupportTicketDetail {
  _id: string;
  subject: string;
  category: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  adminResponse?: string | null;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
    role: string;
  } | null;
}

interface SupportResponseModalProps {
  ticket: SupportTicketDetail | null;
  open: boolean;
  onClose: () => void;
  onRespond: (ticketId: string, status: string, responseText: string) => Promise<void>;
}

export function SupportResponseModal({
  ticket,
  open,
  onClose,
  onRespond,
}: SupportResponseModalProps) {
  const [response, setResponse] = useState("");
  const [status, setStatus] = useState<string>("resolved");
  const [submitting, setSubmitting] = useState(false);

  if (!ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim() && status !== "resolved") return;

    setSubmitting(true);
    try {
      await onRespond(ticket._id, status, response);
      setResponse("");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Support Ticket Resolution" className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Ticket Header Details */}
        <div className="rounded-xl bg-surface-elevated p-4 border border-border space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-bold text-primary">{ticket.subject}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="cyan">{ticket.category}</Badge>
              <Badge
                variant={
                  ticket.priority === "urgent" || ticket.priority === "high"
                    ? "danger"
                    : "warning"
                }
              >
                {ticket.priority} priority
              </Badge>
            </div>
          </div>
          {ticket.user && (
            <p className="text-xs text-muted flex items-center gap-1.5 pt-1">
              <Mail className="h-3.5 w-3.5 text-accent-cyan" /> Submitted by{" "}
              <span className="text-primary font-medium">{ticket.user.fullName}</span> ({ticket.user.role}) —{" "}
              {ticket.user.email}
            </p>
          )}
          <p className="text-xs text-muted flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Date: {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>

        {/* User Message Box */}
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-accent-cyan" /> User Ticket Message
          </label>
          <div className="rounded-xl bg-surface p-4 border border-border text-sm text-primary leading-relaxed whitespace-pre-wrap">
            {ticket.message}
          </div>
        </div>

        {/* Previous Admin Response if exists */}
        {ticket.adminResponse && (
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-success-text font-semibold flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Previous Admin Reply
            </label>
            <div className="rounded-xl bg-success-bg p-3.5 border border-success/20 text-sm text-success-text leading-relaxed">
              {ticket.adminResponse}
            </div>
          </div>
        )}

        {/* Response Composer */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div>
            <label className="text-xs uppercase tracking-wider text-secondary font-semibold block mb-1.5">
              Admin Official Reply
            </label>
            <textarea
              rows={4}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type resolution message or instructions for the user..."
              className="w-full rounded-xl bg-input p-3 text-sm text-primary border border-border focus:border-accent-cyan focus:outline-none focus:ring-2 focus:ring-accent-cyan/20 placeholder:text-muted resize-none"
            />
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted">Target Ticket Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl bg-input px-3 py-1.5 text-xs text-primary border border-border focus:border-accent-cyan focus:outline-none"
              >
                <option value="resolved">Resolved</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
                <option value="open">Re-Open</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="font-semibold"
                disabled={submitting || (!response.trim() && status !== "resolved")}
              >
                <Send className="mr-1.5 h-4 w-4" /> {submitting ? "Sending..." : "Submit Reply"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
