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

## Next hardening pass
- Split generated prompt context from the user-editable prompt override.
- Keep regenerate payload ordering explicit:
  current JD -> current jobAnalysis override -> generation settings -> prompt override -> redo instructions.
- Add user-visible admin pages for lead sources and job leads using the existing API endpoints.
- Preserve lead provenance when converting a lead into an application draft.
- Replace prompt-related placeholder interactions with in-app controls.

## Hardening + lead workflow implementation
- `TailoredApplication` now separates:
  - `assembledPromptPreview` for read-only generated context
  - `promptOverride` for the user-editable delta
- `TailoringOptions` and saved playbooks now use `promptOverride` instead of treating the full preview blob as editable state.
- `pages/ApplicationDetails.tsx` now:
  - saves and reloads prompt override separately from generated preview
  - passes explicit `jobAnalysisOverride` during regenerate
  - shows matched keywords, missing keywords, missing evidence, blocked claims, and rewrite insights
  - surfaces source/provenance links through `searchSources`
- `components/Generator.tsx` now:
  - shows separate assembled preview and prompt override panels
  - uses an in-app modal for playbook save
  - supports prefilled lead conversion drafts
- Lead workflow now includes:
  - `services/leadService.ts`
  - `pages/LeadSourcesPage.tsx`
  - `pages/JobLeadsPage.tsx`
  - admin routes and navbar entries for both pages
- Job lead conversion now preloads the generator route with company/title/raw description and preserves lead provenance as a source link on the saved application.

## Verification for this pass
- `npm run build` succeeds after the hardening and lead UI changes.
- Filtered `npx tsc --noEmit` output shows no hits for the files changed in this pass.
