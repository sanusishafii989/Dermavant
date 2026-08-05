"use client";

import { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Send, Stethoscope, AlertCircle } from "lucide-react";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/doctor/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setMessages([...newMessages, { role: "assistant", content: data.response }]);
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

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col space-y-4">
      {/* Header */}
      <Card className="shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan">Research assistant</p>
            <h1 className="mt-1 text-xl font-semibold text-white">Medical research chat</h1>
          </div>
        </div>
      </Card>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden p-0">
        <div ref={scrollRef} className="h-full overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-6">
              <div className="text-center">
                <Stethoscope className="mx-auto h-12 w-12 text-cyan/40" />
                <p className="mt-4 text-white/60">Ask about clinical guidelines, differential diagnoses, drug interactions, or treatment protocols.</p>
              </div>
              <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-white/70 transition-colors hover:border-cyan/40 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-cyan text-dark"
                        : "border border-white/10 bg-white/5 text-white"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => <h1 className="text-lg font-bold text-white mt-4 mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-semibold text-white mt-4 mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold text-cyan mt-3 mb-1">{children}</h3>,
                            h4: ({ children }) => <h4 className="text-sm font-medium text-cyan mt-2 mb-1">{children}</h4>,
                            p: ({ children }) => <p className="text-sm text-white/90 leading-relaxed mb-2">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-sm text-white/90">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-sm text-white/90">{children}</ol>,
                            li: ({ children }) => <li className="text-sm text-white/90">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                            em: ({ children }) => <em className="italic text-white/80">{children}</em>,
                            code: ({ children }) => <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-cyan">{children}</code>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-cyan/40 pl-3 text-sm text-white/70 italic">{children}</blockquote>,
                            hr: () => <hr className="border-white/10 my-3" />,
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
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex gap-2">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-cyan" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-cyan" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-cyan" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Card>

      {/* Error */}
      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {/* Input */}
      <div className="shrink-0">
        <Card className="p-3">
          <div className="flex items-end gap-3">
            <textarea
              className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 transition-colors focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/20"
              rows={2}
              placeholder="Ask a medical research question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="h-12 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 px-2 text-xs text-white/40">
            AI-generated responses should be verified against primary sources before clinical decision-making. Press Enter to send, Shift+Enter for new line.
          </p>
        </Card>
      </div>
    </div>
  );
}
