"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import {
  PatientConsultationRoomModal,
  type TelemedicineAppointment,
} from "./PatientConsultationRoomModal";
import {
  Calendar,
  Clock,
  Video,
  Mic,
  MessageSquare,
  Stethoscope,
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Building,
} from "lucide-react";

export interface ConsultationItem {
  _id: string;
  appointment_id?: string;
  doctor_name: string;
  doctor_specialization: string;
  doctor_hospital?: string;
  date: string;
  time: string;
  type: "video" | "voice" | "chat";
  payment_status: string;
  consultation_status: "scheduled" | "completed" | "cancelled" | "no_show";
  meeting_link?: string;
}

export function PatientConsultationClient() {
  const [appointments, setAppointments] = useState<ConsultationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeRoomAppt, setActiveRoomAppt] = useState<TelemedicineAppointment | null>(null);

  // Cancellation state
  const [cancellingAppt, setCancellingAppt] = useState<ConsultationItem | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Inspection state for completed appt notes
  const [inspectingAppt, setInspectingAppt] = useState<ConsultationItem | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (data.ok) {
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error("Failed to load consultations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancelAppointment = async () => {
    if (!cancellingAppt) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: cancellingAppt._id,
          consultation_status: "cancelled",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setCancellingAppt(null);
        await fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === "all") return true;
    return apt.consultation_status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Book Specialist Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Stethoscope className="h-7 w-7 text-accent-cyan" /> Patient Consultation Center
          </h1>
          <p className="text-sm text-secondary">
            Manage your doctor appointments, join live video consultations, and review clinical summaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAppointments}
            disabled={loading}
            className="text-accent-cyan hover:bg-accent-cyan/10"
          >
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>

          <Link href="/patient/dashboard/book-specialist">
            <Button className="bg-[var(--accent-primary)] text-white font-semibold hover:bg-[var(--accent-primary-hover)]">
              <Plus className="mr-1.5 h-4 w-4" /> Book Specialist
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <Card className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "All Consultations", value: "all" },
            { label: "Scheduled", value: "scheduled" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.value
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "bg-surface-elevated text-secondary hover:text-primary border border-border"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Appointments List */}
      {loading ? (
        <Card className="p-12 text-center text-secondary">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-accent-cyan mb-3" />
          Loading your consultations...
        </Card>
      ) : filteredAppointments.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-cyan/10 text-accent-cyan">
            <Stethoscope className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">No Consultations Found</h3>
            <p className="text-sm text-secondary max-w-md mx-auto mt-1">
              You do not have any consultations under the selected filter. Book a specialist to start your care journey.
            </p>
          </div>
          <Link href="/patient/dashboard/book-specialist" className="inline-block">
            <Button className="bg-[var(--accent-primary)] text-white font-semibold hover:bg-[var(--accent-primary-hover)]">
              <Plus className="mr-1.5 h-4 w-4" /> Book a Consultation Now
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAppointments.map((apt) => (
            <Card
              key={apt._id}
              className="flex flex-col justify-between space-y-4 border-border hover:border-cyan/40 transition-all duration-200"
            >
              {/* Doctor Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={apt.doctor_name} size="md" />
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">
                      {apt.doctor_name}
                    </h3>
                    <p className="text-xs text-accent-cyan font-medium">{apt.doctor_specialization}</p>
                    {apt.doctor_hospital && (
                      <p className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
                        <Building className="h-3 w-3" /> {apt.doctor_hospital}
                      </p>
                    )}
                  </div>
                </div>

                <Badge
                  variant={
                    apt.consultation_status === "completed"
                      ? "success"
                      : apt.consultation_status === "cancelled"
                      ? "danger"
                      : "cyan"
                  }
                >
                  {apt.consultation_status}
                </Badge>
              </div>

              {/* Date & Time Info */}
              <div className="rounded-xl border border-border bg-surface-elevated p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-primary">
                  <span className="flex items-center gap-1.5 text-secondary">
                    <Calendar className="h-3.5 w-3.5 text-accent-cyan" /> Date:
                  </span>
                  <span className="font-semibold text-primary">
                    {new Date(apt.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-primary">
                  <span className="flex items-center gap-1.5 text-secondary">
                    <Clock className="h-3.5 w-3.5 text-accent-gold" /> Time:
                  </span>
                  <span className="font-mono font-bold text-accent-gold">{apt.time}</span>
                </div>

                <div className="flex items-center justify-between text-primary">
                  <span className="flex items-center gap-1.5 text-secondary">
                    {apt.type === "video" ? (
                      <Video className="h-3.5 w-3.5 text-accent-cyan" />
                    ) : apt.type === "voice" ? (
                      <Mic className="h-3.5 w-3.5 text-accent-cyan" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5 text-accent-cyan" />
                    )}
                    Channel:
                  </span>
                  <span className="capitalize font-semibold text-accent-cyan">{apt.type} Telehealth</span>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                {apt.consultation_status === "scheduled" && (
                  <>
                    <Button
                      className="flex-1 bg-[var(--accent-primary)] text-white font-semibold hover:bg-[var(--accent-primary-hover)] text-xs py-2"
                      onClick={() => setActiveRoomAppt(apt as TelemedicineAppointment)}
                    >
                      <Video className="mr-1.5 h-3.5 w-3.5" /> Join Consultation
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCancellingAppt(apt)}
                      className="text-xs px-2.5 py-2 bg-danger-bg text-danger-text border border-danger/30 hover:opacity-90"
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {apt.consultation_status === "completed" && (
                  <Button
                    variant="ghost"
                    className="w-full text-accent-cyan hover:bg-accent-cyan/10 border border-accent-cyan/30 text-xs py-2"
                    onClick={() => setInspectingAppt(apt)}
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" /> View Clinical Notes
                  </Button>
                )}

                {apt.consultation_status === "cancelled" && (
                  <p className="w-full text-center text-xs text-muted italic py-1">
                    This consultation was cancelled.
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Telemedicine Room Modal */}
      <PatientConsultationRoomModal
        appointment={activeRoomAppt}
        open={!!activeRoomAppt}
        onClose={() => setActiveRoomAppt(null)}
      />

      {/* Cancellation Confirmation Modal */}
      <Modal
        open={!!cancellingAppt}
        onClose={() => setCancellingAppt(null)}
        title="Cancel Consultation"
      >
        <div className="space-y-4">
          <p className="text-sm text-primary">
            Are you sure you want to cancel your upcoming consultation with{" "}
            <span className="font-bold text-primary">{cancellingAppt?.doctor_name}</span> scheduled for{" "}
            <span className="font-mono text-accent-cyan">{cancellingAppt?.time}</span>?
          </p>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setCancellingAppt(null)}>
              Keep Appointment
            </Button>
            <Button
              variant="secondary"
              disabled={cancelling}
              onClick={handleCancelAppointment}
              className="bg-rose-600 hover:bg-rose-500 text-white border-none"
            >
              {cancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Completed Clinical Notes Inspector Modal */}
      <Modal
        open={!!inspectingAppt}
        onClose={() => setInspectingAppt(null)}
        title="Clinical Encounter Summary"
      >
        {inspectingAppt && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-border bg-surface-elevated p-4 space-y-2">
              <div className="flex items-center justify-between text-accent-cyan font-bold">
                <span>{inspectingAppt.doctor_name}</span>
                <Badge variant="success">Completed</Badge>
              </div>
              <p className="text-secondary">{inspectingAppt.doctor_specialization}</p>
            </div>

            <div className="rounded-xl border border-border bg-surface-elevated p-4 space-y-2">
              <p className="font-bold text-accent-gold flex items-center gap-1.5 text-sm">
                <FileText className="h-4 w-4" /> Consultation Diagnosis & Plan
              </p>
              <p className="text-primary leading-relaxed">
                Patient completed a digital telehealth consultation. Vital metrics stable. Follow care instructions and maintain prescribed medications.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setInspectingAppt(null)}>
                Close Summary
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
