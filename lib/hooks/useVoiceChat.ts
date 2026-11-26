"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeAudioMimeType, shouldAutoStopForSilence } from "@/lib/ai/voiceUtils";

interface UseVoiceChatOptions {
  onTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onAIResponse?: (text: string) => void;
  autoStopSilenceMs?: number;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Could not read recorded audio."));
    reader.readAsDataURL(blob);
  });
}

export function useVoiceChat({
  onTranscript,
  onFinalTranscript,
  onAIResponse,
  autoStopSilenceMs = 3000,
}: UseVoiceChatOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [livePreview, setLivePreview] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);

  const onTranscriptRef = useRef(onTranscript);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onAIResponseRef = useRef(onAIResponse);
  const ttsEnabledRef = useRef(false);

  onTranscriptRef.current = onTranscript;
  onFinalTranscriptRef.current = onFinalTranscript;
  onAIResponseRef.current = onAIResponse;

  // MediaRecorder state refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vadRafRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const cancelledRef = useRef(false);
  const stoppingRef = useRef(false);

  // Fallback Web Speech API refs
  const recognitionRef = useRef<any>(null);
  const keepSpeechAliveRef = useRef(false);
  const speechSegmentsRef = useRef<string[]>([]);
  const speechLatestInterimRef = useRef("");

  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasMediaRecorder =
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== "undefined";
    const hasSpeechRecognition = Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
    setSpeechSupported(hasMediaRecorder || hasSpeechRecognition);
    setTtsSupported(Boolean(window.speechSynthesis));
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const cleanupMediaResources = useCallback(() => {
    window.clearInterval(timerRef.current);
    window.cancelAnimationFrame(vadRafRef.current);
    setAudioLevel(0);

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  const cleanupSpeechRecognition = useCallback(() => {
    keepSpeechAliveRef.current = false;
    window.clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      cleanupMediaResources();
      cleanupSpeechRecognition();
    };
  }, [cleanupMediaResources, cleanupSpeechRecognition]);

  const emitFinalTranscript = useCallback((text: string) => {
    const clean = text.trim();
    if (!clean) return;
    if (onFinalTranscriptRef.current) {
      onFinalTranscriptRef.current(clean);
    } else {
      onTranscriptRef.current?.(clean);
    }
  }, []);

  const startSpeechRecognitionFallback = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice recording is not supported in this browser.");
      return;
    }

    cleanupSpeechRecognition();
    speechSegmentsRef.current = [];
    speechLatestInterimRef.current = "";
    keepSpeechAliveRef.current = true;
    setRecordingSeconds(0);
    setLivePreview("");
    setVoiceError(null);

    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 500);

    const launchRecognizer = () => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let finalizedSinceRestart = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i += 1) {
          const piece = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) {
            finalizedSinceRestart += piece + " ";
          } else {
            interim += piece;
          }
        }
        const fullPreview = [
          ...speechSegmentsRef.current,
          finalizedSinceRestart.trim(),
          interim.trim(),
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        speechLatestInterimRef.current = [finalizedSinceRestart.trim(), interim.trim()]
          .filter(Boolean)
          .join(" ")
          .trim();
        setLivePreview(fullPreview);
        onTranscriptRef.current?.(fullPreview);
      };

      recognition.onend = () => {
        if (speechLatestInterimRef.current) {
          speechSegmentsRef.current.push(speechLatestInterimRef.current);
          speechLatestInterimRef.current = "";
        }
        if (keepSpeechAliveRef.current) {
          try {
            launchRecognizer();
            return;
          } catch {
            // fall through to stop cleanly
          }
        }
        window.clearInterval(timerRef.current);
        setIsListening(false);
        const combined = speechSegmentsRef.current.join(" ").trim();
        if (!cancelledRef.current && combined) {
          emitFinalTranscript(combined);
        }
        setLivePreview("");
      };

      recognition.onerror = (event: any) => {
        if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
          keepSpeechAliveRef.current = false;
          setVoiceError("Microphone access was blocked. Enable microphone permission in your browser.");
          window.clearInterval(timerRef.current);
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch {
        keepSpeechAliveRef.current = false;
        window.clearInterval(timerRef.current);
        setIsListening(false);
      }
    };

    launchRecognizer();
  }, [cleanupSpeechRecognition, emitFinalTranscript]);

  const stopListening = useCallback(() => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        cleanupMediaResources();
        setIsListening(false);
        stoppingRef.current = false;
      }
      return;
    }

    if (recognitionRef.current) {
      keepSpeechAliveRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch {
        setIsListening(false);
      }
    }
    stoppingRef.current = false;
  }, [cleanupMediaResources]);

  const cancelListening = useCallback(() => {
    cancelledRef.current = true;
    setLivePreview("");
    setVoiceError(null);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    cleanupMediaResources();
    cleanupSpeechRecognition();
    setIsListening(false);
    setIsTranscribing(false);
    stoppingRef.current = false;
  }, [cleanupMediaResources, cleanupSpeechRecognition]);

  const startListening = useCallback(async () => {
    if (isListening || isTranscribing) return;
    cancelledRef.current = false;
    stoppingRef.current = false;
    setVoiceError(null);
    setLivePreview("");
    setRecordingSeconds(0);

    const canRecordMedia =
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== "undefined";

    if (!canRecordMedia) {
      startSpeechRecognitionFallback();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (cancelledRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      mediaStreamRef.current = stream;
      chunksRef.current = [];

      const candidateTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ];
      const chosenMime =
        candidateTypes.find((type) => typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(type)) ||
        "";

      const recorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const wasCancelled = cancelledRef.current;
        const mimeType = recorder.mimeType || chosenMime || "audio/webm";
        const recordedBlobs = [...chunksRef.current];
        chunksRef.current = [];
        cleanupMediaResources();
        setIsListening(false);
        stoppingRef.current = false;

        if (wasCancelled || recordedBlobs.length === 0) {
          return;
        }

        const audioBlob = new Blob(recordedBlobs, { type: mimeType });
        if (audioBlob.size < 400) {
          setVoiceError("No speech was captured. Speak closer to the microphone and try again.");
          return;
        }

        setIsTranscribing(true);
        try {
          const dataUrl = await blobToBase64(audioBlob);
          const cleanMime = normalizeAudioMimeType(mimeType) || "audio/webm";
          const res = await fetch("/api/ai/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: dataUrl, mimeType: cleanMime }),
          });
          let data: any = null;
          try {
            data = await res.json();
          } catch {
            data = null;
          }
          if (!res.ok || !data?.ok) {
            throw new Error(data?.error || "Could not transcribe speech. Please type or try again.");
          }
          const text = String(data.transcript || "").trim();
          if (!text) {
            setVoiceError("No clear speech detected in that recording. Please try again.");
          } else {
            emitFinalTranscript(text);
          }
        } catch (err) {
          setVoiceError(
            err instanceof Error ? err.message : "Speech transcription failed. Please try again."
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      // Voice activity + elapsed timer so brief pauses never cut off speech,
      // and once the user genuinely finishes speaking (~3s silence after speech), it auto-transcribes.
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        const buffer = new Float32Array(analyser.fftSize);

        let hasDetectedSpeech = false;
        let silenceStartedAt: number | null = null;
        let speechFrames = 0;

        const monitorVolume = () => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
          analyser.getFloatTimeDomainData(buffer);
          let sumSq = 0;
          for (let i = 0; i < buffer.length; i += 1) {
            sumSq += buffer[i] * buffer[i];
          }
          const rms = Math.sqrt(sumSq / buffer.length);
          const normalizedLevel = Math.min(1, rms * 14);
          setAudioLevel(normalizedLevel);

          const now = Date.now();
          if (rms > 0.016) {
            speechFrames += 1;
            if (speechFrames >= 4) {
              hasDetectedSpeech = true;
            }
            silenceStartedAt = null;
          } else if (hasDetectedSpeech) {
            if (silenceStartedAt === null) {
              silenceStartedAt = now;
            } else if (
              shouldAutoStopForSilence({
                hasDetectedSpeech,
                silenceElapsedMs: now - silenceStartedAt,
                silenceThresholdMs: autoStopSilenceMs,
              })
            ) {
              stopListening();
              return;
            }
          }

          vadRafRef.current = window.requestAnimationFrame(monitorVolume);
        };
        vadRafRef.current = window.requestAnimationFrame(monitorVolume);
      }

      const startStamp = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - startStamp) / 1000));
      }, 500);

      recorder.start(250);
      setIsListening(true);
    } catch (err: any) {
      cleanupMediaResources();
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setVoiceError("Microphone permission was denied. Allow microphone access in your browser settings.");
        return;
      }
      startSpeechRecognitionFallback();
    }
  }, [
    autoStopSilenceMs,
    cleanupMediaResources,
    emitFinalTranscript,
    isListening,
    isTranscribing,
    startSpeechRecognitionFallback,
    stopListening,
  ]);

  const speak = useCallback((text: string) => {
    if (!ttsEnabledRef.current) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const cleanText = text
      .replace(/[#*_`>-]/g, "")
      .replace(/\n+/g, ". ")
      .replace(/\*\*/g, "")
      .trim();

    if (!cleanText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
    onAIResponseRef.current?.(text);
  }, []);

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
    isTranscribing,
    isSpeaking,
    voiceEnabled,
    ttsEnabled,
    recordingSeconds,
    audioLevel,
    voiceError,
    clearVoiceError: () => setVoiceError(null),
    livePreview,
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
    toggleVoice,
    toggleTts,
    speechSupported,
    ttsSupported,
  };
}
