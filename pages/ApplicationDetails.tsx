import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TailoredApplication, ApplicationStatus, UserProfile } from '../types';
import * as SupabaseService from '../services/supabaseService';
import { condenseResume, condenseCoverLetter, tailorResume } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import ResumeTemplate from '../components/ResumeTemplate';
import PortfolioPreview from '../components/PortfolioPreview';
import CoverLetterTemplate from '../components/CoverLetterTemplate';
import { FileText, Globe, Printer, ChevronLeft, Loader2, Save, Mail, Sparkles, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
    'Pending': 'bg-gray-100 text-gray-800',
    'Sent': 'bg-blue-100 text-blue-800',
    'Replied': 'bg-purple-100 text-purple-800',
    'Interview Scheduled': 'bg-orange-100 text-orange-800',
    'Rejected': 'bg-red-100 text-red-800'
};

const ApplicationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [application, setApplication] = useState<TailoredApplication | null>(null);
    const [view, setView] = useState<'RESUME' | 'PORTFOLIO' | 'COVER_LETTER'>('RESUME');
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCondensing, setIsCondensing] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [debugResponse, setDebugResponse] = useState<string | null>(null);

    useEffect(() => {
        if (user && id) {
            loadApplication();
        }
    }, [user, id]);

    // Prompt user before leaving if unsaved changes (basic implementation)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const loadApplication = async () => {
        if (!user) return;
        const apps = await SupabaseService.getApplications(user.id);
        const app = apps.find(a => a.id === id);
        setApplication(app || null);
        setLoading(false);
    };

    const handleStatusChange = async (newStatus: ApplicationStatus) => {
        if (!application) return;
        try {
            await SupabaseService.updateApplicationStatus(application.id, newStatus);
            setApplication({ ...application, status: newStatus });
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleSaveChanges = async () => {
        if (!application || !user) return;
        setIsSaving(true);
        try {
            await SupabaseService.updateApplication(application.id, {
                resume: application.resume,
                coverLetter: application.coverLetter,
                // potentially others if we edit them
            });
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error("Failed to save changes", error);
            alert("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResumeUpdate = useCallback((newResume: UserProfile) => {
        if (!application) return;
        setApplication(prev => prev ? ({ ...prev, resume: newResume }) : null);
        setHasUnsavedChanges(true);
    }, [application]);

    const handlePortfolioUpdate = useCallback((updates: Partial<TailoredApplication>) => {
        if (!application) return;
        setApplication(prev => prev ? ({ ...prev, ...updates }) : null);
        setHasUnsavedChanges(true);
    }, [application]);

    const handleCoverLetterUpdate = useCallback((newContent: string) => {
        if (!application) return;
        setApplication(prev => prev ? ({ ...prev, coverLetter: newContent }) : null);
        setHasUnsavedChanges(true);
    }, [application]);

    const handleCondense = async () => {
        if (!application) return;
        setIsCondensing(true);
        try {
            if (view === 'RESUME') {
                const result = await condenseResume(application.resume);
                setApplication(prev => prev ? ({ ...prev, resume: result.profile }) : null);
                setDebugResponse(result.rawResponse);
                setHasUnsavedChanges(true);
            } else if (view === 'COVER_LETTER') {
                const result = await condenseCoverLetter(
                    application.coverLetter,
                    application.resume.fullName,
                    application.jobDescription.companyName
                );
                setApplication(prev => prev ? ({ ...prev, coverLetter: result.content }) : null);
                setDebugResponse(result.rawResponse);
                setHasUnsavedChanges(true);
            }
        } catch (error) {
            console.error('Condense error:', error);
            alert('Failed to condense. Please try again.');
        } finally {
            setIsCondensing(false);
        }
    };

    const handleRegenerate = async () => {
        if (!application || !user) return;
        setIsRegenerating(true);
        try {
            // Get the base profile to regenerate from
            const baseProfile = await SupabaseService.getProfile(user.id);
            if (!baseProfile) {
                throw new Error('Could not load base profile');
            }

            // Regenerate the tailored content
            // Regenerate the tailored content
            const result = await tailorResume(
                baseProfile,
                application.jobDescription,
                application.githubProjects || [],
                application.showMatchScore ?? true
            );
            const { application: regenerated, rawResponse } = result;
            setDebugResponse(rawResponse);

            // Update the application with regenerated content
            setApplication(prev => prev ? ({
                ...prev,
                resume: regenerated.resume || prev.resume,
                coverLetter: regenerated.coverLetter || prev.coverLetter,
                matchScore: regenerated.matchScore ?? prev.matchScore,
                keyKeywords: regenerated.keyKeywords || prev.keyKeywords,
            }) : null);
            setHasUnsavedChanges(true);
        } catch (error) {
            console.error('Regenerate error:', error);
            alert('Failed to regenerate. Please try again.');
        } finally {
            setIsRegenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!application) return <div className="p-8 text-center">Application not found</div>;

    return (
        <div className="max-w-[210mm] mx-auto p-4 md:p-8 print:max-w-none print:w-full print:p-0">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4 print:hidden">
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <Link to="/" className="p-2 hover:bg-gray-200 rounded-full"><ChevronLeft /></Link>
                    <div>
                        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 truncate max-w-[200px] lg:max-w-md">{application.jobDescription.companyName}</h2>
                        <select
                            value={application.status || 'Pending'}
                            onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                            className={`mt-1 appearance-none cursor-pointer px-3 py-1 rounded-full text-xs font-bold border-0 focus:ring-2 focus:ring-blue-500 ${STATUS_COLORS[application.status || 'Pending'] || 'bg-gray-100'}`}
                        >
                            <option value="Pending">Pending</option>
                            <option value="Sent">Sent</option>
                            <option value="Replied">Replied</option>
                            <option value="Interview Scheduled">Interview</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
                    {/* View Switcher */}
                    <div className="flex bg-white rounded-lg shadow-sm border p-1 w-full lg:w-auto overflow-x-auto">
                        <button
                            onClick={() => setView('RESUME')}
                            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition whitespace-nowrap ${view === 'RESUME' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <FileText size={16} /> Resume
                        </button>
                        <button
                            onClick={() => setView('COVER_LETTER')}
                            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition whitespace-nowrap ${view === 'COVER_LETTER' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Mail size={16} /> Cover Letter
                        </button>
                        <button
                            onClick={() => setView('PORTFOLIO')}
                            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition whitespace-nowrap ${view === 'PORTFOLIO' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Globe size={16} /> Web
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex bg-white rounded-lg shadow-sm w-full lg:w-auto">
                        {(view === 'RESUME' || view === 'COVER_LETTER') && (
                            <button
                                onClick={handleCondense}
                                disabled={isCondensing || isRegenerating}
                                className="flex-1 lg:flex-none bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-l flex items-center justify-center gap-2 hover:from-purple-600 hover:to-indigo-600 transition disabled:opacity-50"
                            >
                                {isCondensing ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                Condense
                            </button>
                        )}
                        {(view === 'RESUME' || view === 'COVER_LETTER') && (
                            <button
                                onClick={handleRegenerate}
                                disabled={isRegenerating || isCondensing}
                                className="flex-1 lg:flex-none bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50"
                            >
                                {isRegenerating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                Regenerate
                            </button>
                        )}
                        <button
                            onClick={handleSaveChanges}
                            disabled={!hasUnsavedChanges || isSaving}
                            className={`
                                flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition
                                ${view === 'PORTFOLIO' ? 'rounded-l' : ''}
                                ${hasUnsavedChanges
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                            `}
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 lg:flex-none bg-gray-900 text-white px-4 py-2 rounded-r flex items-center justify-center gap-2 hover:bg-gray-700 border-l border-gray-700"
                        >
                            <Printer size={16} /> Print
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded min-h-[500px]">
                {view === 'RESUME' && (
                    <ResumeTemplate
                        data={application.resume}
                        slug={application.slug}
                        onUpdate={handleResumeUpdate}
                    />
                )}

                {view === 'COVER_LETTER' && (
                    <CoverLetterTemplate
                        resume={application.resume}
                        jobDescription={application.jobDescription}
                        coverLetterContent={application.coverLetter}
                        onUpdate={handleCoverLetterUpdate}
                    />
                )}

                {view === 'PORTFOLIO' && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Simulated Browser Bar */}
                        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2 print:hidden">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="flex-1 bg-white ml-4 rounded px-3 py-1 text-xs text-gray-500 text-center font-mono flex items-center justify-between">
                                <div className="w-4"></div> {/* Spacer */}
                                <a
                                    href={`${window.location.origin}/${application.slug || application.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline text-blue-600 flex items-center gap-1 truncate max-w-[200px] sm:max-w-none"
                                >
                                    <span className="truncate">{window.location.host}/{application.slug || '...'}</span> <Globe size={12} className="shrink-0" />
                                </a>
                                <div className="flex gap-2"></div>
                            </div>
                        </div>
                        <PortfolioPreview
                            application={application}
                            onUpdate={handlePortfolioUpdate}
                        />
                    </div>
                )}
            </div>


            {/* Debug View */}
            {/* {
                debugResponse && (
                    <div className="mt-8 p-4 bg-gray-900 rounded-lg shadow-lg overflow-hidden">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-white font-mono text-sm font-bold flex items-center gap-2">
                                <Sparkles size={14} className="text-yellow-400" />
                                Gemini Raw Response
                            </h3>
                            <button
                                onClick={() => setDebugResponse(null)}
                                className="text-gray-400 hover:text-white text-xs hover:underline"
                            >
                                Close
                            </button>
                        </div>
                        <div className="bg-black rounded p-4 overflow-x-auto">
                            <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap break-all">
                                {debugResponse}
                            </pre>
                        </div>
                    </div>
                )
            } */}
        </div >
    );
};

export default ApplicationDetails;
