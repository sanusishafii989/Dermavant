"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Send,
  Shield,
  Stethoscope,
  Activity,
} from "lucide-react";

export interface TelemedicineAppointment {
  _id: string;
  doctor_name: string;
  doctor_specialization: string;
  doctor_hospital?: string;
  date: string;
  time: string;
  type: "video" | "voice" | "chat";
  consultation_status: string;
  meeting_link?: string;
}

export interface PatientConsultationRoomModalProps {
  appointment: TelemedicineAppointment | null;
  open: boolean;
  onClose: () => void;
}

export function PatientConsultationRoomModal({
  appointment,
  open,
  onClose,
}: PatientConsultationRoomModalProps) {
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "notes">("chat");
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: "Doctor",
      text: "Hello! Welcome to your digital consultation. How are you feeling today?",
      time: "10:00 AM",
    },
  ]);
  const [chatInput, setChatInput] = useState("");

  if (!appointment || !open) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      sender: "Patient",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");

    // Simulate doctor response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "Doctor",
          text: "Thank you for sharing that. Let me review your clinical history and symptoms.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1500);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-5xl bg-dark/95 border-cyan/30 p-0 overflow-hidden"
    >
      <div className="flex flex-col h-[80vh] min-h-[500px]">
        {/* Telemedicine Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-navy/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={appointment.doctor_name} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{appointment.doctor_name}</h3>
                <Badge variant="cyan" className="uppercase text-[10px]">
                  {appointment.type} Call
                </Badge>
              </div>
              <p className="text-xs text-white/60">
                {appointment.doctor_specialization} • {appointment.doctor_hospital || "Dermavant Telehealth"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Encounter
            </span>
          </div>
        </div>

        {/* Telemedicine Main Grid */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_320px] overflow-hidden">
          {/* Main Video Stream Container */}
          <div className="relative flex flex-col items-center justify-between bg-black/80 p-4">
            {/* Main Doctor Screen simulation */}
            <div className="relative flex h-full w-full items-center justify-center rounded-2xl border border-white/10 bg-dark/90 overflow-hidden shadow-2xl">
              {videoActive ? (
                <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-b from-navy/40 to-dark">
                  <div className="text-center space-y-3">
                    <Avatar name={appointment.doctor_name} size="lg" className="mx-auto border-2 border-cyan shadow-lg shadow-cyan/20 h-16 w-16" />
                    <div>
                      <p className="font-bold text-white text-lg">{appointment.doctor_name}</p>
                      <p className="text-xs text-cyan">Consultation Video Active</p>
                    </div>
                  </div>

                  {/* Patient Self Video Inset Preview */}
                  <div className="absolute bottom-4 right-4 h-28 w-40 rounded-xl border border-cyan/40 bg-black/80 shadow-xl overflow-hidden flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-white/70">You (Patient Feed)</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-white/50 space-y-2">
                  <VideoOff className="h-12 w-12 text-white/30" />
                  <p className="text-sm">Video Feed Turned Off</p>
                </div>
              )}

              {/* Status Overlay */}
              <div className="absolute top-4 left-4 rounded-lg bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs text-white/80 font-mono border border-white/10 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-cyan" /> Secure Encrypted Channel
              </div>
            </div>

            {/* Media Controls Toolbar */}
            <div className="mt-4 flex items-center justify-center gap-4 rounded-2xl border border-white/10 bg-navy/90 px-6 py-3 backdrop-blur-md shadow-lg">
              <button
                onClick={() => setMicActive(!micActive)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                  micActive
                    ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                    : "border-rose-500/40 bg-rose-500/20 text-rose-300"
                }`}
                title={micActive ? "Mute Microphone" : "Unmute Microphone"}
              >
                {micActive ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>

              <button
                onClick={() => setVideoActive(!videoActive)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
                  videoActive
                    ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                    : "border-rose-500/40 bg-rose-500/20 text-rose-300"
                }`}
                title={videoActive ? "Turn Off Camera" : "Turn On Camera"}
              >
                {videoActive ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>

              <Button
                variant="secondary"
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-white border-none shadow-lg shadow-rose-600/30"
              >
                <PhoneOff className="h-4 w-4" /> End Call
              </Button>
            </div>
          </div>

          {/* Right Side Chat & Clinical Notes Sidebar */}
          <div className="flex flex-col border-l border-white/10 bg-dark/95">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all border-b-2 ${
                  activeTab === "chat"
                    ? "border-cyan text-cyan bg-white/5"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <MessageSquare className="h-4 w-4" /> Consultation Chat
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-all border-b-2 ${
                  activeTab === "notes"
                    ? "border-cyan text-cyan bg-white/5"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <FileText className="h-4 w-4" /> Clinical Summary
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "chat" ? (
              <div className="flex flex-1 flex-col justify-between p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${
                        msg.sender === "Patient" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.sender === "Patient"
                            ? "bg-cyan text-dark font-medium rounded-br-none"
                            : "bg-white/10 text-white rounded-bl-none border border-white/10"
                        }`}
                      >
                        <p className="font-bold text-[10px] opacity-75 mb-1">{msg.sender}</p>
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-white/40 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="mt-3 flex gap-2 pt-2 border-t border-white/10">
                  <input
                    type="text"
                    placeholder="Type message to doctor..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/40 focus:border-cyan focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan text-dark font-bold hover:bg-cyan/90 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-2">
                  <p className="font-bold text-cyan flex items-center gap-1.5">
                    <Stethoscope className="h-4 w-4" /> Doctor Information
                  </p>
                  <p className="text-white font-medium">{appointment.doctor_name}</p>
                  <p className="text-white/60">{appointment.doctor_specialization}</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-2">
                  <p className="font-bold text-gold flex items-center gap-1.5">
                    <Shield className="h-4 w-4" /> Encounter Metadata
                  </p>
                  <p className="text-white/70">Scheduled Time: <span className="text-white font-mono">{appointment.time}</span></p>
                  <p className="text-white/70">Consultation ID: <span className="text-white font-mono">{appointment._id.slice(-8)}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
