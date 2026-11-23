import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  cosineSimilarity,
  getKeywordFallbackContext,
  normalizeKnowledgeBase,
} from "../../lib/ai/rag";

test("knowledge_base-1.json entries are structured and condition-tagged", () => {
  const kbPath = path.join(process.cwd(), "knowledge_base-1.json");
  const raw = JSON.parse(fs.readFileSync(kbPath, "utf8"));
  assert.equal(Array.isArray(raw), true);
  const chunks = normalizeKnowledgeBase(raw);
  assert.ok(chunks.length >= 100);
  for (const chunk of chunks) {
    assert.ok(chunk.condition.length > 0);
    assert.ok(chunk.category.length > 0);
    assert.ok(chunk.text.length > 0);
  }
});

test("cosineSimilarity handles identical, orthogonal, and mismatched vectors", () => {
  assert.equal(Math.round(cosineSimilarity([1, 0], [1, 0]) * 1000), 1000);
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([1, 0], [1, 0, 0]), 0);
});

test("getKeywordFallbackContext returns condition-attributed guidance", () => {
  const context = getKeywordFallbackContext("itchy ringworm scaly plaque between toes", 3);
  assert.ok(context.length > 0);
  assert.ok(context.includes("Tinea"));
});
