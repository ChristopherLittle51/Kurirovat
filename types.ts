export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export interface GithubProject {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  pushed_at?: string;
  topics?: string[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

export type StrategyPreset = 'ATS' | 'Balanced' | 'Recruiter';
export type CareerMode = 'Standard' | 'Transferable Skills';
export type CritiqueMode = 'Blunt' | 'Supportive';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type RequirementPriority = 'must_have' | 'important' | 'nice_to_have';
export type EvidenceCoverage = 'strong' | 'partial' | 'gap' | 'blocked';
export type QualitySeverity = 'error' | 'warning' | 'info';
export type EvidenceSourceType =
  | 'resume'
  | 'manual'
  | 'github'
  | 'linkedin'
  | 'portfolio'
  | 'job_description'
  | 'company_research';

export interface AchievementBankEntry {
  id: string;
  title: string;
  situation: string;
  action: string;
  result: string;
  metric: string;
  scope: string;
  tools: string[];
  teamSize: string;
  domain: string;
  tags: string[];
  sourceType: EvidenceSourceType;
  confidence: ConfidenceLevel;
  roleIds: string[];
  mustInclude: boolean;
  niceToUse: boolean;
  neverUse: boolean;
  roleFamilyConstraints: string[];
}

export interface CandidateEvidence {
  id: string;
  legacyId?: string;
  title: string;
  situation: string;
  action: string;
  result: string;
  metric: string;
  scope: string;
  tools: string[];
  teamSize: string;
  domain: string;
  tags: string[];
  sourceType: EvidenceSourceType;
  sourceLabel?: string;
  sourceExcerpt?: string;
  confidence: ConfidenceLevel;
  roleIds: string[];
  mustInclude: boolean;
  niceToUse: boolean;
  unavailable: boolean;
  disabled: boolean;
  roleFamilyConstraints: string[];
  dedupeKey?: string;
  lastUsedAt?: string | null;
  usageHistory?: Array<{
    applicationId?: string | null;
    generationJobId?: string | null;
    usedAt: string;
    locations: string[];
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportedProfileSource {
  id: string;
  label: string;
  url: string;
  sourceType: 'linkedin' | 'portfolio' | 'other';
  summary?: string;
  importedAt?: string;
}

export interface TailoringWeights {
  leadership: number;
  technicalDepth: number;
  measurableImpact: number;
  recency: number;
  domainMatch: number;
}

export interface TailoringPlaybook {
  id: string;
  name: string;
  strategyPreset: StrategyPreset;
  tone: string;
  conciseness: string;
  focusSkill: string;
  critiqueMode: CritiqueMode;
  preferredRoleFamilies: string[];
  antiClaims: string[];
  weights: TailoringWeights;
  promptOverride?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EditSuggestion {
  id: string;
  label: string;
  rationale: string;
  instruction: string;
  accepted?: boolean;
}

export interface LearnedPreferenceSuggestion {
  id: string;
  pattern: string;
  recommendation: string;
  promptAdjustment: string;
  accepted?: boolean;
}

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  links: SocialLink[];
  githubUsername?: string;
  otherExperience?: Experience[];
  portfolioTemplate?: string;
  portfolioTheme?: string;
  profilePhotoUrl?: string;
  githubProjects?: GithubProject[];
  githubLastSyncedAt?: string;
  achievementBank?: AchievementBankEntry[];
  tailoringPlaybooks?: TailoringPlaybook[];
  importedProfileSources?: ImportedProfileSource[];
  targetRoles?: string[];
  preferredIndustries?: string[];
  targetRegions?: TargetRegion[];
  antiClaims?: string[];
  learnedPreferenceSuggestions?: LearnedPreferenceSuggestion[];
}

export interface JobDescription {
  companyName: string;
  roleTitle: string;
  rawText: string;
}

export interface IdealJobDescription {
  roleTitle: string;
  jobDescription: string;
}

export interface JobAnalysis {
  keywords: string[];
  requirements: string[];
  responsibilities: string[];
  seniority: string;
  domain: string;
  painPoints: string[];
  signalsToAvoid: string[];
  mustHaveTerms: string[];
  niceToHaveTerms: string[];
  roleFamily: string;
  hiringOutcomes?: string[];
  recruiterRisks?: string[];
  requirementsV2?: JobRequirement[];
}

export interface JobRequirement {
  id: string;
  text: string;
  priority: RequirementPriority;
  category: string;
  importance: number;
  expectedProof: string;
  keywords: string[];
  senioritySignal?: string;
  rationale: string;
}

export interface EvidenceReference {
  sourceType: EvidenceSourceType;
  sourceLabel: string;
  section: string;
  sourceId?: string;
  excerpt?: string;
}

export interface SupportedClaim {
  claim: string;
  evidence?: EvidenceReference[];
  evidenceIds?: string[];
}

export interface EvidenceResolution {
  sourceFacts: string[];
  supportedClaims: SupportedClaim[];
  missingEvidence: string[];
  blockedClaims: string[];
  matches?: EvidenceMatch[];
  questions?: EvidenceQuestion[];
}

export interface EvidenceMatch {
  requirementId: string;
  coverage: EvidenceCoverage;
  evidenceIds: string[];
  rationale: string;
  missingDetail?: string;
}

export interface EvidenceQuestion {
  id: string;
  requirementIds: string[];
  prompt: string;
  reason: string;
  missingFields: Array<'situation' | 'action' | 'result' | 'metric' | 'scope' | 'tools' | 'teamSize'>;
  priority: number;
  status: 'pending' | 'answered' | 'skipped' | 'unavailable';
  answer?: string;
  evidenceId?: string;
}

export interface BulletPlan {
  experienceId: string;
  requirementIds: string[];
  evidenceIds: string[];
  angle: string;
  targetLength: 'short' | 'standard';
}

export interface ContentStrategy {
  targetPageCount: number;
  positioning: string;
  selectedExperienceIds: string[];
  omittedExperienceIds: string[];
  bulletPlans: BulletPlan[];
  summaryEvidenceIds: string[];
  skillEvidenceIds: string[];
  coverLetterEvidenceIds: string[];
  warnings: string[];
}

export interface RewriteCandidate {
  original: string;
  tailored: string;
  alternate: string;
  why: string;
  evidence: EvidenceReference[];
  evidenceIds?: string[];
  requirementIds?: string[];
}

export interface ResumeRewriteInsights {
  summary?: RewriteCandidate;
  skills?: Array<{
    skill: string;
    why: string;
  }>;
  bullets?: Array<{
    experienceId: string;
    rewrites: RewriteCandidate[];
  }>;
}

export interface TailoringDiagnostics {
  matchedKeywords: string[];
  missingKeywords: string[];
  unsupportedClaimsAvoided: string[];
  recruiterConcerns: string[];
  overusedPhrasing: string[];
  manualActionItems: string[];
}

export interface QualityIssue {
  id: string;
  code: string;
  severity: QualitySeverity;
  section: string;
  message: string;
  repairInstruction?: string;
  experienceId?: string;
  bulletIndex?: number;
}

export interface QualityScores {
  truthfulness: number;
  requirementCoverage: number;
  specificity: number;
  measurableImpact: number;
  recruiterScan: number;
  atsClarity: number;
  coverLetterValue: number;
}

export interface QualityReport {
  passed: boolean;
  repaired: boolean;
  scores: QualityScores;
  issues: QualityIssue[];
  pageCount?: number;
  reviewedAt?: string;
  model?: string;
  promptVersion?: string;
}

export interface RenderReview {
  pageCount: number;
  extractedText?: string;
  warnings: Array<{
    code: string;
    severity: QualitySeverity;
    message: string;
  }>;
  reviewedAt?: string;
}

export interface TailoringOptions {
  tone?: string;
  conciseness?: string;
  focusSkill?: string;
  strategyPreset?: StrategyPreset;
  careerMode?: CareerMode;
  critiqueMode?: CritiqueMode;
  weights?: TailoringWeights;
  preferredRoleFamilies?: string[];
  antiClaims?: string[];
  promptOverride?: string;
  regenerationInstructions?: string;
  selectedPlaybookId?: string;
  jobAnalysisOverride?: Partial<JobAnalysis>;
  targetPageCount?: number;
}

export interface SearchSource {
  title: string;
  uri: string;
}

export type ApplicationStatus = 'Pending' | 'Sent' | 'Replied' | 'Interview Scheduled' | 'Rejected';
export type ApplicationEventType =
  | 'created'
  | 'applied'
  | 'reply_received'
  | 'screening'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'rejected'
  | 'offer'
  | 'withdrawn'
  | 'no_response'
  | 'legacy_status_imported';

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  eventType: ApplicationEventType;
  occurredAt?: string | null;
  recordedAt: string;
  notes: string;
  interviewRound?: number | null;
  metadata: Record<string, unknown>;
}

export interface TailoredApplication {
  id: string;
  createdAt: number;
  jobDescription: JobDescription;
  resume: UserProfile;
  coverLetter: string;
  matchScore: number;
  keyKeywords: string[];
  searchSources?: SearchSource[];
  status?: ApplicationStatus;
  slug?: string;
  githubProjects?: GithubProject[];
  showMatchScore?: boolean;
  template?: string;
  portfolioTheme?: string;
  profilePhotoUrl?: string;
  githubLastSyncedAt?: string;
  jobAnalysis?: JobAnalysis;
  evidenceResolution?: EvidenceResolution;
  diagnostics?: TailoringDiagnostics;
  rewriteInsights?: ResumeRewriteInsights;
  assembledPromptPreview?: string;
  promptOverride?: string;
  selectedPlaybookId?: string;
  generationOptions?: TailoringOptions;
  editSuggestions?: EditSuggestion[];
  regenerationHistory?: Array<{
    timestamp: string;
    instructions: string;
  }>;
  contentStrategy?: ContentStrategy;
  qualityReport?: QualityReport;
  tailoringRunId?: string | null;
  applicationEvents?: ApplicationEvent[];
  renderReview?: RenderReview;
}

export type GenerationJobStatus = 'queued' | 'running' | 'needs_input' | 'succeeded' | 'failed' | 'cancelled';
export type TailoringStage =
  | 'queued'
  | 'job_analysis'
  | 'evidence_matching'
  | 'needs_input'
  | 'content_strategy'
  | 'drafting'
  | 'review'
  | 'render_review'
  | 'completed';

export interface GenerationJob {
  id: string;
  userId: string;
  status: GenerationJobStatus;
  stage: string;
  progress: number;
  requestPayload: Record<string, any>;
  resultApplicationId?: string | null;
  errorMessage?: string | null;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  workingState: Record<string, any>;
  pendingQuestions: EvidenceQuestion[];
  acceptedEvidenceIds: string[];
  promptVersion?: string | null;
  schemaVersion?: string | null;
  modelConfig: Record<string, any>;
  usageMetrics: Record<string, any>;
  qualityReport?: QualityReport | null;
  repairCount: number;
}

export interface TargetRegion {
  id: string;
  label: string;
  remotePreference: 'remote' | 'hybrid' | 'onsite' | 'flexible';
}

export interface LeadSource {
  id: string;
  label: string;
  url: string;
  sourceType: 'company_careers' | 'niche_board' | 'recruiter' | 'community' | 'other';
  regions: TargetRegion[];
  notes?: string;
  createdAt?: string;
  lastCheckedAt?: string;
}

export interface LeadSourceCheck {
  id: string;
  leadSourceId: string;
  status: 'pending' | 'succeeded' | 'failed';
  checkedAt: string;
  notes?: string;
  discoveredCount?: number;
  leadSourceLabel?: string;
}

export interface JobLeadMatch {
  score: number;
  rationale: string;
  matchedKeywords: string[];
  concerns: string[];
}

export interface JobLead {
  id: string;
  leadSourceId: string;
  title: string;
  companyName: string;
  location: string;
  url: string;
  summary: string;
  rawDescription?: string;
  provenance: {
    discoveredAt: string;
    submittedBy: 'user' | 'agent' | 'system';
    notes?: string;
  };
  regions: TargetRegion[];
  match?: JobLeadMatch;
  status?: 'new' | 'saved' | 'dismissed';
  leadSourceLabel?: string;
}

export interface ApplicationLeadContext {
  leadId: string;
  leadSourceId: string;
  leadSourceLabel?: string;
  leadUrl: string;
  leadSummary?: string;
}

export type ViewState =
  | 'ONBOARDING'
  | 'DASHBOARD'
  | 'NEW_APPLICATION'
  | 'VIEW_RESUME'
  | 'VIEW_PORTFOLIO';
