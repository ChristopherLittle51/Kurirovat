import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, JobDescription, TailoredApplication } from '../types';

// NOTE: In a real production app, move API calls to a backend to protect the key.
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.error("Missing VITE_GOOGLE_GENAI_API_KEY");
    throw new Error("Google GenAI API Key is missing. Please set VITE_GOOGLE_GENAI_API_KEY in your .env file.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Extracts structured profile data from a PDF Resume.
 */
export const parseResumeFromPdf = async (base64Pdf: string): Promise<UserProfile> => {
  const prompt = `
    Analyze the attached resume PDF. Extract the data into a structured JSON format matching the schema.
    
    Rules:
    1. Extract the full name, email, phone, and location.
    2. Extract the professional summary.
    3. Extract a list of skills.
    4. Extract experience entries. For dates, use a consistent string format (e.g., "Jan 2020"). 
       Split job descriptions into an array of distinct bullet points.
    5. Extract education history.
    6. Extract social links (LinkedIn, Portfolio, etc) if present.
    7. If a field is not found, return an empty string or empty array as appropriate.
    8. Do not hallucinate data. Only use what is visible in the document.
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            location: { type: Type.STRING },
            summary: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  description: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  institution: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  year: { type: Type.STRING }
                }
              }
            },
            links: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  url: { type: Type.STRING }
                }
              }
            }
          },
          required: ["fullName", "email", "experience", "skills"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");

    // Add IDs to experience/education since the AI schema doesn't generate them
    const finalizedData: UserProfile = {
      ...parsedData,
      experience: parsedData.experience?.map((exp: any) => ({ ...exp, id: Date.now().toString() + Math.random() })) || [],
      education: parsedData.education?.map((edu: any) => ({ ...edu, id: Date.now().toString() + Math.random() })) || [],
      links: parsedData.links || [],
      skills: parsedData.skills || [],
      summary: parsedData.summary || "",
      fullName: parsedData.fullName || "",
      email: parsedData.email || "",
      phone: parsedData.phone || "",
      location: parsedData.location || ""
    };

    return finalizedData;

  } catch (error) {
    console.error("Gemini PDF Parse Error:", error);
    throw new Error("Failed to parse PDF. Ensure the file is a readable PDF.");
  }
};

const researchCompany = async (companyName: string): Promise<{ summary: string, sources: any[] }> => {
  const prompt = `
    Research the company "${companyName}". 
    Find their mission statement, core values, recent significant news, and description of their corporate culture.
    Summarize these findings into a concise paragraph.
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ text: prompt }],
      config: {
        tools: [{ googleSearch: {} }],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
          }
        },
        responseMimeType: "application/json"
      }
    });

    // NOTE: Search tool output parsing can be tricky if it strictly returns JSON schema
    // But we asked for summary. Let's see if response.text works.
    // If we use JSON Schema, response.text will be a JSON string.
    const result = JSON.parse(response.text || "{}");
    const summary = result.summary || "No specific company research found.";

    // Extract grounding sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    return { summary, sources };

  } catch (error) {
    console.warn("Company research failed:", error);
    return { summary: "Could not retrieve company details.", sources: [] };
  }
};

/**
 * Tailors the resume and generates a cover letter based on the Job Description.
 * Uses Gemini 3 Pro with a split Research -> Generate approach for structure reliability.
 */
/**
 * Tailors the resume and generates a cover letter based on the Job Description.
 * Uses Gemini 3 Pro with a split Research -> Generate approach for structure reliability.
 */
export const tailorResume = async (
  baseProfile: UserProfile,
  jd: JobDescription,
  githubProjects: any[] = [],
  includeScore: boolean = true
): Promise<Partial<TailoredApplication>> => {

  // Step 1: Research the company (Grounded)
  console.log(`Starting research for ${jd.companyName}...`);
  const research = await researchCompany(jd.companyName);

  // Step 2: Generate Content (Structured)
  const prompt = `
    You are an elite Resume Writer and Career Strategist.
    
    Task: Tailor the candidate's profile to match the Job Description (JD), incorporating the provided company research.
    
    CRITICAL RULE: Prioritize RELEVANT experience over RECENT experience. 
    If the candidate has older experience that is more relevant to the target role (e.g., same industry, same role, same tech stack), 
    it MUST appear first in the 'tailoredExperience' array, even if it is not the most recent job.
    
    Candidate Profile:
    ${JSON.stringify(baseProfile)}

    Selected GitHub Projects (Highlight these if relevant to technical skills):
    ${JSON.stringify(githubProjects)}

    Target Job Description:
    Company: ${jd.companyName}
    Role: ${jd.roleTitle}
    Raw Description: ${jd.rawText}

    Company Research (Use this to align values and culture):
    ${research.summary}

    Requirements:
    1. **Summary**: Rewrite as an "Elevator Pitch" aligning with the JD and Company Culture.
    2. **Skills**: Select top 8-10 skills relevant to the JD.
    3. **Experience**: 
       - Select the TOP 5 most relevant roles for this job.
       - REORDER them to show the most relevant first.
       - Rewrite bullets for these 5 roles to STAR method (max 4 bullets per role).
       - Omit less relevant roles from the 'tailoredExperience' array to save space.
    4. **Cover Letter**: 3 paragraphs (Hook + Company alignment, Achievements, Call to Action).
    5. **Match Score**: ${includeScore ? '0-100 semantic match.' : 'Set to 0 (user opted out).'}
    6. **Keywords**: 5 critical hard keywords from JD.
  `;

  try {
    console.log("Generating structured tailored content...");
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tailoredSummary: { type: Type.STRING },
            tailoredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            tailoredExperience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Must match original experience ID" },
                  description: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            coverLetter: { type: Type.STRING },
            matchScore: { type: Type.NUMBER },
            keyKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["tailoredSummary", "tailoredSkills", "tailoredExperience", "coverLetter", "matchScore", "keyKeywords"]
        }
      }
    });

    let result: any;
    try {
      result = JSON.parse(response.text || "{}");
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", response.text);
      throw new Error("AI response was incomplete or malformed. Please try again or reduce the resume size.");
    }

    // Reconstruct experience array based on the AI's reordered list
    // The AI returns { id, description[] }. We need to find the full original object, apply new desc, and preserve order.
    let reorderedExperience: any[] = [];

    if (result.tailoredExperience && Array.isArray(result.tailoredExperience)) {
      reorderedExperience = result.tailoredExperience.map((tailoredExp: any) => {
        const originalExp = baseProfile.experience.find(exp => exp.id === tailoredExp.id);
        if (originalExp) {
          return { ...originalExp, description: tailoredExp.description };
        }
        return null;
      }).filter(Boolean); // Remove any nulls if ID wasn't found
    } else {
      // Fallback if AI fails to return array
      reorderedExperience = baseProfile.experience;
    }

    const tailoredProfile: UserProfile = {
      ...baseProfile,
      summary: result.tailoredSummary || baseProfile.summary,
      skills: Array.isArray(result.tailoredSkills) ? result.tailoredSkills : baseProfile.skills,
      experience: reorderedExperience,
    };

    return {
      resume: tailoredProfile,
      coverLetter: result.coverLetter || "Cover letter generation failed.",
      matchScore: result.matchScore || 0,
      keyKeywords: result.keyKeywords || [],
      searchSources: research.sources,
      // Pass these through/store them
      githubProjects: githubProjects,
      showMatchScore: includeScore
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate tailored resume. Please check your API key.");
  }
};
