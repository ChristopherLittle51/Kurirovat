
import { supabase } from './supabaseClient';
import { UserProfile, JobDescription, TailoredApplication } from '../types';

/**
 * Extracts structured profile data from a PDF Resume using the 'gemini-api' Edge Function.
 */
export const parseResumeFromPdf = async (base64Pdf: string): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-api', {
      body: {
        action: 'parseResume',
        payload: { base64Pdf }
      }
    });

    if (error) {
      console.error("Edge Function Error (parseResume):", error);
      throw new Error("Failed to parse PDF via backend.");
    }

    return data as UserProfile;

  } catch (error) {
    console.error("Gemini PDF Parse Error:", error);
    throw new Error("Failed to parse PDF. Ensure the file is a readable PDF.");
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
    const { data, error } = await supabase.functions.invoke('gemini-api', {
      body: {
        action: 'tailorResume',
        payload: {
          baseProfile,
          jd,
          githubProjects,
          includeScore,
          targetPageCount: pageCount
        }
      }
    });

    if (error) {
      console.error("Edge Function Error (tailorResume):", error);
      throw new Error("Failed to generate tailored resume via backend.");
    }

    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate tailored resume. Please check your connection.");
  }
};

/**
 * Condenses a resume to fit within 1-2 pages.
 * Delegates to 'gemini-api' Edge Function.
 */
export const condenseResume = async (profile: UserProfile): Promise<{ profile: UserProfile, rawResponse: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-api', {
      body: {
        action: 'condenseResume',
        payload: { profile }
      }
    });

    if (error) {
      console.error("Edge Function Error (condenseResume):", error);
      throw new Error("Failed to condense resume via backend.");
    }

    return data;

  } catch (error) {
    console.error("Condense Resume Error:", error);
    throw new Error("Failed to condense resume. Please try again.");
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
    const { data, error } = await supabase.functions.invoke('gemini-api', {
      body: {
        action: 'condenseCoverLetter',
        payload: { content, candidateName, companyName }
      }
    });

    if (error) {
      console.error("Edge Function Error (condenseCoverLetter):", error);
      throw new Error("Failed to condense cover letter via backend.");
    }

    return data;

  } catch (error) {
    console.error("Condense Cover Letter Error:", error);
    throw new Error("Failed to condense cover letter. Please try again.");
  }
};
