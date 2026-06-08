# Tailoring Platform Expansion

## Goal
Implement the first full pass of the grounded tailoring system:

- structured JD analysis
- evidence-backed generation
- richer tailoring controls
- diagnostics and critique
- reusable achievement bank
- saved playbooks
- lead-source ingestion surfaces

## Current implementation order
1. Expand shared types and persistence contracts.
2. Refactor the Gemini edge function into explicit analysis and generation stages.
3. Upgrade onboarding and generation flows to capture richer inputs.
4. Upgrade application details to show diagnostics, prompt preview, and redo instructions.
5. Add lead-source API surfaces for future agent-driven discovery.

## Notes
- Truthfulness is strict: no unsupported metrics or claims.
- Default strategy remains `Balanced`.
- One primary draft per run; alternates come through targeted regeneration.
- Diagnostics should be stored with the application so critique survives reloads.
- Lead discovery is manual-review-oriented in this pass; no auto-apply behaviors.

## Implemented in this pass
- `types.ts` now includes:
  - `AchievementBankEntry`
  - `TailoringPlaybook`
  - `JobAnalysis`
  - `EvidenceResolution`
  - `TailoringDiagnostics`
  - `TailoringOptions`
  - `LeadSource`, `LeadSourceCheck`, `JobLead`
- `supabase/migrations/20260608120000_tailoring_platform_expansion.sql` adds:
  - profile JSON columns for achievements, playbooks, imports, guardrails, regions
  - application JSON columns for job analysis, evidence, diagnostics, prompt preview, regeneration history
  - `lead_sources`, `lead_source_checks`, and `job_leads`
- `supabase/functions/gemini-api/index.ts` is now staged:
  1. JD analysis
  2. company research
  3. evidence resolution
  4. section-specific generation for summary, skills, experience, cover letter
  5. blunt diagnostics and redo suggestions
- `components/Generator.tsx` now exposes:
  - preset / career / critique controls
  - weighting sliders
  - editable JD analysis
  - prompt preview
  - playbook selection and save
- `components/Onboarding.tsx` now captures:
  - imported profile sources
  - target roles, industries, regions
  - anti-claims
  - achievement bank entries
- `pages/ApplicationDetails.tsx` now surfaces:
  - grounded critique
  - job analysis
  - prompt preview
  - redo suggestions
  - expanded regeneration settings
- Agent-facing lead endpoints added:
  - `api/lead-sources.ts`
  - `api/job-leads.ts`

## Verification
- `npm run build` succeeds after the changes.
- The repo-wide `npx tsc --noEmit` baseline is still noisy because the workspace is missing React type declarations, but the changed app files no longer show up in the filtered error output used during this pass.
