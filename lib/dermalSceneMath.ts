export type ScanPreset = "overview" | "epidermis" | "exploded";

export interface ScanPresetSpec {
  id: ScanPreset;
  label: string;
  layerTitle: string;
  clinicalNote: string;
  cameraPos: [number, number, number];
  lookAtY: number;
  layerSeparation: number;
  ringHeight: number;
  ringSpeed: number;
}

export const SCAN_PRESETS: Record<ScanPreset, ScanPresetSpec> = {
  overview: {
    id: "overview",
    label: "Full Diagnostic",
    layerTitle: "Unified Dermal Stack & Optical Scanner",
    clinicalNote: "360-degree view of epidermal dome, collagen dermis, vascular base, and optical ring.",
    cameraPos: [4.2, 2.95, 5.1],
    lookAtY: 1.05,
    layerSeparation: 0.06,
    ringHeight: 2.15,
    ringSpeed: 0.45,
  },
  epidermis: {
    id: "epidermis",
    label: "Epidermal Scan",
    layerTitle: "Epidermis & Surface Pigment Focus",
    clinicalNote: "Optical sapphire lens focuses directly on surface texture, pore contours, and lesion margin.",
    cameraPos: [2.75, 3.25, 3.35],
    lookAtY: 1.48,
    layerSeparation: 0.04,
    ringHeight: 1.72,
    ringSpeed: 0.72,
  },
  exploded: {
    id: "exploded",
    label: "Exploded Strata",
    layerTitle: "Separated Anatomical Skin Strata",
    clinicalNote: "Inspects Epidermis, Reticular Dermis matrix, and Subcutaneous bed independently.",
    cameraPos: [4.85, 3.1, 5.45],
    lookAtY: 1.4,
    layerSeparation: 0.62,
    ringHeight: 2.88,
    ringSpeed: 0.35,
  },
};

export const PRESET_ORDER: ScanPreset[] = ["overview", "epidermis", "exploded"];

export function getPresetSpec(preset: ScanPreset): ScanPresetSpec {
  return SCAN_PRESETS[preset] ?? SCAN_PRESETS.overview;
}

export function clampPointerTilt(nx: number, ny: number): { yaw: number; pitch: number } {
  const safeX = Number.isFinite(nx) ? Math.max(-1, Math.min(1, nx)) : 0;
  const safeY = Number.isFinite(ny) ? Math.max(-1, Math.min(1, ny)) : 0;
  return {
    yaw: safeX * 0.32,
    pitch: safeY * 0.14,
  };
}

export function dampValue(current: number, target: number, lambda: number, dt: number): number {
  const safeDt = Math.max(0, Math.min(0.1, dt));
  return current + (target - current) * (1 - Math.exp(-lambda * safeDt));
}

export function computeOrbitPoint(
  index: number,
  total: number,
  baseRadius: number,
  timeSec: number
): { x: number; y: number; z: number; scale: number } {
  const safeTotal = Math.max(1, total);
  const angle = (index / safeTotal) * Math.PI * 2 + timeSec * (0.22 + (index % 3) * 0.06);
  const radius = baseRadius + Math.sin(index * 1.7 + timeSec * 0.7) * 0.24;
  const y = 0.75 + (index % 5) * 0.36 + Math.sin(timeSec * 1.1 + index) * 0.16;
  const scale = 0.78 + ((index * 37) % 10) * 0.045;
  return {
    x: Math.cos(angle) * radius,
    y,
    z: Math.sin(angle) * radius,
    scale,
  };
}
