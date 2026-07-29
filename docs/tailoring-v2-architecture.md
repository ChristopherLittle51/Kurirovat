# Tailoring v2 architecture

## Purpose

Tailoring v2 makes saved candidate evidence—not the source resume or model memory—the authoritative source for application claims. The job description determines relevance and ordering; it never authorizes new facts.

## Pipeline

`generation_jobs` is the durable coordinator:

1. `job_analysis`: Terra extracts stable, prioritized `JobRequirement` records, expected proof, hiring outcomes, seniority signals, and recruiter risks.
2. `evidence_matching`: Sol maps every requirement to saved `candidate_evidence` as `strong`, `partial`, `gap`, or `blocked`.
3. `needs_input`: the job persists up to five prioritized questions. The UI presents only the first pending question. An answer is normalized by Terra, deduplicated, and inserted into the evidence library. Skip and no-evidence dispositions are saved on the job.
4. `content_strategy`: Sol selects roles, section budgets, evidence-to-bullet assignments, omissions, and cover-letter stories. The target is exactly two pages.
5. `drafting`: Sol writes both artifacts from the same strategy. Draft bullets carry requirement and evidence IDs.
6. `review`: deterministic validation and an independent Sol recruiter review run without the drafting rationale. One repair pass is allowed.
7. `render_review`: export builds the actual template PDF, then PDF.js checks its page count and extracted text. Sol layout review is requested when available.
8. `completed`: the application, quality report, content strategy, evidence usage, model configuration, versions, and usage are persisted.

Completed model stages live in `generation_jobs.working_state`. Refreshing or returning later therefore does not repeat analysis or answered questions. `needs_input` and `cancelled` are first-class job states.

## Model and privacy boundary

One Edge Function client uses the OpenAI Responses API:

- `gpt-5.6-terra`, medium reasoning: parsing, JD extraction, evidence normalization, imported-source normalization, ideal-role normalization, and condensing.
- `gpt-5.6-sol`, medium reasoning: evidence judgment, strategy, drafting, repair, recruiter review, and rendered-PDF review. The worker uses medium reasoning so a single stage leaves margin for durable checkpoint writes below the Edge Function idle limit.

Every structured call uses Zod-backed Structured Outputs, explicit reasoning effort, `store: false`, and a SHA-256-derived `safety_identifier`. Raw reasoning is never requested or saved. Candidate evidence and job checkpoints live in owner-scoped tables; application strategies, evidence mappings, prompt controls, model metadata, and quality reports live in `application_private_artifacts`. The migration copies legacy tailoring artifacts there and clears their values from application rows exposed by the historical public portfolio policy. The service-role token is accepted only for the background worker path and still requires an explicit user ID.

The Edge Function directory keeps its historical `gemini-api` name only to avoid breaking deployed callers. There is no active Gemini SDK or runtime action.

## Evidence integrity

`candidate_evidence` stores situation, action, result, metrics, scope, tools, team size, domain, provenance, confidence, role associations, tags, availability flags, and last-use time. Existing achievement-bank entries are backfilled while preserving UUIDs or retaining prior IDs in `legacy_id`.

Deterministic validation rejects or warns on:

- unsupported numbers;
- missing contact data or empty sections;
- reverse-chronology errors;
- duplicate bullets;
- vague bullets;
- malformed or suspicious text;
- page overflow and orphan final pages.

The model reviewer separately scores truthfulness, coverage, specificity, impact, recruiter scanning, ATS clarity, and cover-letter value. Remaining warnings are visible and nonblocking.

## Operator workflow

1. Apply the migration.
2. Set `OPENAI_API_KEY` as an Edge Function secret.
3. Deploy the existing `gemini-api` function.
4. Start an application. If the job pauses, answer, skip, or mark the displayed question unavailable.
5. Review the content strategy, evidence coverage, and recruiter report on the application.
6. Select a template and use **Review & Download**. The downloaded blob is the same blob inspected locally and submitted for optional layout review.
7. Record outcome events from the application timeline.

After all active actions have been exercised in the deployed environment, remove the old `GOOGLE_GENAI_API_KEY` secret.
