# Generation Queue Management

## Scope

The generation queue is a standalone admin surface at `/admin/generation-queue`. The New Application page is responsible only for collecting the job description and submitting a durable generation job.

## Runtime behavior

- `GenerationQueuePage` loads the signed-in user's recent jobs and polls every 2.5 seconds.
- Queued jobs are kicked through the existing `gemini-api` worker from the queue page, so leaving the form does not stop processing.
- Failed jobs can be retried from their checkpoint.
- Queued, running, and evidence-interview jobs can be cancelled.
- Succeeded, failed, and cancelled jobs can be removed. The accompanying RLS policy enforces that only terminal jobs owned by the current user are deletable.
- Removal requests use `delete().select('id')` and reject zero-row responses. This matters because RLS can filter a row without returning a PostgREST error; otherwise the queue would refresh and make a failed removal look successful.
- Evidence questions and the round decision controls live with the job in the queue, rather than on the creation form.

## Files

- `pages/GeneratorPage.tsx`: creates a job, then navigates to the queue.
- `pages/GenerationQueuePage.tsx`: owns polling, worker kicking, evidence actions, retry, cancellation, and removal UI.
- `services/supabaseService.ts`: exposes `removeGenerationJob` alongside the existing generation-job operations.
- `supabase/migrations/20260728200000_allow_generation_job_removal.sql`: adds terminal-only delete RLS and the authenticated delete grant.

## Verification

Run `pnpm build`. Manually verify: submit a new application, leave the form, observe progress at `/admin/generation-queue`, retry a failed job, cancel an active job, answer an evidence question, open a successful application, and remove terminal history. Confirm the removed job disappears after refresh. If removal reports that it is not enabled, apply `supabase/migrations/20260728200000_allow_generation_job_removal.sql` to the target Supabase project; the frontend cannot grant itself the required delete permission.
