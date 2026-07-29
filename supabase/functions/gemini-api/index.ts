// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.90.1";
import { zodTextFormat } from "npm:openai@7.0.0/helpers/zod";
import {
  createModelClient,
  MODEL_CONFIG,
  runStructured,
  safetyIdentifier,
} from "./model.ts";
import {
  contentStrategyPrompt,
  draftPrompt,
  evidenceMatchingPrompt,
  jobAnalysisPrompt,
  normalizeEvidenceAnswerPrompt,
  PROMPT_VERSION,
  qualityReviewPrompt,
  repairPrompt,
  SCHEMA_VERSION,
} from "./prompts.ts";
import {
  CandidateEvidenceSchema,
  CondensedResumeSchema,
  CondensedTextSchema,
  ContentStrategySchema,
  DraftSchema,
  EvidenceResolutionSchema,
  IdealJobSchema,
  ImportedSourceSchema,
  JobAnalysisSchema,
  ParsedResumeSchema,
  QualityReportSchema,
  RenderReviewSchema,
} from "./schemas.ts";
import { validateDraft } from "./validators.ts";
import {
  evidenceForModel,
  evidenceFromModel,
  evidenceReferenceSet,
  InvalidEvidenceReferenceError,
  normalizePersistedEvidenceReferences,
} from "./evidenceReferences.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const now = () => new Date().toISOString();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requireJobId = (payload: any) => {
  if (typeof payload?.jobId !== "string" || !UUID_PATTERN.test(payload.jobId)) {
    throw new Error("Generation job ID must be a valid UUID.");
  }
  return payload.jobId;
};
// Every invocation advances at most one model stage. The caller owns
// scheduling and invokes this function again after the durable checkpoint.
class WorkerYieldError extends Error {}
const evidenceQuestionKey = (question: any) =>
  `${[...(question.requirementIds || [])].sort().join("|")}:${[...(question.missingFields || [])].sort().join("|")}`;

const evidenceIdsIn = (value: any): string[] => [
  ...(value?.summaryEvidenceIds || []),
  ...(value?.skillEvidenceIds || []),
  ...(value?.coverLetterEvidenceIds || []),
  ...(value?.bulletPlans || []).flatMap((plan: any) => plan.evidenceIds || []),
  ...(value?.experiences || []).flatMap((experience: any) =>
    (experience.bullets || []).flatMap((bullet: any) => bullet.evidenceIds || [])),
];

const assertKnownEvidenceIds = (values: any[], evidence: any[], stage?: string) => {
  const known = new Set(evidence.map((item) => item.id));
  const invalid = Array.from(new Set(values.flatMap(evidenceIdsIn)))
    .filter((id) => typeof id !== "string" || !known.has(id));
  if (invalid.length) {
    throw new InvalidEvidenceReferenceError(
      `Model returned evidence IDs not present in the evidence library: ${invalid.join(", ")}`,
      stage,
    );
  }
};

const recordUsage = (records: any[] = []) => {
  const costRates: Record<string, { input: number; output: number }> = {
    [MODEL_CONFIG.extraction.model]: {
      input: Number(Deno.env.get("OPENAI_TERRA_INPUT_COST_PER_MILLION") || 0),
      output: Number(Deno.env.get("OPENAI_TERRA_OUTPUT_COST_PER_MILLION") || 0),
    },
    [MODEL_CONFIG.judgment.model]: {
      input: Number(Deno.env.get("OPENAI_SOL_INPUT_COST_PER_MILLION") || 0),
      output: Number(Deno.env.get("OPENAI_SOL_OUTPUT_COST_PER_MILLION") || 0),
    },
  };
  const calls = records.map((record) => {
    const rates = costRates[record.model] || { input: 0, output: 0 };
    return {
      ...record,
      estimatedCostUsd: ((record.inputTokens || 0) * rates.input + (record.outputTokens || 0) * rates.output) / 1_000_000,
    };
  });
  const totals = calls.reduce(
    (totals, record) => ({
      inputTokens: totals.inputTokens + (record.inputTokens || 0),
      outputTokens: totals.outputTokens + (record.outputTokens || 0),
      reasoningTokens: totals.reasoningTokens + (record.reasoningTokens || 0),
      totalTokens: totals.totalTokens + (record.totalTokens || 0),
      latencyMs: totals.latencyMs + (record.latencyMs || 0),
      estimatedCostUsd: totals.estimatedCostUsd + (record.estimatedCostUsd || 0),
    }),
    { inputTokens: 0, outputTokens: 0, reasoningTokens: 0, totalTokens: 0, latencyMs: 0, estimatedCostUsd: 0 },
  );
  return {
    calls,
    totals,
    costEstimateConfigured: Object.values(costRates).some((rate) => rate.input > 0 || rate.output > 0),
  };
};

const normalizeProfileForPrompt = (profile: any) => ({
  fullName: profile?.fullName,
  summary: profile?.summary,
  skills: profile?.skills || [],
  experience: profile?.experience || [],
  education: profile?.education || [],
  antiClaims: profile?.antiClaims || [],
  githubProjects: profile?.githubProjects || [],
});

