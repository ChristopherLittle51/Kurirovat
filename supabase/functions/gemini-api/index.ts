
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "npm:@google/genai";
import pdf from "npm:pdf-parse@1.1.1";
import { Buffer } from "node:buffer";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types definitions to keep the function self-contained
interface Experience {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string[];
}

interface Education {
    id: string;
    institution: string;
    degree: string;
    year: string;
}

interface SocialLink {
    platform: string;
    url: string;
}

interface UserProfile {
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
}

interface JobDescription {
    companyName: string;
    roleTitle: string;
    rawText: string;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify User Authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            console.error("Auth Error:", authError);
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid session' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const { action, payload } = await req.json();
        const apiKey = Deno.env.get('GOOGLE_GENAI_API_KEY');

        if (!apiKey) {
            throw new Error("Google GenAI API Key is missing. Check Edge Function secrets.");
        }

        const ai = new GoogleGenAI({ apiKey });

        switch (action) {
            case 'parseResume':
                return await handleParseResume(ai, payload);
            case 'tailorResume':
                return await handleTailorResume(ai, payload);
            case 'condenseResume':
                return await handleCondenseResume(ai, payload);
            case 'condenseCoverLetter':
                return await handleCondenseCoverLetter(ai, payload);
            default:
                throw new Error(`Unknown action: ${action}`);
        }

    } catch (error: any) {
        console.error("Edge Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

/**
 * Handlers
 */

async function handleParseResume(ai: any, payload: { base64Pdf: string }) {
    console.log("Extracting text from PDF...");
    let pdfText = "";
    try {
        const pdfBuffer = Buffer.from(payload.base64Pdf, "base64");
        const data = await pdf(pdfBuffer);
        pdfText = data.text;
    } catch (e) {
        console.warn("PDF extraction failed, falling back to raw PDF analysis", e);
        // Fallback or re-throw? 
        // If extraction fails, we can't really do the text-only optimization. 
        // We could try sending the image, but the user explicitly wants to avoid that.
        // Let's throw for now as per the optimization goal, or handling it gracefully?
        // Let's rethrow to be safe or improve error handling.
        throw new Error("Failed to extract text from PDF: " + (e instanceof Error ? e.message : String(e)));
    }

    const prompt = `
    Analyze the following resume text. Extract the data into a structured JSON format matching the schema.
    
    RESUME TEXT:
    ${pdfText}
    
    Rules:
    1. Extract the full name, email, phone, and location.
    2. Extract the professional summary.
    3. Extract a list of skills.
    4. Extract experience entries. For dates, use a consistent string format (e.g., "Jan 2020"). 
       Split job descriptions into an array of distinct bullet points.
    5. Extract education history.
    6. Extract social links (LinkedIn, Portfolio, etc) if present.
    7. If a field is not found, return an empty string or empty array as appropriate.
    8. Do not hallucinate data. Only use what is provided in the text.
  `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                { text: prompt }
            ],
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
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

        return new Response(JSON.stringify(finalizedData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        throw new Error("Failed to parse PDF: " + error.message);
    }
}

async function researchCompany(ai: any, companyName: string): Promise<{ summary: string, sources: any[] }> {
    const prompt = `
    Research the company "${companyName}". 
    Find their mission statement, core values, recent significant news, and description of their corporate culture.
    Summarize these findings into a concise paragraph.
  `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ text: prompt }],
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
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

        const result = JSON.parse(response.text || "{}");
        const summary = result.summary || "No specific company research found.";

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
}

