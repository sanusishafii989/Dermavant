"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ScanLine } from "lucide-react";
import { clampLiteLensTilt, computeOpticalPulse } from "@/lib/liteLensMath";

function detectSoftwareGl(): boolean {
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") || probe.getContext("webgl");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function LiteDermalOrb3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pointerTiltRef = useRef({ yaw: 0, pitch: 0 });
  const dragOffsetRef = useRef({ active: false, lastX: 0, lastY: 0, yaw: 0, pitch: 0 });
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const isSoftwareGl = detectSoftwareGl();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: "high-performance",
        alpha: true,
      });
    } catch {
      setContextLost(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "pan-y";

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => setContextLost(false);
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const width = Math.max(container.clientWidth, 240);
    const height = Math.max(container.clientHeight, 200);
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 40);
    camera.position.set(2.35, 1.85, 2.75);
    camera.lookAt(0, 0.28, 0);

    const hemi = new THREE.HemisphereLight(0x99f6e4, 0x0f172a, 1.1);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.0);
    keyLight.position.set(3.2, 5.2, 3.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x14b8a6, 1.6);
    rimLight.position.set(-3.4, 2.4, -2.6);
    scene.add(rimLight);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    const rig = new THREE.Group();
    scene.add(rig);

    // 1. Machined base plinth
    const plinthGeo = new THREE.CylinderGeometry(1.06, 1.16, 0.14, 48);
    const plinthMat = new THREE.MeshPhysicalMaterial({
      color: 0x162032,
      metalness: 0.85,
      roughness: 0.28,
      clearcoat: 0.4,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = 0.07;
    rig.add(plinth);
    geometries.push(plinthGeo);
    materials.push(plinthMat);

    // 2. Dermis & Epidermis calibration discs
    const dermisGeo = new THREE.CylinderGeometry(0.84, 0.86, 0.1, 40);
    const dermisMat = new THREE.MeshPhysicalMaterial({
      color: 0xb85060,
      roughness: 0.42,
      metalness: 0.05,
      clearcoat: 0.35,
    });
    const dermis = new THREE.Mesh(dermisGeo, dermisMat);
    dermis.position.y = 0.21;
    rig.add(dermis);
    geometries.push(dermisGeo);
    materials.push(dermisMat);

    const epidermisGeo = new THREE.CylinderGeometry(0.76, 0.78, 0.08, 40);
    const epidermisMat = new THREE.MeshPhysicalMaterial({
      color: 0xc88968,
      roughness: 0.3,
      metalness: 0.03,
      clearcoat: 0.55,
    });
    const epidermis = new THREE.Mesh(epidermisGeo, epidermisMat);
    epidermis.position.y = 0.33;
    rig.add(epidermis);
    geometries.push(epidermisGeo);
    materials.push(epidermisMat);

    // 3. Target reticle ring flush on surface
    const reticleGeo = new THREE.RingGeometry(0.28, 0.32, 48);
    reticleGeo.rotateX(-Math.PI / 2);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.position.y = 0.376;
    rig.add(reticle);
    geometries.push(reticleGeo);
    materials.push(reticleMat);

    // 4. Floating optical dermatoscope ring + sapphire dome
    const scannerGroup = new THREE.Group();
    scannerGroup.position.y = 0.56;
    rig.add(scannerGroup);

    const bezelGeo = new THREE.TorusGeometry(0.68, 0.055, 18, 56);
    bezelGeo.rotateX(Math.PI / 2);
    const bezelMat = new THREE.MeshPhysicalMaterial({
      color: 0xdbe4f0,
      metalness: 0.94,
      roughness: 0.16,
      clearcoat: 0.5,
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    scannerGroup.add(bezel);
    geometries.push(bezelGeo);
    materials.push(bezelMat);

    const glowRingGeo = new THREE.TorusGeometry(0.58, 0.018, 12, 56);
    glowRingGeo.rotateX(Math.PI / 2);
    const glowRingMat = new THREE.MeshStandardMaterial({
      color: 0x14b8a6,
      emissive: 0x0d9488,
      emissiveIntensity: 1.2,
      roughness: 0.25,
      metalness: 0.4,
    });
    const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
    glowRing.position.y = -0.015;
    scannerGroup.add(glowRing);
    geometries.push(glowRingGeo);
    materials.push(glowRingMat);

    const lugGeo = new THREE.BoxGeometry(0.11, 0.09, 0.17);
    const lugMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.88,
      roughness: 0.22,
    });
    for (let i = 0; i < 4; i += 1) {
      const a = (i / 4) * Math.PI * 2;
      const lug = new THREE.Mesh(lugGeo, lugMat);
      lug.position.set(Math.cos(a) * 0.71, 0, Math.sin(a) * 0.71);
      lug.rotation.y = -a + Math.PI / 2;
      scannerGroup.add(lug);
    }
    geometries.push(lugGeo);
    materials.push(lugMat);

    const domeGeo = new THREE.SphereGeometry(0.57, 32, 18);
    domeGeo.scale(1, 0.16, 1);
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0xccfbf1,
      metalness: 0,
      roughness: 0.06,
      ior: 1.54,
      clearcoat: 1,
      transmission: isSoftwareGl ? 0 : 0.86,
      thickness: 0.4,
      attenuationColor: new THREE.Color(0x14b8a6),
      transparent: true,
      opacity: isSoftwareGl ? 0.36 : 1,
      depthWrite: false,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.renderOrder = 2;
    scannerGroup.add(dome);
    geometries.push(domeGeo);
    materials.push(domeMat);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const resize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 220);
      const h = Math.max(container.clientHeight, 180);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let simTime = 0;
    let lastTime = performance.now();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync && gl.deleteSync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (sync && state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync && gl.deleteSync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function update(dt: number) {
      if (!prefersReducedMotion) {
        simTime += dt;
      }
      const pulse = computeOpticalPulse(simTime);
      scannerGroup.position.y = pulse.lensElevation;
      scannerGroup.rotation.y = pulse.ringRotation;
      reticle.scale.setScalar(pulse.reticleScale);

      const targetYaw = simTime * 0.18 + dragOffsetRef.current.yaw + pointerTiltRef.current.yaw;
      const targetPitch = Math.max(-0.3, Math.min(0.3, dragOffsetRef.current.pitch + pointerTiltRef.current.pitch));
      rig.rotation.y += (targetYaw - rig.rotation.y) * Math.min(1, dt * 6);
      rig.rotation.x += (targetPitch - rig.rotation.x) * Math.min(1, dt * 6);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      update(dt);
      renderer.render(scene, camera);

      if (prefersReducedMotion) return;
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    update(0.016);
    renderer.render(scene, camera);
    if (!prefersReducedMotion) {
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      envTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      className="relative flex h-[220px] w-full flex-col overflow-hidden rounded-xl border border-border bg-gradient-to-br from-slate-900 via-[#0E1726] to-[#0A101D] select-none cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        dragOffsetRef.current.active = true;
        dragOffsetRef.current.lastX = e.clientX;
        dragOffsetRef.current.lastY = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
        const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
        pointerTiltRef.current = clampLiteLensTilt(nx, ny);
        if (dragOffsetRef.current.active) {
          const dx = e.clientX - dragOffsetRef.current.lastX;
          const dy = e.clientY - dragOffsetRef.current.lastY;
          dragOffsetRef.current.lastX = e.clientX;
          dragOffsetRef.current.lastY = e.clientY;
          dragOffsetRef.current.yaw += dx * 0.01;
          dragOffsetRef.current.pitch = Math.max(-0.3, Math.min(0.3, dragOffsetRef.current.pitch + dy * 0.008));
        }
      }}
      onPointerUp={(e) => {
        dragOffsetRef.current.active = false;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      }}
      onPointerCancel={() => {
        dragOffsetRef.current.active = false;
      }}
    >
      <div className="pointer-events-none flex items-center justify-between gap-2 px-3.5 pt-3 text-[11px] font-medium text-slate-300">
        <span className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap">
          <ScanLine className="h-3.5 w-3.5 shrink-0 text-teal-400" aria-hidden="true" />
          Optical Dermoscopy Lens
        </span>
        <span className="hidden shrink-0 whitespace-nowrap font-mono text-slate-400 sm:inline">Drag to inspect</span>
        <span className="shrink-0 whitespace-nowrap font-mono text-slate-400 sm:hidden">Drag</span>
      </div>

      <div ref={mountRef} className="relative flex-1" aria-label="Interactive 3D Optical Dermoscopy Lens" />

      {contextLost ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0B1220] p-4 text-center text-xs text-slate-300">
          <ScanLine className="h-6 w-6 text-teal-400" aria-hidden="true" />
          <p>Interactive 3D optical lens paused</p>
        </div>
      ) : null}
    </div>
  );
}
