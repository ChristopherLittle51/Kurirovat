# Generation job timeout recovery

## Incident signature

An affected job has an error similar to:

`Request idle timeout limit (150s) reached`

The worker log may show a long `model_call_completed` duration immediately
before the request ends. The job can be reported as `Failed to start worker`
even though the failure happened at the Edge Function platform boundary.

## Root cause

Tailoring is checkpointed one model stage at a time, but a high-reasoning
judgment call can consume most of the 150-second Edge Function idle budget.
When the platform terminates the request, application code cannot run its
failure handler. The browser-side invocation error previously treated every
non-546 response as terminal, which lost the resumable queue state.

## Recovery behavior

- `gpt-5.6-sol` worker stages use medium reasoning to leave time for database
  checkpoints and response handling.
- HTTP 408/504/546 responses and timeout/resource-limit messages remain
  `queued`, preserve the checkpoint and progress, and clear `finished_at`.
- The queue page can invoke the next stage on its next refresh. The original
  platform message remains in `error_message`.
- Non-timeout failures remain terminal and require the existing Retry action.

## Verification

1. Deploy the updated Edge Function and frontend together.
2. Start a new generation and inspect `generation_jobs.stage`, `progress`, and
   `working_state` after each refresh.
3. Confirm long-stage failures remain `queued`, with `finished_at` null, and
   that a later invocation resumes from the saved `working_state` rather than
   repeating completed model stages.
4. Confirm a completed job still creates exactly one application through the
   `tailoring_run_id` uniqueness guard.

Do not manually edit a job to `succeeded` or insert an application to bypass a
failed stage; resume from the last durable checkpoint instead.
