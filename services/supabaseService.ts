import { supabase } from './supabaseClient';
import {
    UserProfile,
    TailoredApplication,
    TargetRegion,
    TailoringPlaybook,
    LeadSource,
    LeadSourceCheck,
    JobLead,
    GenerationJob,
    JobDescription,
    GithubProject,
    TailoringOptions,
} from '../types';

const defaultRegion = (region?: Partial<TargetRegion>): TargetRegion => ({
    id: region?.id || crypto.randomUUID(),
    label: region?.label || '',
    remotePreference: region?.remotePreference || 'flexible',
});

const normalizeProfile = (data: any): UserProfile => ({
    fullName: data.full_name || '',
    email: data.email || '',
    location: data.location || '',
    phone: data.phone || '',
    summary: data.summary || '',
    skills: data.skills || [],
    experience: data.experience || [],
    education: data.education || [],
    links: data.links || [],
    githubUsername: data.github_username,
    otherExperience: data.other_experience || [],
    portfolioTemplate: data.portfolio_template,
    portfolioTheme: data.portfolio_theme,
    profilePhotoUrl: data.profile_photo_url,
    githubProjects: data.github_projects || [],
    githubLastSyncedAt: data.github_last_synced_at,
    achievementBank: data.achievement_bank || [],
    tailoringPlaybooks: (data.tailoring_playbooks || []).map((playbook: any) => ({
        ...playbook,
        promptOverride: playbook.promptOverride || playbook.promptOverrides || '',
    })),
    importedProfileSources: data.imported_profile_sources || [],
    targetRoles: data.target_roles || [],
    preferredIndustries: data.preferred_industries || [],
    targetRegions: (data.target_regions || []).map(defaultRegion),
    antiClaims: data.anti_claims || [],
    learnedPreferenceSuggestions: data.learned_preference_suggestions || [],
});

const normalizeApplication = (app: any): TailoredApplication => ({
    id: app.id,
    createdAt: new Date(app.created_at).getTime(),
    jobDescription: {
        companyName: app.company_name,
        roleTitle: app.role_title,
        rawText: app.raw_job_description,
    },
    resume: app.resume_data,
    coverLetter: app.cover_letter,
    matchScore: app.match_score,
    keyKeywords: app.key_keywords,
    searchSources: app.search_sources,
    status: app.status,
    slug: app.slug,
    githubProjects: app.github_projects,
    showMatchScore: app.show_match_score,
    template: app.template,
    portfolioTheme: app.portfolio_theme,
    profilePhotoUrl: app.profile_photo_url,
    githubLastSyncedAt: app.github_last_synced_at,
    jobAnalysis: app.job_analysis,
    evidenceResolution: app.evidence_resolution,
    diagnostics: app.diagnostics,
    rewriteInsights: app.rewrite_insights,
    assembledPromptPreview: app.prompt_preview,
    promptOverride: app.generation_options?.promptOverride || app.generation_options?.promptPreviewOverride || '',
    selectedPlaybookId: app.selected_playbook_id,
    generationOptions: app.generation_options,
    editSuggestions: app.edit_suggestions,
    regenerationHistory: app.regeneration_history || [],
});

const normalizeGenerationJob = (job: any): GenerationJob => ({
    id: job.id,
    userId: job.user_id,
    status: job.status,
    stage: job.stage || 'Queued',
    progress: job.progress || 0,
    requestPayload: job.request_payload || {},
    resultApplicationId: job.result_application_id,
    errorMessage: job.error_message,
    attemptCount: job.attempt_count || 0,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    startedAt: job.started_at,
    finishedAt: job.finished_at,
});

export const getProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching profile:', error);
        return null;
    }

    return normalizeProfile(data);
};

export const saveProfile = async (userId: string, profile: UserProfile): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            full_name: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            location: profile.location,
            summary: profile.summary,
            skills: profile.skills,
            experience: profile.experience,
            education: profile.education,
            links: profile.links,
            github_username: profile.githubUsername,
            other_experience: profile.otherExperience,
            portfolio_template: profile.portfolioTemplate,
            portfolio_theme: profile.portfolioTheme,
            profile_photo_url: profile.profilePhotoUrl,
            github_projects: profile.githubProjects,
            github_last_synced_at: profile.githubLastSyncedAt,
            achievement_bank: profile.achievementBank,
            tailoring_playbooks: profile.tailoringPlaybooks,
            imported_profile_sources: profile.importedProfileSources,
            target_roles: profile.targetRoles,
            preferred_industries: profile.preferredIndustries,
            target_regions: profile.targetRegions,
            anti_claims: profile.antiClaims,
            learned_preference_suggestions: profile.learnedPreferenceSuggestions,
            updated_at: new Date().toISOString(),
        });

    if (error) {
        console.error('Error saving profile:', error);
        throw error;
    }
};

export const startGenerationJob = async (payload: {
    jd: JobDescription;
    projects: GithubProject[];
    showScore: boolean;
    options?: TailoringOptions;
    leadContext?: any;
}): Promise<GenerationJob> => {
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
    if (sessionError || !session?.access_token) {
        throw new Error('You must be signed in to start a generation job.');
    }

    const response = await fetch('/api/generation-jobs', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(body?.error || 'Failed to start generation job.');
    }

    return normalizeGenerationJob(body.job);
};

