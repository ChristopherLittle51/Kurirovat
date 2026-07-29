import { getEdgeFunctionErrorMessage, supabase } from './supabaseClient';
import {
    UserProfile,
    TailoredApplication,
    TargetRegion,
    TailoringPlaybook,
    LeadSource,
    LeadSourceCheck,
    GenerationJob,
    JobDescription,
    GithubProject,
    TailoringOptions,
    CandidateEvidence,
    ApplicationEvent,
    ApplicationEventType,
} from '../types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const assertValidUuid = (value: string, label = 'ID') => {
    if (!UUID_PATTERN.test(value)) throw new Error(`${label} is not a valid UUID.`);
};

const defaultRegion = (region?: Partial<TargetRegion>): TargetRegion => ({
    id: region?.id || crypto.randomUUID(),
    label: region?.label || '',
    remotePreference: region?.remotePreference || 'flexible',
});

const nonEmptyRecord = (value: any) =>
    value && typeof value === 'object' && Object.keys(value).length ? value : undefined;

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

const normalizeApplication = (app: any): TailoredApplication => {
 const privateData = app.private_artifacts || {};
 return ({
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
    jobAnalysis: nonEmptyRecord(privateData.job_analysis),
    evidenceResolution: nonEmptyRecord(privateData.evidence_resolution),
    diagnostics: nonEmptyRecord(privateData.diagnostics),
    rewriteInsights: nonEmptyRecord(privateData.rewrite_insights),
    assembledPromptPreview: privateData.prompt_preview,
    promptOverride: privateData.generation_options?.promptOverride || privateData.generation_options?.promptPreviewOverride || '',
    selectedPlaybookId: privateData.selected_playbook_id,
    generationOptions: nonEmptyRecord(privateData.generation_options),
    editSuggestions: privateData.edit_suggestions,
    regenerationHistory: privateData.regeneration_history || [],
    contentStrategy: nonEmptyRecord(privateData.content_strategy),
    qualityReport: nonEmptyRecord(privateData.quality_report),
    renderReview: nonEmptyRecord(privateData.render_review),
    tailoringRunId: app.tailoring_run_id,
    applicationEvents: app.application_events || [],
 });
};

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
    workingState: job.working_state || {},
    pendingQuestions: job.pending_questions || [],
    acceptedEvidenceIds: job.accepted_evidence_ids || [],
    promptVersion: job.prompt_version,
    schemaVersion: job.schema_version,
    modelConfig: job.model_config || {},
    usageMetrics: job.usage_metrics || {},
    qualityReport: nonEmptyRecord(job.quality_report),
    repairCount: job.repair_count || 0,
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

    const resumeEvidence = (profile.experience || []).flatMap((experience) =>
        (experience.description || [])
            .map((bullet, bulletIndex) => ({
                user_id: userId,
                legacy_id: `resume:${experience.id}:${bulletIndex + 1}`,
                title: [experience.company, experience.role].filter(Boolean).join(' - '),
                situation: [experience.role, experience.company ? `at ${experience.company}` : ''].filter(Boolean).join(' '),
                action: bullet,
                source_type: 'resume',
                source_label: [experience.company, experience.role].filter(Boolean).join(' - '),
                source_excerpt: bullet,
                confidence: 'medium',
                role_ids: [experience.id],
                nice_to_use: true,
                dedupe_key: bullet.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 240),
                updated_at: new Date().toISOString(),
            }))
            .filter((item) => item.action.trim()),
    );
    if (resumeEvidence.length) {
        const { error: evidenceError } = await supabase
            .from('candidate_evidence')
            .upsert(resumeEvidence, { onConflict: 'user_id,legacy_id' });
        if (evidenceError) {
            console.error('Error synchronizing resume evidence:', evidenceError);
            throw evidenceError;
        }
    }
};

export const startGenerationJob = async (payload: {
    jd: JobDescription;
    projects: GithubProject[];
    showScore: boolean;
    options?: TailoringOptions;
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
    assertValidUuid(jobId, 'Generation job ID');
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
        const message = await getEdgeFunctionErrorMessage(error, 'Failed to start generation worker.');
        const status = typeof error === 'object' && error !== null && 'status' in error
            ? (error as any).status
            : undefined;
        await supabase
            .from('generation_jobs')
            .update({
                status: status === 546 ? 'queued' : 'failed',
                stage: status === 546 ? 'Queued for worker retry' : 'Failed to start worker',
                progress: status === 546 ? 0 : 100,
                error_message: message,
                updated_at: new Date().toISOString(),
                finished_at: status === 546 ? null : new Date().toISOString(),
            })
            .eq('id', jobId);
        throw new Error(message);
    }
};

