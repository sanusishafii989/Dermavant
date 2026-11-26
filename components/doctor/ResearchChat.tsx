"use client";

import { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Send,
  Stethoscope,
  AlertCircle,
  Mic,
  Square,
  Volume2,
  VolumeX,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { useVoiceChat } from "@/lib/hooks/useVoiceChat";
import { formatDurationMmSs, mergeTranscriptText } from "@/lib/ai/voiceUtils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  "Latest guidelines for managing atopic dermatitis in adults",
  "Differential diagnosis for persistent erythematous rash on hands",
  "Drug interactions between methotrexate and common NSAIDs",
  "Evidence-based treatments for melasma in darker skin types",
];

const RESEARCH_RETRY_DELAYS = [500, 1000];

async function postResearchMessage(payload: object) {
  for (let attempt = 0; attempt <= RESEARCH_RETRY_DELAYS.length; attempt += 1) {
    const response = await fetch("/api/doctor/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data: any = {};
    try {
      data = await response.json();
    } catch {
      data = { ok: false, error: "Invalid response from research service." };
    }
    const shouldRetry =
      (response.status === 502 || response.status === 503) &&
      data.retryable !== false &&
      attempt < RESEARCH_RETRY_DELAYS.length;
    if (!shouldRetry) return { response, data };
    await new Promise((resolve) => setTimeout(resolve, RESEARCH_RETRY_DELAYS[attempt]));
  }
  throw new Error("Research service did not respond");
}

export function ResearchChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const preVoiceTextRef = useRef("");

  const {
    isListening,
    isTranscribing,
    isSpeaking,
    ttsEnabled,
    recordingSeconds,
    audioLevel,
    voiceError,
    clearVoiceError,
    startListening,
    stopListening,
    cancelListening,
    speak,
    toggleTts,
    speechSupported,
    ttsSupported,
  } = useVoiceChat({
    onTranscript: (liveText) => {
      setInput(mergeTranscriptText(preVoiceTextRef.current, liveText));
    },
    onFinalTranscript: (finalText) => {
      setInput(mergeTranscriptText(preVoiceTextRef.current, finalText));
    },
  });

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch("/api/doctor/research");
        const data = await res.json();
        if (data.ok && data.conversations?.length > 0) {
          const latest = data.conversations[0];
          setConversationId(latest.id);
          setMessages(latest.messages.map((m: any) => ({ role: m.role, content: m.content })));
        }
      } catch {
        // silent — start fresh
      }
    };
    void loadHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text?: string, image?: string) => {
    const content = (text || input).trim();
    if ((!content && !image) || loading) return;

    const userMsg: ChatMessage = { role: "user", content: content || "Please analyze this image." };
    const newMessages: ChatMessage[] = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setSelectedImage(null);
    setLoading(true);
    setError("");
    clearVoiceError();

    try {
      const { data } = await postResearchMessage({
        messages: newMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        image: image || undefined,
        conversationId: conversationId || undefined,
      });

      if (data.ok) {
        const responseText = data.response;
        if (data.conversationId) setConversationId(data.conversationId);
        setMessages([...newMessages, { role: "assistant", content: responseText }]);
        if (ttsEnabled) speak(responseText);
      } else {
        const errMsg = typeof data.error === "string" ? data.error : "Failed to get response";
        setError(errMsg);
      }
    } catch {
      setError("Failed to connect to research assistant");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(undefined, selectedImage || undefined);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload a JPEG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Please choose an image that is 3 MB or smaller.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError("");
      setSelectedImage(reader.result as string);
    };
    reader.onerror = () => setError("The image could not be opened. Please choose another file.");
    reader.readAsDataURL(file);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else if (!isTranscribing) {
      preVoiceTextRef.current = input;
      clearVoiceError();
      void startListening();
    }
  };

  const meterBars = [0.45, 0.75, 1.0, 0.8, 0.5];

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-4">
      <Card className="shrink-0 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
              <Stethoscope className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-primary">AI Medical Research Assistant</h2>
              <p className="text-xs text-secondary">
                Clinical literature, dermatology guidelines &amp; multimodal visual notes
              </p>
            </div>
          </div>

          {isSpeaking ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-accent-cyan">
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              Reading aloud
            </span>
          ) : null}
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageUpload}
        className="hidden"
      />

      <Card className="flex-1 overflow-hidden p-0">
        <div ref={scrollRef} className="h-full overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6">
              <div className="text-center">
                <Stethoscope className="mx-auto h-12 w-12 text-accent-cyan/40" aria-hidden="true" />
                <p className="mt-4 text-sm text-secondary">
                  Ask about clinical guidelines, differential diagnoses, drug interactions, or treatment protocols.
                </p>
              </div>
              <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="rounded-xl border border-border bg-surface-elevated p-3 text-left text-sm text-secondary transition-colors hover:border-accent-cyan/50 hover:text-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-[var(--accent-primary)] text-white"
                        : "border border-border bg-surface-elevated text-primary"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => <h1 className="mb-2 mt-4 text-lg font-bold text-primary">{children}</h1>,
                            h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold text-primary">{children}</h2>,
                            h3: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-semibold text-accent-cyan">{children}</h3>,
                            p: ({ children }) => <p className="mb-2 text-sm leading-relaxed text-primary">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 list-inside list-disc space-y-1 text-sm text-primary">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 list-inside list-decimal space-y-1 text-sm text-primary">{children}</ol>,
                            li: ({ children }) => <li className="text-sm text-primary">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                            code: ({ children }) => <code className="rounded bg-[var(--bg-input)] px-1 py-0.5 text-xs text-accent-cyan">{children}</code>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-accent-cyan/40 pl-3 text-sm italic text-secondary">{children}</blockquote>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-border bg-surface-elevated px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-secondary">
                      <Loader2 className="h-4 w-4 animate-spin text-accent-cyan" aria-hidden="true" />
                      <span>Preparing clinical brief…</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Card>

      {voiceError || error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-rose-500/35 bg-danger-bg px-4 py-3 text-sm text-danger-text"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{voiceError || error}</span>
        </div>
      ) : null}

      {/* Unified In-Box Composer */}
      <div className="shrink-0">
        <div className="overflow-hidden rounded-2xl border border-border bg-[var(--bg-input)] transition-colors focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-teal-500/20">
          {selectedImage ? (
            <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedImage} alt="Selected" className="h-12 w-12 rounded-xl object-cover" />
              <span className="flex-1 text-xs text-secondary">Clinical image attached · up to 3 MB</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-muted hover:text-danger"
                aria-label="Remove uploaded image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {isListening || isTranscribing ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-elevated px-4 py-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {isTranscribing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-cyan" aria-hidden="true" />
                    <span className="text-xs font-medium text-primary">Transcribing speech…</span>
                  </>
                ) : (
                  <>
                    <div className="flex h-4 items-center gap-0.5" aria-hidden="true">
                      {meterBars.map((weight, idx) => {
                        const scale = Math.max(0.28, Math.min(1, audioLevel * weight + 0.25));
                        return (
                          <span
                            key={idx}
                            style={{ transform: `scaleY(${scale})` }}
                            className="h-3.5 w-1 origin-center rounded-full bg-rose-500 transition-transform duration-75"
                          />
                        );
                      })}
                    </div>
                    <span className="font-mono text-xs font-semibold tabular-nums text-rose-500">
                      {formatDurationMmSs(recordingSeconds)}
                    </span>
                    <span className="truncate text-xs text-secondary">
                      Listening — speak freely, click Done when finished
                    </span>
                  </>
                )}
              </div>

              {isListening ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={cancelListening}
                    className="rounded-lg px-2 py-1 text-xs text-secondary hover:bg-surface hover:text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={stopListening}
                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-primary)] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[var(--accent-primary-hover)]"
                  >
                    <Square className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                    Done
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <textarea
            className="block w-full resize-none border-0 bg-transparent px-4 pb-2 pt-3 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-0"
            rows={2}
            placeholder="Ask a medical research question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                aria-label="Upload clinical image"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-secondary transition-colors hover:bg-surface hover:text-accent-cyan disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Photo</span>
              </button>

              {speechSupported ? (
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={loading || isTranscribing}
                  aria-label={isListening ? "Stop voice dictation" : "Start voice dictation"}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                    isListening
                      ? "bg-rose-500/15 text-rose-500"
                      : "text-secondary hover:bg-surface hover:text-accent-cyan"
                  }`}
                >
                  {isTranscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : isListening ? (
                    <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  ) : (
                    <Mic className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">
                    {isTranscribing ? "Transcribing" : isListening ? "Stop" : "Voice"}
                  </span>
                </button>
              ) : null}

              {ttsSupported ? (
                <button
                  type="button"
                  onClick={toggleTts}
                  aria-label={ttsEnabled ? "Disable voice readout" : "Enable voice readout"}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    ttsEnabled
                      ? "bg-teal-500/15 text-accent-cyan"
                      : "text-secondary hover:bg-surface hover:text-accent-cyan"
                  }`}
                >
                  {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              ) : null}
            </div>

            <Button
              onClick={() => void sendMessage(undefined, selectedImage || undefined)}
              disabled={loading || isTranscribing || (!input.trim() && !selectedImage)}
              size="sm"
              className="whitespace-nowrap shrink-0"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <p className="mt-1.5 px-2 text-xs text-muted">
          AI-generated summaries must be verified against primary sources. Press Enter to send, Shift+Enter for new line.
        </p>
      </div>
    </div>
  );
}
