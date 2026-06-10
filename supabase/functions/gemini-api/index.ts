// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "npm:@google/genai";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

interface GithubProject {
    id: number;
    name: string;
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    pushed_at?: string;
    topics?: string[];
}

interface AchievementBankEntry {
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
    sourceType: string;
    confidence: string;
    roleIds: string[];
    mustInclude: boolean;
    niceToUse: boolean;
    neverUse: boolean;
    roleFamilyConstraints: string[];
}

interface ImportedProfileSource {
    id: string;
    label: string;
    url: string;
    sourceType: string;
    summary?: string;
    importedAt?: string;
}

interface TailoringWeights {
    leadership: number;
    technicalDepth: number;
    measurableImpact: number;
    recency: number;
    domainMatch: number;
}

interface TailoringPlaybook {
    id: string;
    name: string;
    strategyPreset: string;
    tone: string;
    conciseness: string;
    focusSkill: string;
    critiqueMode: string;
    preferredRoleFamilies: string[];
    antiClaims: string[];
    weights: TailoringWeights;
    promptOverride?: string;
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
    otherExperience?: Experience[];
    githubProjects?: GithubProject[];
    achievementBank?: AchievementBankEntry[];
    tailoringPlaybooks?: TailoringPlaybook[];
    importedProfileSources?: ImportedProfileSource[];
    targetRoles?: string[];
    preferredIndustries?: string[];
    antiClaims?: string[];
}

interface JobDescription {
    companyName: string;
    roleTitle: string;
    rawText: string;
}

interface TailoringOptions {
    tone?: string;
    conciseness?: string;
    focusSkill?: string;
    strategyPreset?: string;
    careerMode?: string;
    critiqueMode?: string;
    weights?: TailoringWeights;
    preferredRoleFamilies?: string[];
    antiClaims?: string[];
    promptOverride?: string;
    regenerationInstructions?: string;
    selectedPlaybookId?: string;
    jobAnalysisOverride?: Record<string, any>;
}

const defaultWeights: TailoringWeights = {
    leadership: 0.5,
    technicalDepth: 0.5,
    measurableImpact: 0.7,
    recency: 0.7,
    domainMatch: 0.6,
};