export const getGenerationJob = async (jobId: string): Promise<GenerationJob | null> => {
    assertValidUuid(jobId, 'Generation job ID');
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
        .in('status', ['queued', 'running', 'needs_input', 'failed', 'succeeded', 'cancelled'])
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

    const applicationIds = data.map((item: any) => item.id);
    const [{ data: events }, { data: privateArtifacts }] = applicationIds.length
        ? await Promise.all([
            supabase
                .from('application_events')
                .select('*')
                .in('application_id', applicationIds)
                .order('recorded_at', { ascending: true }),
            supabase
                .from('application_private_artifacts')
                .select('*')
                .in('application_id', applicationIds),
        ])
        : [{ data: [] as any[] }, { data: [] as any[] }];
    const eventsByApplication = (events || []).reduce((acc: Record<string, ApplicationEvent[]>, item: any) => {
        const event = normalizeApplicationEvent(item);
        acc[event.applicationId] = [...(acc[event.applicationId] || []), event];
        return acc;
    }, {});

    const privateByApplication = Object.fromEntries((privateArtifacts || []).map((item: any) => [item.application_id, item]));
    return data.map((app: any) => normalizeApplication({
        ...app,
        application_events: eventsByApplication[app.id] || [],
        private_artifacts: privateByApplication[app.id] || {},
    }));
};

export const saveApplication = async (userId: string, application: TailoredApplication): Promise<void> => {
    const { data: saved, error } = await supabase
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
            tailoring_run_id: application.tailoringRunId,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error saving application:', error);
        throw error;
    }

    const { error: privateError } = await supabase
        .from('application_private_artifacts')
        .upsert({
            application_id: saved.id,
            user_id: userId,
            job_analysis: application.jobAnalysis || {},
            evidence_resolution: application.evidenceResolution || {},
            diagnostics: application.diagnostics || {},
            rewrite_insights: application.rewriteInsights || {},
            prompt_preview: application.assembledPromptPreview || '',
            selected_playbook_id: application.selectedPlaybookId,
            generation_options: {
                ...(application.generationOptions || {}),
                promptOverride: application.promptOverride ?? application.generationOptions?.promptOverride,
            },
            edit_suggestions: application.editSuggestions || [],
            regeneration_history: application.regenerationHistory || [],
            content_strategy: application.contentStrategy || {},
            quality_report: application.qualityReport || {},
            updated_at: new Date().toISOString(),
        });
    if (privateError) throw privateError;
};

export const updateApplication = async (appId: string, updates: Partial<TailoredApplication>): Promise<void> => {
    const updatePayload: any = {};
    const privatePayload: any = {};

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
    if (updates.jobAnalysis) privatePayload.job_analysis = updates.jobAnalysis;
    if (updates.evidenceResolution) privatePayload.evidence_resolution = updates.evidenceResolution;
    if (updates.diagnostics) privatePayload.diagnostics = updates.diagnostics;
    if (updates.rewriteInsights) privatePayload.rewrite_insights = updates.rewriteInsights;
    if (updates.assembledPromptPreview !== undefined) privatePayload.prompt_preview = updates.assembledPromptPreview;
    if (updates.selectedPlaybookId !== undefined) privatePayload.selected_playbook_id = updates.selectedPlaybookId;
    if (updates.generationOptions || updates.promptOverride !== undefined) {
        privatePayload.generation_options = {
            ...(updates.generationOptions || {}),
            promptOverride: updates.promptOverride ?? updates.generationOptions?.promptOverride,
        };
    }
    if (updates.editSuggestions) privatePayload.edit_suggestions = updates.editSuggestions;
    if (updates.regenerationHistory) privatePayload.regeneration_history = updates.regenerationHistory;
    if (updates.contentStrategy) privatePayload.content_strategy = updates.contentStrategy;
    if (updates.qualityReport) privatePayload.quality_report = updates.qualityReport;

    if (Object.keys(updatePayload).length) {
        const { error } = await supabase
            .from('applications')
            .update(updatePayload)
            .eq('id', appId);

        if (error) {
            console.error('Error updating application:', error);
            throw error;
        }
    }

    if (Object.keys(privatePayload).length) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be signed in.');
        const { error } = await supabase
            .from('application_private_artifacts')
            .upsert({
                application_id: appId,
                user_id: user.id,
                ...privatePayload,
                updated_at: new Date().toISOString(),
            });
        if (error) throw error;
    }
};

