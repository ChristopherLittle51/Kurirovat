
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "npm:@google/genai";


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
        console.log("Request Received. Method:", req.method);

        const { action, payload, access_token } = await req.json();

        // 1. Verify User Authentication
        let authHeader = req.headers.get('Authorization');
        let token = "";

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.replace("Bearer ", "");
        } else if (access_token) {
            console.log("Using Fallback: Found access_token in body.");
            token = access_token;
        }

        if (!token) {
            console.error("Missing Auth Token.");
            return new Response(JSON.stringify({ error: 'Missing Authorization header or token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const sbUrl = Deno.env.get('SUPABASE_URL');
        const sbKey = Deno.env.get('SUPABASE_ANON_KEY');
        console.log("Supabase Config Check:", {
            urlPresent: !!sbUrl,
            keyPresent: !!sbKey,
            keyStart: sbKey ? sbKey.substring(0, 5) : 'N/A'
        });

        const supabaseClient = createClient(
            sbUrl ?? '',
            sbKey ?? ''
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        console.log("Auth Check Result:", {
            userFound: !!user,
            userId: user?.id,
            error: authError ? JSON.stringify(authError) : null
        });

        if (authError || !user) {
            console.error("Auth Error Detail:", authError);
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid session', details: authError }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const apiKey = Deno.env.get('GOOGLE_GENAI_API_KEY');

        if (!apiKey) {
            throw new Error("Google GenAI API Key is missing. Check Edge Function secrets.");
        }

        const ai = new GoogleGenAI({ apiKey });

        switch (action) {
            case 'parseResume':
                return await handleParseResume(ai, payload);
            case 'tailorResume':
                return await handleTailorResume(ai, payload); // Note: tailroResume is a typo in original if present, assuming handleTailorResume here
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
    8. Do not hallucinate data. Only use what is provided in the document.
  `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: "application/pdf",
                                data: payload.base64Pdf
                            }
                        }
                    ]
                }
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
    Find:
    1. Their mission statement and core values.
    2. Recent significant news, product launches, or strategic initiatives.
    3. Description of their corporate culture and work environment.
    4. Key business challenges they face or industry pain points they are solving.
    
    Summarize these findings into a concise paragraph that covers culture, values, AND business challenges.
    Do not use trademarked or branded terms specific to the company.
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
    targetPageCount?: number,
    options?: {
        tone?: string;
        conciseness?: string;
        focusSkill?: string;
    }
}) {
    const { baseProfile, jd, githubProjects = [], includeScore = true, targetPageCount = 1, options } = payload;

    console.log(`Starting research for ${jd.companyName}...`);
    const research = await researchCompany(ai, jd.companyName);

    const toneInstruction = options?.tone ? `TONE: Adopt a ${options.tone} tone.` : '';
    const lengthInstruction = options?.conciseness === 'concise'
        ? "Be extremely concise and direct."
        : (options?.conciseness === 'detailed' ? "Provide detailed, in-depth explanations of achievements." : "Maintain a balanced professional density.");
    const focusInstruction = options?.focusSkill ? `FOCUS: Emphasize experience and achievements related to "${options.focusSkill}".` : '';

    const prompt = `
    You are an elite Resume Strategist specializing in Applicant Tracking System (ATS) optimization.
    
    OBJECTIVE: Tailor the candidate's profile to achieve maximum algorithmic match score against the Job Description (JD), using company research for cultural alignment. Your output must survive automated ATS parsing AND impress a human recruiter.
    
    ===== CORE RULES =====
    
    CHRONOLOGICAL RULE: Sort experience by Start Date in descending order (newest first). Do NOT reorder based on relevance.
    
    LINGO RULE: STRICTLY AVOID company-specific jargon, internal proprietary terminology, or non-standard shorthand. Translate all content into professional, industry-standard language universally understood by recruiters and ATS systems.
    
    PARSEABILITY RULE: Do not use special characters (bullets like •, arrows, emojis), tables, or unusual formatting in text output. Use plain alphanumeric text only. This ensures OCR and layout parsers extract all data correctly.
    
    ${toneInstruction}
    ${lengthInstruction}
    ${focusInstruction}
    
    ===== INPUT DATA =====
    
    Candidate Profile:
    ${JSON.stringify(baseProfile)}

    Selected GitHub Projects (Highlight if relevant to technical skills):
    ${JSON.stringify(githubProjects)}

    Target Job Description:
    Company: ${jd.companyName}
    Role: ${jd.roleTitle}
    Raw Description: ${jd.rawText}

    Company Research:
    ${research.summary}

    ===== OUTPUT REQUIREMENTS =====
    
    1. **Summary (tailoredSummary)**:
       - Write a compelling 2-3 sentence elevator pitch.
       - Embed the top 2-3 keywords from the JD naturally into the summary.
       - Demonstrate alignment with the company's mission and the role's core function.
       - Include at least one quantifiable career highlight (e.g., "driving 40% revenue growth").
    
    2. **Skills (tailoredSkills)**:
       - Select 6-8 skills that are the strongest semantic match to the JD requirements.
       - Prioritize skills the candidate has used within the last 24 months (high recency weight).
       - Use EXACT terminology from the JD where the candidate possesses the skill.
       - For technical terms, include both the spelled-out form and acronym where appropriate (e.g., "Search Engine Optimization (SEO)", "Key Performance Indicators (KPIs)", "Continuous Integration/Continuous Deployment (CI/CD)").
       - Also include 1-2 semantically adjacent skills the ATS ontology would recognize (e.g., if JD says "React", and candidate knows it, also include "Front-End Development").
    
    3. **Experience (tailoredExperience)**:
       - Include ALL provided experience roles. Do not omit any.
       - Maintain strict reverse chronological order.
       - Rewrite bullets using the STAR-K methodology (Situation, Task, Action, Result + Keywords):
         * Every bullet MUST contain a quantifiable metric (percentage, dollar amount, time saved, team size, etc.).
         * Every bullet MUST embed at least one keyword from the JD naturally in context.
         * BAD example: "Responsible for digital marketing, SEO, and increasing web traffic."
         * GOOD example: "Directed comprehensive digital marketing initiatives, leveraging advanced Search Engine Optimization (SEO) to increase organic web traffic by 42% within six months, generating $1.2M in new pipeline."
       - Maximum ${targetPageCount === 1 ? '3' : '4'} bullets per role.
       - For acronyms, spell out the term first followed by the abbreviation in parentheses on first use.
       - Ensure employment dates use consistent "Month YYYY" format (e.g., "March 2023 - January 2026"). If the original data has ambiguous dates, normalize them.
    
    4. **Cover Letter (coverLetter)**:
       - Use the Problem-Solution framework optimized for ATS semantic scoring:
         * Paragraph 1 (Problem): Open by identifying a specific business challenge or strategic priority inferred from the JD or company research. Demonstrate that you understand their pain point. Then connect your background as the solution.
         * Paragraph 2 (Solution): Map 2-3 of the candidate's most impactful, quantifiable achievements directly to the role's core requirements. Use STAR-K format for at least one achievement.
         * Paragraph 3 (Call to Action): Express enthusiasm for contributing to the company's specific goals. Include a confident, forward-looking closing.
       - Keep under 350 words total.
       - Do NOT include any greeting (Dear...) or sign-off (Sincerely...) — those are added separately.
       - Naturally embed 3-5 critical keywords from the JD throughout the letter.
    
    5. **Match Score (matchScore)**: ${includeScore ? 'Provide a 0-100 semantic match score evaluating: keyword overlap, skills alignment, experience relevance, and quantifiable achievement density.' : 'Set to 0 (user opted out).'}
    
    6. **Keywords (keyKeywords)**: Extract the 5 most critical hard-skill keywords from the JD that the candidate should ensure appear on their resume. These should be the terms most likely to trigger ATS filtering.
    
    7. **Length Constraint**: Optimize content density to fit within ${targetPageCount} page(s). Do NOT omit any experience entries — reduce bullet count per role if necessary.
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
    You are an expert resume editor specializing in ATS-optimized content density.
    
    Condense this resume to fit on 1-2 pages while MAXIMIZING algorithmic signal density.
    
    Current Data:
    - Summary: ${profile.summary}
    - Skills (${profile.skills.length} total): ${JSON.stringify(profile.skills)}
    - Experience: ${JSON.stringify(experienceSummary)}
    - Education count: ${profile.education.length}
    
    Return ONLY:
    1. condensedSummary: Shorten to 2-3 impactful sentences. Retain quantifiable highlights and core keywords.
    2. selectedSkillIndices: Array of indices (0-based) of top 6-8 skills to keep. Prioritize recently used, high-demand skills.
    3. condensedExperience: Array of {id, condensedBullets} for ALL roles.
       - Condense to 2-3 bullets max per role.
       - Every bullet MUST retain at least one quantifiable metric (%, $, time, team size).
       - Use STAR-K format: embed the key action, the measurable result, and a relevant skill keyword in each bullet.
       - Preserve acronym formatting: spell out the term first, then abbreviation in parentheses on first use.
    4. keepEducationIds: Array of education IDs to keep (usually all).
    
    CRITICAL: Only return the delta/changes, not full data. Use exact IDs from input.
    
    LINGO RULE: Maintain professional, industry-standard terminology. Do not use company-specific shorthand or internal jargon.
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
            experience: condensedExperience.length > 0 ? condensedExperience : profile.experience,
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
    You are an expert cover letter editor specializing in ATS-optimized content.
    
    Condense this cover letter to fit on a single page while maximizing its persuasive impact and ATS semantic relevance.
    
    Current Cover Letter:
    ${content}

    Candidate: ${candidateName}
    Company: ${companyName}
    
    Condensing Rules:
    1. Use the Problem-Solution framework in exactly 3 short paragraphs:
       - Paragraph 1 (Problem): Identify a specific business challenge the company faces. Connect the candidate's background as the ideal solution. This replaces a generic "why this company" opener.
       - Paragraph 2 (Solution): Present the 2-3 most impactful, quantifiable achievements that directly address the role's requirements. At least one achievement should follow STAR-K format (Situation, Task, Action, Result + Keyword).
       - Paragraph 3 (Call to Action): Express enthusiasm for contributing to specific company goals. Confident, forward-looking close.
    2. Each paragraph should be 2-4 sentences maximum.
    3. Naturally embed critical hard-skill keywords from the original letter throughout.
    4. Preserve quantifiable metrics — never remove a number, percentage, or dollar amount.
    5. Remove any redundant, filler, or generic content that does not add signal density.
    6. Keep under 350 words total.
    7. Do NOT include any greeting (Dear...) or sign-off (Sincerely...) — those are added separately.
    
    LINGO RULE: Avoid company-specific jargon or internal lingo. Use professional language that demonstrates alignment with the company's public-facing values and culture without using "insider" buzzwords.

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
