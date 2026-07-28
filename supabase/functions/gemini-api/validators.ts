const metricPattern = /(?:[$£€]\s*)?\b\d+(?:[.,]\d+)*(?:\s*%|\+)?\b/g;

const makeIssue = (
  code: string,
  severity: "error" | "warning" | "info",
  section: string,
  message: string,
  experienceId = "",
  bulletIndex = -1,
) => ({
  id: `${code}-${section}-${experienceId}-${bulletIndex}`,
  code,
  severity,
  section,
  message,
  repairInstruction: message,
  experienceId,
  bulletIndex,
});

const parsedDate = (value = "") => {
  if (/present|current/i.test(value)) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return parsed;
  const year = value.match(/\b(19|20)\d{2}\b/)?.[0];
  return year ? Date.parse(`${year}-01-01`) : Number.NEGATIVE_INFINITY;
};

export const validateDraft = (profile: any, evidence: any[], draft?: any) => {
  const issues: any[] = [];
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const supportedMetrics = new Set(
    evidence
      .filter((item) => !item.disabled && !item.unavailable)
      .flatMap((item) => `${item.metric || ""} ${item.result || ""} ${item.scope || ""}`.match(metricPattern) || [])
      .map((metric) => metric.replace(/\s+/g, "").toLowerCase()),
  );
  if (!profile.fullName?.trim()) issues.push(makeIssue("missing_name", "error", "header", "Candidate name is missing."));
  if (!profile.email?.trim() && !profile.phone?.trim()) {
    issues.push(makeIssue("missing_contact", "error", "header", "Email and phone are both missing."));
  }
  if (!profile.summary?.trim()) issues.push(makeIssue("empty_summary", "warning", "summary", "Summary is empty."));
  if (!profile.skills?.length) issues.push(makeIssue("empty_skills", "warning", "skills", "Skills section is empty."));
  if (!profile.experience?.length) issues.push(makeIssue("empty_experience", "error", "experience", "Experience section is empty."));

  let previous = Number.POSITIVE_INFINITY;
  const seen = new Set<string>();
  const openerCounts = new Map<string, number>();
  for (const role of profile.experience || []) {
    const date = parsedDate(role.endDate || role.startDate);
    if (date > previous) {
      issues.push(makeIssue("chronology", "error", "experience", `${role.role} is out of reverse chronological order.`, role.id));
    }
    previous = Math.min(previous, date);
    for (const [index, bullet] of (role.description || []).entries()) {
      const draftBullet = draft?.experiences
        ?.find((item: any) => item.id === role.id)
        ?.bullets?.[index];
      const referencedEvidence = draftBullet?.evidenceIds || [];
      if (!referencedEvidence.length || referencedEvidence.some((id: string) => !evidenceById.has(id))) {
        issues.push(makeIssue("invalid_evidence_reference", "error", "experience", "Bullet does not reference valid candidate evidence.", role.id, index));
      }
      if (!draftBullet?.requirementIds?.length) {
        issues.push(makeIssue("missing_requirement_reference", "error", "experience", "Bullet does not reference a hiring requirement.", role.id, index));
      }
      const normalized = bullet.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (seen.has(normalized)) {
        issues.push(makeIssue("duplicate_bullet", "error", "experience", "Duplicate bullet content.", role.id, index));
      }
      seen.add(normalized);
      const opener = normalized.split(" ")[0] || "";
      if (opener) openerCounts.set(opener, (openerCounts.get(opener) || 0) + 1);
      if (normalized.length < 25) {
        issues.push(makeIssue("weak_bullet", "warning", "experience", "Bullet is too short or vague.", role.id, index));
      }
      if (/(.)\1{5,}|[a-z]{18,}|(?:asd|qwe|zxc){2,}/i.test(bullet)) {
        issues.push(makeIssue("suspicious_text", "error", "experience", "Bullet contains suspicious or malformed text.", role.id, index));
      }
      for (const metric of bullet.match(metricPattern) || []) {
        const normalizedMetric = metric.replace(/\s+/g, "").toLowerCase();
        const referencedMetrics = new Set(
          referencedEvidence
            .map((id: string) => evidenceById.get(id))
            .filter(Boolean)
            .flatMap((item: any) => `${item.metric || ""} ${item.result || ""} ${item.scope || ""}`.match(metricPattern) || [])
            .map((value: string) => value.replace(/\s+/g, "").toLowerCase()),
        );
        if (!/^(19|20)\d{2}$/.test(normalizedMetric)
          && (!supportedMetrics.has(normalizedMetric) || !referencedMetrics.has(normalizedMetric))) {
          issues.push(makeIssue("unsupported_metric", "error", "experience", `Metric "${metric}" is not grounded in candidate evidence.`, role.id, index));
        }
      }
    }
  }
  for (const [opener, count] of openerCounts) {
    if (count >= 3) {
      issues.push(makeIssue("repeated_opener", "warning", "experience", `The opener "${opener}" is repeated ${count} times.`));
    }
  }
  return issues;
};
