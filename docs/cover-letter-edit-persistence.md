# Cover Letter Edit Persistence

## Problem

Cover letter text appeared editable, but the changed value reverted as soon as
the textarea lost focus.

## Root Cause

`CoverLetterTemplate` renders the shared `InlineEdit` component. `InlineEdit`
keeps a temporary value while a field is focused and commits that value through
its required `onSave` callback during `onBlur`.

The cover letter integration supplied an `onChange` prop instead. Because
`InlineEdit` does not consume that prop, its blur handler could not call the
page-level update function. The temporary textarea was then replaced by the
read-only view using the unchanged `coverLetterContent` prop, which made the
edit appear to revert.

## Fix

`components/CoverLetterTemplate.tsx` now passes
`onSave={handleContentChange}` to `InlineEdit`.

The resulting update path is:

1. The user clicks the cover letter body and edits the temporary textarea.
2. `InlineEdit.handleBlur` calls `onSave` with the edited content.
3. `ApplicationDetails.handleCoverLetterUpdate` writes the content into the
   local `application` state and marks the application as changed.
4. The application detail page's existing auto-save effect sends the updated
   `coverLetter` to `SupabaseService.updateApplication`.
5. `updateApplication` maps the value to the `applications.cover_letter`
   column.

## Verification

Run:

```bash
rtk npm run build
```

Manual browser check:

1. Open a saved application.
2. Select the Cover view.
3. Click the letter body and change the text.
4. Click outside the field.
5. Confirm the changed text remains visible and the save state changes from
   unsaved/saving to saved.
6. Reload the application and confirm the edited text is still present.

## Related Contract

New usages of `components/InlineEdit.tsx` must provide `onSave`, not
`onChange`. The component intentionally commits changes on blur rather than on
every keystroke.