export const kickGenerationJob = async (jobId: string): Promise<void> => {
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
    if (sessionError || !session?.access_token) {
        throw new Error('You must be signed in to start the generation worker.');
    }

    const { error } = await supabase.functions.invoke('gemini-api', {
        body: {
            action: 'processGenerationJob',
            payload: { jobId },
            access_token: session.access_token,
        },
        headers: {
            Authorization: `Bearer ${session.access_token}`,
        },
    });

    if (error) {
        const message = error.message || 'Failed to start generation worker.';
        await supabase
            .from('generation_jobs')
            .update({
                status: 'failed',
                stage: 'Failed to start worker',
                progress: 100,
                error_message: message,
                updated_at: new Date().toISOString(),
                finished_at: new Date().toISOString(),
            })
            .eq('id', jobId);
        throw new Error(message);
    }
};

export const getGenerationJob = async (jobId: string): Promise<GenerationJob | null> => {
    const { data, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching generation job:', error);
        throw error;
    }

    return normalizeGenerationJob(data);
};

export const getRecentGenerationJobs = async (userId: string): Promise<GenerationJob[]> => {
    const { data, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['queued', 'running', 'failed', 'succeeded'])
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching generation jobs:', error);
        return [];
    }

    return data.map(normalizeGenerationJob);
};

export const getApplications = async (userId: string): Promise<TailoredApplication[]> => {
    const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications:', error);
        return [];
    }

    return data.map(normalizeApplication);
};

export const saveApplication = async (userId: string, application: TailoredApplication): Promise<void> => {
    const { error } = await supabase
        .from('applications')
        .insert({
            user_id: userId,
            company_name: application.jobDescription.companyName,
            role_title: application.jobDescription.roleTitle,
            raw_job_description: application.jobDescription.rawText,
            resume_data: application.resume,
            cover_letter: application.coverLetter,
            match_score: application.matchScore,
            key_keywords: application.keyKeywords,
            search_sources: application.searchSources,
            status: application.status || 'Pending',
            github_projects: application.githubProjects,
            show_match_score: application.showMatchScore,
            profile_photo_url: application.profilePhotoUrl || application.resume?.profilePhotoUrl,
            template: application.template,
            portfolio_theme: application.portfolioTheme,
            job_analysis: application.jobAnalysis,
            evidence_resolution: application.evidenceResolution,
            diagnostics: application.diagnostics,
            rewrite_insights: application.rewriteInsights,
            prompt_preview: application.assembledPromptPreview,
            selected_playbook_id: application.selectedPlaybookId,
            generation_options: {
                ...(application.generationOptions || {}),
                promptOverride: application.promptOverride ?? application.generationOptions?.promptOverride,
            },
            edit_suggestions: application.editSuggestions,
            regeneration_history: application.regenerationHistory,
        });

    if (error) {
        console.error('Error saving application:', error);
        throw error;
    }
};

export const updateApplication = async (appId: string, updates: Partial<TailoredApplication>): Promise<void> => {
    const updatePayload: any = {};

    if (updates.resume) updatePayload.resume_data = updates.resume;
    if (updates.coverLetter !== undefined) updatePayload.cover_letter = updates.coverLetter;
    if (updates.status) updatePayload.status = updates.status;
    if (updates.template) updatePayload.template = updates.template;
    if (updates.portfolioTheme) updatePayload.portfolio_theme = updates.portfolioTheme;
    if (updates.profilePhotoUrl) updatePayload.profile_photo_url = updates.profilePhotoUrl;
    if (updates.jobDescription) {
        updatePayload.company_name = updates.jobDescription.companyName;
        updatePayload.role_title = updates.jobDescription.roleTitle;
        updatePayload.raw_job_description = updates.jobDescription.rawText;
    }
    if (updates.jobAnalysis) updatePayload.job_analysis = updates.jobAnalysis;
    if (updates.evidenceResolution) updatePayload.evidence_resolution = updates.evidenceResolution;
    if (updates.diagnostics) updatePayload.diagnostics = updates.diagnostics;
    if (updates.rewriteInsights) updatePayload.rewrite_insights = updates.rewriteInsights;
    if (updates.assembledPromptPreview !== undefined) updatePayload.prompt_preview = updates.assembledPromptPreview;
    if (updates.selectedPlaybookId !== undefined) updatePayload.selected_playbook_id = updates.selectedPlaybookId;
    if (updates.generationOptions || updates.promptOverride !== undefined) {
        updatePayload.generation_options = {
            ...(updates.generationOptions || {}),
            promptOverride: updates.promptOverride ?? updates.generationOptions?.promptOverride,
        };
    }
    if (updates.editSuggestions) updatePayload.edit_suggestions = updates.editSuggestions;
    if (updates.regenerationHistory) updatePayload.regeneration_history = updates.regenerationHistory;

    if (Object.keys(updatePayload).length === 0) return;

    const { error } = await supabase
        .from('applications')
        .update(updatePayload)
        .eq('id', appId);

    if (error) {
        console.error('Error updating application:', error);
        throw error;
    }
};