export const updateApplicationStatus = async (appId: string, status: string): Promise<void> => {
    const eventMap: Record<string, ApplicationEventType> = {
        Pending: 'legacy_status_imported',
        Sent: 'applied',
        Replied: 'reply_received',
        'Interview Scheduled': 'interview_scheduled',
        Rejected: 'rejected',
    };
    await recordApplicationEvent(appId, {
        eventType: eventMap[status] || 'legacy_status_imported',
        occurredAt: new Date().toISOString(),
        notes: `Status updated to ${status}.`,
        metadata: { status },
    });
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

const normalizeCandidateEvidence = (item: any): CandidateEvidence => ({
    id: item.id,
    legacyId: item.legacy_id,
    title: item.title || '',
    situation: item.situation || '',
    action: item.action || '',
    result: item.result || '',
    metric: item.metric || '',
    scope: item.scope || '',
    tools: item.tools || [],
    teamSize: item.team_size || '',
    domain: item.domain || '',
    tags: item.tags || [],
    sourceType: item.source_type || 'manual',
    sourceLabel: item.source_label || '',
    sourceExcerpt: item.source_excerpt || '',
    confidence: item.confidence || 'medium',
    roleIds: item.role_ids || [],
    mustInclude: Boolean(item.must_include),
    niceToUse: item.nice_to_use !== false,
    unavailable: Boolean(item.unavailable),
    disabled: Boolean(item.disabled),
    roleFamilyConstraints: item.role_family_constraints || [],
    dedupeKey: item.dedupe_key,
    lastUsedAt: item.last_used_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
});

const evidenceToRow = (userId: string, evidence: CandidateEvidence) => ({
    id: evidence.id,
    user_id: userId,
    legacy_id: evidence.legacyId,
    title: evidence.title,
    situation: evidence.situation,
    action: evidence.action,
    result: evidence.result,
    metric: evidence.metric,
    scope: evidence.scope,
    tools: evidence.tools,
    team_size: evidence.teamSize,
    domain: evidence.domain,
    tags: evidence.tags,
    source_type: evidence.sourceType,
    source_label: evidence.sourceLabel,
    source_excerpt: evidence.sourceExcerpt,
    confidence: evidence.confidence,
    role_ids: evidence.roleIds,
    must_include: evidence.mustInclude,
    nice_to_use: evidence.niceToUse,
    unavailable: evidence.unavailable,
    disabled: evidence.disabled,
    role_family_constraints: evidence.roleFamilyConstraints,
    dedupe_key: evidence.dedupeKey,
    updated_at: new Date().toISOString(),
});

export const getCandidateEvidence = async (userId: string): Promise<CandidateEvidence[]> => {
    const [{ data, error }, { data: usage, error: usageError }] = await Promise.all([
        supabase
            .from('candidate_evidence')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false }),
        supabase
            .from('candidate_evidence_usage')
            .select('*')
            .eq('user_id', userId)
            .order('used_at', { ascending: false }),
    ]);
    if (error) throw error;
    if (usageError) throw usageError;
    const usageByEvidence = (usage || []).reduce((acc: Record<string, CandidateEvidence['usageHistory']>, item: any) => {
        acc[item.evidence_id] = [
            ...(acc[item.evidence_id] || []),
            {
                applicationId: item.application_id,
                generationJobId: item.generation_job_id,
                usedAt: item.used_at,
                locations: item.locations || [],
            },
        ];
        return acc;
    }, {});
    return (data || []).map((item: any) => ({
        ...normalizeCandidateEvidence(item),
        usageHistory: usageByEvidence[item.id] || [],
    }));
};

export const saveCandidateEvidence = async (
    userId: string,
    evidence: CandidateEvidence,
): Promise<CandidateEvidence> => {
    const { data, error } = await supabase
        .from('candidate_evidence')
        .upsert(evidenceToRow(userId, evidence))
        .select('*')
        .single();
    if (error) throw error;
    return normalizeCandidateEvidence(data);
};

export const mergeCandidateEvidence = async (
    userId: string,
    keep: CandidateEvidence,
    removeId: string,
): Promise<CandidateEvidence> => {
    const saved = await saveCandidateEvidence(userId, keep);
    const { error } = await supabase
        .from('candidate_evidence')
        .delete()
        .eq('id', removeId)
        .eq('user_id', userId);
    if (error) throw error;
    return saved;
};

export const deleteCandidateEvidence = async (userId: string, evidenceId: string): Promise<void> => {
    const { error } = await supabase
        .from('candidate_evidence')
        .delete()
        .eq('id', evidenceId)
        .eq('user_id', userId);
    if (error) throw error;
};

const normalizeApplicationEvent = (item: any): ApplicationEvent => ({
    id: item.id,
    applicationId: item.application_id,
    eventType: item.event_type,
    occurredAt: item.occurred_at,
    recordedAt: item.recorded_at,
    notes: item.notes || '',
    interviewRound: item.interview_round,
    metadata: item.metadata || {},
});

