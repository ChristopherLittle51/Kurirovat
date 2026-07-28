import { describe, expect, it } from 'vitest';
import {
    appendRenderIssues,
    calculateOutcomeTimeline,
    findDuplicateEvidence,
    prioritizeEvidenceQuestions,
    validateTailoredProfile,
} from './tailoringV2';
import type { CandidateEvidence, EvidenceQuestion, TailoredApplication, UserProfile } from '../types';

const evidence = (overrides: Partial<CandidateEvidence> = {}): CandidateEvidence => ({
    id: 'evidence-1',
    title: 'Checkout repair',
    situation: 'A checkout workflow was unreliable.',
    action: 'Redesigned the retry boundary.',
    result: 'Reduced failures by 30%.',
    metric: '30%',
    scope: '4 teams',
    tools: ['Postgres'],
    teamSize: '4 teams',
    domain: 'commerce',
    tags: ['requirement:req-1'],
    sourceType: 'manual',
    confidence: 'high',
    roleIds: ['role-1'],
    mustInclude: false,
    niceToUse: true,
    unavailable: false,
    disabled: false,
    roleFamilyConstraints: [],
    ...overrides,
});

describe('Tailoring v2 evidence controls', () => {
    it('deduplicates normalized STAR evidence', () => {
        expect(findDuplicateEvidence([evidence()], {
            title: 'Checkout repair',
            action: 'Redesigned the retry boundary.',
            result: 'Reduced failures by 30%.',
            metric: '30%',
        })?.id).toBe('evidence-1');
    });

    it('does not repeat questions covered by active evidence and caps a round at five', () => {
        const questions: EvidenceQuestion[] = Array.from({ length: 8 }, (_, index) => ({
            id: `q-${index}`,
            requirementIds: [index === 0 ? 'req-1' : `req-${index + 1}`],
            prompt: `Question ${index}`,
            reason: 'Missing proof',
            missingFields: ['result'],
            priority: 10 - index,
            status: 'pending',
        }));
        const selected = prioritizeEvidenceQuestions(questions, [evidence()]);
        expect(selected).toHaveLength(5);
        expect(selected.some((question) => question.requirementIds.includes('req-1'))).toBe(false);
    });

    it('flags unsupported numeric claims, duplicates, chronology, and page overflow', () => {
        const profile: UserProfile = {
            fullName: 'Candidate',
            email: 'candidate@example.com',
            phone: '',
            location: '',
            summary: 'Evidence-led operator.',
            skills: [],
            education: [],
            links: [],
            experience: [
                { id: 'old', company: 'Old', role: 'Old role', startDate: '2018', endDate: '2020', description: ['Improved conversion by 45% across the checkout flow.'] },
                { id: 'new', company: 'New', role: 'New role', startDate: '2021', endDate: 'Present', description: ['Improved conversion by 45% across the checkout flow.'] },
            ],
        };
        const issues = appendRenderIssues(validateTailoredProfile(profile, [evidence()]), 3, ['full', 'full', 'one line']);
        expect(issues.map((item) => item.code)).toEqual(expect.arrayContaining([
            'unsupported_metric',
            'duplicate_bullet',
            'chronology',
            'page_overflow',
            'orphan_page',
        ]));
    });
});

describe('application outcome timelines', () => {
    it('ignores unknown dates and computes known intervals', () => {
        const application = {
            applicationEvents: [
                { id: '1', applicationId: 'app', eventType: 'legacy_status_imported', occurredAt: null, recordedAt: '2026-01-01', notes: '', metadata: {} },
                { id: '2', applicationId: 'app', eventType: 'applied', occurredAt: '2026-01-01T12:00:00Z', recordedAt: '2026-01-01', notes: '', metadata: {} },
                { id: '3', applicationId: 'app', eventType: 'reply_received', occurredAt: '2026-01-04T12:00:00Z', recordedAt: '2026-01-04', notes: '', metadata: {} },
                { id: '4', applicationId: 'app', eventType: 'interview_scheduled', occurredAt: '2026-01-06T12:00:00Z', recordedAt: '2026-01-06', notes: '', metadata: {} },
            ],
        } as TailoredApplication;
        expect(calculateOutcomeTimeline(application)).toMatchObject({
            daysToReply: 3,
            daysReplyToInterview: 2,
        });
    });
});
