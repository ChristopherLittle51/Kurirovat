import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IdealJobDescription, UserProfile } from '../types';
import * as GeminiService from '../services/geminiService';
import * as SupabaseService from '../services/supabaseService';

const IdealRolePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [idealJob, setIdealJob] = useState<IdealJobDescription | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return;
            setLoadingProfile(true);
            const loadedProfile = await SupabaseService.getProfile(user.id);
            setProfile(loadedProfile);
            setLoadingProfile(false);
        };

        loadProfile();
    }, [user]);

    const handleGenerate = async () => {
        if (!profile) return;
        setErrorMessage('');
        setCopied(false);
        setIsGenerating(true);

        try {
            const result = await GeminiService.generateIdealJobDescription(profile, instructions);
            setIdealJob(result);
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message || 'Failed to generate an ideal role. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!idealJob) return;
        try {
            await navigator.clipboard.writeText(
                `${idealJob.roleTitle}\n\n${idealJob.jobDescription}`,
            );
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error(error);
            setErrorMessage('Could not copy the ideal role to the clipboard.');
        }
    };

    const handleUseAsDraft = () => {
        if (!idealJob) return;
        navigate('/admin/new', {
            state: {
                jobDescription: {
                    companyName: '',
                    roleTitle: idealJob.roleTitle,
                    rawText: idealJob.jobDescription,
                },
            },
        });
    };

    if (loadingProfile) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-8">
            <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <Sparkles size={16} />
                    Profile benchmark
                </div>
                <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                    Your Theoretical 100% Match
                </h1>
                <p className="mt-2 max-w-3xl text-gray-600 dark:text-gray-400">
                    Generate a company-neutral role whose responsibilities and qualifications are all supported by your saved profile. Use it as a benchmark for evaluating real job listings.
                </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Optional direction
                </label>
                <textarea
                    value={instructions}
                    onChange={(event) => setInstructions(event.target.value)}
                    className="mt-2 h-28 w-full rounded-lg border border-gray-300 bg-transparent p-3 text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:text-white"
                    placeholder="Example: Emphasize hands-on engineering over people management."
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Direction can change emphasis, but it cannot add experience that is not in your profile.
                </p>

                {errorMessage && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                        {errorMessage}
                    </div>
                )}

                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || !profile}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {isGenerating ? 'Generating benchmark...' : idealJob ? 'Regenerate Ideal Role' : 'Generate Ideal Role'}
                </button>
            </div>

            {idealJob && (
                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generated benchmark</h2>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                            <button
                                type="button"
                                onClick={handleUseAsDraft}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                            >
                                Use in New Application
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Job title
                        </label>
                        <input
                            value={idealJob.roleTitle}
                            onChange={(event) => setIdealJob({
                                ...idealJob,
                                roleTitle: event.target.value,
                            })}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-transparent p-3 text-lg font-semibold text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <div className="mt-5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Job description
                        </label>
                        <textarea
                            value={idealJob.jobDescription}
                            onChange={(event) => setIdealJob({
                                ...idealJob,
                                jobDescription: event.target.value,
                            })}
                            className="mt-2 min-h-[32rem] w-full rounded-lg border border-gray-300 bg-transparent p-4 font-mono text-sm leading-6 text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:text-white"
                        />
                    </div>

                    <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                        This is an AI-generated benchmark based on saved evidence, not a real opening or a guarantee that a matching role exists.
                    </p>
                </div>
            )}
        </div>
    );
};

export default IdealRolePage;