export const getApplicationEvents = async (applicationId: string): Promise<ApplicationEvent[]> => {
    const { data, error } = await supabase
        .from('application_events')
        .select('*')
        .eq('application_id', applicationId)
        .order('recorded_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(normalizeApplicationEvent);
};

export const recordApplicationEvent = async (
    applicationId: string,
    event: Pick<ApplicationEvent, 'eventType' | 'occurredAt' | 'notes'> & {
        interviewRound?: number | null;
        metadata?: Record<string, unknown>;
    },
): Promise<ApplicationEvent> => {
    const { data, error } = await supabase
        .from('application_events')
        .insert({
            application_id: applicationId,
            event_type: event.eventType,
            occurred_at: event.occurredAt || null,
            notes: event.notes || '',
            interview_round: event.interviewRound || null,
            metadata: event.metadata || {},
        })
        .select('*')
        .single();
    if (error) throw error;
    return normalizeApplicationEvent(data);
};

export const updateApplicationEvent = async (
    eventId: string,
    updates: Partial<Pick<ApplicationEvent, 'eventType' | 'occurredAt' | 'notes' | 'interviewRound' | 'metadata'>>,
): Promise<ApplicationEvent> => {
    const row: Record<string, unknown> = {};
    if (updates.eventType) row.event_type = updates.eventType;
    if (updates.occurredAt !== undefined) row.occurred_at = updates.occurredAt;
    if (updates.notes !== undefined) row.notes = updates.notes;
    if (updates.interviewRound !== undefined) row.interview_round = updates.interviewRound;
    if (updates.metadata !== undefined) row.metadata = updates.metadata;
    const { data, error } = await supabase
        .from('application_events')
        .update(row)
        .eq('id', eventId)
        .select('*')
        .single();
    if (error) throw error;
    return normalizeApplicationEvent(data);
};

export const saveRenderedReview = async (
    applicationId: string,
    tailoringRunId: string | null | undefined,
    review: TailoredApplication['renderReview'],
): Promise<void> => {
    const { error } = await supabase
        .from('application_private_artifacts')
        .update({
            render_review: review || {},
            updated_at: new Date().toISOString(),
        })
        .eq('application_id', applicationId);
    if (error) throw error;
    if (tailoringRunId) {
        await supabase
            .from('generation_jobs')
            .update({ stage: 'completed', updated_at: new Date().toISOString() })
            .eq('id', tailoringRunId);
    }
};

export const markRenderReviewStarted = async (tailoringRunId?: string | null): Promise<void> => {
    if (!tailoringRunId) return;
    const { error } = await supabase
        .from('generation_jobs')
        .update({ stage: 'render_review', updated_at: new Date().toISOString() })
        .eq('id', tailoringRunId);
    if (error) throw error;
};

export const answerEvidenceQuestion = async (
    jobId: string,
    questionId: string,
    disposition: 'answered' | 'skipped' | 'unavailable',
    answer = '',
): Promise<void> => {
    assertValidUuid(jobId, 'Generation job ID');
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
    if (sessionError || !session?.access_token) throw new Error('You must be signed in.');
    const { error } = await supabase.functions.invoke('gemini-api', {
        body: {
            action: 'answerEvidenceQuestion',
            payload: { jobId, questionId, disposition, answer },
            access_token: session.access_token,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw new Error(await getEdgeFunctionErrorMessage(error, 'Failed to answer evidence question.'));
};

export const resumeGenerationJob = async (jobId: string): Promise<void> => {
    assertValidUuid(jobId, 'Generation job ID');
    const { error } = await supabase
        .from('generation_jobs')
        .update({
            status: 'queued',
            error_message: null,
            finished_at: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);
    if (error) throw error;
    await kickGenerationJob(jobId);
};

export const cancelGenerationJob = async (jobId: string): Promise<void> => {
    assertValidUuid(jobId, 'Generation job ID');
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
    if (sessionError || !session?.access_token) throw new Error('You must be signed in.');
    const { error } = await supabase.functions.invoke('gemini-api', {
        body: {
            action: 'cancelGenerationJob',
            payload: { jobId },
            access_token: session.access_token,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw new Error(await getEdgeFunctionErrorMessage(error, 'Failed to cancel generation job.'));
};

export const removeGenerationJob = async (jobId: string): Promise<void> => {
    assertValidUuid(jobId, 'Generation job ID');
    const { error } = await supabase
        .from('generation_jobs')
        .delete()
        .eq('id', jobId);
    if (error) throw error;
};

export const decideEvidenceRound = async (jobId: string, anotherRound: boolean): Promise<void> => {
    assertValidUuid(jobId, 'Generation job ID');
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
    if (sessionError || !session?.access_token) throw new Error('You must be signed in.');
    const { error } = await supabase.functions.invoke('gemini-api', {
        body: {
            action: anotherRound ? 'requestAdditionalEvidenceRound' : 'continueAfterEvidence',
            payload: { jobId },
            access_token: session.access_token,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw new Error(await getEdgeFunctionErrorMessage(error, 'Failed to update the evidence decision.'));
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