async function handleTailorResume(ai: any, payload: {
    baseProfile: UserProfile,
    jd: JobDescription,
    githubProjects: any[],
    includeScore: boolean,
    targetPageCount?: number
}) {
    const { baseProfile, jd, githubProjects = [], includeScore = true, targetPageCount = 1 } = payload;

    console.log(`Starting research for ${jd.companyName}...`);
    const research = await researchCompany(ai, jd.companyName);

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
    1. **Summary**: Rewrite as an "Elevator Pitch" aligning with the JD and Company Culture (Max 3 lines).
    2. **Skills**: Select top 6-8 skills relevant to the JD.
    3. **Experience**: 
       - Select the TOP ${targetPageCount === 1 ? '3-4' : '5'} most relevant roles for this job.
       - REORDER them to show the most relevant first.
       - Rewrite bullets for these roles to STAR method (max ${targetPageCount === 1 ? '3' : '4'} bullets per role).
       - Omit less relevant roles to strictly fit within ${targetPageCount} page(s).
    4. **Cover Letter**: 3 paragraphs (Hook + Company alignment, Achievements, Call to Action), Do NOT include any greeting(Dear...) or sign - off(Sincerely...) - those are added separately.
    5. **Match Score**: ${includeScore ? '0-100 semantic match.' : 'Set to 0 (user opted out).'}
    6. **Keywords**: 5 critical hard keywords from JD.
    7. **Length Constraint**: STRICTLY ensure the total content fits on ${targetPageCount} page(s). Be concise.
  `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ text: prompt }],
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
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
                                },
                                required: ["id", "description"]
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
            throw new Error("AI response was incomplete or malformed.");
        }

        let reorderedExperience: any[] = [];
        if (result.tailoredExperience && Array.isArray(result.tailoredExperience)) {
            reorderedExperience = result.tailoredExperience.map((tailoredExp: any) => {
                const originalExp = baseProfile.experience.find(exp => exp.id === tailoredExp.id);
                if (originalExp) {
                    const newDescription = (tailoredExp.description && tailoredExp.description.length > 0)
                        ? tailoredExp.description
                        : originalExp.description;
                    return { ...originalExp, description: newDescription };
                }
                return null;
            }).filter(Boolean);
        } else {
            reorderedExperience = baseProfile.experience;
        }

        const tailoredProfile: UserProfile = {
            ...baseProfile,
            summary: result.tailoredSummary || baseProfile.summary,
            skills: Array.isArray(result.tailoredSkills) ? result.tailoredSkills : baseProfile.skills,
            experience: reorderedExperience,
        };

        const finalResult = {
            application: {
                resume: tailoredProfile,
                coverLetter: result.coverLetter || "Cover letter generation failed.",
                matchScore: result.matchScore || 0,
                keyKeywords: result.keyKeywords || [],
                searchSources: research.sources,
                githubProjects: githubProjects,
                showMatchScore: includeScore
            },
            rawResponse: response.text || ""
        };

        return new Response(JSON.stringify(finalResult), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        throw new Error("Failed to tailor resume: " + error.message);
    }
}

async function handleCondenseResume(ai: any, payload: { profile: UserProfile }) {
    const { profile } = payload;
    const experienceSummary = profile.experience.map(exp => ({
        id: exp.id,
        role: exp.role,
        company: exp.company,
        bulletCount: exp.description?.length || 0,
        bullets: exp.description || []
    }));

    const prompt = `
    You are an expert resume editor. Condense this resume to fit on 1-2 pages.
    
    Current Data:
    - Summary: ${profile.summary}
    - Skills (${profile.skills.length} total): ${JSON.stringify(profile.skills)}
    - Experience: ${JSON.stringify(experienceSummary)}
    - Education count: ${profile.education.length}
    
    Return ONLY:
    1. condensedSummary: Shorten to 2-3 sentences max
    2. selectedSkillIndices: Array of indices (0-based) of top 6-8 skills to keep
    3. condensedExperience: Array of {id, condensedBullets} for top 3-4 roles only
       - condensedBullets should have 2-3 items max, each made more concise
    4. keepEducationIds: Array of education IDs to keep (usually all)
    
    CRITICAL: Only return the delta/changes, not full data. Use exact IDs from input.
  `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ text: prompt }],
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        condensedSummary: { type: Type.STRING },
                        selectedSkillIndices: {
                            type: Type.ARRAY,
                            items: { type: Type.INTEGER }
                        },
                        condensedExperience: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    condensedBullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["id", "condensedBullets"]
                            }
                        },
                        keepEducationIds: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["condensedSummary", "selectedSkillIndices", "condensedExperience"]
                }
            }
        });

        const result = JSON.parse(response.text || "{}");

        const condensedSkills = (result.selectedSkillIndices || [])
            .filter((i: number) => i >= 0 && i < profile.skills.length)
            .map((i: number) => profile.skills[i]);

        const condensedExperience = (result.condensedExperience || [])
            .map((ce: { id: string; condensedBullets: string[] }) => {
                const original = profile.experience.find(exp => exp.id === ce.id);
                if (original) {
                    return {
                        ...original,
                        description: ce.condensedBullets || original.description
                    };
                }
                return null;
            })
            .filter(Boolean);

        const keepEducation = result.keepEducationIds?.length > 0
            ? profile.education.filter((edu: any) => result.keepEducationIds.includes(edu.id))
            : profile.education;

        const finalProfile = {
            ...profile,
            summary: result.condensedSummary || profile.summary,
            skills: condensedSkills.length > 0 ? condensedSkills : profile.skills.slice(0, 8),
            experience: condensedExperience.length > 0 ? condensedExperience : profile.experience.slice(0, 4),
            education: keepEducation,
            links: profile.links.slice(0, 3)
        };

        return new Response(JSON.stringify({
            profile: finalProfile,
            rawResponse: response.text || ""
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        throw new Error("Failed to condense resume: " + error.message);
    }
}

async function handleCondenseCoverLetter(ai: any, payload: { content: string, candidateName: string, companyName: string }) {
    const { content, candidateName, companyName } = payload;
    const prompt = `
    You are an expert cover letter editor.Condense this cover letter to fit on a single page while maintaining its persuasive impact.
    
    Current Cover Letter:
    ${content}

    Candidate: ${candidateName}
    Company: ${companyName}
    
    Condensing Rules:
    1. Create exactly 3 short paragraphs:
       - Paragraph 1: Strong opening hook + why this company
       - Paragraph 2: Key achievements and value proposition(most impactful points only)
       - Paragraph 3: Brief call to action and closing
    2. Each paragraph should be 2 - 4 sentences maximum.
    3. Preserve the professional tone and key selling points.
    4. Remove any redundant or filler content.
    5. Do NOT include any greeting(Dear...) or sign - off(Sincerely...) - those are added separately.
    
    Return ONLY the condensed body text, nothing else.
  `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ text: prompt }],
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        condensedContent: { type: Type.STRING }
                    },
                    required: ["condensedContent"]
                }
            }
        });

        const result = JSON.parse(response.text || "{}");
        return new Response(JSON.stringify({
            content: result.condensedContent || content,
            rawResponse: response.text || ""
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        throw new Error("Failed to condense cover letter: " + error.message);
    }
}
