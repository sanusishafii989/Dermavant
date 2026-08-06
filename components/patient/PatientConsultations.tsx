"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Video, Phone, MessageSquare, Calendar, Clock, DoorOpen } from "lucide-react";

interface Appointment {
  _id: string;
  appointment_id: string;
  doctor_name: string;
  doctor_specialization: string;
  doctor_hospital: string;
  date: string;
  time: string;
  type: string;
  payment_status: string;
  consultation_status: string;
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
  return new Date(dateStr).toLocaleDateString("en-NG", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

export function PatientConsultations() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
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
    };
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Consultations</p>
            <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Your consultations</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">View and join your scheduled consultations with doctors.</p>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">{error}</div>
      ) : null}

      {loading ? (
        <Card className="p-6 text-[var(--text-secondary)]">Loading consultations…</Card>
      ) : appointments.length === 0 ? (
        <Card className="p-6 text-center text-[var(--text-secondary)]">
          <p>No consultations yet.</p>
          <a href="/patient/dashboard/book-specialist">
            <Button variant="primary" size="sm" className="mt-4">Book a specialist</Button>
          </a>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const statusCfg = STATUS_CONFIG[apt.consultation_status] || STATUS_CONFIG.scheduled;
            const payCfg = PAYMENT_CONFIG[apt.payment_status] || PAYMENT_CONFIG.pending;
            return (
              <Card key={apt._id} className="space-y-3">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
                        {TYPE_ICONS[apt.type] || <Video className="h-4 w-4" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">{apt.doctor_name}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{apt.doctor_specialization}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(apt.date)}</span>
                      <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {apt.time}</span>
                      <span className="flex items-center gap-2 capitalize">{TYPE_ICONS[apt.type]} {apt.type}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      <Badge variant={payCfg.variant}>Payment: {payCfg.label}</Badge>
                    </div>
                  </div>
                  {apt.consultation_status === "scheduled" && apt.payment_status === "paid" ? (
                    <Link href={`/patient/consultation/${apt._id}`}>
                      <Button variant="gold" size="sm">
                        <DoorOpen className="mr-2 h-4 w-4" />
                        Join Room
                      </Button>
                    </Link>
                  ) : apt.consultation_status === "scheduled" && apt.payment_status !== "paid" ? (
                    <Link href="/patient/dashboard/book-specialist">
                      <Button variant="primary" size="sm">Complete payment</Button>
                    </Link>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}