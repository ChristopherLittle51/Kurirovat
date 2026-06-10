# Ideal Role Generator

## Goal

Generate a theoretical job title and company-neutral job description that is a 100% evidence-backed match for the user's saved profile.

This feature is a benchmark generator. It does not search for a live opening, invent an employer, or predict that a matching role exists.

## User Flow

1. Open `Ideal Role` from the admin navigation.
2. Optionally enter direction such as a preferred emphasis or role style.
3. Select `Generate Ideal Role`.
4. Review and edit the generated title and description.
5. Copy the benchmark or use it to seed the existing New Application form.

When the result seeds a new application, the company field remains empty. This prevents the theoretical benchmark from being mistaken for a real employer and requires the user to supply a real company before tailoring an application.

## Architecture

### Frontend

- `pages/IdealRolePage.tsx`
  - Loads the authenticated user's saved profile through `SupabaseService.getProfile`.
  - Calls `GeminiService.generateIdealJobDescription`.
  - Keeps generated output editable in local state.
  - Supports clipboard copy and navigation into `/admin/new`.
- `services/geminiService.ts`
  - Invokes the existing authenticated `gemini-api` Supabase Edge Function.
- `App.tsx`
  - Registers `/admin/ideal-role` under the protected admin layout.
- `components/Navbar.tsx`
  - Adds the `Ideal Role` navigation entry.

### Edge Function

`supabase/functions/gemini-api/index.ts` handles the `generateIdealJobDescription` action.

The prompt sends only career-relevant profile fields to Gemini:

- summary, skills, experience, and education
- usable achievement-bank entries
- GitHub projects and imported profile summaries
- target roles and preferred industries as preferences
- anti-claims as hard constraints

Achievement entries marked `neverUse` are removed before prompt assembly.

## Grounding Rules

The generated job description must:

- use a market-recognizable role title
- remain company-neutral
- include role overview, responsibilities, required qualifications, and preferred qualifications
- include only responsibilities and qualifications supported by saved profile evidence
- avoid invented years, metrics, tools, certifications, degrees, management scope, or industry experience
- omit personal and employer-identifying information
- avoid compensation, location, benefits, and hiring-process details

The optional user direction changes emphasis only. It is explicitly treated as preference rather than evidence.

## Data and Persistence

No database migration is required. Generated results remain client-side until the user copies them or uses them to seed a new application.

The existing profile schema remains the source of truth. The existing application flow remains responsible for saving any real application created from the benchmark.

## Deployment

The frontend and the updated `gemini-api` Edge Function must both be deployed. A frontend deployment without the Edge Function action will return an unknown-action error.

## Verification

Completed:

```bash
rtk npm run build
```

The production build succeeds. It continues to emit the existing bundle-size warning.

`rtk npx tsc --noEmit` still reports the existing 38 errors in `ResumeTemplate`, `CoverLetterTemplate`, `ApplicationDetails`, and the missing `react-dom/client` declaration. No TypeScript errors reference the new ideal-role page, service action, route, or shared type.

The local browser smoke test confirmed that `/admin/ideal-role` resolves through the protected route and redirects an unauthenticated visitor to the existing sign-in page without console errors. End-to-end generation requires an authenticated profile and deployment of the updated Edge Function.

Manual verification should cover:

1. Authenticated profile load.
2. Successful generation with and without optional direction.
3. Editable title and description.
4. Clipboard copy.
5. `Use in New Application` pre-fills title and description but leaves company blank.
6. Regeneration replaces the current benchmark.