const roleFamilyPacks: Record<string, string> = {
    engineering: 'Prioritize technical depth, systems impact, delivery quality, and collaboration with product/design.',
    product: 'Prioritize problem framing, cross-functional leadership, roadmap influence, customer insight, and measurable business outcomes.',
    design: 'Prioritize craft, systems thinking, user research, iteration, collaboration, and measurable experience improvements.',
    marketing: 'Prioritize audience insight, channel execution, conversion outcomes, growth experiments, and brand/story clarity.',
    operations: 'Prioritize reliability, process design, stakeholder coordination, throughput, cost savings, and execution discipline.',
    sales: 'Prioritize pipeline growth, relationship management, quota attainment, deal strategy, and customer outcomes.',
    general: 'Balance delivery, collaboration, business impact, and role-specific language without overstating direct fit.',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { action, payload, access_token } = await req.json();

        let authHeader = req.headers.get('Authorization');
        let token = '';

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        } else if (access_token) {
            token = access_token;
        }

        if (!token) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header or token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        );

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid session' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const apiKey = Deno.env.get('GOOGLE_GENAI_API_KEY');
        if (!apiKey) {
            throw new Error('Google GenAI API Key is missing. Check Edge Function secrets.');
        }

        const ai = new GoogleGenAI({ apiKey });

        switch (action) {
            case 'parseResume':
                return await handleParseResume(ai, payload);
            case 'tailorResume':
                return await handleTailorResume(ai, payload);
            case 'analyzeJobDescription':
                return await handleAnalyzeJobDescription(ai, payload);
            case 'generateIdealJobDescription':
                return await handleGenerateIdealJobDescription(ai, payload);
            case 'importProfileSource':
                return await handleImportProfileSource(ai, payload);
            case 'condenseResume':
                return await handleCondenseResume(ai, payload);
            case 'condenseCoverLetter':
                return await handleCondenseCoverLetter(ai, payload);
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    } catch (error: any) {
        console.error('Edge Function Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

async function generateJson(ai: GoogleGenAI, args: {
    model?: string;
    prompt: string;
    schema: any;
    tools?: any[];
}) {
    const response = await ai.models.generateContent({
        model: args.model || 'gemini-3-flash-preview',
        contents: [{ text: args.prompt }],
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            responseMimeType: 'application/json',
            responseSchema: args.schema,
            tools: args.tools,
        }
    });

    return {
        data: JSON.parse(response.text || '{}'),
        response,
    };
}

function stableId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function clampWeight(value: number | undefined, fallback: number) {
    if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
    return Math.max(0, Math.min(1, value));
}

function normalizeWeights(weights?: Partial<TailoringWeights>): TailoringWeights {
    return {
        leadership: clampWeight(weights?.leadership, defaultWeights.leadership),
        technicalDepth: clampWeight(weights?.technicalDepth, defaultWeights.technicalDepth),
        measurableImpact: clampWeight(weights?.measurableImpact, defaultWeights.measurableImpact),
        recency: clampWeight(weights?.recency, defaultWeights.recency),
        domainMatch: clampWeight(weights?.domainMatch, defaultWeights.domainMatch),
    };
}

function scoreGithubProject(project: GithubProject, keywords: string[], focusSkill?: string) {
    const haystack = [
        project.name,
        project.description || '',
        project.language || '',
        ...(project.topics || []),
    ].join(' ').toLowerCase();

    let score = project.stargazers_count * 0.05;
    for (const keyword of keywords) {
        if (keyword && haystack.includes(keyword.toLowerCase())) {
            score += 2;
        }
    }

    if (focusSkill && haystack.includes(focusSkill.toLowerCase())) {
        score += 3;
    }

    if (project.pushed_at) {
        const ageInDays = Math.max(
            0,
            (Date.now() - new Date(project.pushed_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        score += Math.max(0, 4 - ageInDays / 90);
    }

    return score;
}

function selectRelevantProjects(projects: GithubProject[], keywords: string[], focusSkill?: string) {
    return [...projects]
        .sort((a, b) => scoreGithubProject(b, keywords, focusSkill) - scoreGithubProject(a, keywords, focusSkill))
        .slice(0, 3);
}

function resolvePlaybook(profile: UserProfile, options?: TailoringOptions) {
    const playbooks = profile.tailoringPlaybooks || [];
    const selected = playbooks.find((playbook) => playbook.id === options?.selectedPlaybookId);
    if (!selected) {
        return null;
    }

    return selected;
}

function mergeTailoringOptions(profile: UserProfile, options?: TailoringOptions) {
    const selectedPlaybook = resolvePlaybook(profile, options);
    const merged = {
        tone: options?.tone || selectedPlaybook?.tone || 'professional',
        conciseness: options?.conciseness || selectedPlaybook?.conciseness || 'standard',
        focusSkill: options?.focusSkill || selectedPlaybook?.focusSkill || '',
        strategyPreset: options?.strategyPreset || selectedPlaybook?.strategyPreset || 'Balanced',
        careerMode: options?.careerMode || 'Standard',
        critiqueMode: options?.critiqueMode || selectedPlaybook?.critiqueMode || 'Blunt',
        preferredRoleFamilies: options?.preferredRoleFamilies?.length
            ? options.preferredRoleFamilies
            : (selectedPlaybook?.preferredRoleFamilies || []),
        antiClaims: [
            ...(profile.antiClaims || []),
            ...(selectedPlaybook?.antiClaims || []),
            ...(options?.antiClaims || []),
        ],
        promptOverride: options?.promptOverride || selectedPlaybook?.promptOverride || (selectedPlaybook as any)?.promptOverrides || '',
        regenerationInstructions: options?.regenerationInstructions || '',
        selectedPlaybookId: options?.selectedPlaybookId,
        weights: normalizeWeights({
            ...selectedPlaybook?.weights,
            ...options?.weights,
        }),
    };

    return merged;
}

function buildPromptPreview(context: {
    options: ReturnType<typeof mergeTailoringOptions>;
    jobAnalysis: any;
    evidence: any;
    companyResearch: string;
    roleFamilyInstruction: string;
}) {
    const basePrompt = `
Strategy preset: ${context.options.strategyPreset}
Tone: ${context.options.tone}
Conciseness: ${context.options.conciseness}
Career mode: ${context.options.careerMode}
Critique mode: ${context.options.critiqueMode}
Focus skill: ${context.options.focusSkill || 'None'}
Weights: ${JSON.stringify(context.options.weights)}
Role family pack: ${context.roleFamilyInstruction}
Job analysis: ${JSON.stringify(context.jobAnalysis)}
Company research summary: ${context.companyResearch}
Evidence resolution: ${JSON.stringify(context.evidence)}
Anti-claims: ${JSON.stringify(context.options.antiClaims)}
Regeneration instructions: ${context.options.regenerationInstructions || 'None'}

Rules:
- Never invent metrics, team size, scope, ownership, leadership, or tools.
- Use missing-evidence handling instead of fabrication.
- Prefer concrete, recruiter-readable language over fluff.
- Avoid keyword stuffing and repeated action verbs.
`.trim();

    return context.options.promptOverride
        ? `${basePrompt}\n\nUser prompt adjustments:\n${context.options.promptOverride}`
        : basePrompt;
}

async function handleParseResume(ai: GoogleGenAI, payload: { base64Pdf: string }) {
    const prompt = `
Analyze the attached resume PDF and extract structured data.

Rules:
- Only use facts present in the document.
- Do not infer metrics that are not written.
- Split experience into bullet arrays.
- Return empty strings or arrays when missing.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: 'application/pdf',
                            data: payload.base64Pdf,
                        }
                    }
                ]
            }
        ],
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            responseMimeType: 'application/json',
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
                                description: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                                year: { type: Type.STRING },
                            }
                        }
                    },
                    links: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                platform: { type: Type.STRING },
                                url: { type: Type.STRING },
                            }
                        }
                    }
                },
                required: ['fullName', 'email', 'experience', 'skills']
            }
        }
    });

    const parsedData = JSON.parse(response.text || '{}');
    const finalizedData = {
        ...parsedData,
        experience: (parsedData.experience || []).map((exp: any) => ({ ...exp, id: stableId('exp') })),
        education: (parsedData.education || []).map((edu: any) => ({ ...edu, id: stableId('edu') })),
        links: parsedData.links || [],
        skills: parsedData.skills || [],
        summary: parsedData.summary || '',
        fullName: parsedData.fullName || '',
        email: parsedData.email || '',
        phone: parsedData.phone || '',
        location: parsedData.location || '',
        achievementBank: [],
        tailoringPlaybooks: [],
        importedProfileSources: [],
        targetRoles: [],
        preferredIndustries: [],
        targetRegions: [],
        antiClaims: [],
        learnedPreferenceSuggestions: [],
    };

    return new Response(JSON.stringify(finalizedData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function handleAnalyzeJobDescription(ai: GoogleGenAI, payload: { jd: JobDescription }) {
    const analysis = await analyzeJobDescription(ai, payload.jd);
    return new Response(JSON.stringify(analysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function handleGenerateIdealJobDescription(ai: GoogleGenAI, payload: {
    profile: UserProfile;
    instructions?: string;
}) {
    if (!payload.profile) {
        throw new Error('Profile is required to generate an ideal job description.');
    }

    const usableAchievements = (payload.profile.achievementBank || [])
        .filter((entry) => !entry.neverUse);

    const prompt = `
Create a theoretical job posting that is a 100% evidence-backed match for this candidate.

Candidate evidence:
${JSON.stringify({
        summary: payload.profile.summary,
        skills: payload.profile.skills,
        experience: payload.profile.experience,
        otherExperience: payload.profile.otherExperience || [],
        education: payload.profile.education,
        achievements: usableAchievements,
        githubProjects: payload.profile.githubProjects || [],
        importedProfileSources: payload.profile.importedProfileSources || [],
        targetRoles: payload.profile.targetRoles || [],
        preferredIndustries: payload.profile.preferredIndustries || [],
        antiClaims: payload.profile.antiClaims || [],
    })}

Optional user direction:
${payload.instructions || 'None'}

Task:
- Return one concise, market-recognizable role title.
- Write a realistic, company-neutral job description between 350 and 600 words.
- Include clear sections for role overview, responsibilities, required qualifications, and preferred qualifications.
- Make every responsibility and qualification directly supportable by the candidate evidence above.
- Treat target roles, preferred industries, and user direction as preferences, not proof of experience.
- Prefer the candidate's strongest and most recent demonstrated capabilities.
- Translate candidate evidence into employer language without copying resume bullets verbatim.

Strict grounding rules:
- Do not invent years of experience, metrics, tools, certifications, degrees, industries, management scope, or responsibilities.
- Do not include any requirement the candidate cannot already satisfy from the supplied evidence.
- Do not include the candidate's name, contact details, current employer, or other identifying information.
- Do not invent a company, compensation range, location, benefits, or hiring process.
- Do not describe the result as a real open position or promise that such a position exists.
- Respect all anti-claims and evidence entries marked never-use.
`;

    const { data } = await generateJson(ai, {
        prompt,
        schema: {
            type: Type.OBJECT,
            properties: {
                roleTitle: { type: Type.STRING },
                jobDescription: { type: Type.STRING },
            },
            required: ['roleTitle', 'jobDescription'],
        }
    });

    if (!data.roleTitle || !data.jobDescription) {
        throw new Error('Gemini returned an incomplete ideal job description.');
    }

    return new Response(JSON.stringify({
        roleTitle: data.roleTitle,
        jobDescription: data.jobDescription,
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function handleImportProfileSource(ai: GoogleGenAI, payload: { url: string; label?: string; sourceType?: string; rawText?: string; }) {
    const prompt = `
Summarize this imported candidate profile source into grounded facts.

URL: ${payload.url}
Label: ${payload.label || ''}
Provided text:
${payload.rawText || 'No page text provided. Summarize only what can be inferred from the URL metadata.'}

Return:
- summary: concise factual summary
- skills: extracted skill phrases
- achievements: extracted evidence statements
- warnings: missing or low-confidence areas
`;

    const { data } = await generateJson(ai, {
        prompt,
        schema: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
                warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
            }
        }
    });

    return new Response(JSON.stringify({
        id: stableId('source'),
        label: payload.label || payload.url,
        url: payload.url,
        sourceType: payload.sourceType || 'other',
        summary: data.summary || '',
        skills: data.skills || [],
        achievements: data.achievements || [],
        warnings: data.warnings || [],
        importedAt: new Date().toISOString(),
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function researchCompany(ai: GoogleGenAI, companyName: string): Promise<{ summary: string; sources: any[] }> {
    const prompt = `
Research the company "${companyName}".
Return a concise paragraph covering:
- mission or product direction
- relevant business challenges
- current momentum or strategic themes
- cultural cues useful for candidate positioning

Do not over-index on branded slogans.
`;

    try {
        const { data, response } = await generateJson(ai, {
            prompt,
            schema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                }
            },
            tools: [{ googleSearch: {} }],
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .map((chunk: any) => chunk.web)
            .filter((web: any) => web)
            .map((web: any) => ({ title: web.title, uri: web.uri }));

        return {
            summary: data.summary || 'Could not retrieve company details.',
            sources,
        };
    } catch (error) {
        console.warn('Company research failed:', error);
        return { summary: 'Could not retrieve company details.', sources: [] };
    }
}

async function analyzeJobDescription(ai: GoogleGenAI, jd: JobDescription) {
    const prompt = `
You are analyzing a job description for structured resume tailoring.

Company: ${jd.companyName}
Role: ${jd.roleTitle}
Job Description:
${jd.rawText}

Extract structured fields for tailoring. Be precise and avoid fluff.
`;

    const { data } = await generateJson(ai, {
        prompt,
        schema: {
            type: Type.OBJECT,
            properties: {
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                seniority: { type: Type.STRING },
                domain: { type: Type.STRING },
                painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                signalsToAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
                mustHaveTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
                niceToHaveTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
                roleFamily: { type: Type.STRING },
            },
            required: ['keywords', 'requirements', 'responsibilities', 'seniority', 'domain', 'painPoints', 'signalsToAvoid', 'mustHaveTerms', 'niceToHaveTerms', 'roleFamily'],
        }
    });

    return {
        keywords: data.keywords || [],
        requirements: data.requirements || [],
        responsibilities: data.responsibilities || [],
        seniority: data.seniority || '',
        domain: data.domain || '',
        painPoints: data.painPoints || [],
        signalsToAvoid: data.signalsToAvoid || [],
        mustHaveTerms: data.mustHaveTerms || [],
        niceToHaveTerms: data.niceToHaveTerms || [],
        roleFamily: (data.roleFamily || 'general').toLowerCase(),
    };
}

async function resolveEvidence(ai: GoogleGenAI, args: {
    profile: UserProfile;
    jobAnalysis: any;
    selectedProjects: GithubProject[];
    companyResearch: string;
    options: ReturnType<typeof mergeTailoringOptions>;
}) {
    const prompt = `
Resolve candidate evidence for a grounded tailoring pass.

Job analysis:
${JSON.stringify(args.jobAnalysis)}

Candidate profile:
${JSON.stringify({
        summary: args.profile.summary,
        skills: args.profile.skills,
        experience: args.profile.experience,
        education: args.profile.education,
        achievementBank: args.profile.achievementBank || [],
        importedProfileSources: args.profile.importedProfileSources || [],
    })}

Selected GitHub projects:
${JSON.stringify(args.selectedProjects)}

Options:
${JSON.stringify(args.options)}

Company research summary:
${args.companyResearch}

Rules:
- Only create supported claims if grounded in the profile, projects, or imported evidence.
- If a JD requirement lacks evidence, put it under missingEvidence or blockedClaims.
- Unsupported leadership claims, metrics, or tool experience must be blocked.
`;

    const { data } = await generateJson(ai, {
        prompt,
        schema: {
            type: Type.OBJECT,
            properties: {
                sourceFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
                supportedClaims: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            claim: { type: Type.STRING },
                            evidence: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        sourceType: { type: Type.STRING },
                                        sourceLabel: { type: Type.STRING },
                                        section: { type: Type.STRING },
                                        sourceId: { type: Type.STRING },
                                        excerpt: { type: Type.STRING },
                                    }
                                }
                            }
                        }
                    }
                },
                missingEvidence: { type: Type.ARRAY, items: { type: Type.STRING } },
                blockedClaims: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['sourceFacts', 'supportedClaims', 'missingEvidence', 'blockedClaims'],
        }
    });

    return {
        sourceFacts: data.sourceFacts || [],
        supportedClaims: data.supportedClaims || [],
        missingEvidence: data.missingEvidence || [],
        blockedClaims: data.blockedClaims || [],
    };
}

async function generateSummary(ai: GoogleGenAI, args: {
    profile: UserProfile;
    jobAnalysis: any;
    evidence: any;
    options: ReturnType<typeof mergeTailoringOptions>;
    companyResearch: string;
    roleFamilyInstruction: string;
}) {
    const prompt = `
Write a grounded resume summary for a mid-career candidate.

${buildPromptPreview(args)}

Task:
- Write 2-3 sentences.
- Use exact JD terminology only when it is supported.
- Avoid generic opener phrases and hollow adjectives.
- Do not invent metrics. If there is no metric, write strong but honest specificity.
- For career changers in Transferable Skills mode, emphasize adjacency and proof of learning without implying direct prior ownership.
`;

    const { data } = await generateJson(ai, {
        prompt,
        schema: {
            type: Type.OBJECT,
            properties: {
                tailoredSummary: { type: Type.STRING },
                alternateSummary: { type: Type.STRING },
                why: { type: Type.STRING },
                evidence: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            sourceType: { type: Type.STRING },
                            sourceLabel: { type: Type.STRING },
                            section: { type: Type.STRING },
                            sourceId: { type: Type.STRING },
                            excerpt: { type: Type.STRING },
                        }
                    }
                }
            },
            required: ['tailoredSummary', 'alternateSummary', 'why', 'evidence'],
        }
    });

    return data;
}

async function generateSkills(ai: GoogleGenAI, args: {
    profile: UserProfile;
    jobAnalysis: any;
    evidence: any;
    options: ReturnType<typeof mergeTailoringOptions>;
    roleFamilyInstruction: string;
}) {
    const prompt = `
Select the best grounded skills for a tailored resume.

${buildPromptPreview({ ...args, companyResearch: '', })}

Task:
- Select 6-10 skills.
- Use JD terms when supported.
- Prefer recent and evidence-backed skills.
- Avoid filler skills and near-duplicates.
`;

    const { data } = await generateJson(ai, {
        prompt,
        schema: {
            type: Type.OBJECT,
            properties: {
                tailoredSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                rationale: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            skill: { type: Type.STRING },
                            why: { type: Type.STRING },
                        }
                    }
                }
            },
            required: ['tailoredSkills', 'rationale'],
        }
    });

    return data;
}

async function generateExperience(ai: GoogleGenAI, args: {
    profile: UserProfile;
    jobAnalysis: any;
    evidence: any;
    options: ReturnType<typeof mergeTailoringOptions>;
    roleFamilyInstruction: string;
}) {
    const maxBulletsPerRole = args.options.strategyPreset === 'ATS' ? 4 : 3;

    const prompt = `
Rewrite resume bullets with strict grounding.

${buildPromptPreview({ ...args, companyResearch: '' })}

Task:
- Keep all experience roles.
- Maintain reverse chronological order.
- For each role, rewrite up to ${maxBulletsPerRole} bullets.
- Do not invent metrics or responsibilities.
- If a bullet lacks quantification, improve specificity using scope, tools, process, stakeholders, or outcomes that are actually supported.
- Avoid repeated verbs across bullets.
- Return both a primary rewrite and alternate rewrite for each returned bullet.
`;

    const { data } = await generateJson(ai, {
        prompt,
        schema: {
            type: Type.OBJECT,
            properties: {
                tailoredExperience: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            description: { type: Type.ARRAY, items: { type: Type.STRING } },
                            alternates: { type: Type.ARRAY, items: { type: Type.STRING } },
                            reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
                            evidence: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            sourceType: { type: Type.STRING },
                                            sourceLabel: { type: Type.STRING },
                                            section: { type: Type.STRING },
                                            sourceId: { type: Type.STRING },
                                            excerpt: { type: Type.STRING },
                                        }
                                    }
                                }
                            }
                        },
                        required: ['id', 'description', 'alternates', 'reasons', 'evidence']
                    }
                }
            },
            required: ['tailoredExperience'],
        }
    });

    return data;
}

async function generateCoverLetter(ai: GoogleGenAI, args: {
    profile: UserProfile;
    jobAnalysis: any;
    evidence: any;
    options: ReturnType<typeof mergeTailoringOptions>;
    companyResearch: string;
    roleFamilyInstruction: string;
}) {
    const prompt = `
Write a grounded cover letter body using the same evidence model as the tailored resume.

${buildPromptPreview(args)}

Task:
- 3 paragraphs.
- No greeting or sign-off.
- Keep it under 320 words.
- Sound tailored and concrete, not inflated.
- Mention adjacent strengths honestly for career changers.
- Do not claim direct experience where the evidence model marked gaps.
`;

    const { data } = await generateJson(ai, {
        prompt,
        schema: {
            type: Type.OBJECT,
            properties: {
                coverLetter: { type: Type.STRING },
            },
            required: ['coverLetter'],
        }
    });

    return data.coverLetter || '';
}

async function generateDiagnostics(ai: GoogleGenAI, args: {
    profile: UserProfile;
    jobAnalysis: any;
    evidence: any;
    summary: any;
    skills: any;
    experience: any;
    options: ReturnType<typeof mergeTailoringOptions>;
}) {
    const prompt = `
Produce blunt post-generation diagnostics for this tailored application.

Job analysis:
${JSON.stringify(args.jobAnalysis)}

Evidence:
${JSON.stringify(args.evidence)}

Generated summary:
${JSON.stringify(args.summary)}

Generated skills:
${JSON.stringify(args.skills)}

Generated experience:
${JSON.stringify(args.experience)}

Rules:
- Be blunt by default.
- Focus on missing evidence, recruiter concerns, and overused phrasing.
- Call out unsupported claims that were intentionally avoided.
- Suggest manual improvements a user can make.
`;

    const { data } = await generateJson(ai, {
        prompt,
        schema: {
            type: Type.OBJECT,
            properties: {
                matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                unsupportedClaimsAvoided: { type: Type.ARRAY, items: { type: Type.STRING } },
                recruiterConcerns: { type: Type.ARRAY, items: { type: Type.STRING } },
                overusedPhrasing: { type: Type.ARRAY, items: { type: Type.STRING } },
                manualActionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                editSuggestions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            label: { type: Type.STRING },
                            rationale: { type: Type.STRING },
                            instruction: { type: Type.STRING },
                        }
                    }
                },
                keyKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                matchScore: { type: Type.NUMBER },
            },
            required: ['matchedKeywords', 'missingKeywords', 'unsupportedClaimsAvoided', 'recruiterConcerns', 'overusedPhrasing', 'manualActionItems', 'editSuggestions', 'keyKeywords', 'matchScore'],
        }
    });

    return data;
}

async function handleTailorResume(ai: GoogleGenAI, payload: {
    baseProfile: UserProfile;
    jd: JobDescription;
    githubProjects: GithubProject[];
    includeScore: boolean;
    targetPageCount?: number;
    options?: TailoringOptions;
}) {
    const baseProfile = payload.baseProfile;
    const options = mergeTailoringOptions(baseProfile, payload.options);
    const analyzedJob = await analyzeJobDescription(ai, payload.jd);
    const jobAnalysis = {
        ...analyzedJob,
        ...(payload.options?.jobAnalysisOverride || {}),
        keywords: payload.options?.jobAnalysisOverride?.keywords || analyzedJob.keywords,
        requirements: payload.options?.jobAnalysisOverride?.requirements || analyzedJob.requirements,
        responsibilities: payload.options?.jobAnalysisOverride?.responsibilities || analyzedJob.responsibilities,
        painPoints: payload.options?.jobAnalysisOverride?.painPoints || analyzedJob.painPoints,
        signalsToAvoid: payload.options?.jobAnalysisOverride?.signalsToAvoid || analyzedJob.signalsToAvoid,
        mustHaveTerms: payload.options?.jobAnalysisOverride?.mustHaveTerms || analyzedJob.mustHaveTerms,
        niceToHaveTerms: payload.options?.jobAnalysisOverride?.niceToHaveTerms || analyzedJob.niceToHaveTerms,
    };
    const companyResearch = await researchCompany(ai, payload.jd.companyName);
    const relevantProjects = selectRelevantProjects(
        payload.githubProjects?.length ? payload.githubProjects : (baseProfile.githubProjects || []),
        jobAnalysis.keywords,
        options.focusSkill,
    );
    const evidenceResolution = await resolveEvidence(ai, {
        profile: baseProfile,
        jobAnalysis,
        selectedProjects: relevantProjects,
        companyResearch: companyResearch.summary,
        options,
    });
    const roleFamilyInstruction = roleFamilyPacks[jobAnalysis.roleFamily] || roleFamilyPacks.general;

    const summaryResult = await generateSummary(ai, {
        profile: baseProfile,
        jobAnalysis,
        evidence: evidenceResolution,
        options,
        companyResearch: companyResearch.summary,
        roleFamilyInstruction,
    });
    const skillsResult = await generateSkills(ai, {
        profile: baseProfile,
        jobAnalysis,
        evidence: evidenceResolution,
        options,
        roleFamilyInstruction,
    });
    const experienceResult = await generateExperience(ai, {
        profile: baseProfile,
        jobAnalysis,
        evidence: evidenceResolution,
        options,
        roleFamilyInstruction,
    });
    const coverLetter = await generateCoverLetter(ai, {
        profile: baseProfile,
        jobAnalysis,
        evidence: evidenceResolution,
        options,
        companyResearch: companyResearch.summary,
        roleFamilyInstruction,
    });
    const diagnosticsResult = await generateDiagnostics(ai, {
        profile: baseProfile,
        jobAnalysis,
        evidence: evidenceResolution,
        summary: summaryResult,
        skills: skillsResult,
        experience: experienceResult,
        options,
    });

    const tailoredExperience = (experienceResult.tailoredExperience || []).map((tailoredExp: any) => {
        const original = baseProfile.experience.find((exp) => exp.id === tailoredExp.id);
        if (!original) return null;
        return {
            ...original,
            description: tailoredExp.description?.length ? tailoredExp.description : original.description,
        };
    }).filter(Boolean);

    const rewriteInsights = {
        summary: {
            original: baseProfile.summary || '',
            tailored: summaryResult.tailoredSummary || baseProfile.summary,
            alternate: summaryResult.alternateSummary || summaryResult.tailoredSummary || baseProfile.summary,
            why: summaryResult.why || '',
            evidence: summaryResult.evidence || [],
        },
        skills: (skillsResult.rationale || []).map((entry: any) => ({
            skill: entry.skill,
            why: entry.why,
        })),
        bullets: (experienceResult.tailoredExperience || []).map((item: any) => {
            const original = baseProfile.experience.find((exp) => exp.id === item.id);
            const rewrites = (item.description || []).map((bullet: string, index: number) => ({
                original: original?.description?.[index] || '',
                tailored: bullet,
                alternate: item.alternates?.[index] || bullet,
                why: item.reasons?.[index] || '',
                evidence: item.evidence?.[index] || [],
            }));
            return {
                experienceId: item.id,
                rewrites,
            };
        }),
    };

    const tailoredProfile = {
        ...baseProfile,
        summary: summaryResult.tailoredSummary || baseProfile.summary,
        skills: Array.isArray(skillsResult.tailoredSkills) && skillsResult.tailoredSkills.length
            ? skillsResult.tailoredSkills
            : baseProfile.skills,
        experience: tailoredExperience.length ? tailoredExperience : baseProfile.experience,
        githubProjects: relevantProjects,
    };

    const assembledPromptPreview = buildPromptPreview({
        options,
        jobAnalysis,
        evidence: evidenceResolution,
        companyResearch: companyResearch.summary,
        roleFamilyInstruction,
    });

    const finalResult = {
        application: {
            resume: tailoredProfile,
            coverLetter,
            matchScore: payload.includeScore ? (diagnosticsResult.matchScore || 0) : 0,
            keyKeywords: diagnosticsResult.keyKeywords || [],
            searchSources: companyResearch.sources,
            githubProjects: relevantProjects,
            showMatchScore: payload.includeScore,
            jobAnalysis,
            evidenceResolution,
            diagnostics: {
                matchedKeywords: diagnosticsResult.matchedKeywords || [],
                missingKeywords: diagnosticsResult.missingKeywords || [],
                unsupportedClaimsAvoided: diagnosticsResult.unsupportedClaimsAvoided || [],
                recruiterConcerns: diagnosticsResult.recruiterConcerns || [],
                overusedPhrasing: diagnosticsResult.overusedPhrasing || [],
                manualActionItems: diagnosticsResult.manualActionItems || [],
            },
            rewriteInsights,
            assembledPromptPreview,
            promptOverride: options.promptOverride || '',
            selectedPlaybookId: options.selectedPlaybookId,
            generationOptions: options,
            editSuggestions: (diagnosticsResult.editSuggestions || []).map((suggestion: any) => ({
                id: stableId('suggestion'),
                label: suggestion.label,
                rationale: suggestion.rationale,
                instruction: suggestion.instruction,
                accepted: false,
            })),
            regenerationHistory: options.regenerationInstructions
                ? [{ timestamp: new Date().toISOString(), instructions: options.regenerationInstructions }]
                : [],
        },
        rawResponse: JSON.stringify({
            summary: summaryResult,
            skills: skillsResult,
            experience: experienceResult,
            diagnostics: diagnosticsResult,
        }),
    };

    return new Response(JSON.stringify(finalResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function handleCondenseResume(ai: GoogleGenAI, payload: { profile: UserProfile }) {
    const prompt = `
You are condensing a resume while keeping grounded content intact.

Profile:
${JSON.stringify({
        summary: payload.profile.summary,
        skills: payload.profile.skills,
        experience: payload.profile.experience,
    })}

Task:
- Condense summary to 2 sentences maximum.
- Keep 6-8 strongest skills.
- Limit each role to up to 3 bullets without inventing details.
`;

    const { data } = await generateJson(ai, {
        prompt,
        schema: {
            type: Type.OBJECT,
            properties: {
                condensedSummary: { type: Type.STRING },
                selectedSkillIndices: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                condensedExperience: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            bulletIndices: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                        }
                    }
                }
            }
        }
    });

    const condensedSkills = (data.selectedSkillIndices || [])
        .filter((index: number) => index >= 0 && index < payload.profile.skills.length)
        .map((index: number) => payload.profile.skills[index]);

    const condensedExperience = (data.condensedExperience || []).map((item: any) => {
        const original = payload.profile.experience.find((exp) => exp.id === item.id);
        if (!original) return null;
        return {
            ...original,
            description: (item.bulletIndices || [])
                .filter((index: number) => index >= 0 && index < original.description.length)
                .map((index: number) => original.description[index]),
        };
    }).filter(Boolean);

    return new Response(JSON.stringify({
        profile: {
            ...payload.profile,
            summary: data.condensedSummary || payload.profile.summary,
            skills: condensedSkills.length ? condensedSkills : payload.profile.skills.slice(0, 8),
            experience: condensedExperience.length ? condensedExperience : payload.profile.experience,
        },
        rawResponse: JSON.stringify(data),
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

async function handleCondenseCoverLetter(ai: GoogleGenAI, payload: { content: string; candidateName: string; companyName: string }) {
    const prompt = `
Condense this cover letter to a grounded, high-signal single-page version.

Candidate: ${payload.candidateName}
Company: ${payload.companyName}
Content:
${payload.content}

Rules:
- Keep it specific.
- Remove filler and repetition.
- Preserve only grounded claims already present.
`;

    const { data } = await generateJson(ai, {
        prompt,
        schema: {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING },
            },
            required: ['content'],
        }
    });

    return new Response(JSON.stringify({
        content: data.content || payload.content,
        rawResponse: JSON.stringify(data),
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
