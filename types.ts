export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string[]; // Bullet points
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
}

export interface SocialLink {
  platform: string;
  url: string;
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
  portfolioTemplate?: string; // Template ID for Resume/PDF rendering
  portfolioTheme?: string;    // Theme ID for public-facing portfolio website
  profilePhotoUrl?: string;   // URL to profile photo in Supabase Storage
  githubProjects?: GithubProject[];
}

export interface JobDescription {
  companyName: string;
  roleTitle: string;
  rawText: string;
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
  resume: UserProfile; // A version of the profile tailored to the job
  coverLetter: string;
  matchScore: number; // 0-100
  keyKeywords: string[];
  searchSources?: SearchSource[];
  status?: ApplicationStatus;
  slug?: string;
  githubProjects?: GithubProject[];
  showMatchScore?: boolean;
  template?: string; // Template ID for resume rendering
  portfolioTheme?: string; // Theme ID for portfolio rendering
  profilePhotoUrl?: string; // URL to profile photo
}

export type ViewState =
  | 'ONBOARDING'
  | 'DASHBOARD'
  | 'NEW_APPLICATION'
  | 'VIEW_RESUME'
  | 'VIEW_PORTFOLIO';
