
import { supabase } from './supabaseClient';
import { UserProfile, JobDescription, TailoredApplication } from '../types';

/**
 * Helper to invoke the 'gemini-api' Edge Function with explicit Auth headers.
 * This ensures the session token is passed correctly to avoid 401 errors.
 */
const callGeminiFunction = async (action: string, payload: any) => {
  // Refresh session to ensure the token is valid
  const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

  if (sessionError) {
    console.warn("[GeminiService] Failed to refresh session:", sessionError);
  }

  // Explicitly attach the session token if available
  const headers = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : undefined;

  console.log(`[GeminiService] Invoking ${action}. Session exists: ${!!session}, Token length: ${session?.access_token?.length || 0}`);

  if (!session) {
    console.warn("[GeminiService] No active session found. Request will likely fail with 401.");
  }

  const { data, error } = await supabase.functions.invoke('gemini-api', {
    body: {
      action,
      payload,
      access_token: session?.access_token // Fallback: Send token in body
    },
    headers
  });

  if (error) {
    // Enhanced error logging
    console.error(`Edge Function Error (${action}):`, error);
    if (error instanceof Error) {
      console.error("Error Details:", error.message, error.stack);
    }
    // Check if it's a 401 specifically
    if (typeof error === 'object' && error !== null && 'status' in error && (error as any).status === 401) {
      throw new Error(`Authentication failed (401). Please try logging out and back in.`);
    }
    throw new Error(`Failed to execute ${action} via backend: ${error.message || 'Unknown error'}`);
  }

  return data;
};

/**
 * Extracts structured profile data from a PDF Resume using the 'gemini-api' Edge Function.
 */
export const parseResumeFromPdf = async (base64Pdf: string): Promise<UserProfile> => {
  try {
    return await callGeminiFunction('parseResume', { base64Pdf });
  } catch (error: any) {
    console.error("Gemini PDF Parse Error:", error);
    throw new Error(error.message || "Failed to parse PDF. Ensure the file is a readable PDF.");
  }
};

/**
 * Tailors the resume and generates a cover letter based on the Job Description.
 * Delegates logic to 'gemini-api' Edge Function to protect API keys.
 */
export const tailorResume = async (
  baseProfile: UserProfile,
  jd: JobDescription,
  githubProjects: any[] = [],
  includeScore: boolean = true,
  pageCount: number = 1
): Promise<{ application: Partial<TailoredApplication>, rawResponse: string }> => {
  try {
    return await callGeminiFunction('tailorResume', {
      baseProfile,
      jd,
      githubProjects,
      includeScore,
      targetPageCount: pageCount
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate tailored resume. Please check your connection.");
  }
};

/**
 * Condenses a resume to fit within 1-2 pages.
 * Delegates to 'gemini-api' Edge Function.
 */
export const condenseResume = async (profile: UserProfile): Promise<{ profile: UserProfile, rawResponse: string }> => {
  try {
    return await callGeminiFunction('condenseResume', { profile });
  } catch (error: any) {
    console.error("Condense Resume Error:", error);
    throw new Error(error.message || "Failed to condense resume. Please try again.");
  }
};

/**
 * Condenses a cover letter to fit on a single page.
 * Delegates to 'gemini-api' Edge Function.
 */
export const condenseCoverLetter = async (
  content: string,
  candidateName: string,
  companyName: string
): Promise<{ content: string, rawResponse: string }> => {
  try {
    return await callGeminiFunction('condenseCoverLetter', {
      content,
      candidateName,
      companyName
    });
  } catch (error: any) {
    console.error("Condense Cover Letter Error:", error);
    throw new Error(error.message || "Failed to condense cover letter. Please try again.");
  }
};