export const updateApplicationStatus = async (appId: string, status: string): Promise<void> => {
    return updateApplication(appId, { status: status as any });
};

export const getApplicationBySlug = async (slug: string): Promise<TailoredApplication | null> => {
    const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching application by slug:', error);
        return null;
    }

    return normalizeApplication(data);
};

export const deleteApplication = async (appId: string): Promise<void> => {
    const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', appId);

    if (error) {
        console.error('Error deleting application:', error);
        throw error;
    }
};

export const saveTailoringPlaybook = async (userId: string, playbook: TailoringPlaybook): Promise<void> => {
    const profile = await getProfile(userId);
    if (!profile) {
        throw new Error('Profile not found');
    }

    const playbooks = profile.tailoringPlaybooks || [];
    const nextPlaybooks = playbooks.some((existing) => existing.id === playbook.id)
        ? playbooks.map((existing) => existing.id === playbook.id ? playbook : existing)
        : [...playbooks, playbook];

    await saveProfile(userId, { ...profile, tailoringPlaybooks: nextPlaybooks });
};

export const saveLeadSource = async (userId: string, source: LeadSource): Promise<void> => {
    const { error } = await supabase
        .from('lead_sources')
        .upsert({
            id: source.id,
            user_id: userId,
            label: source.label,
            url: source.url,
            source_type: source.sourceType,
            regions: source.regions,
            notes: source.notes,
            last_checked_at: source.lastCheckedAt,
        });

    if (error) {
        console.error('Error saving lead source:', error);
        throw error;
    }
};

export const getLeadSources = async (userId: string): Promise<LeadSource[]> => {
    const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching lead sources:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        label: item.label,
        url: item.url,
        sourceType: item.source_type,
        regions: (item.regions || []).map(defaultRegion),
        notes: item.notes,
        createdAt: item.created_at,
        lastCheckedAt: item.last_checked_at,
    }));
};

export const getLeadSourceChecks = async (userId: string): Promise<LeadSourceCheck[]> => {
    const { data, error } = await supabase
        .from('lead_source_checks')
        .select('id, lead_source_id, status, checked_at, notes, discovered_count, lead_sources!inner(user_id, label)')
        .eq('lead_sources.user_id', userId)
        .order('checked_at', { ascending: false });

    if (error) {
        console.error('Error fetching lead source checks:', error);
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        leadSourceId: item.lead_source_id,
        status: item.status,
        checkedAt: item.checked_at,
        notes: item.notes,
        discoveredCount: item.discovered_count,
        leadSourceLabel: item.lead_sources?.label,
    }));
};

export const recordLeadSourceCheck = async (
    userId: string,
    check: {
        leadSourceId: string;
        status: LeadSourceCheck['status'];
        notes?: string;
        discoveredCount?: number;
    }
): Promise<LeadSourceCheck> => {
    const { data, error } = await supabase
        .from('lead_source_checks')
        .insert({
            lead_source_id: check.leadSourceId,
            status: check.status,
            notes: check.notes || '',
            discovered_count: check.discoveredCount || 0,
        })
        .select('id, lead_source_id, status, checked_at, notes, discovered_count')
        .single();

    if (error) {
        console.error('Error recording lead source check:', error);
        throw error;
    }

    const { error: updateError } = await supabase
        .from('lead_sources')
        .update({ last_checked_at: data.checked_at })
        .eq('id', check.leadSourceId)
        .eq('user_id', userId);

    if (updateError) {
        console.error('Error updating lead source last_checked_at:', updateError);
        throw updateError;
    }

    return {
        id: data.id,
        leadSourceId: data.lead_source_id,
        status: data.status,
        checkedAt: data.checked_at,
        notes: data.notes,
        discoveredCount: data.discovered_count,
    };
};

export const saveJobLead = async (userId: string, lead: JobLead): Promise<void> => {
    const { error } = await supabase
        .from('job_leads')
        .upsert({
            id: lead.id,
            user_id: userId,
            lead_source_id: lead.leadSourceId,
            title: lead.title,
            company_name: lead.companyName,
            location: lead.location,
            url: lead.url,
            summary: lead.summary,
            raw_description: lead.rawDescription,
            provenance: lead.provenance,
            regions: lead.regions,
            match: lead.match,
            status: lead.status,
        });

    if (error) {
        console.error('Error saving job lead:', error);
        throw error;
    }
};

export const getJobLeads = async (userId: string): Promise<JobLead[]> => {
    const { data, error } = await supabase
        .from('job_leads')
        .select('*, lead_sources(label)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching job leads:', error);
        return [];
    }

    return data.map((lead: any) => ({
        id: lead.id,
        leadSourceId: lead.lead_source_id,
        leadSourceLabel: lead.lead_sources?.label,
        title: lead.title,
        companyName: lead.company_name,
        location: lead.location,
        url: lead.url,
        summary: lead.summary,
        rawDescription: lead.raw_description,
        provenance: lead.provenance,
        regions: (lead.regions || []).map(defaultRegion),
        match: lead.match,
        status: lead.status,
    }));
};
