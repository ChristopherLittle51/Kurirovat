import {
  ApplicationEvent,
  CandidateEvidence,
  EvidenceQuestion,
  QualityIssue,
  TailoredApplication,
  UserProfile,
} from '../types';

const numberPattern = /(?:[$£€]\s*)?\b\d+(?:[.,]\d+)*(?:\s*%|\+)?\b/g;
const wordPattern = /[a-z0-9]+/g;

export const normalizeEvidenceKey = (input: Partial<CandidateEvidence>) =>
  [input.title, input.action, input.result, input.metric]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .match(wordPattern)
    ?.join(' ')
    .slice(0, 240) || '';

export const findDuplicateEvidence = (
  evidence: CandidateEvidence[],
  candidate: Partial<CandidateEvidence>,
) => {
  const key = normalizeEvidenceKey(candidate);
  if (!key) return undefined;
  return evidence.find((item) => !item.disabled && normalizeEvidenceKey(item) === key);
};

export const prioritizeEvidenceQuestions = (
  questions: EvidenceQuestion[],
  evidence: CandidateEvidence[],
  limit = 5,
) => {
  const covered = new Set(
    evidence
      .filter((item) => !item.disabled && !item.unavailable)
      .flatMap((item) => item.tags.filter((tag) => tag.startsWith('requirement:')))
      .map((tag) => tag.replace('requirement:', '')),
  );

  return [...questions]
    .filter((question) =>
      question.status === 'pending'
      && !question.requirementIds.every((id) => covered.has(id)),
    )
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
    .slice(0, limit);
};

const parseExperienceDate = (value?: string) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  if (/present|current/i.test(value)) return Number.POSITIVE_INFINITY;
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return parsed;
  const year = value.match(/\b(19|20)\d{2}\b/)?.[0];
  return year ? Date.parse(`${year}-01-01`) : Number.NEGATIVE_INFINITY;
};

const metricsFromEvidence = (evidence: CandidateEvidence[]) =>
  new Set(
    evidence
      .filter((item) => !item.disabled && !item.unavailable)
      .flatMap((item) => `${item.metric} ${item.result} ${item.scope}`.match(numberPattern) || [])
      .map((value) => value.replace(/\s+/g, '').toLowerCase()),
  );

const issue = (
  code: string,
  severity: QualityIssue['severity'],
  section: string,
  message: string,
  extra: Partial<QualityIssue> = {},
): QualityIssue => ({
  id: `${code}-${section}-${extra.experienceId || ''}-${extra.bulletIndex ?? ''}`,
  code,
  severity,
  section,
  message,
  ...extra,
});

export const validateTailoredProfile = (
  profile: UserProfile,
  evidence: CandidateEvidence[],
): QualityIssue[] => {
  const issues: QualityIssue[] = [];
  const supportedMetrics = metricsFromEvidence(evidence);

  if (!profile.fullName?.trim()) {
    issues.push(issue('missing_name', 'error', 'header', 'Candidate name is missing.'));
  }
  if (!profile.email?.trim() && !profile.phone?.trim()) {
    issues.push(issue('missing_contact', 'error', 'header', 'Email and phone are both missing.'));
  }
  if (!profile.summary?.trim()) {
    issues.push(issue('empty_summary', 'warning', 'summary', 'Professional summary is empty.'));
  }
  if (!profile.experience?.length) {
    issues.push(issue('empty_experience', 'error', 'experience', 'No professional experience was selected.'));
    return issues;
  }

  const seenBullets = new Map<string, string>();
  let previousDate = Number.POSITIVE_INFINITY;
  profile.experience.forEach((experience) => {
    const endDate = parseExperienceDate(experience.endDate || experience.startDate);
    if (endDate > previousDate) {
      issues.push(issue(
        'chronology',
        'error',
        'experience',
        `${experience.role} is out of reverse chronological order.`,
        { experienceId: experience.id },
      ));
    }
    previousDate = Math.min(previousDate, endDate);

    if (!experience.description?.length) {
      issues.push(issue(
        'empty_role',
        'warning',
        'experience',
        `${experience.role} has no selected bullets.`,
        { experienceId: experience.id },
      ));
    }

    experience.description?.forEach((bullet, bulletIndex) => {
      const normalized = bullet.toLowerCase().match(wordPattern)?.join(' ') || '';
      if (!normalized || normalized.length < 25) {
        issues.push(issue(
          'weak_bullet',
          'warning',
          'experience',
          `Bullet ${bulletIndex + 1} under ${experience.role} is too short or vague.`,
          { experienceId: experience.id, bulletIndex },
        ));
      }
      if (/(.)\1{5,}|[a-z]{18,}|(?:asd|qwe|zxc){2,}/i.test(bullet)) {
        issues.push(issue(
          'suspicious_text',
          'error',
          'experience',
          `Bullet ${bulletIndex + 1} under ${experience.role} contains suspicious or malformed text.`,
          { experienceId: experience.id, bulletIndex },
        ));
      }
      const duplicateAt = seenBullets.get(normalized);
      if (duplicateAt) {
        issues.push(issue(
          'duplicate_bullet',
          'error',
          'experience',
          `This bullet duplicates content already used under ${duplicateAt}.`,
          { experienceId: experience.id, bulletIndex },
        ));
      } else if (normalized) {
        seenBullets.set(normalized, experience.role);
      }
      for (const metric of bullet.match(numberPattern) || []) {
        const normalizedMetric = metric.replace(/\s+/g, '').toLowerCase();
        const isDate = /^(19|20)\d{2}$/.test(normalizedMetric);
        if (!isDate && !supportedMetrics.has(normalizedMetric)) {
          issues.push(issue(
            'unsupported_metric',
            'error',
            'experience',
            `Metric "${metric}" is not present in saved candidate evidence.`,
            { experienceId: experience.id, bulletIndex },
          ));
        }
      }
    });
  });

  return issues;
};

export const appendRenderIssues = (
  issues: QualityIssue[],
  pageCount: number,
  extractedPageText: string[] = [],
) => {
  const next = [...issues];
  if (pageCount > 2) {
    next.push(issue('page_overflow', 'error', 'render', `Resume renders to ${pageCount} pages; maximum is 2.`));
  }
  const lastPage = extractedPageText.at(-1)?.trim() || '';
  if (pageCount > 1 && lastPage && lastPage.split(/\s+/).length < 30) {
    next.push(issue('orphan_page', 'error', 'render', 'The final page contains too little content and appears orphaned.'));
  }
  return next;
};

const firstEventTime = (events: ApplicationEvent[], types: ApplicationEvent['eventType'][]) =>
  events
    .filter((event) => types.includes(event.eventType) && event.occurredAt)
    .map((event) => Date.parse(event.occurredAt as string))
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b)[0];

export const calculateOutcomeTimeline = (application: TailoredApplication) => {
  const events = application.applicationEvents || [];
  const appliedAt = firstEventTime(events, ['applied']);
  const replyAt = firstEventTime(events, ['reply_received', 'screening']);
  const interviewAt = firstEventTime(events, ['interview_scheduled', 'interview_completed']);
  const day = 1000 * 60 * 60 * 24;

  return {
    appliedAt: appliedAt || null,
    replyAt: replyAt || null,
    interviewAt: interviewAt || null,
    daysToReply: appliedAt && replyAt && replyAt >= appliedAt
      ? Math.round((replyAt - appliedAt) / day)
      : null,
    daysReplyToInterview: replyAt && interviewAt && interviewAt >= replyAt
      ? Math.round((interviewAt - replyAt) / day)
      : null,
  };
};
