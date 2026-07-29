export const PROMPT_VERSION = "tailoring-v2.0.0";
export const SCHEMA_VERSION = "tailoring-v2.0.0";

const json = (value: unknown) => JSON.stringify(value, null, 2);

export const jobAnalysisPrompt = (job: unknown) => `
<goal>
Turn this job description into a recruiter-grade hiring brief for grounded resume tailoring.
</goal>
<job>${json(job)}</job>
<success>
- Prioritize the real hiring outcomes, not every noun in the posting.
- Give each requirement a stable semantic ID.
- Separate must-have, important, and nice-to-have requirements.
- Describe the proof a recruiter would expect and the risk created when it is missing.
- Support any role type; do not default to engineering or leadership.
</success>
`;

export const evidenceMatchingPrompt = (args: {
  jobAnalysis: unknown;
  profile: unknown;
  evidence: unknown;
}) => `
<goal>
Map every prioritized job requirement to reusable candidate evidence and ask only high-value unanswered questions.
</goal>
<job_analysis>${json(args.jobAnalysis)}</job_analysis>
<candidate_profile>${json(args.profile)}</candidate_profile>
<candidate_evidence>${json(args.evidence)}</candidate_evidence>
<constraints>
- Never invent facts, metrics, scope, tools, titles, responsibilities, or leadership.
- Use only the opaque evidence references (such as E1, E2) shown in candidate_evidence; never reproduce database UUIDs.
- Mark weak adjacency as partial, not strong.
- A blocked match means an anti-claim or explicit unavailable evidence prevents the claim.
- Ask at most five questions. Each question must target missing STAR, metric, scope, tool, or stakeholder detail that could materially improve the application.
- Do not ask for information already present in candidate_evidence.
</constraints>
`;

export const normalizeEvidenceAnswerPrompt = (args: {
  question: unknown;
  answer: string;
  profile: unknown;
}) => `
<goal>Convert the user's answer into one reusable, truthful STAR evidence record.</goal>
<question>${json(args.question)}</question>
<answer>${args.answer}</answer>
<profile_roles>${json((args.profile as any)?.experience || [])}</profile_roles>
<constraints>
- Preserve the user's facts exactly; do not strengthen or estimate numbers.
- Empty fields are allowed.
- Attach the most likely existing role IDs only when supported.
- Add requirement tags in the form requirement:ID for the question's requirement IDs.
</constraints>
`;

export const contentStrategyPrompt = (args: {
  jobAnalysis: unknown;
  profile: unknown;
  evidence: unknown;
  matches: unknown;
  options: unknown;
}) => `
<goal>
Design the evidence and content plan for a recruiter-readable resume of no more than two pages and a matching cover letter.
</goal>
<job_analysis>${json(args.jobAnalysis)}</job_analysis>
<profile>${json(args.profile)}</profile>
<evidence>${json(args.evidence)}</evidence>
<requirement_matches>${json(args.matches)}</requirement_matches>
<options>${json(args.options)}</options>
<success>
- Return opaque evidence references exactly as shown in the evidence input (for example E1), never database UUIDs.
- Keep professional experience in reverse chronological order.
- Favor current and relevant proof without deleting honest career history solely because it is older.
- Assign every planned bullet to real evidence IDs and requirement IDs.
- Allocate 2-5 high-signal bullets to relevant recent roles and fewer to weakly relevant older roles.
- Plan action + context/scope + outcome. Metrics may appear only when present in evidence.
- Select two or three complementary proof stories for the cover letter.
</success>
`;

export const draftPrompt = (args: {
  job: unknown;
  jobAnalysis: unknown;
  profile: unknown;
  evidence: unknown;
  strategy: unknown;
  options: unknown;
}) => `
<goal>
Write the tailored resume content and cover letter from the approved evidence plan.
</goal>
<job>${json(args.job)}</job>
<job_analysis>${json(args.jobAnalysis)}</job_analysis>
<base_profile>${json(args.profile)}</base_profile>
<candidate_evidence>${json(args.evidence)}</candidate_evidence>
<content_strategy>${json(args.strategy)}</content_strategy>
<options>${json(args.options)}</options>
<success>
- Return opaque evidence references exactly as shown in candidate_evidence, never database UUIDs.
- Summary is 2-3 specific sentences and does not say "seeking".
- Skills are grounded, non-duplicative, and relevant.
- Experience roles stay in reverse chronological order.
- Every bullet begins with a strong action, communicates scope or method, and ends with an outcome when supported.
- Every bullet lists the exact evidence IDs and requirement IDs used.
- Do not create or alter employer, role, or date facts.
- Do not invent metrics. Qualitative specificity is preferable to a fabricated number.
- Cover letter is 220-320 words, three paragraphs, and uses the same evidence without repeating the resume verbatim.
</success>
`;

export const qualityReviewPrompt = (args: {
  job: unknown;
  jobAnalysis: unknown;
  evidence: unknown;
  draft: unknown;
  deterministicIssues: unknown;
}) => `
<goal>
Act as an independent recruiter and evidence auditor. Review the application without seeing the drafting rationale.
</goal>
<job>${json(args.job)}</job>
<job_analysis>${json(args.jobAnalysis)}</job_analysis>
<candidate_evidence>${json(args.evidence)}</candidate_evidence>
<draft>${json(args.draft)}</draft>
<deterministic_issues>${json(args.deterministicIssues)}</deterministic_issues>
<rubric>
Score truthfulness, requirement coverage, specificity, measurable impact, recruiter scan quality, ATS clarity, and cover-letter value from 0 to 100.
An unsupported factual or numeric claim is always an error.
Generic duty language, buried relevant work, repetitive bullets, malformed text, and unsupported keyword mirroring are warnings or errors according to severity.
</rubric>
`;

export const repairPrompt = (args: {
  job: unknown;
  profile: unknown;
  evidence: unknown;
  strategy: unknown;
  draft: unknown;
  qualityReport: unknown;
}) => `
<goal>Repair the application once, addressing only the supplied quality issues.</goal>
<job>${json(args.job)}</job>
<base_profile>${json(args.profile)}</base_profile>
<candidate_evidence>${json(args.evidence)}</candidate_evidence>
<content_strategy>${json(args.strategy)}</content_strategy>
<draft>${json(args.draft)}</draft>
<quality_report>${json(args.qualityReport)}</quality_report>
<constraints>
- Preserve valid content and all source facts.
- Remove unsupported claims rather than replacing them with new claims.
- Keep every bullet's evidence IDs and requirement IDs accurate.
- Keep the resume within the content strategy and the cover letter between 220 and 320 words.
</constraints>
`;
