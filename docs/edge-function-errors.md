# Edge Function errors

The frontend calls the historical `gemini-api` Supabase Edge Function for
resume parsing, job analysis, tailoring, and generation-job actions.

## What the generic message means

`Edge Function returned a non-2xx status code` is the generic
`FunctionsHttpError.message` from `@supabase/supabase-js`. It does not identify
the failure. The client now reads the function response body first, so errors
such as `Missing authorization token.`, `Profile not found`, an OpenAI error,
or a database/RLS error remain visible to the operator.

## Focused diagnosis

1. Open the browser console and reproduce the action. Look for the full
   `Edge Function Error (<action>)` object and the resulting application error.
2. In Supabase Dashboard, open Edge Functions → `gemini-api` → Logs and inspect
   the timestamp matching the request. The function logs both top-level
   failures and generation-job failures.
3. Confirm the browser session is valid. The client refreshes the session and
   sends its access token in the `Authorization` header; a 401 means the user
   must sign in again.
4. Confirm the deployed function has `OPENAI_API_KEY` and that the deployed
   code includes the requested action. The directory retains the `gemini-api`
   name even though the runtime uses OpenAI.
5. For a generation job, inspect the `generation_jobs.error_message` and
   `stage` fields. The worker persists failures before returning its 400.

## `546 WORKER_RESOURCE_LIMIT`

Supabase terminates an Edge Function invocation when it exhausts its worker
resource budget. A generation request that performs analysis, evidence
matching, drafting, repair, and review in one request can reach that limit.
The generation worker now performs one model stage per invocation, checkpoints
`working_state`, returns the job to `queued`, and lets the application schedule
the next invocation. A pre-fix 546 can leave a job as `running`; use Retry once
to put it back in the resumable queue.

Each model stage now emits `model_call_started`, `model_call_completed`, or
`model_call_failed` with its schema name and duration. Use those entries to
separate slow OpenAI responses from database or Edge runtime overhead.
`generation_stage_entered` records the checkpoint keys used to select the next
stage; repeated `job_analysis` entries with the same empty state indicate a
failed checkpoint write, while a changing state-key set indicates normal
resumption.

Idle and worker-resource-limit responses are retryable. The client leaves the
job in `queued` with `finished_at` unset so the queue page can invoke the next
checkpoint; these responses must not be converted into a terminal `failed`
state. Judgment stages use medium reasoning to leave margin below the 150
second platform idle limit. The original error remains in `error_message` for
operator diagnosis.

The model does not see database UUIDs. It receives deterministic opaque
references such as `E1` and `E2`, assigned by canonical evidence UUID order.
The function maps every evidence-reference field—including the plain
`evidenceIds` arrays on plans and bullets—back to canonical IDs immediately
after the response. The reverse mapping is applied when a canonical strategy
or draft is sent to a later model stage.

The structured-output schema is generated with the exact allowed `E#` values
for each call. Canonical evidence UUIDs and legacy evidence IDs are removed
from the candidate-evidence prompt projection, and a UUID cannot satisfy an
evidence-reference output field.

An unknown alias is a deterministic contract failure. The worker records it
and stops; it does not spend money retrying the same prompt. Retry only after
correcting or deploying the reference mapper.

### Stale `E#` evidence references

`Model returned evidence IDs not present in the evidence library: E13, ...`
was caused by a case-sensitive mapper that handled aggregate fields such as
`summaryEvidenceIds` but skipped the plain `evidenceIds` fields on plans and
bullets. Those aliases were checkpointed and then compared with UUIDs. The
mapper now uses one shared field predicate for both shapes. Older checkpoints
are normalized once using their legacy query order; new checkpoints contain
only canonical evidence UUIDs.

After deploying this fix, retry the failed job once. Do not delete candidate
evidence rows or weaken the validator.

Job IDs are validated as UUIDs before any Postgres query. A value must follow
the `8-4-4-4-12` format; for example, an extra character in the final segment
is invalid and should be corrected at the caller. To trace provenance, compare
`generation_job_created`, `[GenerationJob] kick payload`, and
`generation_job_id_received`; each includes the raw ID and character length.

Do not put `OPENAI_API_KEY` in Vite or browser environment variables.
