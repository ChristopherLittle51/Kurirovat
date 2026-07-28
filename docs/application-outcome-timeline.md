# Application outcome timeline

## Data model

`application_events` is the authoritative history. Each event stores:

- `event_type`;
- nullable `occurred_at`;
- immutable `recorded_at`;
- notes;
- optional interview round;
- metadata;
- application and owner IDs.

Supported types are created, applied, reply received, screening, interview scheduled, interview completed, rejected, offer, withdrawn, no response, and legacy status imported.

`applications.status` remains a compatibility summary. An insert trigger updates it transactionally for legacy screens. It is not the analytical source of truth.

## Historical import

Every existing application receives a dated `created` event from its real `created_at`. Existing non-pending statuses become `legacy_status_imported` events with `occurred_at = null`. This deliberately preserves uncertainty; migration time is not substituted for an unknown historical event date.

## Recording outcomes

Use the application detail timeline to add events and their actual occurrence dates. Leave the date blank when it is genuinely unknown. Status changes in legacy dropdowns insert a corresponding event instead of directly rewriting the status field.

Editing an event changes the timeline record; downstream dashboard calculations use the revised known date. Deleting material outcome history should be treated as an exceptional correction.

## Metrics

The dashboard computes:

- application-to-reply rate among applications with a known applied date;
- reply-to-interview conversion among applications with a known reply date;
- elapsed application-to-reply days;
- elapsed reply-to-interview days;
- rejection and no-response counts separately.

Unknown dates are excluded from duration denominators. A legacy final status can contribute to historical categorization only through its metadata; it must not create a fabricated duration.

## RLS and ownership

Application events use owner-scoped RLS. Inserts require ownership of both the event row and its parent application. The event trigger is `security invoker`, and public function access is revoked.
