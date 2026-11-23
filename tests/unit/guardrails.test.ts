import test from "node:test";
import assert from "node:assert/strict";
import {
  createDermatologyResponseSchema,
  extractJsonFromText,
  isValidDermatologyResponse,
} from "../../lib/ai/guardrails";

test("createDermatologyResponseSchema includes required fields", () => {
  const schema = createDermatologyResponseSchema();
  assert.equal(schema.type, "OBJECT");
  assert.ok(Array.isArray(schema.required));
  assert.ok(schema.required.includes("clinicalSummary"));
  assert.ok(schema.required.includes("possibleConditions"));
  assert.ok(schema.required.includes("needsImmediateProfessionalCare"));
});

test("extractJsonFromText parses markdown-fenced and prefixed JSON", () => {
  const raw = `Here is the report:\n\`\`\`json\n{"clinicalSummary":"Itchy scaly plaque","possibleConditions":[{"condition":"Tinea corporis","confidence":0.6,"reasoning":"Ring-like scaly edge"}],"recommendedNextSteps":"Consult a clinician","followUpGuidance":"Seek care if spreading","confidenceScore":0.6,"needsImmediateProfessionalCare":false}\n\`\`\``;
  const parsed = extractJsonFromText(raw);
  assert.equal(isValidDermatologyResponse(parsed), true);
});

test("isValidDermatologyResponse rejects out-of-range confidence or empty conditions", () => {
  assert.equal(
    isValidDermatologyResponse({
      clinicalSummary: "Summary",
      possibleConditions: [],
      recommendedNextSteps: "Next",
      followUpGuidance: "Follow up",
      confidenceScore: 0.5,
      needsImmediateProfessionalCare: false,
    }),
    false
  );

  assert.equal(
    isValidDermatologyResponse({
      clinicalSummary: "Summary",
      possibleConditions: [{ condition: "Eczema", confidence: 1.5, reasoning: "Invalid" }],
      recommendedNextSteps: "Next",
      followUpGuidance: "Follow up",
      confidenceScore: 0.5,
      needsImmediateProfessionalCare: false,
    }),
    false
  );
});
