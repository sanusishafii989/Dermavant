"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Video, Phone, MessageSquare, Calendar, Clock, DoorOpen } from "lucide-react";

interface Appointment {
  _id: string;
  appointment_id: string;
  patient_name: string;
  patient_email: string;
  doctor_name?: string;
  doctor_specialization?: string;
  doctor_hospital?: string;
  date: string;
  time: string;
  type: string;
  payment_status: string;
  consultation_status: string;
  meeting_link: string;
}

const STATUS_CONFIG: Record<string, { variant: "default" | "cyan" | "gold" | "success" | "warning" | "danger"; label: string }> = {
  scheduled: { variant: "cyan", label: "Scheduled" },
  completed: { variant: "success", label: "Completed" },
  cancelled: { variant: "danger", label: "Cancelled" },
  no_show: { variant: "warning", label: "No Show" },
};

const PAYMENT_CONFIG: Record<string, { variant: "default" | "cyan" | "gold" | "success" | "warning" | "danger"; label: string }> = {
  paid: { variant: "success", label: "Paid" },
  pending: { variant: "warning", label: "Pending" },
  failed: { variant: "danger", label: "Failed" },
  refunded: { variant: "default", label: "Refunded" },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  voice: <Phone className="h-4 w-4" />,
  chat: <MessageSquare className="h-4 w-4" />,
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-NG", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

export function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ appointment: Appointment; status: string } | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (data.ok) {
        setAppointments(data.appointments || []);
      } else {
        setError(data.error || "Failed to load appointments");
      }
    } catch {
      setError("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const updateStatus = async (appointmentId: string, status: string) => {
    setUpdatingId(appointmentId);
    try {
      const res = await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, consultation_status: status }),
      });
      const data = await res.json();
      if (data.ok) {
        setAppointments((prev) =>
          prev.map((apt) =>
            apt._id === appointmentId ? { ...apt, consultation_status: status } : apt
          )
        );
      } else {
        setError(data.error || "Failed to update appointment");
      }
    } catch {
      setError("Failed to update appointment");
    } finally {
      setUpdatingId(null);
      setConfirmAction(null);
    }
  };

  const filtered = filter === "all"
    ? appointments
    : appointments.filter((apt) => apt.consultation_status === filter);

  const counts = {
    all: appointments.length,
    scheduled: appointments.filter((a) => a.consultation_status === "scheduled").length,
    completed: appointments.filter((a) => a.consultation_status === "completed").length,
    cancelled: appointments.filter((a) => a.consultation_status === "cancelled").length,
    no_show: appointments.filter((a) => a.consultation_status === "no_show").length,
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Appointments</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Manage your consultations</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void loadAppointments()}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "scheduled", "completed", "cancelled", "no_show"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              filter === status
                ? "bg-[var(--accent-cyan)] text-white"
                : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--accent-cyan)]/40 hover:text-[var(--text-primary)]"
            }`}
          >
            {status === "all" ? "All" : STATUS_CONFIG[status]?.label || status}
            <span className="ml-2 text-xs opacity-70">{counts[status]}</span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <Card className="p-6 text-[var(--text-secondary)]">Loading appointments…</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-[var(--text-secondary)]">No appointments found.</Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((apt) => {
            const statusCfg = STATUS_CONFIG[apt.consultation_status] || STATUS_CONFIG.scheduled;
            const payCfg = PAYMENT_CONFIG[apt.payment_status] || PAYMENT_CONFIG.pending;

            return (
              <Card key={apt._id} className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                        {TYPE_ICONS[apt.type] || <Video className="h-4 w-4" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">{apt.patient_name}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{apt.patient_email}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[var(--accent-cyan)]" />
                        {formatDate(apt.date)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[var(--accent-cyan)]" />
                        {apt.time}
                      </span>
                      <span className="flex items-center gap-2 capitalize">
                        {TYPE_ICONS[apt.type]}
                        {apt.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      <Badge variant={payCfg.variant}>Payment: {payCfg.label}</Badge>
                    </div>
                  </div>

                  {/* Action buttons — only for scheduled appointments */}
                  {apt.consultation_status === "scheduled" ? (
                    <div className="flex flex-col gap-2 md:w-40">
                      <Link href={`/doctor/consultation/${apt._id}`}>
                        <Button size="sm" variant="gold" className="w-full">
                          <DoorOpen className="mr-2 h-4 w-4" />
                          Join Room
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={updatingId === apt._id}
                        onClick={() => setConfirmAction({ appointment: apt, status: "completed" })}
                      >
                        Mark Completed
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={updatingId === apt._id}
                        onClick={() => setConfirmAction({ appointment: apt, status: "no_show" })}
                      >
                        Mark No Show
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={updatingId === apt._id}
                        onClick={() => setConfirmAction({ appointment: apt, status: "cancelled" })}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation modal */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Confirm action"
      >
        {confirmAction ? (
          <div className="space-y-4">
            <p className="text-[var(--text-primary)]">
              Are you sure you want to mark the appointment with{" "}
              <span className="font-semibold text-[var(--text-primary)]">{confirmAction.appointment.patient_name}</span> on{" "}
              <span className="font-semibold text-[var(--text-primary)]">{formatDate(confirmAction.appointment.date)}</span> as{" "}
              <span className="font-semibold text-[var(--accent-cyan)]">{STATUS_CONFIG[confirmAction.status]?.label}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={updatingId === confirmAction.appointment._id}
                onClick={() => void updateStatus(confirmAction.appointment._id, confirmAction.status)}
              >
                {updatingId === confirmAction.appointment._id ? "Updating…" : "Confirm"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
