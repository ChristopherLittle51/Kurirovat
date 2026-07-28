import { z } from "npm:zod@4.4.3";

export const RequirementSchema = z.object({
  id: z.string(),
  text: z.string(),
  priority: z.enum(["must_have", "important", "nice_to_have"]),
  category: z.string(),
  importance: z.number().min(0).max(100),
  expectedProof: z.string(),
  keywords: z.array(z.string()),
  senioritySignal: z.string(),
  rationale: z.string(),
});

export const JobAnalysisSchema = z.object({
  keywords: z.array(z.string()),
  requirements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  seniority: z.string(),
  domain: z.string(),
  painPoints: z.array(z.string()),
  signalsToAvoid: z.array(z.string()),
  mustHaveTerms: z.array(z.string()),
  niceToHaveTerms: z.array(z.string()),
  roleFamily: z.string(),
  hiringOutcomes: z.array(z.string()).max(7),
  recruiterRisks: z.array(z.string()).max(7),
  requirementsV2: z.array(RequirementSchema).min(1).max(15),
});

export const EvidenceQuestionSchema = z.object({
  id: z.string(),
  requirementIds: z.array(z.string()),
  prompt: z.string(),
  reason: z.string(),
  missingFields: z.array(z.enum(["situation", "action", "result", "metric", "scope", "tools", "teamSize"])),
  priority: z.number().min(0).max(100),
  status: z.literal("pending"),
});

export const EvidenceResolutionSchema = z.object({
  sourceFacts: z.array(z.string()),
  supportedClaims: z.array(z.object({
    claim: z.string(),
    evidenceIds: z.array(z.string()),
  })),
  missingEvidence: z.array(z.string()),
  blockedClaims: z.array(z.string()),
  matches: z.array(z.object({
    requirementId: z.string(),
    coverage: z.enum(["strong", "partial", "gap", "blocked"]),
    evidenceIds: z.array(z.string()),
    rationale: z.string(),
    missingDetail: z.string(),
  })),
  questions: z.array(EvidenceQuestionSchema).max(5),
});

export const CandidateEvidenceSchema = z.object({
  title: z.string(),
  situation: z.string(),
  action: z.string(),
  result: z.string(),
  metric: z.string(),
  scope: z.string(),
  tools: z.array(z.string()),
  teamSize: z.string(),
  domain: z.string(),
  tags: z.array(z.string()),
  sourceType: z.enum(["resume", "manual", "github", "linkedin", "portfolio"]),
  sourceLabel: z.string(),
  sourceExcerpt: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  roleIds: z.array(z.string()),
});

export const ContentStrategySchema = z.object({
  targetPageCount: z.literal(2),
  positioning: z.string(),
  selectedExperienceIds: z.array(z.string()).min(1),
  omittedExperienceIds: z.array(z.string()),
  bulletPlans: z.array(z.object({
    experienceId: z.string(),
    requirementIds: z.array(z.string()),
    evidenceIds: z.array(z.string()),
    angle: z.string(),
    targetLength: z.enum(["short", "standard"]),
  })).min(1),
  summaryEvidenceIds: z.array(z.string()).min(1),
  skillEvidenceIds: z.array(z.string()),
  coverLetterEvidenceIds: z.array(z.string()).min(1),
  warnings: z.array(z.string()),
});

export const DraftSchema = z.object({
  summary: z.string(),
  skills: z.array(z.string()).min(5).max(12),
  experiences: z.array(z.object({
    id: z.string(),
    bullets: z.array(z.object({
      text: z.string(),
      evidenceIds: z.array(z.string()).min(1),
      requirementIds: z.array(z.string()).min(1),
      why: z.string(),
    })).min(1),
  })).min(1),
  coverLetter: z.string(),
});

export const QualityIssueSchema = z.object({
  id: z.string(),
  code: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  section: z.string(),
  message: z.string(),
  repairInstruction: z.string(),
  experienceId: z.string(),
  bulletIndex: z.number().int(),
});

export const QualityReportSchema = z.object({
  passed: z.boolean(),
  scores: z.object({
    truthfulness: z.number().min(0).max(100),
    requirementCoverage: z.number().min(0).max(100),
    specificity: z.number().min(0).max(100),
    measurableImpact: z.number().min(0).max(100),
    recruiterScan: z.number().min(0).max(100),
    atsClarity: z.number().min(0).max(100),
    coverLetterValue: z.number().min(0).max(100),
  }),
  issues: z.array(QualityIssueSchema),
});

export const ParsedResumeSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  summary: z.string(),
  skills: z.array(z.string()),
  experience: z.array(z.object({
    id: z.string(),
    company: z.string(),
    role: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    description: z.array(z.string()),
  })),
  education: z.array(z.object({
    id: z.string(),
    institution: z.string(),
    degree: z.string(),
    year: z.string(),
  })),
  links: z.array(z.object({ platform: z.string(), url: z.string() })),
});

export const IdealJobSchema = z.object({
  roleTitle: z.string(),
  jobDescription: z.string(),
});

export const ImportedSourceSchema = z.object({
  label: z.string(),
  summary: z.string(),
  skills: z.array(z.string()),
  achievements: z.array(z.string()),
});

export const CondensedResumeSchema = z.object({
  condensedSummary: z.string(),
  selectedSkillIndices: z.array(z.number().int()),
  condensedExperience: z.array(z.object({
    id: z.string(),
    bulletIndices: z.array(z.number().int()),
  })),
});

export const CondensedTextSchema = z.object({ content: z.string() });

export const RenderReviewSchema = z.object({
  pageCount: z.number().int(),
  warnings: z.array(z.object({
    code: z.string(),
    severity: z.enum(["error", "warning", "info"]),
    message: z.string(),
  })),
});
