import React, { useEffect, useState } from 'react';
import Generator from '../components/Generator';
import {
    ApplicationLeadContext,
    JobDescription,
    TailoredApplication,
    GithubProject,
    UserProfile,
    TailoringOptions,
    TailoringPlaybook,
} from '../types';
import * as GeminiService from '../services/geminiService';
import * as SupabaseService from '../services/supabaseService';
import * as GithubService from '../services/githubService';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const GeneratorPage: React.FC = () => {
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [githubRepos, setGithubRepos] = useState<GithubProject[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [pageError, setPageError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const prefillJobDescription = (location.state as { jobDescription?: Partial<JobDescription> } | null)?.jobDescription;
    const leadContext = (location.state as { leadContext?: ApplicationLeadContext } | null)?.leadContext || null;

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;
        const loadedProfile = await SupabaseService.getProfile(user.id);
        setProfile(loadedProfile);
        if (loadedProfile?.githubUsername) {
            const repos = await GithubService.fetchGithubRepos(loadedProfile.githubUsername);
            setGithubRepos(repos);
        }
    };

    const handleGenerate = async (
        jd: JobDescription,
        projects: GithubProject[],
        showScore: boolean,
        options?: TailoringOptions
    ) => {
        if (!user) return;
        setIsGenerating(true);

        try {
            const latestProfile = await SupabaseService.getProfile(user.id);
            if (!latestProfile) {
                setPageError('Profile not found. Please complete onboarding.');
                navigate('/admin/onboarding');
                return;
            }

            const result = await GeminiService.tailorResume(latestProfile, jd, projects, showScore, 1, options);
            const { application } = result;

            const newApp: TailoredApplication = {
                id: '',
                createdAt: Date.now(),
                jobDescription: jd,
                resume: application.resume!,
                coverLetter: application.coverLetter || '',
                matchScore: application.matchScore || 0,
                keyKeywords: application.keyKeywords || [],
                githubProjects: application.githubProjects,
                showMatchScore: application.showMatchScore,
                jobAnalysis: application.jobAnalysis,
                evidenceResolution: application.evidenceResolution,
                diagnostics: application.diagnostics,
                rewriteInsights: application.rewriteInsights,
                assembledPromptPreview: application.assembledPromptPreview,
                promptOverride: application.promptOverride,
                selectedPlaybookId: application.selectedPlaybookId,
                generationOptions: application.generationOptions,
                editSuggestions: application.editSuggestions,
                regenerationHistory: application.regenerationHistory,
                searchSources: leadContext ? [
                    ...(application.searchSources || []),
                    {
                        title: leadContext.leadSourceLabel || 'Lead source',
                        uri: leadContext.leadUrl,
                    }
                ] : (application.searchSources || []),
            };

            await SupabaseService.saveApplication(user.id, newApp);
            navigate('/admin/dashboard');
        } catch (e) {
            console.error(e);
            setPageError('Error generating resume. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSavePlaybook = async (name: string, options: TailoringOptions) => {
        if (!user || !profile) return;

        const playbook: TailoringPlaybook = {
            id: crypto.randomUUID(),
            name,
            strategyPreset: options.strategyPreset || 'Balanced',
            tone: options.tone || 'professional',
            conciseness: options.conciseness || 'standard',
            focusSkill: options.focusSkill || '',
            critiqueMode: options.critiqueMode || 'Blunt',
            preferredRoleFamilies: options.preferredRoleFamilies || [],
            antiClaims: options.antiClaims || [],
            weights: options.weights || {
                leadership: 0.5,
                technicalDepth: 0.5,
                measurableImpact: 0.7,
                recency: 0.7,
                domainMatch: 0.6,
            },
            promptOverride: options.promptOverride || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        try {
            await SupabaseService.saveTailoringPlaybook(user.id, playbook);
            setProfile((prev) => prev ? ({
                ...prev,
                tailoringPlaybooks: [...(prev.tailoringPlaybooks || []), playbook],
            }) : prev);
        } catch (error) {
            console.error(error);
            setPageError('Failed to save playbook.');
            throw error;
        }
    };

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 max-w-5xl mx-auto break-words">New Application</h2>
            {pageError && (
                <div className="max-w-5xl mx-auto mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    {pageError}
                </div>
            )}
            <Generator
                onGenerate={handleGenerate}
                onSavePlaybook={handleSavePlaybook}
                isLoading={isGenerating}
                availableGithubProjects={githubRepos}
                availablePlaybooks={profile?.tailoringPlaybooks || []}
                initialJobDescription={prefillJobDescription}
                initialLeadContext={leadContext}
            />
        </div>
    );
};

export default GeneratorPage;
