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

Do not put `OPENAI_API_KEY` in Vite or browser environment variables.
