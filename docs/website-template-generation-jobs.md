# Website Templates And Generation Jobs

## What Changed
- Portfolio website themes now share `components/portfolio/ProfilePhoto.tsx` for profile images.
- Active web themes should show `profilePhotoUrl` wherever the template represents the person. If no photo exists, use the shared neutral placeholder instead of initials or theme symbols.
- The New Application flow now creates durable rows in `generation_jobs` and polls for progress instead of blocking the browser while Gemini requests run.

## Responsive Template Rules
- Keep public themes mobile-first with `px-4 sm:px-6`, `min-w-0`, `break-words`, and local `overflow-x-auto` for intentionally wide content such as contribution charts.
- Do not rely on hiding body overflow to mask component-level width bugs.
- Hero names, emails, repo names, company names, roles, and bullets must wrap inside their cards or sections.
- Decorative backgrounds should be bounded with responsive dimensions so they do not create page-level horizontal scroll.

## Generation Job Flow
1. `GeneratorPage` calls `SupabaseService.startGenerationJob`.
2. `POST /api/generation-jobs` validates the bearer token, loads the latest profile, inserts `generation_jobs`, and kicks the Supabase Edge Function with Vercel `waitUntil`.
3. `supabase/functions/gemini-api` handles `processGenerationJob`, updates `stage` and `progress`, runs the independent writing calls in parallel, inserts the final `applications` row, and marks the job `succeeded`.
4. `GeneratorPage` polls `generation_jobs` and shows status, errors, progress, and an Open Application button when complete.
5. `/api/generation-jobs-retry` is registered in `vercel.json` as a five-minute cron to retry queued, failed, or stale running jobs up to three attempts.

## Required Runtime Configuration
- Vercel needs the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` values.
- Vercel retry support requires `SUPABASE_SERVICE_ROLE_KEY`; without it, the cron endpoint exits without doing work.
- Supabase Edge Functions need `SUPABASE_SERVICE_ROLE_KEY` if cron retries should process jobs through the service-role path.
- Optionally set `CRON_SECRET` in Vercel and call the retry endpoint with `Authorization: Bearer <CRON_SECRET>` if you trigger it outside Vercel Cron.

## Verification Notes
- Run `rtk pnpm build` after changes.
- Manually check public/admin web previews at 320, 375, 390, 768, and desktop widths.
- Confirm profile photos render in Modern, Creative, Tech, and ATS themes.
- Confirm multiple generation jobs can be queued, refresh-safe polling resumes, failed jobs show an error, and completed jobs open the generated application.