const evidenceRowToModel = (row: any) => ({
  id: row.id,
  legacyId: row.legacy_id,
  title: row.title || "",
  situation: row.situation || "",
  action: row.action || "",
  result: row.result || "",
  metric: row.metric || "",
  scope: row.scope || "",
  tools: row.tools || [],
  teamSize: row.team_size || "",
  domain: row.domain || "",
  tags: row.tags || [],
  sourceType: row.source_type || "manual",
  sourceLabel: row.source_label || "",
  sourceExcerpt: row.source_excerpt || "",
  confidence: row.confidence || "medium",
  roleIds: row.role_ids || [],
  mustInclude: Boolean(row.must_include),
  niceToUse: Boolean(row.nice_to_use),
  unavailable: Boolean(row.unavailable),
  disabled: Boolean(row.disabled),
  roleFamilyConstraints: row.role_family_constraints || [],
  dedupeKey: row.dedupe_key || "",
  lastUsedAt: row.last_used_at,
});

const normalizedEvidenceKey = (entry: any) =>
  [entry.title, entry.action, entry.result, entry.metric]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 240);

const achievementToEvidence = (entry: any) => ({
  id: entry.id,
  title: entry.title || "",
  situation: entry.situation || "",
  action: entry.action || "",
  result: entry.result || "",
  metric: entry.metric || "",
  scope: entry.scope || "",
  tools: entry.tools || [],
  teamSize: entry.teamSize || "",
  domain: entry.domain || "",
  tags: entry.tags || [],
  sourceType: entry.sourceType || "manual",
  sourceLabel: "",
  sourceExcerpt: "",
  confidence: entry.confidence || "medium",
  roleIds: entry.roleIds || [],
  mustInclude: Boolean(entry.mustInclude),
  niceToUse: entry.niceToUse !== false,
  unavailable: Boolean(entry.neverUse),
  disabled: Boolean(entry.neverUse),
  roleFamilyConstraints: entry.roleFamilyConstraints || [],
});

async function loadEvidence(supabaseClient: any, userId: string, profile?: any) {
  const { data, error } = await supabaseClient
    .from("candidate_evidence")
    .select("*")
    .eq("user_id", userId)
    .eq("disabled", false)
    .order("updated_at", { ascending: false });
  if (!error) return (data || []).map(evidenceRowToModel);
  console.warn("candidate_evidence unavailable; using profile achievement bank:", error.message);
  return (profile?.achievementBank || []).map(achievementToEvidence);
}

async function analyzeJob(client: any, safetyId: string, job: any) {
  return runStructured({
    client,
    prompt: jobAnalysisPrompt(job),
    schema: JobAnalysisSchema,
    schemaName: "job_analysis_v2",
    tier: "extraction",
    safetyId,
  });
}

async function matchEvidence(
  client: any,
  safetyId: string,
  jobAnalysis: any,
  profile: any,
  evidence: any[],
) {
  const references = evidenceReferenceSet(evidence);
  const result = await runStructured({
    client,
    prompt: evidenceMatchingPrompt({
      jobAnalysis,
      profile: normalizeProfileForPrompt(profile),
      evidence: references.promptEvidence,
    }),
    schema: EvidenceResolutionSchema,
    schemaName: "evidence_resolution_v2",
    tier: "judgment",
    safetyId,
  });
  return {
    ...result,
    data: evidenceFromModel(result.data, evidence, "Evidence matching"),
  };
}

const sortExperiences = (experiences: any[]) => {
  const dateValue = (value = "") => {
    if (/present|current/i.test(value)) return Number.POSITIVE_INFINITY;
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
    const year = value.match(/\b(19|20)\d{2}\b/)?.[0];
    return year ? Date.parse(`${year}-01-01`) : Number.NEGATIVE_INFINITY;
  };
  return [...experiences].sort(
    (a, b) => dateValue(b.endDate || b.startDate) - dateValue(a.endDate || a.startDate),
  );
};

const mergeDraft = (baseProfile: any, draft: any, strategy: any) => {
  const byId = new Map((draft.experiences || []).map((entry: any) => [entry.id, entry]));
  const selected = new Set(strategy.selectedExperienceIds || []);
  const baseExperiences = selected.size
    ? (baseProfile.experience || []).filter((entry: any) => selected.has(entry.id))
    : (baseProfile.experience || []);

  const experience = sortExperiences(baseExperiences).map((entry: any) => {
    const replacement: any = byId.get(entry.id);
    return {
      ...entry,
      description: replacement?.bullets?.length
        ? replacement.bullets.map((bullet: any) => bullet.text)
        : entry.description,
    };
  });

  return {
    ...baseProfile,
    summary: draft.summary || baseProfile.summary,
    skills: draft.skills?.length ? draft.skills : baseProfile.skills,
    experience,
  };
};

const rewriteInsightsFromDraft = (baseProfile: any, draft: any) => ({
  summary: {
    original: baseProfile.summary || "",
    tailored: draft.summary || baseProfile.summary || "",
    alternate: draft.summary || baseProfile.summary || "",
    why: "Positioned from the approved evidence strategy.",
    evidence: [],
  },
  skills: (draft.skills || []).map((skill: string) => ({
    skill,
    why: "Selected for job relevance and evidence support.",
  })),
  bullets: (draft.experiences || []).map((item: any) => {
    const original = (baseProfile.experience || []).find((entry: any) => entry.id === item.id);
    return {
      experienceId: item.id,
      rewrites: (item.bullets || []).map((bullet: any, index: number) => ({
        original: original?.description?.[index] || "",
        tailored: bullet.text,
        alternate: bullet.text,
        why: bullet.why,
        evidence: [],
        evidenceIds: bullet.evidenceIds || [],
        requirementIds: bullet.requirementIds || [],
      })),
    };
  }),
});

