"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DoctorCard } from "@/components/patient/DoctorCard";

type DoctorSummary = {
  id: string;
  doctorId: string;
  specialization: string;
  consultation_fee: number;
  rating: number;
  hospital: string;
  experience: number;
  bio: string;
  available_today: boolean;
  user: {
    fullName: string;
    email: string;
    imageUrl?: string;
  } | null;
};

export function BookingWizard({ patientName }: { patientName: string }) {
  const [specialization, setSpecialization] = useState("all");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoading(true);
      const query = specialization && specialization !== "all" ? `?specialization=${encodeURIComponent(specialization)}` : "";

      try {
        const response = await fetch(`/api/doctors${query}`, { cache: "no-store" });
        const contentType = response.headers.get("content-type") || "";

        if (response.redirected || !response.ok || !contentType.includes("application/json")) {
          throw new Error("Session expired. Please reload the page.");
        }

        const payload = await response.json();

        if (!payload.ok) {
          setFeedback(payload.error || "Unable to load doctors");
          setDoctors([]);
          setSpecializations([]);
          return;
        }

        setDoctors(payload.doctors || []);
        setSpecializations(payload.specializations || []);
      } catch (error: any) {
        setFeedback(error?.message || "Unable to load doctors");
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, [specialization]);

  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  const filteredDoctors = useMemo(() => {
    if (specialization === "all") return doctors;
    return doctors.filter((doctor) => doctor.specialization.toLowerCase() === specialization.toLowerCase());
  }, [doctors, specialization]);

  const selectedDoctor = filteredDoctors.find((doctor) => doctor.id === selectedDoctorId) || null;

  async function handleConfirmBooking() {
    if (!selectedDoctor) {
      setFeedback("Please choose a doctor first.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const appointmentResponse = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          date: selectedDate,
          time: selectedTime,
          type: "video",
        }),
      });

      const appointmentContentType = appointmentResponse.headers.get("content-type") || "";
      if (appointmentResponse.redirected || !appointmentResponse.ok || !appointmentContentType.includes("application/json")) {
        throw new Error("Session expired. Please reload the page.");
      }

      const appointmentPayload = await appointmentResponse.json();
      if (!appointmentPayload.ok) {
        throw new Error(appointmentPayload.details || appointmentPayload.error || "Booking failed");
      }

      const paymentResponse = await fetch("/api/payment/paystack/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId: appointmentPayload.appointmentId,
          amount: selectedDoctor.consultation_fee,
          callbackUrl: `${window.location.origin}/patient/dashboard/payment/success`,
        }),
      });

      const paymentContentType = paymentResponse.headers.get("content-type") || "";
      if (paymentResponse.redirected || !paymentResponse.ok || !paymentContentType.includes("application/json")) {
        throw new Error("Unable to start payment. Please try again.");
      }

      const paymentPayload = await paymentResponse.json();
      if (!paymentPayload.ok) {
        throw new Error(paymentPayload.details || paymentPayload.error || "Payment initialization failed");
      }

      setAppointmentId(appointmentPayload.appointmentId || null);
      window.location.assign(paymentPayload.authorization_url);
    } catch (error: any) {
      setFeedback(error?.message || "Booking failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-5xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan">Booking flow</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Select a specialist</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
            <div>
              <label className="mb-2 block text-sm text-white/80">Specialty</label>
              <select
                value={specialization}
                onChange={(event) => setSpecialization(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan"
              >
                <option value="all">All specialties</option>
                {specializations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/80">Visit time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(event) => setSelectedTime(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              selected={selectedDoctorId === doctor.id}
              onSelect={(doctorId) => setSelectedDoctorId(doctorId)}
            />
          ))}
        </div>

        {isLoading ? <p className="mt-4 text-sm text-white/70">Loading specialist directory…</p> : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Selected appointment</p>
            <div className="mt-3 space-y-3 text-sm text-white/70">
              <p>Doctor: {selectedDoctor?.user?.fullName || "No doctor selected"}</p>
              <p>Specialization: {selectedDoctor?.specialization || "—"}</p>
              <p>Preferred date: {selectedDate}</p>
              <p>Preferred time: {selectedTime}</p>
              <p>Payment status: pending</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="mb-2 block text-sm text-white/80">Choose date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />

            <div className="mt-4">
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                onClick={handleConfirmBooking}
                disabled={isSubmitting || !selectedDoctor}
              >
                {isSubmitting ? "Confirming…" : "Confirm booking"}
              </Button>
            </div>
          </div>
        </div>

        {feedback ? (
          <div className="mt-4 rounded-2xl border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm text-white">
            {feedback}
          </div>
        ) : null}

        {appointmentId ? (
          <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-white">
            Appointment created successfully. MongoDB appointment record stored with payment status pending.
          </div>
        ) : null}
      </Card>
    </div>
  );
}
