# Website Templates And Generation Jobs

## What Changed
- Portfolio website themes now share `components/portfolio/ProfilePhoto.tsx` for profile images.
- Active web themes should show `profilePhotoUrl` wherever the template represents the person. If no photo exists, use the shared neutral placeholder instead of initials or theme symbols.
- The New Application flow now creates durable rows in `generation_jobs`, starts the Supabase worker from the active browser session, and polls for progress instead of blocking the browser while Gemini requests run.

## Responsive Template Rules
- Keep public themes mobile-first with `px-4 sm:px-6`, `min-w-0`, `break-words`, and local `overflow-x-auto` for intentionally wide content such as contribution charts.
- Do not rely on hiding body overflow to mask component-level width bugs.
- Hero names, emails, repo names, company names, roles, and bullets must wrap inside their cards or sections.
- Decorative backgrounds should be bounded with responsive dimensions so they do not create page-level horizontal scroll.

## Generation Job Flow
1. `GeneratorPage` calls `SupabaseService.startGenerationJob`.
2. `POST /api/generation-jobs` validates the bearer token, loads the latest profile, and inserts `generation_jobs`.
3. `GeneratorPage` calls `SupabaseService.kickGenerationJob` without awaiting it, so the UI stays responsive while the Edge Function runs.
4. `supabase/functions/gemini-api` handles `processGenerationJob`, updates `stage` and `progress`, runs the independent writing calls in parallel, inserts the final `applications` row, and marks the job `succeeded`.
5. `GeneratorPage` polls `generation_jobs`, resumes queued jobs after refresh, and shows status, errors, progress, and an Open Application button when complete.

This design intentionally avoids Vercel Cron so it works on the Hobby tier. If a fully server-owned retry loop becomes necessary later, prefer Supabase `pg_cron` or a queue worker over Vercel Cron.

## Required Runtime Configuration
- Vercel needs the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` values.
- Supabase Edge Functions only need `SUPABASE_SERVICE_ROLE_KEY` if a future server-owned retry path is added. The current no-cron flow uses the signed-in user's bearer token and RLS.

## Verification Notes
- Run `rtk pnpm build` after changes.
- Manually check public/admin web previews at 320, 375, 390, 768, and desktop widths.
- Confirm profile photos render in Modern, Creative, Tech, and ATS themes.
- Confirm multiple generation jobs can be queued, refresh-safe polling resumes queued jobs, failed jobs show an error, and completed jobs open the generated application.
