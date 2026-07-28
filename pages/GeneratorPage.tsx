import React, { useEffect, useState } from 'react';
import Generator from '../components/Generator';
import { GithubProject, JobDescription, TailoringOptions, TailoringPlaybook, UserProfile } from '../types';
import * as SupabaseService from '../services/supabaseService';
import * as GithubService from '../services/githubService';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const GeneratorPage: React.FC = () => {
    const { user } = useAuth();
    const [isSubmittingJob, setIsSubmittingJob] = useState(false);
    const [githubRepos, setGithubRepos] = useState<GithubProject[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [pageError, setPageError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const prefillJobDescription = (location.state as { jobDescription?: Partial<JobDescription> } | null)?.jobDescription;

    useEffect(() => {
        if (!user) return;
        const loadProfile = async () => {
            const loadedProfile = await SupabaseService.getProfile(user.id);
            setProfile(loadedProfile);
            if (loadedProfile?.githubUsername) {
                setGithubRepos(await GithubService.fetchGithubRepos(loadedProfile.githubUsername));
            }
        };
        void loadProfile();
    }, [user]);

    const handleGenerate = async (jd: JobDescription, projects: GithubProject[], showScore: boolean, options?: TailoringOptions) => {
        if (!user) return;
        setIsSubmittingJob(true);
        setPageError('');
        try {
            await SupabaseService.startGenerationJob({ jd, projects, showScore, options });
            navigate('/admin/generation-queue');
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : 'Error starting generation. Please try again.';
            if (message.includes('Profile not found')) {
                setPageError(message);
                navigate('/admin/onboarding');
            } else {
                setPageError(message);
            }
        } finally {
            setIsSubmittingJob(false);
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
            weights: options.weights || { leadership: 0.5, technicalDepth: 0.5, measurableImpact: 0.7, recency: 0.7, domainMatch: 0.6 },
            promptOverride: options.promptOverride || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        try {
            await SupabaseService.saveTailoringPlaybook(user.id, playbook);
            setProfile((current) => current ? { ...current, tailoringPlaybooks: [...(current.tailoringPlaybooks || []), playbook] } : current);
        } catch (error) {
            console.error(error);
            setPageError('Failed to save playbook.');
            throw error;
        }
    };

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 max-w-5xl mx-auto break-words">New Application</h2>
            {pageError && <div className="max-w-5xl mx-auto mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{pageError}</div>}
            <Generator
                onGenerate={handleGenerate}
                onSavePlaybook={handleSavePlaybook}
                isLoading={isSubmittingJob}
                availableGithubProjects={githubRepos}
                availablePlaybooks={profile?.tailoringPlaybooks || []}
                initialJobDescription={prefillJobDescription}
            />
        </div>
    );
};

export default GeneratorPage;
