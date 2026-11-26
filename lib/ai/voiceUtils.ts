export const SUPPORTED_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
] as const;

export type SupportedAudioMimeType = (typeof SUPPORTED_AUDIO_MIME_TYPES)[number];

export function normalizeAudioMimeType(rawMime: string | undefined | null): SupportedAudioMimeType | null {
  if (!rawMime || typeof rawMime !== "string") return null;
  const base = rawMime.split(";")[0].trim().toLowerCase();
  if (base === "audio/x-wav") return "audio/wav";
  if (base === "audio/x-m4a" || base === "audio/aac") return "audio/mp4";
  if ((SUPPORTED_AUDIO_MIME_TYPES as readonly string[]).includes(base)) {
    return base as SupportedAudioMimeType;
  }
  return null;
}

export function mergeTranscriptText(existingText: string, dictatedText: string): string {
  const existing = existingText.trim();
  const dictated = dictatedText.trim();
  if (!dictated) return existing;
  if (!existing) return dictated;
  const separator = /[.!?\n]$/.test(existing) ? " " : " ";
  return `${existing}${separator}${dictated}`;
}

export function formatDurationMmSs(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function shouldAutoStopForSilence(params: {
  hasDetectedSpeech: boolean;
  silenceElapsedMs: number;
  silenceThresholdMs?: number;
}): boolean {
  const threshold = params.silenceThresholdMs ?? 3000;
  return params.hasDetectedSpeech && params.silenceElapsedMs >= threshold;
}
