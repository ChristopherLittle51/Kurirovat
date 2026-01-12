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

export interface TailoredApplication {
  id: string;
  createdAt: number;
  jobDescription: JobDescription;
  resume: UserProfile; // A version of the profile tailored to the job
  coverLetter: string;
  matchScore: number; // 0-100
  keyKeywords: string[];
  searchSources?: SearchSource[];
}

export type ViewState = 
  | 'ONBOARDING'
  | 'DASHBOARD'
  | 'NEW_APPLICATION'
  | 'VIEW_RESUME'
  | 'VIEW_PORTFOLIO';
