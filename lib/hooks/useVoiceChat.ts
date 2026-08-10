"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceChatOptions {
  onTranscript?: (text: string) => void;
  onAIResponse?: (text: string) => void;
}

export function useVoiceChat({ onTranscript, onAIResponse }: UseVoiceChatOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const ttsEnabledRef = useRef(false);

  // Keep ref in sync with state so speak() always reads current value
  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        transcriptRef.current = transcript;
        onTranscript?.(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcriptRef.current.trim()) {
          onTranscript?.(transcriptRef.current.trim());
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  // Load voices early (Chrome needs this)
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    transcriptRef.current = "";
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // already started
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // already stopped
    }
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    // Read from ref, not state — avoids stale closure
    if (!ttsEnabledRef.current) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Strip markdown for speech
    const cleanText = text
      .replace(/[#*_`>-]/g, "")
      .replace(/\n+/g, ". ")
      .replace(/\*\*/g, "")
      .trim();

    if (!cleanText) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a good English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) || voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Small delay to ensure cancel completes
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);

    onAIResponse?.(text);
  }, [onAIResponse]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      if (prev) {
        stopListening();
        stopSpeaking();
      }
      return !prev;
    });
  }, [stopListening, stopSpeaking]);

  const toggleTts = useCallback(() => {
    setTtsEnabled((prev) => {
      if (prev) stopSpeaking();
      return !prev;
    });
  }, [stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    voiceEnabled,
    ttsEnabled,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleVoice,
    toggleTts,
    speechSupported: typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
    ttsSupported: typeof window !== "undefined" && !!window.speechSynthesis,
  };
}
