"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Video, Phone, MessageSquare, Mic, MicOff, VideoOff, PhoneOff, Send, ScreenShare } from "lucide-react";

interface Message {
  role: "doctor" | "patient" | "system";
  content: string;
  time: string;
}

interface ConsultationRoomProps {
  appointmentId: string;
  patientName: string;
  doctorName: string;
  type: "video" | "voice" | "chat";
  role: "doctor" | "patient";
}

const DEMO_MESSAGES: Message[] = [
  { role: "system", content: "Consultation room initialized. All communications are encrypted and HIPAA-compliant.", time: "" },
];

const DEMO_RESPONSES = [
  "Thank you for joining. Can you describe your symptoms in more detail?",
  "I see. How long have you been experiencing this?",
  "Based on what you've described, I'd recommend a physical examination. Let me note this in your records.",
  "I'm prescribing a topical treatment. You can pick it up from the e-pharmacy after our session.",
  "Please follow up in two weeks. If symptoms worsen, don't hesitate to book another appointment.",
];

export function ConsultationRoom({ appointmentId, patientName, doctorName, type, role }: ConsultationRoomProps) {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(type === "video");
  const [screenShare, setScreenShare] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [responseIndex, setResponseIndex] = useState(0);
  const [cameraError, setCameraError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!callActive) return;
    const timer = setInterval(() => setCallDuration((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [callActive]);

  // Start webcam when call starts and video is on
  useEffect(() => {
    if (callActive && videoOn && type === "video") {
      startCamera();
    }
    return () => stopCamera();
  }, [callActive, videoOn, type]);

  const startCamera = async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: micOn,
      });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError(err?.message || "Failed to access camera. Check browser permissions.");
      setVideoOn(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const toggleVideo = () => {
    if (videoOn) {
      stopCamera();
      setVideoOn(false);
    } else {
      setVideoOn(true);
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => (track.enabled = !micOn));
    }
    setMicOn(!micOn);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startCall = () => {
    setCallActive(true);
    setCallDuration(0);
    const systemMsg: Message = {
      role: "system",
      content: `${type === "video" ? "Video" : type === "voice" ? "Voice" : "Chat"} call started at ${new Date().toLocaleTimeString()}.`,
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, systemMsg]);
  };

  const endCall = () => {
    stopCamera();
    setCallActive(false);
    const systemMsg: Message = {
      role: "system",
      content: `Call ended. Duration: ${formatDuration(callDuration)}.`,
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, systemMsg]);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg: Message = {
      role,
      content: input.trim(),
      time: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");

    setTimeout(() => {
      const responseMsg: Message = {
        role: role === "doctor" ? "patient" : "doctor",
        content: DEMO_RESPONSES[responseIndex % DEMO_RESPONSES.length],
        time: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, responseMsg]);
      setResponseIndex((i) => i + 1);
    }, 1500);
  };

  const otherParty = role === "doctor" ? patientName : doctorName;
  const otherPartyLabel = role === "doctor" ? "Patient" : "Doctor";

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      {/* Header */}
      <Card className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
            {type === "video" ? <Video className="h-6 w-6" /> : type === "voice" ? <Phone className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Consultation room</p>
            <h1 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
              {otherPartyLabel}: {otherParty}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {callActive ? (
            <Badge variant="success">Live · {formatDuration(callDuration)}</Badge>
          ) : (
            <Badge variant="warning">Not connected</Badge>
          )}
          <Badge variant="cyan" className="capitalize">{type} call</Badge>
        </div>
      </Card>

      {/* Camera error */}
      {cameraError ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {cameraError}
        </div>
      ) : null}

      <div className="grid flex-1 gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Video/Voice area */}
        <Card className="flex flex-col p-0 overflow-hidden">
          {type === "chat" ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <MessageSquare className="h-16 w-16 text-[var(--accent-cyan)]/40" />
              <p className="text-[var(--text-secondary)]">Text-only consultation. Use the chat panel on the right to communicate.</p>
            </div>
          ) : (
            <>
              {/* Video grid */}
              <div className="flex flex-1 flex-col gap-2 overflow-hidden p-2">
                {/* Remote video (other party) */}
                <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-secondary)]/40 to-[var(--bg-primary)]">
                  {callActive ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent-cyan)]/20 text-3xl font-bold text-[var(--accent-cyan)]">
                        {otherParty.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-[var(--text-primary)]">{otherParty}</p>
                      {type === "voice" ? <Mic className="h-5 w-5 text-[var(--accent-cyan)]" /> : null}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg-card)]">
                        <VideoOff className="h-8 w-8 text-[var(--text-muted)]" />
                      </div>
                      <p className="text-[var(--text-muted)]">Waiting to connect…</p>
                    </div>
                  )}
                </div>

                {/* Local video (self) — real webcam */}
                <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)]/60">
                  {callActive && videoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-full ${videoOn ? "bg-[var(--accent-cyan)]/15" : "bg-[var(--bg-card)]"} text-xl font-bold ${videoOn ? "text-[var(--accent-cyan)]" : "text-[var(--text-muted)]"}`}>
                        {role === "doctor" ? "D" : "P"}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">You ({role})</p>
                      {!callActive ? <p className="text-xs text-[var(--text-muted)]">Start call to enable camera</p> : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Call controls */}
              <div className="flex shrink-0 items-center justify-center gap-3 border-t border-[var(--border)] p-4">
                {type === "video" ? (
                  <button
                    onClick={toggleVideo}
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${videoOn ? "bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-input)]" : "bg-[var(--bg-card)] text-[var(--text-muted)]"}`}
                    title={videoOn ? "Turn off camera" : "Turn on camera"}
                  >
                    {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </button>
                ) : null}

                <button
                  onClick={toggleMic}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${micOn ? "bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-input)]" : "bg-rose-500/20 text-rose-400"}`}
                  title={micOn ? "Mute" : "Unmute"}
                >
                  {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                {type === "video" ? (
                  <button
                    onClick={() => setScreenShare(!screenShare)}
                    className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${screenShare ? "bg-[var(--accent-cyan)] text-white" : "bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-input)]"}`}
                    title="Share screen"
                  >
                    <ScreenShare className="h-5 w-5" />
                  </button>
                ) : null}

                {callActive ? (
                  <button
                    onClick={endCall}
                    className="flex h-12 w-16 items-center justify-center rounded-full bg-rose-500 text-[var(--text-primary)] transition-colors hover:bg-rose-600"
                    title="End call"
                  >
                    <PhoneOff className="h-5 w-5" />
                  </button>
                ) : (
                  <Button variant="primary" onClick={startCall} className="h-12 px-6">
                    {type === "video" ? <Video className="mr-2 h-4 w-4" /> : <Phone className="mr-2 h-4 w-4" />}
                    Start {type} call
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>

        {/* Chat panel */}
        <Card className="flex flex-col p-0">
          <div className="shrink-0 border-b border-[var(--border)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Chat</p>
            <h2 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Consultation messages</h2>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {messages.map((msg, i) => {
                if (msg.role === "system") {
                  return (
                    <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 text-center text-xs text-[var(--text-muted)]">
                      {msg.content}
                    </div>
                  );
                }
                const isMe = msg.role === role;
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-[var(--accent-cyan)] text-white" : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]"}`}>
                      {!isMe ? <p className="mb-1 text-xs font-medium text-[var(--accent-cyan)]">{msg.role === "doctor" ? doctorName : patientName}</p> : null}
                      <p>{msg.content}</p>
                      {msg.time ? <p className={`mt-1 text-xs ${isMe ? "text-[var(--text-muted)]" : "text-[var(--text-muted)]"}`}>{new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 border-t border-[var(--border)] p-3">
            <div className="flex items-end gap-2">
              <textarea
                className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
                rows={1}
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button size="sm" className="h-10 px-3" onClick={sendMessage} disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
