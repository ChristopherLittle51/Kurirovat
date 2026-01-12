import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, JobDescription, TailoredApplication } from '../types';

// NOTE: In a real production app, move API calls to a backend to protect the key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
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

/**
 * Tailors the resume and generates a cover letter based on the Job Description.
 * Uses Gemini 3 Pro with Thinking Mode and Search Grounding.
 */
export const tailorResume = async (
  baseProfile: UserProfile,
  jd: JobDescription
): Promise<Partial<TailoredApplication>> => {
  
  const prompt = `
    You are an elite Resume Writer and Career Strategist specializing in ATS (Applicant Tracking System) optimization.
    
    Task: Tailor the candidate's profile to perfectly match the target Job Description (JD).

    Candidate Profile:
    ${JSON.stringify(baseProfile)}

    Target Job Description:
    Company: ${jd.companyName}
    Role: ${jd.roleTitle}
    Raw Description: ${jd.rawText}

    Objectives:
    1. **Research Phase**: Use the Google Search tool to find the company's core values, mission statement, recent news, and culture. 
    2. **Summary**: Rewrite the summary to be a powerful "Elevator Pitch" that addresses the JD's requirements AND explicitly aligns with the company's values found via search.
    3. **Skills**: Select the top 8-10 skills. Prioritize skills explicitly mentioned in the JD.
    4. **Experience**: 
       - Rewrite bullet points to use the "STAR" method (Situation, Task, Action, Result). 
       - Prioritize achievements that map to the JD's responsibilities.
       - Use strong action verbs (e.g., "Spearheaded", "Engineered", "Optimized").
       - REMOVE irrelevant bullet points.
    5. **Cover Letter**: Write a compelling, 3-paragraph cover letter. 
       - Paragraph 1: Hook the reader, mention the role, and reference a specific detail about the company (e.g., a recent project or value) found in your research.
       - Paragraph 2: Highlight achievements that solve the company's specific problems.
       - Paragraph 3: Call to action.
    6. **Match Score**: Analyze the semantic similarity between the tailored profile and the JD (0-100).
    7. **Keywords**: Extract the 5 most critical hard keywords from the JD that are now present in the resume.

    Output:
    Return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
    Structure:
    {
      "tailoredSummary": "string",
      "tailoredSkills": ["string"],
      "tailoredExperience": [{ "id": "original_id", "description": ["string"] }],
      "coverLetter": "string",
      "matchScore": number,
      "keyKeywords": ["string"]
    }
  `;

  try {
    console.log("Starting resume tailoring with Gemini 3 Pro + Thinking + Search...");
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Pro model for complex reasoning
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget for deep analysis
        tools: [{ googleSearch: {} }], // Enable Google Search for grounding
        // responseSchema REMOVED to prevent conflict with Search tool output formats
      }
    });

    console.log("Gemini response received.");
    
    let jsonText = response.text || "{}";
    // Clean markdown if present
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    // Attempt to extract JSON if there's preamble text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const result = JSON.parse(jsonText);

    // Extract grounding sources from the response
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const searchSources = groundingChunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    // Merge the tailored parts back into a full Profile object structure
    const newExperience = baseProfile.experience.map(exp => {
      // Use optional chaining for safety if tailoredExperience is missing
      const tailoredExp = result.tailoredExperience?.find((te: any) => te.id === exp.id);
      
      // Ensure tailoredExp exists and description is an array before using it
      if (tailoredExp && Array.isArray(tailoredExp.description)) {
        return { ...exp, description: tailoredExp.description };
      }
      
      // Fallback to original if AI didn't return a valid update for this experience
      return exp;
    });

    const tailoredProfile: UserProfile = {
      ...baseProfile,
      summary: result.tailoredSummary || baseProfile.summary,
      skills: Array.isArray(result.tailoredSkills) ? result.tailoredSkills : baseProfile.skills,
      experience: newExperience,
    };

    return {
      resume: tailoredProfile,
      coverLetter: result.coverLetter || "Cover letter generation failed.",
      matchScore: typeof result.matchScore === 'number' ? result.matchScore : 0,
      keyKeywords: Array.isArray(result.keyKeywords) ? result.keyKeywords : [],
      searchSources: searchSources
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate tailored resume. Please check your API key.");
  }
};