async function createStrategyAndDraft(args: {
  client: any;
  safetyId: string;
  job: any;
  profile: any;
  evidence: any[];
  jobAnalysis: any;
  evidenceResolution: any;
  options: any;
  existing?: Record<string, any>;
  checkpoint?: (stage: string, values: Record<string, any>) => Promise<void>;
}) {
  const usages: any[] = [];
  const references = evidenceReferenceSet(args.evidence);
  let strategy = args.existing?.contentStrategy;
  if (!strategy) {
    const strategyResult = await runStructured({
      client: args.client,
      prompt: contentStrategyPrompt({
        jobAnalysis: args.jobAnalysis,
        profile: normalizeProfileForPrompt(args.profile),
        evidence: references.promptEvidence,
        matches: evidenceForModel(args.evidenceResolution.matches, args.evidence, "Content strategy"),
        options: { ...args.options, targetPageCount: 2 },
      }),
      schema: ContentStrategySchema,
      schemaName: "content_strategy_v2",
      tier: "judgment",
      safetyId: args.safetyId,
    });
    strategy = evidenceFromModel(strategyResult.data, args.evidence, "Content strategy");
    assertKnownEvidenceIds([strategy], args.evidence, "content_strategy");
    usages.push(strategyResult.usage);
    await args.checkpoint?.("drafting", { contentStrategy: strategy });
  }

  let draft = args.existing?.draft;
  if (!draft) {
    const draftResult = await runStructured({
      client: args.client,
      prompt: draftPrompt({
        job: args.job,
        jobAnalysis: args.jobAnalysis,
        profile: normalizeProfileForPrompt(args.profile),
        evidence: references.promptEvidence,
        strategy: evidenceForModel(strategy, args.evidence, "Draft strategy"),
        options: args.options,
      }),
      schema: DraftSchema,
      schemaName: "application_draft_v2",
      tier: "judgment",
      safetyId: args.safetyId,
    });
    draft = evidenceFromModel(draftResult.data, args.evidence, "Draft");
    assertKnownEvidenceIds([draft], args.evidence, "drafting");
    usages.push(draftResult.usage);
    await args.checkpoint?.("review", { contentStrategy: strategy, draft });
  }

  let profile = mergeDraft(args.profile, draft, strategy);
  let deterministicIssues = validateDraft(profile, args.evidence, draft);
  let reviewResult: any;
  if (args.existing?.initialReview) {
    reviewResult = { data: args.existing.initialReview };
  } else {
    reviewResult = await runStructured({
      client: args.client,
      prompt: qualityReviewPrompt({
        job: args.job,
        jobAnalysis: args.jobAnalysis,
        evidence: args.evidence,
        draft: { resume: profile, coverLetter: draft.coverLetter },
        deterministicIssues,
      }),
      schema: QualityReportSchema,
      schemaName: "recruiter_quality_report_v2",
      tier: "judgment",
      safetyId: args.safetyId,
    });
    usages.push(reviewResult.usage);
    await args.checkpoint?.("review", {
      contentStrategy: strategy,
      draft,
      initialReview: reviewResult.data,
    });
  }

  const initialReview = reviewResult.data;
  let repaired = Boolean(args.existing?.repairCompleted);
  const needsRepair = !repaired && (
    deterministicIssues.some((item: any) => item.severity === "error")
    || !reviewResult.data.passed
  );
  if (needsRepair) {
    const repairResult = await runStructured({
      client: args.client,
      prompt: repairPrompt({
        job: args.job,
        profile: normalizeProfileForPrompt(args.profile),
        evidence: references.promptEvidence,
        strategy: evidenceForModel(strategy, args.evidence, "Repair strategy"),
        draft: evidenceForModel(draft, args.evidence, "Repair draft"),
        qualityReport: {
          ...reviewResult.data,
          issues: [...deterministicIssues, ...reviewResult.data.issues],
        },
      }),
      schema: DraftSchema,
      schemaName: "application_repair_v2",
      tier: "judgment",
      safetyId: args.safetyId,
    });
    usages.push(repairResult.usage);
    draft = evidenceFromModel(repairResult.data, args.evidence, "Repair");
    await args.checkpoint?.("review", {
      contentStrategy: strategy,
      draft,
      initialReview: reviewResult.data,
      repairCompleted: true,
    });
    profile = mergeDraft(args.profile, draft, strategy);
    deterministicIssues = validateDraft(profile, args.evidence, draft);
    repaired = true;
  }

  if (repaired) {
    if (args.existing?.finalReview) {
      reviewResult = { data: args.existing.finalReview };
    } else {
      reviewResult = await runStructured({
      client: args.client,
      prompt: qualityReviewPrompt({
        job: args.job,
        jobAnalysis: args.jobAnalysis,
        evidence: args.evidence,
        draft: { resume: profile, coverLetter: draft.coverLetter },
        deterministicIssues,
      }),
      schema: QualityReportSchema,
      schemaName: "recruiter_quality_report_repaired_v2",
      tier: "judgment",
      safetyId: args.safetyId,
      });
      usages.push(reviewResult.usage);
      await args.checkpoint?.("review", {
        contentStrategy: strategy,
        draft,
        initialReview,
        repairCompleted: true,
        finalReview: reviewResult.data,
      });
    }
  }

  const qualityReport = {
    ...reviewResult.data,
    passed: reviewResult.data.passed
      && !deterministicIssues.some((item: any) => item.severity === "error"),
    repaired,
    issues: [...deterministicIssues, ...reviewResult.data.issues],
    reviewedAt: now(),
    model: MODEL_CONFIG.judgment.model,
    promptVersion: PROMPT_VERSION,
  };

  const scores = Object.values(qualityReport.scores || {}) as number[];
  const matchScore = scores.length
    ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
    : 0;

  return {
    application: {
      resume: profile,
      coverLetter: draft.coverLetter,
      matchScore,
      keyKeywords: args.jobAnalysis.keywords || [],
      searchSources: [],
      githubProjects: args.profile.githubProjects || [],
      showMatchScore: true,
      jobAnalysis: args.jobAnalysis,
      evidenceResolution: args.evidenceResolution,
      diagnostics: {
        matchedKeywords: args.jobAnalysis.keywords || [],
        missingKeywords: args.evidenceResolution.missingEvidence || [],
        unsupportedClaimsAvoided: args.evidenceResolution.blockedClaims || [],
        recruiterConcerns: qualityReport.issues.map((item: any) => item.message),
        overusedPhrasing: qualityReport.issues
          .filter((item: any) => item.code === "repeated_opener")
          .map((item: any) => item.message),
        manualActionItems: qualityReport.issues
          .filter((item: any) => item.severity !== "info")
          .map((item: any) => item.repairInstruction || item.message),
      },
      rewriteInsights: rewriteInsightsFromDraft(args.profile, draft),
      assembledPromptPreview: `Prompt ${PROMPT_VERSION}\nModels: ${MODEL_CONFIG.extraction.model}, ${MODEL_CONFIG.judgment.model}\nTwo-page evidence-first strategy.`,
      promptOverride: args.options?.promptOverride || "",
      selectedPlaybookId: args.options?.selectedPlaybookId,
      generationOptions: { ...args.options, targetPageCount: 2 },
      editSuggestions: qualityReport.issues.map((item: any) => ({
        id: item.id,
        label: item.code,
        rationale: item.message,
        instruction: item.repairInstruction || item.message,
        accepted: false,
      })),
      regenerationHistory: args.options?.regenerationInstructions
        ? [{ timestamp: now(), instructions: args.options.regenerationInstructions }]
        : [],
      contentStrategy: strategy,
      qualityReport,
    },
    draft,
    usages,
    repairCount: repaired ? 1 : 0,
  };
}

