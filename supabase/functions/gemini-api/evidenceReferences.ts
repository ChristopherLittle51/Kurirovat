export class InvalidEvidenceReferenceError extends Error {
  stage?: string;

  constructor(message: string, stage?: string) {
    super(message);
    this.name = "InvalidEvidenceReferenceError";
    this.stage = stage;
  }
}

export const isEvidenceIdField = (key: string) =>
  key === "evidenceIds" || key.endsWith("EvidenceIds");

const stableEvidence = (evidence: any[]) =>
  [...evidence].sort((left, right) => {
    const leftId = String(left?.id || "");
    const rightId = String(right?.id || "");
    return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
  });

export const evidenceReferenceSet = (evidence: any[]) => {
  const refToId = new Map<string, string>();
  const idToRef = new Map<string, string>();
  const promptEvidence = stableEvidence(evidence).map((item, index) => {
    const reference = `E${index + 1}`;
    refToId.set(reference, item.id);
    idToRef.set(item.id, reference);
    return { ...item, id: reference };
  });
  return { promptEvidence, refToId, idToRef };
};

export const mapEvidenceReferences = (
  value: any,
  mapping: Map<string, string>,
  label: string,
): any => {
  if (Array.isArray(value)) {
    return value.map((item) => mapEvidenceReferences(item, mapping, label));
  }
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (isEvidenceIdField(key) && Array.isArray(item)) {
      return [key, item.map((reference) => {
        const mapped = mapping.get(String(reference));
        if (!mapped) {
          throw new InvalidEvidenceReferenceError(
            `${label} returned unknown evidence reference: ${reference}`,
          );
        }
        return mapped;
      })];
    }
    return [key, mapEvidenceReferences(item, mapping, label)];
  }));
};

// Checkpoints produced before canonicalization could contain E# aliases. Those
// aliases were assigned in the database query order used at the time, so keep
// that legacy order for the one-way checkpoint migration.
export const normalizePersistedEvidenceReferences = (
  value: any,
  evidence: any[],
): any => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizePersistedEvidenceReferences(item, evidence));
  }
  if (!value || typeof value !== "object") return value;

  const legacyRefToId = new Map(
    evidence.map((item, index) => [`E${index + 1}`, item.id]),
  );
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (isEvidenceIdField(key) && Array.isArray(item)) {
      return [key, item.map((reference) => {
        const id = String(reference);
        return legacyRefToId.get(id) || id;
      })];
    }
    return [key, normalizePersistedEvidenceReferences(item, evidence)];
  }));
};

export const evidenceForModel = (value: any, evidence: any[], label: string) =>
  mapEvidenceReferences(value, evidenceReferenceSet(evidence).idToRef, label);

export const evidenceFromModel = (value: any, evidence: any[], label: string) =>
  mapEvidenceReferences(value, evidenceReferenceSet(evidence).refToId, label);
