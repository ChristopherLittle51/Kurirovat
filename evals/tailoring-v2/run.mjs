import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const fixturePath = process.argv[2] || resolve('evals/tailoring-v2/fixtures/redacted-seed.json');
const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));

const requiredDimensions = [
  'requirementCoverage',
  'impact',
  'specificity',
  'truthfulness',
  'chronology',
  'scanQuality',
  'coverLetterUsefulness',
];

let failures = 0;
for (const comparison of fixture.comparisons || []) {
  const missing = requiredDimensions.filter((dimension) => comparison.review?.[dimension] == null);
  if (missing.length) {
    console.error(`${comparison.id}: missing review dimensions: ${missing.join(', ')}`);
    failures += 1;
  }
  if ((comparison.v2?.unsupportedNumericClaims || []).length) {
    console.error(`${comparison.id}: v2 contains unsupported numeric claims`);
    failures += 1;
  }
  if ((comparison.v2?.pageCount || 0) > 2) {
    console.error(`${comparison.id}: v2 exceeds two pages`);
    failures += 1;
  }
  if (comparison.v2?.structuredOutputValid !== true || comparison.v2?.evidenceReferencesValid !== true) {
    console.error(`${comparison.id}: v2 structured output or evidence references are invalid`);
    failures += 1;
  }
}

const reviewed = (fixture.comparisons || []).filter((item) => item.review?.winner);
const wins = reviewed.filter((item) => item.review.winner === 'v2').length;
const winRate = reviewed.length ? wins / reviewed.length : 0;
console.log(JSON.stringify({ fixture: fixturePath, reviewed: reviewed.length, wins, winRate, failures }, null, 2));
if (reviewed.length && winRate < 0.8) failures += 1;
if (failures) process.exitCode = 1;
