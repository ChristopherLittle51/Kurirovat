# Responsive Mobile Pass

## Intent
Kurirovat should render from narrow mobile viewports through desktop without body-level horizontal scrolling, clipped primary controls, or text pushing buttons past the screen.

## Layout Conventions
- Page shells should be mobile-first: prefer `px-4 py-6 sm:px-6 lg:px-8` over a blanket `p-8`.
- Flex and grid children that contain user data, generated text, URLs, or headings need `min-w-0` so they can shrink inside the available viewport.
- Action clusters should use `flex flex-col sm:flex-row`, `flex-wrap`, or responsive hidden labels instead of fixed-width rows on mobile.
- Long values such as URLs, emails, company names, role titles, prompt text, and generated descriptions should use `break-words`, `break-all`, `truncate`, or local scroll containers based on the content type.

## Document Preview Rules
- Resume and cover-letter previews are allowed to scroll inside their preview container.
- The preview container should carry the horizontal scroll, not the page body.
- Fixed-format document components should use `w-full max-w-[210mm]` where possible; templates that must remain print-sized should be wrapped in `max-w-full overflow-x-auto`.

## Verification Viewports
Check each route at `320x640`, `375x667`, `390x844`, `768x1024`, and desktop width. Body-level width should satisfy `document.documentElement.scrollWidth <= window.innerWidth`, except where a nested table or document preview intentionally scrolls inside its own container.

## Notes For Future Work
- Do not hide body overflow as the only fix for a component-level problem.
- Keep admin and public route behavior unchanged; this document only describes layout behavior.
- If authenticated data is not available during local verification, verify route shells and unauthenticated states, then record which protected screens could not be inspected with real data.
