# Tailoring v2 evaluation

## Principle

Interview and rejection outcomes are weak labels. They help choose representative cases but do not prove the resume caused the outcome. Prompt changes are judged first on truthfulness, recruiter quality, and paired human preference; callback behavior is measured prospectively after release.

## Local harness

Run:

```bash
pnpm eval:tailoring-v2
```

The harness reads `evals/tailoring-v2/fixtures/redacted-seed.json`, verifies the required review dimensions and hard output gates, and fails when reviewed v2 outputs win fewer than 80% of comparisons. Pass a different fixture path as the first argument.

Private resumes, job descriptions, generated artifacts, and outcome histories must remain uncommitted. The repository contains only a synthetic fixture, rubric, and runner. Build a private seed containing:

- both known interview-producing applications;
- representative rejections;
- role and seniority variety;
- sparse and rich evidence cases;
- resumes that previously overflowed or contained weak historical bullets.

## Paired human review

Blind the reviewer to which output is legacy or v2. Score both from 1–5 on:

- requirement coverage;
- impact;
- specificity;
- truthfulness;
- chronology;
- recruiter scan quality;
- cover-letter usefulness.

Record a winner, tie, and short rationale. Outcomes may be shown only after the quality review is complete.

## Hard gates

Every v2 case must have:

- zero unsupported numeric claims;
- valid evidence IDs for every generated claim;
- valid structured output;
- correct pause/resume behavior;
- no repeated adequately answered question;
- no more than two rendered pages;
- no more than one automatic repair.

Before enabling v2 by default, it must win at least 80% of paired human comparisons and must not regress either known interview-positive case. Refusals, malformed output, timeouts, and unavailable rendered-PDF review must produce a recoverable job state or an advisory warning rather than fabricated content.

## Run telemetry

Persist model, reasoning tier, prompt/schema versions, latency, input/output/reasoning tokens, estimated cost when configured, deterministic/model warnings, repair count, selected evidence, user edits, export decisions, and subsequent application events. Do not store OpenAI reasoning content.

Prospective funnel analysis must exclude unknown event dates and keep rejection distinct from no response. Wait for enough timeline-complete applications before optimizing prompts against callback outcomes.
