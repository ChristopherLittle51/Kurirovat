import React, { useEffect, useState } from 'react';
import Generator from '../components/Generator';
import {
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
import { useNavigate } from 'react-router-dom';

const GeneratorPage: React.FC = () => {
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [githubRepos, setGithubRepos] = useState<GithubProject[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const navigate = useNavigate();

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
                alert('Profile not found. Please complete onboarding.');
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
                searchSources: application.searchSources || [],
                githubProjects: application.githubProjects,
                showMatchScore: application.showMatchScore,
                jobAnalysis: application.jobAnalysis,
                evidenceResolution: application.evidenceResolution,
                diagnostics: application.diagnostics,
                rewriteInsights: application.rewriteInsights,
                promptPreview: application.promptPreview,
                selectedPlaybookId: application.selectedPlaybookId,
                generationOptions: application.generationOptions,
                editSuggestions: application.editSuggestions,
                regenerationHistory: application.regenerationHistory,
            };

            await SupabaseService.saveApplication(user.id, newApp);
            navigate('/admin/dashboard');
        } catch (e) {
            console.error(e);
            alert('Error generating resume. Please try again.');
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
            promptOverrides: options.promptPreviewOverride || '',
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
            alert('Failed to save playbook.');
        }
    };

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 max-w-5xl mx-auto">New Application</h2>
            <Generator
                onGenerate={handleGenerate}
                onSavePlaybook={handleSavePlaybook}
                isLoading={isGenerating}
                availableGithubProjects={githubRepos}
                availablePlaybooks={profile?.tailoringPlaybooks || []}
            />
        </div>
    );
};

export default GeneratorPage;
