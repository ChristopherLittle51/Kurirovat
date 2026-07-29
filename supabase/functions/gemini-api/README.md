# Generation worker contract

The directory keeps the historical `gemini-api` function name for endpoint
compatibility. The function is an authenticated transport and orchestration
boundary: callers provide the action and payload, prompt builders assemble the
declared data, and `model.ts` forwards that structured request to OpenAI.

## Evidence reference contract

Canonical candidate-evidence IDs are database UUIDs. They are never sent to
the model. Before a model call, `evidenceReferences.ts` sorts active evidence
by canonical UUID and assigns `E1`, `E2`, and so on. This makes aliases stable
for the same evidence library even if database result order changes.

All evidence-bearing structures use one of these field shapes:

- `evidenceIds`
- `summaryEvidenceIds`
- `skillEvidenceIds`
- `coverLetterEvidenceIds`

The same recursive mapper handles every shape. Outbound canonical UUIDs become
opaque aliases; inbound aliases become canonical UUIDs before validation or a
checkpoint write. A later stage receives aliases again, derived from its
current canonical input. Durable state therefore stores UUIDs, not `E#`
references.

Unknown aliases fail closed. They are not silently dropped, guessed, or sent
through an automatic model retry. This prevents a deterministic integration
error from consuming more tokens.

Checkpoints created before this contract may contain `E#` values. The worker
performs a one-way compatibility normalization using the legacy evidence query
order, then validates the resulting UUIDs. Once a checkpoint advances, it is
stored in canonical form.

## Verification

Run the focused reference tests:

```bash
pnpm test -- supabase/functions/gemini-api/evidenceReferences.test.ts
```

The tests cover stable alias allocation, nested plan and bullet fields,
round-trip conversion, legacy checkpoint normalization, and rejection of an
alias that was not supplied to the model.
