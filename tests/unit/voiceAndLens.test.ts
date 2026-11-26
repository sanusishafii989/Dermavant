import test from "node:test";
import assert from "node:assert/strict";
import {
  formatDurationMmSs,
  mergeTranscriptText,
  normalizeAudioMimeType,
  shouldAutoStopForSilence,
} from "../../lib/ai/voiceUtils";
import { clampLiteLensTilt, computeOpticalPulse } from "../../lib/liteLensMath";
import { deduplicateModels, formatGeminiUserError, isModelNotFoundError } from "../../lib/ai/gemini";

test("normalizeAudioMimeType strips codec params and maps audio types", () => {
  assert.equal(normalizeAudioMimeType("audio/webm;codecs=opus"), "audio/webm");
  assert.equal(normalizeAudioMimeType("AUDIO/X-M4A"), "audio/mp4");
  assert.equal(normalizeAudioMimeType("audio/mp4"), "audio/mp4");
  assert.equal(normalizeAudioMimeType("image/png"), null);
});

test("mergeTranscriptText preserves existing notes cleanly", () => {
  assert.equal(mergeTranscriptText("", "itchy rash on forearm"), "itchy rash on forearm");
  assert.equal(
    mergeTranscriptText("Started Monday.", "getting redder"),
    "Started Monday. getting redder"
  );
});

test("formatDurationMmSs and silence threshold helpers work deterministically", () => {
  assert.equal(formatDurationMmSs(0), "0:00");
  assert.equal(formatDurationMmSs(74), "1:14");
  assert.equal(shouldAutoStopForSilence({ hasDetectedSpeech: false, silenceElapsedMs: 5000 }), false);
  assert.equal(shouldAutoStopForSilence({ hasDetectedSpeech: true, silenceElapsedMs: 1200 }), false);
  assert.equal(shouldAutoStopForSilence({ hasDetectedSpeech: true, silenceElapsedMs: 3100 }), true);
});

test("lite lens math returns bounded tilt and finite pulse values", () => {
  const tilt = clampLiteLensTilt(10, -10);
  assert.equal(tilt.yaw, 0.34);
  assert.equal(tilt.pitch, -0.18);
  const pulse = computeOpticalPulse(1.25);
  assert.ok(Number.isFinite(pulse.lensElevation));
  assert.ok(Number.isFinite(pulse.ringRotation));
  assert.ok(Number.isFinite(pulse.reticleScale));
});

test("gemini fallback detection and user error formatter handle 404/403/429 cleanly", () => {
  assert.equal(isModelNotFoundError({ status: 404, message: "models/gemini-4-hydrogen is not found" }), true);
  assert.equal(isModelNotFoundError({ status: 429, message: "RESOURCE_EXHAUSTED" }), false);
  assert.deepEqual(
    deduplicateModels("gemini-4-hydrogen", ["gemini-4-hydrogen", "gemini-2.5-flash"]),
    ["gemini-4-hydrogen", "gemini-2.5-flash"]
  );
  const keyErr = formatGeminiUserError({ status: 400, message: "API_KEY_INVALID" });
  assert.equal(keyErr.status, 502);
  assert.ok(keyErr.message.includes("GEMINI_API_KEY"));
  const rateErr = formatGeminiUserError({ status: 429, message: "Quota exceeded" });
  assert.equal(rateErr.status, 429);
});