async function handleGenerationJob(args: {
  client: any;
  safetyId: string;
  supabaseClient: any;
  payload: any;
  authedUserId?: string;
  isServiceRole: boolean;
}) {
  const jobId = requireJobId(args.payload);
  const { data: job, error: jobError } = await args.supabaseClient
    .from("generation_jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (jobError || !job) throw new Error(jobError?.message || "Generation job not found.");
  if (!args.isServiceRole && job.user_id !== args.authedUserId) {
    return jsonResponse({ error: "Unauthorized generation job access." }, 403);
  }
  if (["succeeded", "cancelled"].includes(job.status)) return jsonResponse({ job });
  if (job.status === "needs_input") return jsonResponse({ job }, 202);

  const updatedAt = job.updated_at ? new Date(job.updated_at).getTime() : 0;
  if (job.status === "running" && Date.now() - updatedAt < 8 * 60 * 1000) {
    return jsonResponse({ job, skipped: "already running" }, 202);
  }

  const updateJob = async (updates: Record<string, any>) => {
    const { error } = await args.supabaseClient
      .from("generation_jobs")
      .update({ ...updates, updated_at: now() })
      .eq("id", job.id);
    if (error) throw error;
  };

  const request = job.request_payload || {};
  const state = job.working_state || {};
  const usages = [...(job.usage_metrics?.calls || [])];
  const entryPoint = !state.jobAnalysis
    ? { stage: "job_analysis", progress: 8 }
    : (!state.evidenceResolution || !state.interviewComplete)
      ? { stage: "evidence_matching", progress: 25 }
      : !state.contentStrategy
        ? { stage: "content_strategy", progress: 48 }
        : !state.draft
          ? { stage: "drafting", progress: 60 }
          : !state.initialReview
            ? { stage: "review", progress: 76 }
            : state.repairCompleted && !state.finalReview
              ? { stage: "review", progress: 88 }
              : { stage: "persisting", progress: 92 };
  console.info("generation_stage_entered", {
    jobId: job.id,
    stage: entryPoint.stage,
    stateKeys: Object.keys(state),
    status: job.status,
  });

  try {
    await updateJob({
      status: "running",
      stage: entryPoint.stage,
      progress: entryPoint.progress,
      error_message: null,
      attempt_count: (job.attempt_count || 0) + 1,
      started_at: job.started_at || now(),
      prompt_version: PROMPT_VERSION,
      schema_version: SCHEMA_VERSION,
      model_config: MODEL_CONFIG,
    });

    const evidence = await loadEvidence(args.supabaseClient, job.user_id, request.baseProfile);
    // Migrate checkpoints written before opaque references were translated
    // back to database IDs at each model-stage boundary.
    Object.assign(state, normalizePersistedEvidenceReferences(state, evidence));
    if (state.contentStrategy) {
      try {
        assertKnownEvidenceIds([state.contentStrategy], evidence, "content_strategy");
      } catch (error) {
        throw error instanceof InvalidEvidenceReferenceError
          ? error
          : new InvalidEvidenceReferenceError(String(error), "content_strategy");
      }
    }
    if (state.draft) {
      try {
        assertKnownEvidenceIds([state.draft], evidence, "drafting");
      } catch (error) {
        throw error instanceof InvalidEvidenceReferenceError
          ? error
          : new InvalidEvidenceReferenceError(String(error), "drafting");
      }
    }
    let jobAnalysis = state.jobAnalysis;
    if (!jobAnalysis) {
      const analysis = await analyzeJob(args.client, args.safetyId, request.jd);
      jobAnalysis = {
        ...analysis.data,
        ...(request.options?.jobAnalysisOverride || {}),
      };
      usages.push(analysis.usage);
    await updateJob({
      stage: "evidence_matching",
      progress: 25,
      working_state: { ...state, jobAnalysis },
      usage_metrics: recordUsage(usages),
    });
      throw new WorkerYieldError();
    }

    const questionHistory = state.questionHistory || [];
    const priorQuestionKeys = new Set(questionHistory.map(evidenceQuestionKey));
    let evidenceResolution = state.evidenceResolution;
    let matchedEvidence = false;
    // Once the interview is complete, evidence matching is authoritative in
    // the checkpoint. Do not spend another model call on every continuation.
    // When an answer or round decision changes the evidence state,
    // interviewComplete is false and matching must run again.
    if (!evidenceResolution || !state.interviewComplete) {
      matchedEvidence = true;
      const resolutionResult = await matchEvidence(
        args.client,
        args.safetyId,
        jobAnalysis,
        request.baseProfile,
        evidence,
      );
      usages.push(resolutionResult.usage);
      evidenceResolution = {
        ...resolutionResult.data,
        questions: (resolutionResult.data.questions || []).filter(
          (question: any) => !priorQuestionKeys.has(evidenceQuestionKey(question)),
        ),
      };
    }

    if (!state.interviewComplete && evidenceResolution.questions?.length) {
      await updateJob({
        status: "needs_input",
        stage: "needs_input",
        progress: 35,
        pending_questions: evidenceResolution.questions.slice(0, 5),
        working_state: { ...state, jobAnalysis, evidenceResolution },
        usage_metrics: recordUsage(usages),
      });
      return jsonResponse({
        jobId: job.id,
        status: "needs_input",
        questions: evidenceResolution.questions.slice(0, 5),
      }, 202);
    }

    if (matchedEvidence) {
      await updateJob({
        stage: "content_strategy",
        progress: 48,
        working_state: { ...state, jobAnalysis, evidenceResolution, interviewComplete: true },
        pending_questions: [],
        usage_metrics: recordUsage(usages),
      });
      throw new WorkerYieldError();
    }

    let pipelineState = {
      ...state,
      jobAnalysis,
      evidenceResolution,
      interviewComplete: true,
    };
    assertKnownEvidenceIds(
      [pipelineState.contentStrategy, pipelineState.draft],
      evidence,
    );
    const generated = await createStrategyAndDraft({
      client: args.client,
      safetyId: args.safetyId,
      job: request.jd,
      profile: request.baseProfile,
      evidence,
      jobAnalysis,
      evidenceResolution,
      options: request.options || {},
      existing: pipelineState,
      checkpoint: async (stage, values) => {
        pipelineState = { ...pipelineState, ...values };
        await updateJob({
          stage,
          progress: stage === "drafting" ? 60 : 76,
          working_state: pipelineState,
          usage_metrics: recordUsage(usages),
        });
        throw new WorkerYieldError();
      },
    });
    usages.push(...generated.usages);

    await updateJob({
      stage: "review",
      progress: 88,
      quality_report: generated.application.qualityReport,
      repair_count: generated.repairCount,
      usage_metrics: recordUsage(usages),
    });

    const application = generated.application;
    let { data: saved, error: saveError } = await args.supabaseClient
      .from("applications")
      .insert({
        user_id: job.user_id,
        company_name: request.jd.companyName,
        role_title: request.jd.roleTitle,
        raw_job_description: request.jd.rawText,
        resume_data: application.resume,
        cover_letter: application.coverLetter,
        match_score: application.matchScore,
        key_keywords: application.keyKeywords,
        status: "Pending",
        github_projects: application.githubProjects,
        show_match_score: request.includeScore ?? true,
        profile_photo_url: application.resume?.profilePhotoUrl,
        template: request.baseProfile?.portfolioTemplate,
        portfolio_theme: request.baseProfile?.portfolioTheme || request.baseProfile?.portfolioTemplate,
        tailoring_run_id: job.id,
      })
      .select("id")
      .single();
    if (saveError?.code === "23505") {
      const existingApplication = await args.supabaseClient
        .from("applications")
        .select("id")
        .eq("tailoring_run_id", job.id)
        .single();
      if (existingApplication.error) throw existingApplication.error;
      saved = existingApplication.data;
      saveError = null;
    }
    if (saveError || !saved) throw saveError || new Error("Application could not be persisted.");

    const { error: privateError } = await args.supabaseClient
      .from("application_private_artifacts")
      .upsert({
        application_id: saved.id,
        user_id: job.user_id,
        job_analysis: application.jobAnalysis,
        evidence_resolution: application.evidenceResolution,
        content_strategy: application.contentStrategy,
        quality_report: application.qualityReport,
        diagnostics: application.diagnostics,
        rewrite_insights: application.rewriteInsights,
        prompt_preview: application.assembledPromptPreview,
        selected_playbook_id: application.selectedPlaybookId,
        generation_options: application.generationOptions,
        edit_suggestions: application.editSuggestions,
        regeneration_history: application.regenerationHistory,
        model_config: MODEL_CONFIG,
        usage_metrics: recordUsage(usages),
        updated_at: now(),
      });
    if (privateError) throw privateError;

    const { error: eventError } = await args.supabaseClient.from("application_events").insert({
      application_id: saved.id,
      user_id: job.user_id,
      event_type: "created",
      occurred_at: now(),
      notes: "Application generated by Tailoring v2.",
      metadata: { tailoringRunId: job.id },
    });
    if (eventError && eventError.code !== "23505") throw eventError;

    const usedEvidenceIds = Array.from(new Set([
      ...(application.contentStrategy?.summaryEvidenceIds || []),
      ...(application.contentStrategy?.skillEvidenceIds || []),
      ...(application.contentStrategy?.coverLetterEvidenceIds || []),
      ...(application.contentStrategy?.bulletPlans || []).flatMap((plan: any) => plan.evidenceIds || []),
    ]));
    assertKnownEvidenceIds([application.contentStrategy], evidence);
    if (usedEvidenceIds.length) {
      await args.supabaseClient
        .from("candidate_evidence")
        .update({ last_used_at: now(), updated_at: now() })
        .in("id", usedEvidenceIds)
        .eq("user_id", job.user_id);
      const locationByEvidence = new Map<string, Set<string>>();
      for (const evidenceId of application.contentStrategy?.summaryEvidenceIds || []) {
        locationByEvidence.set(evidenceId, new Set([...(locationByEvidence.get(evidenceId) || []), "summary"]));
      }
      for (const evidenceId of application.contentStrategy?.skillEvidenceIds || []) {
        locationByEvidence.set(evidenceId, new Set([...(locationByEvidence.get(evidenceId) || []), "skills"]));
      }
      for (const evidenceId of application.contentStrategy?.coverLetterEvidenceIds || []) {
        locationByEvidence.set(evidenceId, new Set([...(locationByEvidence.get(evidenceId) || []), "cover_letter"]));
      }
      for (const plan of application.contentStrategy?.bulletPlans || []) {
        for (const evidenceId of plan.evidenceIds || []) {
          locationByEvidence.set(evidenceId, new Set([
            ...(locationByEvidence.get(evidenceId) || []),
            `experience:${plan.experienceId}`,
          ]));
        }
      }
      const { error: usageError } = await args.supabaseClient
        .from("candidate_evidence_usage")
        .upsert(usedEvidenceIds.map((evidenceId) => ({
          evidence_id: evidenceId,
          application_id: saved.id,
          generation_job_id: job.id,
          user_id: job.user_id,
          locations: Array.from(locationByEvidence.get(evidenceId) || []),
        })), { onConflict: "evidence_id,generation_job_id" });
      if (usageError) throw usageError;
    }

    await updateJob({
      status: "succeeded",
      stage: "completed",
      progress: 100,
      result_application_id: saved.id,
      accepted_evidence_ids: usedEvidenceIds,
      finished_at: now(),
      usage_metrics: recordUsage(usages),
    });
    return jsonResponse({ jobId: job.id, applicationId: saved.id });
  } catch (error: any) {
    if (error instanceof WorkerYieldError) {
      await updateJob({
        status: "queued",
        error_message: null,
        finished_at: null,
      });
      return jsonResponse({ jobId: job.id, status: "queued", continued: true }, 202);
    }
    console.error("Tailoring v2 generation failed:", error);
    await updateJob({
      status: "failed",
      stage: "failed",
      progress: 100,
      error_message: error.message || "Generation failed.",
      finished_at: now(),
      usage_metrics: recordUsage(usages),
    }).catch((updateError: any) => console.error("Failed to persist job failure:", updateError));
    return jsonResponse({ error: error.message || "Generation failed." }, 400);
  }
}

async function answerEvidenceQuestion(args: {
  client: any;
  safetyId: string;
  supabaseClient: any;
  userId: string;
  payload: any;
}) {
  const jobId = requireJobId(args.payload);
  const { data: job, error } = await args.supabaseClient
    .from("generation_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", args.userId)
    .single();
  if (error || !job) throw new Error(error?.message || "Generation job not found.");
  const questions = job.pending_questions || [];
  const question = questions.find((item: any) => item.id === args.payload.questionId);
  if (!question) throw new Error("Evidence question not found.");

  let evidenceId: string | undefined;
  if (args.payload.disposition === "answered") {
    if (!args.payload.answer?.trim()) throw new Error("An evidence answer is required.");
    const normalized = await runStructured({
      client: args.client,
      prompt: normalizeEvidenceAnswerPrompt({
        question,
        answer: args.payload.answer.trim(),
        profile: job.request_payload?.baseProfile,
      }),
      schema: CandidateEvidenceSchema,
      schemaName: "candidate_evidence_answer_v2",
      tier: "extraction",
      safetyId: args.safetyId,
    });
    const dedupeKey = normalizedEvidenceKey(normalized.data);
    const { data: duplicate } = await args.supabaseClient
      .from("candidate_evidence")
      .select("id")
      .eq("user_id", args.userId)
      .eq("dedupe_key", dedupeKey)
      .maybeSingle();
    if (duplicate?.id) {
      evidenceId = duplicate.id;
    } else {
      const { data: inserted, error: insertError } = await args.supabaseClient
        .from("candidate_evidence")
        .insert({
          user_id: args.userId,
          title: normalized.data.title,
          situation: normalized.data.situation,
          action: normalized.data.action,
          result: normalized.data.result,
          metric: normalized.data.metric,
          scope: normalized.data.scope,
          tools: normalized.data.tools,
          team_size: normalized.data.teamSize,
          domain: normalized.data.domain,
          tags: normalized.data.tags,
          source_type: normalized.data.sourceType,
          source_label: normalized.data.sourceLabel,
          source_excerpt: normalized.data.sourceExcerpt,
          confidence: normalized.data.confidence,
          role_ids: normalized.data.roleIds,
          must_include: false,
          nice_to_use: true,
          unavailable: false,
          disabled: false,
          role_family_constraints: [],
          dedupe_key: dedupeKey,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      evidenceId = inserted.id;
    }
  }

  const updatedQuestions = questions.map((item: any) =>
    item.id === question.id
      ? {
        ...item,
        status: args.payload.disposition,
        answer: args.payload.disposition === "answered" ? args.payload.answer.trim() : "",
        evidenceId,
      }
      : item
  );
  const remaining = updatedQuestions.filter((item: any) => item.status === "pending");
  const accepted = evidenceId
    ? Array.from(new Set([...(job.accepted_evidence_ids || []), evidenceId]))
    : (job.accepted_evidence_ids || []);

  const priorHistory = job.working_state?.questionHistory || [];
  const resolvedQuestion = updatedQuestions.find((item: any) => item.id === question.id);
  const questionHistory = [
    ...priorHistory.filter((item: any) => evidenceQuestionKey(item) !== evidenceQuestionKey(resolvedQuestion)),
    resolvedQuestion,
  ];
  const materialGapsRemain = Boolean(job.working_state?.evidenceResolution?.missingEvidence?.length);
  const roundDecisionRequired = remaining.length === 0
    && materialGapsRemain
    && (job.working_state?.evidenceRound || 1) < 3;

  const { error: updateError } = await args.supabaseClient
    .from("generation_jobs")
    .update({
      pending_questions: updatedQuestions,
      accepted_evidence_ids: accepted,
      status: remaining.length || roundDecisionRequired ? "needs_input" : "queued",
      stage: remaining.length || roundDecisionRequired ? "needs_input" : "evidence_matching",
      working_state: {
        ...(job.working_state || {}),
        interviewComplete: remaining.length === 0 && !roundDecisionRequired,
        roundDecisionRequired,
        evidenceRound: job.working_state?.evidenceRound || 1,
        questionHistory,
      },
      updated_at: now(),
    })
    .eq("id", job.id);
  if (updateError) throw updateError;
  return jsonResponse({
    jobId: job.id,
    questions: updatedQuestions,
    remaining: remaining.length,
    roundDecisionRequired,
  });
}

async function setEvidenceRoundDecision(args: {
  supabaseClient: any;
  userId: string;
  payload: any;
  anotherRound: boolean;
}) {
  const jobId = requireJobId(args.payload);
  const { data: job, error } = await args.supabaseClient
    .from("generation_jobs")
    .select("working_state")
    .eq("id", jobId)
    .eq("user_id", args.userId)
    .single();
  if (error || !job) throw new Error(error?.message || "Generation job not found.");
  const state = job.working_state || {};
  const { error: updateError } = await args.supabaseClient
    .from("generation_jobs")
    .update({
      status: "queued",
      stage: "evidence_matching",
      pending_questions: [],
      working_state: {
        ...state,
        interviewComplete: !args.anotherRound,
        roundDecisionRequired: false,
        evidenceRound: args.anotherRound ? (state.evidenceRound || 1) + 1 : (state.evidenceRound || 1),
      },
      updated_at: now(),
    })
    .eq("id", jobId)
    .eq("user_id", args.userId);
  if (updateError) throw updateError;
  return jsonResponse({ ok: true });
}

async function parseResume(client: any, safetyId: string, payload: any) {
  const result = await runStructured({
    client,
    prompt: "Extract the supplied resume PDF. Use only facts present in the file. Preserve employer, title, date, and bullet text faithfully.",
    schema: ParsedResumeSchema,
    schemaName: "parsed_resume_v2",
    tier: "extraction",
    safetyId,
    input: [{
      role: "user",
      content: [
        { type: "input_text", text: "Extract this resume into the required structure without inference." },
        {
          type: "input_file",
          filename: "resume.pdf",
          file_data: `data:application/pdf;base64,${payload.base64Pdf}`,
        },
      ],
    }],
  });
  return jsonResponse(result.data);
}

async function generateIdealJob(client: any, safetyId: string, payload: any) {
  const result = await runStructured({
    client,
    prompt: `Create a realistic ideal job-description benchmark from this profile. Do not invent candidate experience.\nProfile:\n${JSON.stringify(normalizeProfileForPrompt(payload.profile))}\nDirection:\n${payload.instructions || "None"}`,
    schema: IdealJobSchema,
    schemaName: "ideal_job_v2",
    tier: "extraction",
    safetyId,
  });
  return jsonResponse(result.data);
}

async function importProfileSource(client: any, safetyId: string, payload: any) {
  const result = await runStructured({
    client,
    prompt: `Extract only career facts from this supplied profile source.\nURL: ${payload.url || ""}\nLabel: ${payload.label || ""}\nText: ${payload.rawText || ""}`,
    schema: ImportedSourceSchema,
    schemaName: "imported_profile_source_v2",
    tier: "extraction",
    safetyId,
    tools: payload.rawText ? undefined : [{ type: "web_search" }],
  });
  return jsonResponse({
    id: crypto.randomUUID(),
    label: result.data.label || payload.label || payload.url,
    url: payload.url,
    sourceType: payload.sourceType || "other",
    summary: result.data.summary,
    skills: result.data.skills,
    achievements: result.data.achievements,
    importedAt: now(),
  });
}

async function condenseResume(client: any, safetyId: string, payload: any) {
  const result = await runStructured({
    client,
    prompt: `Select and condense this resume without adding facts. Keep at most two pages worth of content.\n${JSON.stringify(normalizeProfileForPrompt(payload.profile))}`,
    schema: CondensedResumeSchema,
    schemaName: "condensed_resume_v2",
    tier: "extraction",
    safetyId,
  });
  const skills = (result.data.selectedSkillIndices || [])
    .filter((index: number) => index >= 0 && index < payload.profile.skills.length)
    .map((index: number) => payload.profile.skills[index]);
  const experience = (result.data.condensedExperience || []).map((item: any) => {
    const original = payload.profile.experience.find((entry: any) => entry.id === item.id);
    if (!original) return null;
    return {
      ...original,
      description: item.bulletIndices
        .filter((index: number) => index >= 0 && index < original.description.length)
        .map((index: number) => original.description[index]),
    };
  }).filter(Boolean);
  return jsonResponse({
    profile: {
      ...payload.profile,
      summary: result.data.condensedSummary || payload.profile.summary,
      skills: skills.length ? skills : payload.profile.skills.slice(0, 8),
      experience: experience.length ? experience : payload.profile.experience,
    },
    rawResponse: JSON.stringify(result.data),
  });
}

async function condenseCoverLetter(client: any, safetyId: string, payload: any) {
  const result = await runStructured({
    client,
    prompt: `Condense this cover letter to 220-320 grounded words. Preserve all facts and do not add claims.\n${payload.content}`,
    schema: CondensedTextSchema,
    schemaName: "condensed_cover_letter_v2",
    tier: "extraction",
    safetyId,
  });
  return jsonResponse({ content: result.data.content, rawResponse: JSON.stringify(result.data) });
}

async function reviewRenderedResume(client: any, safetyId: string, payload: any) {
  const response = await client.responses.parse({
    model: MODEL_CONFIG.judgment.model,
    reasoning: { effort: MODEL_CONFIG.judgment.effort },
    store: false,
    safety_identifier: safetyId,
    input: [{
      role: "user",
      content: [
        {
          type: "input_text",
          text: "Review the rendered resume PDF. Report page count, clipping, orphan pages, unreadable hierarchy, excessive density, malformed text, or suspicious text. Warnings are advisory.",
        },
        {
          type: "input_file",
          filename: "tailored-resume.pdf",
          file_data: `data:application/pdf;base64,${payload.base64Pdf}`,
        },
      ],
    }],
    text: { format: zodTextFormat(RenderReviewSchema, "render_review_v2") },
  });
  if (!response.output_parsed) throw new Error("Rendered PDF review returned no structured result.");
  return jsonResponse(response.output_parsed);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { action, payload, access_token } = await req.json();
    if (payload?.jobId) {
      console.info("generation_job_id_received", {
        action,
        jobId: payload.jobId,
        length: typeof payload.jobId === "string" ? payload.jobId.length : null,
      });
    }
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : access_token;
    if (!token) return jsonResponse({ error: "Missing authorization token." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const isServiceRole = Boolean(serviceRoleKey && token === serviceRoleKey);
    const supabaseClient = createClient(
      supabaseUrl,
      isServiceRole ? serviceRoleKey : anonKey,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );

    let userId = payload?.userId;
    if (!isServiceRole) {
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);
      if (error || !user) return jsonResponse({ error: "Unauthorized." }, 401);
      userId = user.id;
    }
    if (!userId) return jsonResponse({ error: "Unable to resolve request owner." }, 401);

    const client = createModelClient();
    const safetyId = await safetyIdentifier(userId);

    switch (action) {
      case "parseResume":
        return parseResume(client, safetyId, payload);
      case "analyzeJobDescription": {
        const result = await analyzeJob(client, safetyId, payload.jd);
        return jsonResponse(result.data);
      }
      case "processGenerationJob":
        return handleGenerationJob({
          client,
          safetyId,
          supabaseClient,
          payload,
          authedUserId: userId,
          isServiceRole,
        });
      case "answerEvidenceQuestion":
        return answerEvidenceQuestion({ client, safetyId, supabaseClient, userId, payload });
      case "continueAfterEvidence":
        return setEvidenceRoundDecision({ supabaseClient, userId, payload, anotherRound: false });
      case "requestAdditionalEvidenceRound":
        return setEvidenceRoundDecision({ supabaseClient, userId, payload, anotherRound: true });
      case "cancelGenerationJob": {
        const jobId = requireJobId(payload);
        const { error } = await supabaseClient
          .from("generation_jobs")
          .update({ status: "cancelled", stage: "cancelled", finished_at: now(), updated_at: now() })
          .eq("id", jobId)
          .eq("user_id", userId);
        if (error) throw error;
        return jsonResponse({ ok: true });
      }
      case "generateIdealJobDescription":
        return generateIdealJob(client, safetyId, payload);
      case "importProfileSource":
        return importProfileSource(client, safetyId, payload);
      case "condenseResume":
        return condenseResume(client, safetyId, payload);
      case "condenseCoverLetter":
        return condenseCoverLetter(client, safetyId, payload);
      case "reviewRenderedResume":
        return reviewRenderedResume(client, safetyId, payload);
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error: any) {
    console.error("Tailoring v2 Edge Function error:", error);
    return jsonResponse({ error: error.message || "Unexpected generation error." }, 400);
  }
});
