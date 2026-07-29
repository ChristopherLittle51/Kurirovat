import { describe, expect, it } from "vitest";
import {
  evidenceForModel,
  evidenceFromModel,
  evidenceReferenceSet,
  InvalidEvidenceReferenceError,
  normalizePersistedEvidenceReferences,
} from "./evidenceReferences";

const evidence = [
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", title: "Second" },
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", title: "First" },
];

describe("evidence reference mapping", () => {
  it("assigns deterministic aliases by canonical evidence ID", () => {
    expect(evidenceReferenceSet(evidence).promptEvidence).toEqual([
      { id: "E1", title: "First" },
      { id: "E2", title: "Second" },
    ]);
    expect(evidenceReferenceSet([...evidence].reverse()).promptEvidence).toEqual([
      { id: "E1", title: "First" },
      { id: "E2", title: "Second" },
    ]);
  });

  it("maps every evidence ID field to and from model aliases", () => {
    const canonical = {
      summaryEvidenceIds: [evidence[1].id],
      bulletPlans: [{ evidenceIds: [evidence[0].id] }],
      experiences: [{ bullets: [{ evidenceIds: [evidence[1].id, evidence[0].id] }] }],
    };

    const modelValue = evidenceForModel(canonical, evidence, "Prompt");
    expect(modelValue).toEqual({
      summaryEvidenceIds: ["E1"],
      bulletPlans: [{ evidenceIds: ["E2"] }],
      experiences: [{ bullets: [{ evidenceIds: ["E1", "E2"] }] }],
    });
    expect(evidenceFromModel(modelValue, evidence, "Response")).toEqual(canonical);
  });

  it("normalizes both legacy evidenceIds and aggregate EvidenceIds fields", () => {
    expect(normalizePersistedEvidenceReferences({
      summaryEvidenceIds: ["E1"],
      bulletPlans: [{ evidenceIds: ["E2"] }],
    }, evidence)).toEqual({
      summaryEvidenceIds: [evidence[0].id],
      bulletPlans: [{ evidenceIds: [evidence[1].id] }],
    });
  });

  it("rejects an alias that was not sent to the model without retrying it", () => {
    expect(() => evidenceFromModel(
      { bulletPlans: [{ evidenceIds: ["E99"] }] },
      evidence,
      "Content strategy",
    )).toThrow(InvalidEvidenceReferenceError);
  });
});
