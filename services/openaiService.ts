import { getEdgeFunctionErrorMessage, supabase } from './supabaseClient';
import {
  UserProfile,
  JobDescription,
  JobAnalysis,
  IdealJobDescription,
} from '../types';

const callOpenAIFunction = async (action: string, payload: any) => {
  const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

  if (sessionError) {
    console.warn('[OpenAIService] Failed to refresh session:', sessionError);
  }

  const headers = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : undefined;

  const { data, error } = await supabase.functions.invoke('gemini-api', {
    body: {
      action,
      payload,
      access_token: session?.access_token,
    },
    headers,
  });

  if (error) {
    console.error(`Edge Function Error (${action}):`, error);
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? (error as any).status
      : undefined;
    if (status === 401) {
      throw new Error('Authentication failed (401). Please try logging out and back in.');
    }
    throw new Error(`Failed to execute ${action} via backend: ${await getEdgeFunctionErrorMessage(error, 'Unknown error')}`);
  }

  return data;
};

export const parseResumeFromPdf = async (base64Pdf: string): Promise<UserProfile> => {
  try {
    return await callOpenAIFunction('parseResume', { base64Pdf });
  } catch (error: any) {
    console.error('OpenAI PDF Parse Error:', error);
    throw new Error(error.message || 'Failed to parse PDF. Ensure the file is a readable PDF.');
  }
};

export const analyzeJobDescription = async (jd: JobDescription): Promise<JobAnalysis> => {
  try {
    return await callOpenAIFunction('analyzeJobDescription', { jd });
  } catch (error: any) {
    console.error('OpenAI JD Analysis Error:', error);
    throw new Error(error.message || 'Failed to analyze job description.');
  }
};

export const generateIdealJobDescription = async (
  profile: UserProfile,
  instructions?: string
): Promise<IdealJobDescription> => {
  try {
    return await callOpenAIFunction('generateIdealJobDescription', {
      profile,
      instructions: instructions?.trim() || '',
    });
  } catch (error: any) {
    console.error('OpenAI Ideal Job Description Error:', error);
    throw new Error(error.message || 'Failed to generate an ideal job description.');
  }
};

export const importProfileSource = async (payload: {
  url: string;
  label?: string;
  sourceType?: 'linkedin' | 'portfolio' | 'other';
  rawText?: string;
}) => {
  try {
    return await callOpenAIFunction('importProfileSource', payload);
  } catch (error: any) {
    console.error('OpenAI Profile Import Error:', error);
    throw new Error(error.message || 'Failed to import profile source.');
  }
};

export const condenseResume = async (profile: UserProfile): Promise<{ profile: UserProfile; rawResponse: string }> => {
  try {
    return await callOpenAIFunction('condenseResume', { profile });
  } catch (error: any) {
    console.error('Condense Resume Error:', error);
    throw new Error(error.message || 'Failed to condense resume. Please try again.');
  }
};

export const condenseCoverLetter = async (
  content: string,
  candidateName: string,
  companyName: string
): Promise<{ content: string; rawResponse: string }> => {
  try {
    return await callOpenAIFunction('condenseCoverLetter', {
      content,
      candidateName,
      companyName,
    });
  } catch (error: any) {
    console.error('Condense Cover Letter Error:', error);
    throw new Error(error.message || 'Failed to condense cover letter. Please try again.');
  }
};

export const reviewRenderedResume = async (base64Pdf: string) => (
  callOpenAIFunction('reviewRenderedResume', { base64Pdf })
);
