import React, { useEffect, useRef, useState } from 'react';
import Generator from '../components/Generator';
import {
    ApplicationLeadContext,
    JobDescription,
    GithubProject,
    UserProfile,
    TailoringOptions,
    TailoringPlaybook,
    GenerationJob,
} from '../types';
import * as SupabaseService from '../services/supabaseService';
import * as GithubService from '../services/githubService';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

const GeneratorPage: React.FC = () => {
    const { user } = useAuth();
    const [isSubmittingJob, setIsSubmittingJob] = useState(false);
    const [githubRepos, setGithubRepos] = useState<GithubProject[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
    const [pageError, setPageError] = useState('');
    const kickedJobIdsRef = useRef<Set<string>>(new Set());
    const navigate = useNavigate();
    const location = useLocation();

    const prefillJobDescription = (location.state as { jobDescription?: Partial<JobDescription> } | null)?.jobDescription;
    const leadContext = (location.state as { leadContext?: ApplicationLeadContext } | null)?.leadContext || null;

    useEffect(() => {
        if (user) {
            loadProfile();
            refreshGenerationJobs();
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;

        const interval = window.setInterval(() => {
            void refreshGenerationJobs();
        }, 2500);

        return () => window.clearInterval(interval);
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

    const refreshGenerationJobs = async () => {
        if (!user) return;
        const jobs = await SupabaseService.getRecentGenerationJobs(user.id);
        setGenerationJobs(jobs);
        jobs
            .filter((job) => job.status === 'queued')
            .forEach((job) => {
                kickJob(job.id);
            });
    };

    const kickJob = (jobId: string) => {
        if (kickedJobIdsRef.current.has(jobId)) return;
        kickedJobIdsRef.current.add(jobId);
        void SupabaseService.kickGenerationJob(jobId)
            .then(() => {
                void refreshGenerationJobs();
            })
            .catch((error) => {
                console.error(error);
                kickedJobIdsRef.current.delete(jobId);
                void refreshGenerationJobs();
            });
    };

    const handleGenerate = async (
        jd: JobDescription,
        projects: GithubProject[],
        showScore: boolean,
        options?: TailoringOptions
    ) => {
        if (!user) return;
        setIsSubmittingJob(true);
        setPageError('');

        try {
            const job = await SupabaseService.startGenerationJob({
                jd,
                projects,
                showScore,
                options,
                leadContext,
            });
            setGenerationJobs((prev) => [job, ...prev.filter((existing) => existing.id !== job.id)].slice(0, 10));
            kickJob(job.id);
        } catch (e) {
            console.error(e);
            const message = e instanceof Error ? e.message : 'Error starting generation. Please try again.';
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
            {generationJobs.length > 0 && (
                <div className="max-w-5xl mx-auto mb-6 space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Generation Jobs</h3>
                    {generationJobs.map((job) => (
                        <div
                            key={job.id}
                            className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex items-start gap-3">
                                    {job.status === 'succeeded' ? (
                                        <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={20} />
                                    ) : job.status === 'failed' ? (
                                        <XCircle className="mt-0.5 shrink-0 text-red-500" size={20} />
                                    ) : (
                                        <Loader2 className="mt-0.5 shrink-0 animate-spin text-blue-500" size={20} />
                                    )}
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 dark:text-white break-words">
                                            {job.requestPayload?.jd?.roleTitle || 'Tailored resume'} at {job.requestPayload?.jd?.companyName || 'target company'}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 break-words">
                                            {job.status === 'failed' ? (job.errorMessage || 'Generation failed.') : job.stage}
                                        </div>
                                    </div>
                                </div>
                                {job.status === 'succeeded' && job.resultApplicationId && (
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/admin/application/${job.resultApplicationId}`)}
                                        className="w-full sm:w-auto shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        Open Application
                                    </button>
                                )}
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                <div
                                    className={`h-full rounded-full transition-all ${job.status === 'failed' ? 'bg-red-500' : job.status === 'succeeded' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                    style={{ width: `${Math.max(4, Math.min(100, job.progress || 0))}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Generator
                onGenerate={handleGenerate}
                onSavePlaybook={handleSavePlaybook}
                isLoading={isSubmittingJob}
                availableGithubProjects={githubRepos}
                availablePlaybooks={profile?.tailoringPlaybooks || []}
                initialJobDescription={prefillJobDescription}
                initialLeadContext={leadContext}
            />
        </div>
    );
};

export default GeneratorPage;
