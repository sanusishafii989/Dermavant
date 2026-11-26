export interface LiteLensSpec {
  id: string;
  index: string;
  title: string;
  detail: string;
}

export const DERMAVANT_STUDIO_CAPABILITIES: LiteLensSpec[] = [
  {
    id: "multimodal",
    index: "01",
    title: "Visual & Symptom Triage",
    detail: "Photo inspection paired with grounded dermatology guidelines via Google Gemini.",
  },
  {
    id: "dictation",
    index: "02",
    title: "Continuous Voice Dictation",
    detail: "Speak naturally until finished; Dermavant transcribes clinical symptoms into the box.",
  },
  {
    id: "research",
    index: "03",
    title: "Auditable Research Baselines",
    detail: "Open ISIC and SCIN CNN notebooks on Colab/Kaggle, kept separate from patient triage.",
  },
];

export function clampLiteLensTilt(nx: number, ny: number): { yaw: number; pitch: number } {
  const safeX = Number.isFinite(nx) ? Math.max(-1, Math.min(1, nx)) : 0;
  const safeY = Number.isFinite(ny) ? Math.max(-1, Math.min(1, ny)) : 0;
  return {
    yaw: safeX * 0.34,
    pitch: safeY * 0.18,
  };
}

export function computeOpticalPulse(timeSec: number): {
  lensElevation: number;
  ringRotation: number;
  reticleScale: number;
} {
  const safeTime = Number.isFinite(timeSec) ? timeSec : 0;
  return {
    lensElevation: 0.56 + Math.sin(safeTime * 1.4) * 0.035,
    ringRotation: safeTime * 0.42,
    reticleScale: 1 + Math.sin(safeTime * 1.8) * 0.035,
  };
}
