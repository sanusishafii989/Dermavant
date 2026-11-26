"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Layers, Pause, Play, RotateCcw, ScanLine } from "lucide-react";
import {
  PRESET_ORDER,
  type ScanPreset,
  clampPointerTilt,
  computeOrbitPoint,
  dampValue,
  getPresetSpec,
} from "@/lib/dermalSceneMath";
import {
  createCalibrationDialTexture,
  createRadialShadowTexture,
  createTissueLayerTexture,
} from "@/components/landing/DermalTextures";

const _dummyObj = new THREE.Object3D();
const _targetCamPos = new THREE.Vector3();
const _lookAtTarget = new THREE.Vector3(0, 1.05, 0);
const SCAN_PRESETS_INITIAL: [number, number, number] = [4.2, 2.95, 5.1];

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

function createRoundedSlabGeometry(width: number, depth: number, height: number, radius: number): THREE.ExtrudeGeometry {
  const hw = width / 2;
  const hd = depth / 2;
  const r = Math.min(radius, hw * 0.45, hd * 0.45);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.05,
    bevelSegments: 3,
    curveSegments: 16,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

export function DermavantScene3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const presetRef = useRef<ScanPreset>("overview");
  const pausedRef = useRef(false);
  const dragStateRef = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    yawOffset: 0,
    pitchOffset: 0,
  });
  const hoverTiltRef = useRef({ yaw: 0, pitch: 0 });

  const [preset, setPreset] = useState<ScanPreset>("overview");
  const [paused, setPaused] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const activeSpec = getPresetSpec(preset);

  const handlePresetChange = (next: ScanPreset) => {
    presetRef.current = next;
    setPreset(next);
  };

  const handleResetView = () => {
    dragStateRef.current.yawOffset = 0;
    dragStateRef.current.pitchOffset = 0;
    hoverTiltRef.current = { yaw: 0, pitch: 0 };
    handlePresetChange("overview");
  };

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
        alpha: false,
      });
    } catch {
      setContextLost(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A101D);
    scene.fog = new THREE.FogExp2(0x0A101D, 0.045);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(...SCAN_PRESETS_INITIAL);

    const hemiLight = new THREE.HemisphereLight(0xa5f3fc, 0x0b1220, 1.15);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.25);
    keyLight.position.set(4.5, 7.5, 4.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x14b8a6, 1.55);
    rimLight.position.set(-5.2, 3.6, -4.4);
    scene.add(rimLight);

    const goldAccentLight = new THREE.PointLight(0xffb703, 1.25, 10, 1.6);
    goldAccentLight.position.set(1.8, 3.2, 1.8);
    scene.add(goldAccentLight);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const shadowTex = createRadialShadowTexture();
    const dialTex = createCalibrationDialTexture(maxAniso);
    const epidermisTex = createTissueLayerTexture("#c58563", "#9a5d3f", "#dfaa8b", maxAniso, "epidermis");
    const dermisTex = createTissueLayerTexture("#b84b5c", "#8e2d3e", "#f4a2a8", maxAniso, "dermis");
    const subcutisTex = createTissueLayerTexture("#d48c3b", "#e8ab5e", "#9a4a18", maxAniso, "subcutis");
    textures.push(shadowTex, dialTex, epidermisTex, dermisTex, subcutisTex);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const contactGeo = new THREE.PlaneGeometry(5.6, 5.6);
    contactGeo.rotateX(-Math.PI / 2);
    const contactMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    });
    const contactMesh = new THREE.Mesh(contactGeo, contactMat);
    contactMesh.position.y = 0.01;
    rootGroup.add(contactMesh);
    geometries.push(contactGeo);
    materials.push(contactMat);

    const lathePoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(2.38, 0),
      new THREE.Vector2(2.38, 0.06),
      new THREE.Vector2(2.22, 0.14),
      new THREE.Vector2(2.02, 0.14),
      new THREE.Vector2(1.94, 0.22),
      new THREE.Vector2(0, 0.22),
    ];
    const plinthGeo = new THREE.LatheGeometry(lathePoints, 64);
    const plinthMat = new THREE.MeshPhysicalMaterial({
      color: 0x162032,
      metalness: 0.88,
      roughness: 0.26,
      clearcoat: 0.35,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.receiveShadow = true;
    plinthMesh.castShadow = !isSoftwareGl;
    rootGroup.add(plinthMesh);
    geometries.push(plinthGeo);
    materials.push(plinthMat);

    const dialGeo = new THREE.CircleGeometry(1.92, 64);
    dialGeo.rotateX(-Math.PI / 2);
    const dialMat = new THREE.MeshStandardMaterial({
      map: dialTex,
      roughness: 0.42,
      metalness: 0.35,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.position.y = 0.225;
    dialMesh.receiveShadow = true;
    rootGroup.add(dialMesh);
    geometries.push(dialGeo);
    materials.push(dialMat);

    const specimenGroup = new THREE.Group();
    rootGroup.add(specimenGroup);

    const subcutisGeo = createRoundedSlabGeometry(2.35, 2.35, 0.26, 0.34);
    const subcutisMat = new THREE.MeshPhysicalMaterial({
      map: subcutisTex,
      roughness: 0.5,
      metalness: 0.04,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
    });
    const subcutisMesh = new THREE.Mesh(subcutisGeo, subcutisMat);
    subcutisMesh.position.y = 0.26;
    subcutisMesh.castShadow = !isSoftwareGl;
    subcutisMesh.receiveShadow = true;
    specimenGroup.add(subcutisMesh);
    geometries.push(subcutisGeo);
    materials.push(subcutisMat);

    const vesselCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.92, 0.32, -0.58),
      new THREE.Vector3(-0.32, 0.34, -0.18),
      new THREE.Vector3(0.28, 0.34, 0.25),
      new THREE.Vector3(0.88, 0.32, 0.62),
    ]);
    const vesselGeo = new THREE.TubeGeometry(vesselCurve, 28, 0.028, 8, false);
    const vesselMat = new THREE.MeshStandardMaterial({
      color: 0xe63946,
      emissive: 0x6b121c,
      emissiveIntensity: 0.35,
      roughness: 0.35,
      metalness: 0.1,
    });
    const vesselMesh = new THREE.Mesh(vesselGeo, vesselMat);
    subcutisMesh.add(vesselMesh);
    geometries.push(vesselGeo);
    materials.push(vesselMat);

    const dermisGeo = createRoundedSlabGeometry(2.26, 2.26, 0.28, 0.32);
    const dermisMat = new THREE.MeshPhysicalMaterial({
      map: dermisTex,
      roughness: 0.36,
      metalness: 0.05,
      clearcoat: 0.5,
      clearcoatRoughness: 0.28,
    });
    const dermisMesh = new THREE.Mesh(dermisGeo, dermisMat);
    dermisMesh.position.y = 0.72;
    dermisMesh.castShadow = !isSoftwareGl;
    dermisMesh.receiveShadow = true;
    specimenGroup.add(dermisMesh);
    geometries.push(dermisGeo);
    materials.push(dermisMat);

    const noduleGeo = new THREE.SphereGeometry(0.038, 12, 12);
    const noduleMat = new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0x92400e,
      emissiveIntensity: 0.25,
      roughness: 0.32,
      metalness: 0.2,
    });
    const noduleInstanced = new THREE.InstancedMesh(noduleGeo, noduleMat, 24);
    for (let i = 0; i < 24; i++) {
      const col = i % 6;
      const row = Math.floor(i / 6);
      _dummyObj.position.set(-0.78 + col * 0.31, 0.33, -0.66 + row * 0.44);
      const s = 0.8 + ((i * 7) % 5) * 0.1;
      _dummyObj.scale.set(s, s * 0.7, s);
      _dummyObj.updateMatrix();
      noduleInstanced.setMatrixAt(i, _dummyObj.matrix);
    }
    noduleInstanced.instanceMatrix.needsUpdate = true;
    noduleInstanced.computeBoundingSphere();
    dermisMesh.add(noduleInstanced);
    geometries.push(noduleGeo);
    materials.push(noduleMat);

    const epidermisGeo = createRoundedSlabGeometry(2.16, 2.16, 0.2, 0.3);
    const epidermisMat = new THREE.MeshPhysicalMaterial({
      map: epidermisTex,
      roughness: 0.28,
      metalness: 0.02,
      clearcoat: 0.65,
      clearcoatRoughness: 0.22,
    });
    const epidermisMesh = new THREE.Mesh(epidermisGeo, epidermisMat);
    epidermisMesh.position.y = 1.14;
    epidermisMesh.castShadow = !isSoftwareGl;
    epidermisMesh.receiveShadow = true;
    specimenGroup.add(epidermisMesh);
    geometries.push(epidermisGeo);
    materials.push(epidermisMat);

    const lesionGeo = new THREE.SphereGeometry(0.36, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
    const lesionMat = new THREE.MeshPhysicalMaterial({
      color: 0xa65f46,
      roughness: 0.24,
      metalness: 0.05,
      clearcoat: 0.75,
    });
    const lesionMesh = new THREE.Mesh(lesionGeo, lesionMat);
    lesionMesh.position.set(0.08, 0.24, -0.04);
    lesionMesh.scale.set(1.15, 0.42, 0.96);
    epidermisMesh.add(lesionMesh);
    geometries.push(lesionGeo);
    materials.push(lesionMat);

    const targetRingGeo = new THREE.RingGeometry(0.52, 0.56, 48);
    targetRingGeo.rotateX(-Math.PI / 2);
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const targetRingMesh = new THREE.Mesh(targetRingGeo, targetRingMat);
    targetRingMesh.position.set(0.08, 0.262, -0.04);
    epidermisMesh.add(targetRingMesh);
    geometries.push(targetRingGeo);
    materials.push(targetRingMat);

    const scannerGroup = new THREE.Group();
    scannerGroup.position.y = 2.15;
    rootGroup.add(scannerGroup);

    const outerBezelGeo = new THREE.TorusGeometry(1.06, 0.085, 20, 64);
    outerBezelGeo.rotateX(Math.PI / 2);
    const titaniumMat = new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      metalness: 0.94,
      roughness: 0.16,
      anisotropy: 0.8,
      clearcoat: 0.4,
    });
    const outerBezel = new THREE.Mesh(outerBezelGeo, titaniumMat);
    outerBezel.castShadow = !isSoftwareGl;
    scannerGroup.add(outerBezel);
    geometries.push(outerBezelGeo);
    materials.push(titaniumMat);

    const innerRimGeo = new THREE.TorusGeometry(0.92, 0.028, 16, 64);
    innerRimGeo.rotateX(Math.PI / 2);
    const cyanEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x0891b2,
      emissiveIntensity: 1.4,
      roughness: 0.2,
      metalness: 0.5,
    });
    const innerRim = new THREE.Mesh(innerRimGeo, cyanEmissiveMat);
    innerRim.position.y = -0.02;
    scannerGroup.add(innerRim);
    geometries.push(innerRimGeo);
    materials.push(cyanEmissiveMat);

    const lugGeo = new THREE.BoxGeometry(0.16, 0.14, 0.26);
    const lugMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.88,
      roughness: 0.22,
    });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const lug = new THREE.Mesh(lugGeo, lugMat);
      lug.position.set(Math.cos(a) * 1.11, 0, Math.sin(a) * 1.11);
      lug.rotation.y = -a + Math.PI / 2;
      scannerGroup.add(lug);
    }
    geometries.push(lugGeo);
    materials.push(lugMat);

    const lensGeo = new THREE.SphereGeometry(0.9, 40, 24);
    lensGeo.scale(1, 0.14, 1);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      metalness: 0,
      roughness: 0.05,
      ior: 1.54,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transmission: isSoftwareGl ? 0 : 0.88,
      thickness: 0.6,
      attenuationColor: new THREE.Color(0x38bdf8),
      transparent: true,
      opacity: isSoftwareGl ? 0.34 : 1,
      depthWrite: false,
    });
    const lensMesh = new THREE.Mesh(lensGeo, lensMat);
    lensMesh.renderOrder = 2;
    scannerGroup.add(lensMesh);
    geometries.push(lensGeo);
    materials.push(lensMat);

    const coneGeo = new THREE.CylinderGeometry(0.86, 1.15, 0.92, 48, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.y = -0.48;
    coneMesh.renderOrder = 1;
    scannerGroup.add(coneMesh);
    geometries.push(coneGeo);
    materials.push(coneMat);

    const nodeCount = 18;
    const nodeGeo = new THREE.SphereGeometry(0.055, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.65,
      emissive: 0x0e7490,
      emissiveIntensity: 0.55,
    });
    const cellNodes = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);
    const nodeColorCyan = new THREE.Color(0x38bdf8);
    const nodeColorGold = new THREE.Color(0xfbbf24);
    for (let i = 0; i < nodeCount; i++) {
      cellNodes.setColorAt(i, i % 4 === 0 ? nodeColorGold : nodeColorCyan);
    }
    if (cellNodes.instanceColor) cellNodes.instanceColor.needsUpdate = true;
    cellNodes.frustumCulled = false;
    rootGroup.add(cellNodes);
    geometries.push(nodeGeo);
    materials.push(nodeMat);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let currentSep = getPresetSpec(presetRef.current).layerSeparation;
    let currentRingY = getPresetSpec(presetRef.current).ringHeight;
    let currentCamX = getPresetSpec(presetRef.current).cameraPos[0];
    let currentCamY = getPresetSpec(presetRef.current).cameraPos[1];
    let currentCamZ = getPresetSpec(presetRef.current).cameraPos[2];
    let currentLookY = getPresetSpec(presetRef.current).lookAtY;
    let spinAngle = 0.42;
    let simTime = 0;
    let lastStamp = performance.now();
    let frameId = 0;
    let disposed = false;

    const resize = () => {
      if (!container || disposed) return;
      const w = Math.max(container.clientWidth, 280);
      const h = Math.max(container.clientHeight, 280);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);
    resize();

    function updateScene(dt: number) {
      const spec = getPresetSpec(presetRef.current);

      if (!pausedRef.current && !prefersReducedMotion) {
        simTime += dt;
        spinAngle += dt * 0.24;
      }

      currentSep = dampValue(currentSep, spec.layerSeparation, 5.5, dt);
      currentRingY = dampValue(currentRingY, spec.ringHeight, 5.5, dt);
      currentCamX = dampValue(currentCamX, spec.cameraPos[0], 4.8, dt);
      currentCamY = dampValue(currentCamY, spec.cameraPos[1], 4.8, dt);
      currentCamZ = dampValue(currentCamZ, spec.cameraPos[2], 4.8, dt);
      currentLookY = dampValue(currentLookY, spec.lookAtY, 4.8, dt);

      subcutisMesh.position.y = 0.26;
      dermisMesh.position.y = 0.62 + currentSep * 0.72;
      epidermisMesh.position.y = 1.0 + currentSep * 1.45;

      const hoverBob = pausedRef.current || prefersReducedMotion ? 0 : Math.sin(simTime * 1.8) * 0.045;
      scannerGroup.position.y = currentRingY + hoverBob;
      scannerGroup.rotation.y += dt * (pausedRef.current ? 0 : spec.ringSpeed);

      const targetRotY = spinAngle + dragStateRef.current.yawOffset + hoverTiltRef.current.yaw;
      const targetRotX = THREE.MathUtils.clamp(
        dragStateRef.current.pitchOffset + hoverTiltRef.current.pitch,
        -0.36,
        0.36
      );
      rootGroup.rotation.y = dampValue(rootGroup.rotation.y, targetRotY, 7.5, dt);
      rootGroup.rotation.x = dampValue(rootGroup.rotation.x, targetRotX, 7.5, dt);

      for (let i = 0; i < nodeCount; i++) {
        const pt = computeOrbitPoint(i, nodeCount, 2.15, simTime);
        _dummyObj.position.set(pt.x, pt.y + currentSep * 0.35, pt.z);
        _dummyObj.scale.setScalar(pt.scale);
        _dummyObj.updateMatrix();
        cellNodes.setMatrixAt(i, _dummyObj.matrix);
      }
      cellNodes.instanceMatrix.needsUpdate = true;

      _targetCamPos.set(currentCamX, currentCamY, currentCamZ);
      camera.position.copy(_targetCamPos);
      _lookAtTarget.set(0, currentLookY, 0);
      camera.lookAt(_lookAtTarget);
    }

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

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastStamp) / 1000));
      lastStamp = now;

      updateScene(dt);
      renderer.render(scene, camera);

      if (prefersReducedMotion) {
        return;
      }
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    updateScene(0.016);
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
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      envTex.dispose();
      renderer.dispose();
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current.active = true;
    dragStateRef.current.lastX = e.clientX;
    dragStateRef.current.lastY = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
    hoverTiltRef.current = clampPointerTilt(nx, ny);

    if (dragStateRef.current.active) {
      const dx = e.clientX - dragStateRef.current.lastX;
      const dy = e.clientY - dragStateRef.current.lastY;
      dragStateRef.current.lastX = e.clientX;
      dragStateRef.current.lastY = e.clientY;
      dragStateRef.current.yawOffset += dx * 0.009;
      dragStateRef.current.pitchOffset = Math.max(
        -0.34,
        Math.min(0.34, dragStateRef.current.pitchOffset + dy * 0.006)
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const togglePause = () => {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
  };

  return (
    <div
      data-testid="dermavant-3d-stage"
      data-preset={preset}
      className="relative flex min-h-[460px] w-full flex-col overflow-hidden rounded-2xl border border-slate-800/80 dark:border-border bg-[#0A101D] shadow-theme-lg lg:min-h-[540px]"
    >
      <div className="pointer-events-none relative z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0D1424] px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <ScanLine className="h-4 w-4 shrink-0 text-[#2DD4BF]" aria-hidden="true" />
          <span className="truncate text-xs font-semibold text-white">
            {activeSpec.layerTitle}
          </span>
        </div>
        <span className="hidden shrink-0 text-xs font-mono text-white/65 sm:inline">
          Drag model to rotate
        </span>
      </div>

      <div
        className="relative flex-1 cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          ref={mountRef}
          className="absolute inset-0 h-full w-full"
          aria-label="Interactive 3D Dermal Layer and Optical Dermatoscope Model"
        />

        {contextLost ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0A101D] p-6 text-center">
            <Layers className="h-10 w-10 text-[#2DD4BF]" />
            <p className="text-sm font-semibold text-white">Interactive 3D Dermal View</p>
            <p className="max-w-xs text-xs text-white/70">
              Hardware 3D context paused. Explore Epidermis, Dermis, and Subcutaneous triage workflows below.
            </p>
          </div>
        ) : null}
      </div>

      <div className="relative z-10 border-t border-white/10 bg-[#0D1424] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="3D Dermal Scan Modes">
            {PRESET_ORDER.map((id) => {
              const item = getPresetSpec(id);
              const isSelected = preset === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handlePresetChange(id)}
                  className={`whitespace-nowrap shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-[#0D9488] text-white"
                      : "bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? "Resume 3D rotation" : "Pause 3D rotation"}
              className="inline-flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              <span>{paused ? "Resume" : "Pause"}</span>
            </button>
            <button
              type="button"
              onClick={handleResetView}
              aria-label="Reset 3D camera view"
              className="inline-flex whitespace-nowrap shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-white/70">{activeSpec.clinicalNote}</p>
      </div>
    </div>
  );
}
