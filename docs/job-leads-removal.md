# Job Leads removal

## Summary

The unused Job Leads feature was removed from the application on 2026-07-28 to reduce the density of the authenticated navigation bar and eliminate an unmaintained workflow.

## Removed application surfaces

- Removed the `Job Leads` desktop and mobile navigation item from `components/Navbar.tsx`.
- Removed the `/admin/job-leads` route and page import from `App.tsx`.
- Removed `pages/JobLeadsPage.tsx` and the unused `api/job-leads.ts` endpoint.
- Removed job-lead data access and the lead-to-application adapter from `services/leadService.ts` and `services/supabaseService.ts`.
- Removed the `JobLead`, `JobLeadMatch`, and `ApplicationLeadContext` types.
- Removed the generator banner and generation request plumbing that only existed to carry a saved job lead into a new application.

## Intentionally retained

Lead Sources remains available at `/admin/lead-sources`. It is a separate source-tracking workflow and uses `lead_sources` and `lead_source_checks`; removing Job Leads does not remove those tables or their UI.

The historical migration `supabase/migrations/20260608120000_tailoring_platform_expansion.sql` still contains the original `job_leads` table definition and policies. It was not edited because applied migrations are immutable history. The table is now an unused database artifact and should only be dropped through a separately reviewed cleanup migration after confirming that no deployment, backup, or operator workflow still depends on it.

## Verification

The source tree was searched for runtime references to `JobLead`, `ApplicationLeadContext`, `leadContext`, and the `/admin/job-leads` route. The only remaining `job_leads` references are in the historical migration noted above.

Run the focused application checks with:

```bash
pnpm build
```

Unrelated linting and tests are intentionally outside this change.
