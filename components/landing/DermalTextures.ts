import * as THREE from "three";

export function createRadialShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0, "rgba(0, 4, 12, 0.72)");
    grad.addColorStop(0.55, "rgba(0, 6, 16, 0.34)");
    grad.addColorStop(1, "rgba(0, 6, 16, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCalibrationDialTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const c = size / 2;
    ctx.fillStyle = "#061526";
    ctx.fillRect(0, 0, size, size);

    [96, 148, 198, 236].forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 2 ? "rgba(33, 158, 188, 0.55)" : "rgba(103, 232, 249, 0.22)";
      ctx.lineWidth = idx === 2 ? 2.2 : 1.2;
      ctx.stroke();
    });

    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2;
      const major = i % 6 === 0;
      const rIn = major ? 204 : 214;
      const rOut = 232;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(angle) * rIn, c + Math.sin(angle) * rIn);
      ctx.lineTo(c + Math.cos(angle) * rOut, c + Math.sin(angle) * rOut);
      ctx.strokeStyle = major ? "#FFB703" : "rgba(56, 189, 248, 0.52)";
      ctx.lineWidth = major ? 2.6 : 1.3;
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(33, 158, 188, 0.25)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(c - 190, c);
    ctx.lineTo(c + 190, c);
    ctx.moveTo(c, c - 190);
    ctx.lineTo(c, c + 190);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createTissueLayerTexture(
  baseHex: string,
  accentHex: string,
  fleckHex: string,
  maxAnisotropy: number,
  pattern: "epidermis" | "dermis" | "subcutis"
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, size, size);

    if (pattern === "epidermis") {
      for (let i = 0; i < 160; i++) {
        const x = (i * 73) % 256;
        const y = (i * 139) % 256;
        const r = 3 + (i % 5);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? accentHex : fleckHex;
        ctx.globalAlpha = 0.14;
        ctx.fill();
      }
    } else if (pattern === "dermis") {
      ctx.globalAlpha = 0.24;
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 2;
      for (let y = 8; y < size; y += 20) {
        ctx.beginPath();
        for (let x = 0; x <= size; x += 16) {
          const wy = y + Math.sin(x * 0.08 + y * 0.1) * 5;
          if (x === 0) ctx.moveTo(x, wy);
          else ctx.lineTo(x, wy);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = fleckHex;
      ctx.globalAlpha = 0.18;
      for (let x = 10; x < size; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 12, 85, x - 12, 170, x, size);
        ctx.stroke();
      }
    } else {
      for (let i = 0; i < 64; i++) {
        const x = (i * 53 + 19) % 256;
        const y = (i * 97 + 11) % 256;
        const r = 10 + (i % 10);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = accentHex;
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.strokeStyle = fleckHex;
        ctx.globalAlpha = 0.16;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = maxAnisotropy;
  return tex;
}
