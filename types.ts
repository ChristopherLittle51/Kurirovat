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
  evidence: EvidenceReference[];
}

export interface EvidenceResolution {
  sourceFacts: string[];
  supportedClaims: SupportedClaim[];
  missingEvidence: string[];
  blockedClaims: string[];
}

export interface RewriteCandidate {
  original: string;
  tailored: string;
  alternate: string;
  why: string;
  evidence: EvidenceReference[];
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
}

export interface SearchSource {
  title: string;
  uri: string;
}

export type ApplicationStatus = 'Pending' | 'Sent' | 'Replied' | 'Interview Scheduled' | 'Rejected';

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
}

export type GenerationJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

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
