import test from "node:test";
import assert from "node:assert/strict";
import {
  SCAN_PRESETS,
  PRESET_ORDER,
  getPresetSpec,
  clampPointerTilt,
  dampValue,
  computeOrbitPoint,
} from "../../lib/dermalSceneMath";

test("preset specs expose distinct separation and camera distances", () => {
  assert.deepEqual(PRESET_ORDER, ["overview", "epidermis", "exploded"]);
  const overview = getPresetSpec("overview");
  const epidermis = getPresetSpec("epidermis");
  const exploded = getPresetSpec("exploded");
  assert.ok(exploded.layerSeparation > overview.layerSeparation);
  assert.ok(epidermis.ringHeight < overview.ringHeight);
  assert.ok(exploded.ringHeight > overview.ringHeight);
  assert.equal(Object.keys(SCAN_PRESETS).length, 3);
});

test("clampPointerTilt bounds extreme inputs safely", () => {
  const maxTilt = clampPointerTilt(10, -10);
  assert.equal(maxTilt.yaw, 0.32);
  assert.equal(maxTilt.pitch, -0.14);
  const nanTilt = clampPointerTilt(Number.NaN, Number.POSITIVE_INFINITY);
  assert.equal(nanTilt.yaw, 0);
  assert.equal(nanTilt.pitch, 0);
});

test("dampValue converges smoothly without overshooting", () => {
  let v = 0;
  for (let i = 0; i < 60; i++) {
    v = dampValue(v, 1, 6, 1 / 60);
  }
  assert.ok(v > 0.99 && v <= 1);
});

test("computeOrbitPoint returns finite deterministic coordinates", () => {
  const p = computeOrbitPoint(3, 18, 2.35, 1.5);
  assert.ok(Number.isFinite(p.x));
  assert.ok(Number.isFinite(p.y));
  assert.ok(Number.isFinite(p.z));
  assert.ok(p.scale >= 0.78 && p.scale <= 1.25);
});
