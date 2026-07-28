# Application details layout handoff

## Scope

This note covers the `/admin/application/:id` editor page, which contains the
resume editor, cover-letter editor, web preview, and resume-bullet evidence rail.

## Layout contract

- `App.tsx` owns the fixed admin navbar and reserves its 4rem height on the
  admin content wrapper.
- `pages/ApplicationDetails.tsx` owns the route toolbar and page canvas.
- The route toolbar is intentionally in normal document flow. It must not be
  sticky because the admin shell already has a fixed navbar offset; a second
  sticky layer can cover the top of the resume or evidence rail while scrolling.
- Resume view uses a single-column stack below the `xl` breakpoint and a
  `minmax(0, 1fr) 20rem` grid at `xl`. The first column must be allowed to
  shrink, while the resume canvas remains horizontally scrollable if the
  viewport is narrower than an A4/Letter page.
- Cover-letter and web-preview canvases are bounded with `min-w-0` and
  `max-w-full` so long content cannot expand the route beyond the viewport.

## Verification notes

The focused change is limited to route-level positioning and sizing classes.
Do not “fix” unrelated lint or test failures when validating this page. A
production build is the appropriate baseline check; visual verification should
cover a desktop viewport at and above `xl`, a tablet width below `xl`, and a
narrow mobile width with each of Resume, Cover, and Web selected.
