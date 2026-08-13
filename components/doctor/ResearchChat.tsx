"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Send, Stethoscope, AlertCircle, Mic, MicOff, Volume2, VolumeX, Image as ImageIcon, X } from "lucide-react";
import { useVoiceChat } from "@/lib/hooks/useVoiceChat";

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

export function ResearchChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, isSpeaking, ttsEnabled, startListening, stopListening, speak, stopSpeaking, toggleTts, speechSupported, ttsSupported } = useVoiceChat({
    onTranscript: (text) => setInput(text),
  });

  // Load chat history on mount
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

    try {
      const res = await fetch("/api/doctor/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({ role: msg.role, content: msg.content })),
          image: image || undefined,
          conversationId: conversationId || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        const responseText = data.response;
        if (data.conversationId) setConversationId(data.conversationId);
        setMessages([...newMessages, { role: "assistant", content: responseText }]);
        if (ttsEnabled) speak(responseText);
      } else {
        const errMsg = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        const detMsg = typeof data.details === "string" ? data.details : JSON.stringify(data.details);
        setError(errMsg || detMsg || "Failed to get response");
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
      sendMessage();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setInput("");
      startListening();
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col space-y-4">
      {/* Header */}
      <Card className="shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)]">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-cyan)]">Research assistant</p>
              <h1 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Medical research chat</h1>
            </div>
          </div>
          {/* Voice + TTS toggles */}
          <div className="flex items-center gap-2">
            {messages.length > 0 ? (
              <button
                onClick={() => { setMessages([]); setConversationId(null); }}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]"
                title="Start new conversation"
              >
                New chat
              </button>
            ) : null}
            {speechSupported ? (
              <button
                onClick={handleMicClick}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                  isListening
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-500 animate-pulse"
                    : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]"
                }`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            ) : null}
            {ttsSupported ? (
              <button
                onClick={toggleTts}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                  ttsEnabled
                    ? "border-[var(--accent-cyan)]/40 bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)]"
                    : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                }`}
                title={ttsEnabled ? "Disable voice output" : "Enable voice output"}
              >
                {ttsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
            ) : null}
            {/* Image upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-cyan)]"
              title="Upload medical image"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
        </div>
        {isListening ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-rose-500 animate-pulse"><Mic className="h-3 w-3" /> Listening — Speak your question</p>
        ) : null}
        {isSpeaking ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-[var(--accent-cyan)]"><Volume2 className="h-3 w-3" /> AI is speaking</p>
        ) : null}
      </Card>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden p-0">
        <div ref={scrollRef} className="h-full overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6">
              <div className="text-center">
                <Stethoscope className="mx-auto h-12 w-12 text-[var(--accent-cyan)]/40" />
                <p className="mt-4 text-[var(--text-secondary)]">Ask about clinical guidelines, differential diagnoses, drug interactions, or treatment protocols.</p>
                <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><Mic className="h-3 w-3" /> Voice input</span>
                  <span className="flex items-center gap-1"><Volume2 className="h-3 w-3" /> Voice output</span>
                  <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Image upload</span>
                </p>
              </div>
              <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 text-left text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-cyan)]/40 hover:text-[var(--text-primary)]"
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
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[var(--accent-cyan)] text-white"
                      : "border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => <h1 className="text-lg font-bold text-[var(--text-primary)] mt-4 mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-semibold text-[var(--text-primary)] mt-4 mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold text-[var(--accent-cyan)] mt-3 mb-1">{children}</h3>,
                            p: ({ children }) => <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-2">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-sm text-[var(--text-primary)]">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-sm text-[var(--text-primary)]">{children}</ol>,
                            li: ({ children }) => <li className="text-sm text-[var(--text-primary)]">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>,
                            code: ({ children }) => <code className="rounded bg-[var(--bg-input)] px-1 py-0.5 text-xs text-[var(--accent-cyan)]">{children}</code>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-[var(--accent-cyan)]/40 pl-3 text-sm text-[var(--text-secondary)] italic">{children}</blockquote>,
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
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3">
                    <div className="flex gap-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-cyan)]" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-cyan)]" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-cyan)]" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Card>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {/* Image preview */}
      {selectedImage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3">
          <img src={selectedImage} alt="Selected" className="h-16 w-16 rounded-xl object-cover" />
          <span className="flex-1 text-sm text-[var(--text-secondary)]">Image ready to send</span>
          <button onClick={() => setSelectedImage(null)} className="text-[var(--text-muted)] hover:text-rose-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Input */}
      <div className="shrink-0">
        <Card className="p-3">
          <div className="flex items-end gap-3">
            <textarea
              className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--accent-cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]/20"
              rows={2}
              placeholder="Ask a medical research question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage(undefined, selectedImage || undefined)}
              disabled={loading || (!input.trim() && !selectedImage)}
              className="h-12 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 px-2 text-xs text-[var(--text-muted)]">
            AI-generated responses should be verified against primary sources. Press Enter to send, Shift+Enter for new line. Voice and image supported.
          </p>
        </Card>
      </div>
    </div>
  );
}
