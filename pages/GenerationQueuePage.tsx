import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, MessageSquareText, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as SupabaseService from '../services/supabaseService';
import { GenerationJob } from '../types';

const terminalStatuses = new Set(['succeeded', 'failed', 'cancelled']);

const GenerationQueuePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<GenerationJob[]>([]);
    const [pageError, setPageError] = useState('');
    const [busyJobId, setBusyJobId] = useState('');
    const [evidenceAnswers, setEvidenceAnswers] = useState<Record<string, string>>({});
    const [answeringQuestionId, setAnsweringQuestionId] = useState('');
    const kickedJobIdsRef = useRef<Set<string>>(new Set());

    const refreshJobs = async () => {
        if (!user) return;
        const nextJobs = await SupabaseService.getRecentGenerationJobs(user.id);
        setJobs(nextJobs);
        nextJobs.filter((job) => job.status === 'queued').forEach((job) => kickJob(job.id));
    };

    const kickJob = (jobId: string) => {
        if (kickedJobIdsRef.current.has(jobId)) return;
        kickedJobIdsRef.current.add(jobId);
        void SupabaseService.kickGenerationJob(jobId)
            .then(() => void refreshJobs())
            .catch((error) => {
                console.error(error);
                kickedJobIdsRef.current.delete(jobId);
                setPageError(error instanceof Error ? error.message : 'Could not start the generation worker.');
                void refreshJobs();
            });
    };

    useEffect(() => {
        void refreshJobs();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        const interval = window.setInterval(() => void refreshJobs(), 2500);
        return () => window.clearInterval(interval);
    }, [user]);

    const runJobAction = async (jobId: string, action: () => Promise<void>) => {
        setBusyJobId(jobId);
        setPageError('');
        try {
            await action();
            kickedJobIdsRef.current.delete(jobId);
            await refreshJobs();
        } catch (error) {
            setPageError(error instanceof Error ? error.message : 'Could not update the generation job.');
        } finally {
            setBusyJobId('');
        }
    };

    const resolveEvidenceQuestion = async (job: GenerationJob, questionId: string, disposition: 'answered' | 'skipped' | 'unavailable') => {
        setAnsweringQuestionId(questionId);
        setPageError('');
        try {
            await SupabaseService.answerEvidenceQuestion(job.id, questionId, disposition, evidenceAnswers[questionId] || '');
            const refreshed = await SupabaseService.getGenerationJob(job.id);
            if (refreshed?.status === 'queued') {
                kickedJobIdsRef.current.delete(job.id);
                kickJob(job.id);
            }
            await refreshJobs();
        } catch (error) {
            setPageError(error instanceof Error ? error.message : 'Could not save the evidence answer.');
        } finally {
            setAnsweringQuestionId('');
        }
    };

    const decideEvidenceRound = async (jobId: string, anotherRound: boolean) => {
        await runJobAction(jobId, () => SupabaseService.decideEvidenceRound(jobId, anotherRound));
    };

    const removeJob = (jobId: string) => {
        if (window.confirm('Remove this completed generation from queue history?')) {
            void runJobAction(jobId, () => SupabaseService.removeGenerationJob(jobId));
        }
    };

    return (
        <div className="px-4 py-6 sm:px-6 lg:px-8 min-w-0">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Generation Queue</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track, retry, cancel, and remove tailored application runs.</p>
                    </div>
                    <button type="button" onClick={() => navigate('/admin/new')} className="w-full sm:w-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        New application
                    </button>
                </div>
                {pageError && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{pageError}</div>}
                {jobs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">No generation jobs yet.</div>
                ) : (
                    <div className="space-y-3">
                        {jobs.map((job) => {
                            const question = job.pendingQuestions.find((item) => item.status === 'pending');
                            const isBusy = busyJobId === job.id;
                            return (
                                <div key={job.id} className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex items-start gap-3">
                                            {job.status === 'succeeded' ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={20} /> : job.status === 'failed' ? <XCircle className="mt-0.5 shrink-0 text-red-500" size={20} /> : job.status === 'needs_input' ? <MessageSquareText className="mt-0.5 shrink-0 text-amber-500" size={20} /> : <Loader2 className="mt-0.5 shrink-0 animate-spin text-blue-500" size={20} />}
                                            <div className="min-w-0">
                                                <div className="font-semibold text-gray-900 dark:text-white break-words">{job.requestPayload?.jd?.roleTitle || 'Tailored resume'} at {job.requestPayload?.jd?.companyName || 'target company'}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 break-words">{job.status === 'failed' ? (job.errorMessage || 'Generation failed.') : job.stage}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 sm:justify-end">
                                            {job.status === 'succeeded' && job.resultApplicationId && <button type="button" onClick={() => navigate(`/admin/application/${job.resultApplicationId}`)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Open application</button>}
                                            {job.status === 'failed' && <button type="button" disabled={isBusy} onClick={() => void runJobAction(job.id, () => SupabaseService.resumeGenerationJob(job.id))} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"><RotateCcw size={15} /> Retry</button>}
                                            {(job.status === 'queued' || job.status === 'running' || job.status === 'needs_input') && <button type="button" disabled={isBusy} onClick={() => void runJobAction(job.id, () => SupabaseService.cancelGenerationJob(job.id))} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-700 disabled:opacity-50">Cancel</button>}
                                            {terminalStatuses.has(job.status) && <button type="button" disabled={isBusy} onClick={() => removeJob(job.id)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-900/50 dark:text-red-300 disabled:opacity-50"><Trash2 size={15} /> Remove</button>}
                                        </div>
                                    </div>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className={`h-full rounded-full transition-all ${job.status === 'failed' ? 'bg-red-500' : job.status === 'succeeded' ? 'bg-emerald-500' : job.status === 'cancelled' ? 'bg-gray-400' : 'bg-blue-500'}`} style={{ width: `${Math.max(4, Math.min(100, job.progress || 0))}%` }} /></div>
                                    {job.status === 'needs_input' && job.workingState.roundDecisionRequired && !question && <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20"><div className="font-semibold">Material evidence gaps remain</div><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Ask another round of distinct questions or continue to drafting with advisory gaps.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void decideEvidenceRound(job.id, true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Ask another round</button><button type="button" onClick={() => void decideEvidenceRound(job.id, false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-700">Continue to draft</button></div></div>}
                                    {job.status === 'needs_input' && question && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"><div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Evidence interview · one question at a time</div><p className="mt-2 font-medium text-gray-900 dark:text-white">{question.prompt}</p><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{question.reason}</p>{question.missingFields.length > 0 && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Additional detail needed: {question.missingFields.join(', ')}.</p>}<textarea value={evidenceAnswers[question.id] || ''} onChange={(event) => setEvidenceAnswers((current) => ({ ...current, [question.id]: event.target.value }))} rows={4} placeholder="Describe the situation, what you personally did, the scope, and the result. Use a metric only if you know it." className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={answeringQuestionId === question.id || !(evidenceAnswers[question.id] || '').trim()} onClick={() => void resolveEvidenceQuestion(job, question.id, 'answered')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Save evidence</button><button type="button" disabled={answeringQuestionId === question.id} onClick={() => void resolveEvidenceQuestion(job, question.id, 'unavailable')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium dark:border-gray-700">No evidence</button><button type="button" disabled={answeringQuestionId === question.id} onClick={() => void resolveEvidenceQuestion(job, question.id, 'skipped')} className="rounded-lg px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Skip</button></div></div>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenerationQueuePage;
