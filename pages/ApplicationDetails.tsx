import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TailoredApplication, ApplicationStatus, UserProfile, Experience, Education, JobDescription } from '../types';
import * as SupabaseService from '../services/supabaseService';
import { tailorResume } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import PortfolioPreview from '../components/PortfolioPreview';
import CoverLetterTemplate from '../components/CoverLetterTemplate';
import TemplateSwitcher from '../components/TemplateSwitcher';
import {
    TEMPLATES,
    TemplateId,
    ModernMinimal,
    ProfessionalClassic,
    CreativeBold,
    TechFocused,
    ModernMinimalPDF,
    ProfessionalClassicPDF,
    CreativeBoldPDF,
    TechFocusedPDF
} from '../components/templates';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
    FileText,
    Globe,
    Download,
    ChevronLeft,
    Loader2,
    Save,
    Mail,
    RefreshCw,
    CheckCircle2,
    Palette,
    Edit3,
    Eye,
    Settings,
    MoreVertical,
    ChevronDown,
    X,
    MessageSquare,
    Sliders
} from 'lucide-react';
import CoverLetterPDF from '../components/CoverLetterPDF';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
    'Pending': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    'Sent': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    'Replied': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    'Interview Scheduled': 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
    'Rejected': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
};

const ApplicationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [application, setApplication] = useState<TailoredApplication | null>(null);
    const [view, setView] = useState<'RESUME' | 'PORTFOLIO' | 'COVER_LETTER'>('RESUME');
    const [editMode, setEditMode] = useState(true); // Toggle between editor and preview
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('modern-minimal');
    const [selectedTheme, setSelectedTheme] = useState<TemplateId>('modern-minimal');

    // Regeneration Options State
    const [genOptions, setGenOptions] = useState({
        tone: 'professional',
        conciseness: 'standard',
        focusSkill: ''
    });
    const [showRegenMenu, setShowRegenMenu] = useState(false);
    const [showJDEditor, setShowJDEditor] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);

    // Temp JD for editing
    const [tempJD, setTempJD] = useState<Partial<JobDescription>>({});

    useEffect(() => {
        if (user && id) {
            loadApplication();
        }
    }, [user, id]);

    // Load template from application if set
    useEffect(() => {
        if (application?.template) {
            setSelectedTemplate(application.template as TemplateId);
        }
        if (application?.portfolioTheme) {
            setSelectedTheme(application.portfolioTheme as TemplateId);
        }
    }, [application]);

    const lastSavedData = useRef<string>('');

    // Prompt user before leaving if unsaved changes
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

    // Auto-save logic with robust state checking
    useEffect(() => {
        if (!hasUnsavedChanges || isSaving || !application) return;

        const timeoutId = setTimeout(() => {
            handleSaveChanges();
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [application, hasUnsavedChanges]);

    const loadApplication = async () => {
        if (!user) return;
        const apps = await SupabaseService.getApplications(user.id);
        const app = apps.find(a => a.id === id);
        setApplication(app || null);
        if (app) {
            lastSavedData.current = JSON.stringify({
                resume: app.resume,
                coverLetter: app.coverLetter,
                template: app.template,
                portfolioTheme: app.portfolioTheme
            });
        }
        if (app?.template) {
            setSelectedTemplate(app.template as TemplateId);
        }
        if (app?.portfolioTheme) {
            setSelectedTheme(app.portfolioTheme as TemplateId);
        }
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

        // Capture a snapshot of what we're about to save
        const snapshot = JSON.stringify({
            resume: application.resume,
            coverLetter: application.coverLetter,
            template: selectedTemplate,
            portfolioTheme: selectedTheme,
            jobDescription: application.jobDescription // Track JD changes
        });

        // Don't save if it matches the last saved data
        if (snapshot === lastSavedData.current) {
            setHasUnsavedChanges(false);
            return;
        }

        setIsSaving(true);
        console.log("Saving application changes...", application.resume);
        try {
            await SupabaseService.updateApplication(application.id, {
                resume: application.resume,
                coverLetter: application.coverLetter,
                template: selectedTemplate,
                portfolioTheme: selectedTheme,
                jobDescription: application.jobDescription, // Save updated JD
            });
            console.log("Application saved successfully");
            lastSavedData.current = snapshot;

            // Only reset unsaved changes if the state hasn't changed since we started saving
            const currentSnapshot = JSON.stringify({
                resume: application.resume,
                coverLetter: application.coverLetter,
                template: selectedTemplate,
                portfolioTheme: selectedTheme,
                jobDescription: application.jobDescription
            });

            if (currentSnapshot === snapshot) {
                setHasUnsavedChanges(false);
            }
        } catch (error) {
            console.error("Failed to save changes", error);
            // Don't alert on auto-save errors to avoid interrupting the user, 
            // but keep the unsaved flag true
        } finally {
            setIsSaving(false);
        }
    };

    const handleResumeUpdate = useCallback((newResume: UserProfile) => {
        if (!application) return;
        setApplication(prev => prev ? ({ ...prev, resume: newResume }) : null);
        setHasUnsavedChanges(true);
    }, [application]);

    // Handle field-level updates for inline editing
    const handleFieldUpdate = useCallback((field: keyof UserProfile, value: any) => {
        if (!application) return;
        setApplication(prev => prev ? ({
            ...prev,
            resume: { ...prev.resume, [field]: value }
        }) : null);
        setHasUnsavedChanges(true);
    }, [application]);

    // Handle experience updates
    const handleExperienceUpdate = useCallback((expId: string, field: keyof Experience, value: any) => {
        if (!application) return;
        setApplication(prev => {
            if (!prev) return null;
            const updatedExp = prev.resume.experience?.map(exp =>
                exp.id === expId ? { ...exp, [field]: value } : exp
            );
            return { ...prev, resume: { ...prev.resume, experience: updatedExp } };
        });
        setHasUnsavedChanges(true);
    }, [application]);

    // Handle education updates
    const handleEducationUpdate = useCallback((eduId: string, field: keyof Education, value: any) => {
        if (!application) return;
        setApplication(prev => {
            if (!prev) return null;
            const updatedEdu = prev.resume.education?.map(edu =>
                edu.id === eduId ? { ...edu, [field]: value } : edu
            );
            return { ...prev, resume: { ...prev.resume, education: updatedEdu } };
        });
        setHasUnsavedChanges(true);
    }, [application]);

    // Handle bullet point updates
    const handleBulletUpdate = useCallback((expId: string, bulletIndex: number, value: string) => {
        if (!application) return;
        setApplication(prev => {
            if (!prev) return null;
            const updatedExp = prev.resume.experience?.map(exp => {
                if (exp.id === expId && exp.description) {
                    const newDesc = [...exp.description];
                    newDesc[bulletIndex] = value;
                    return { ...exp, description: newDesc };
                }
                return exp;
            });
            return { ...prev, resume: { ...prev.resume, experience: updatedExp } };
        });
        setHasUnsavedChanges(true);
    }, [application]);

    // Add new bullet point
    const handleAddBullet = useCallback((expId: string) => {
        if (!application) return;
        setApplication(prev => {
            if (!prev) return null;
            const updatedExp = prev.resume.experience?.map(exp => {
                if (exp.id === expId) {
                    return { ...exp, description: [...(exp.description || []), 'New achievement...'] };
                }
                return exp;
            });
            return { ...prev, resume: { ...prev.resume, experience: updatedExp } };
        });
        setHasUnsavedChanges(true);
    }, [application]);

    // Remove bullet point
    const handleRemoveBullet = useCallback((expId: string, bulletIndex: number) => {
        if (!application) return;
        setApplication(prev => {
            if (!prev) return null;
            const updatedExp = prev.resume.experience?.map(exp => {
                if (exp.id === expId && exp.description) {
                    const newDesc = exp.description.filter((_, idx) => idx !== bulletIndex);
                    return { ...exp, description: newDesc };
                }
                return exp;
            });
            return { ...prev, resume: { ...prev.resume, experience: updatedExp } };
        });
        setHasUnsavedChanges(true);
    }, [application]);

    // Add new experience
    const handleAddExperience = useCallback(() => {
        if (!application) return;
        const newExp: Experience = {
            id: Date.now().toString(),
            company: 'Company Name',
            role: 'Job Title',
            startDate: 'Start',
            endDate: 'Present',
            description: ['Achievement or responsibility']
        };
        setApplication(prev => prev ? ({
            ...prev,
            resume: { ...prev.resume, experience: [...(prev.resume.experience || []), newExp] }
        }) : null);
        setHasUnsavedChanges(true);
    }, [application]);

    // Remove experience
    const handleRemoveExperience = useCallback((expId: string) => {
        if (!application) return;
        setApplication(prev => {
            if (!prev) return null;
            const updatedExp = prev.resume.experience?.filter(exp => exp.id !== expId);
            return { ...prev, resume: { ...prev.resume, experience: updatedExp } };
        });
        setHasUnsavedChanges(true);
    }, [application]);

    // Add new education
    const handleAddEducation = useCallback(() => {
        if (!application) return;
        const newEdu: Education = {
            id: Date.now().toString(),
            institution: 'Institution Name',
            degree: 'Degree',
            year: 'Year'
        };
        setApplication(prev => prev ? ({
            ...prev,
            resume: { ...prev.resume, education: [...(prev.resume.education || []), newEdu] }
        }) : null);
        setHasUnsavedChanges(true);
    }, [application]);

    // Remove education
    const handleRemoveEducation = useCallback((eduId: string) => {
        if (!application) return;
        setApplication(prev => {
            if (!prev) return null;
            const updatedEdu = prev.resume.education?.filter(edu => edu.id !== eduId);
            return { ...prev, resume: { ...prev.resume, education: updatedEdu } };
        });
        setHasUnsavedChanges(true);
    }, [application]);

    // Add skill
    const handleAddSkill = useCallback((skill: string) => {
        if (!application) return;
        setApplication(prev => prev ? ({
            ...prev,
            resume: { ...prev.resume, skills: [...(prev.resume.skills || []), skill] }
        }) : null);
        setHasUnsavedChanges(true);
    }, [application]);

    // Remove skill
    const handleRemoveSkill = useCallback((index: number) => {
        if (!application) return;
        setApplication(prev => {
            if (!prev) return null;
            const updatedSkills = prev.resume.skills?.filter((_, idx) => idx !== index);
            return { ...prev, resume: { ...prev.resume, skills: updatedSkills } };
        });
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

    const handleTemplateChange = (templateId: TemplateId) => {
        setSelectedTemplate(templateId);
        setApplication(prev => prev ? ({ ...prev, template: templateId }) : null);
        setHasUnsavedChanges(true);
        setShowTemplatePicker(false);
    };

    const handleThemeChange = (themeId: TemplateId) => { // Assuming TemplateId is used for themes as well
        setSelectedTheme(themeId);
        setApplication(prev => prev ? ({ ...prev, portfolioTheme: themeId }) : null);
        setHasUnsavedChanges(true);
        setShowThemePicker(false);
    };

    const handleRegenerate = async () => {
        if (!application || !user) return;
        setIsRegenerating(true);
        setShowRegenMenu(false); // Close menu if open

        try {
            const baseProfile = await SupabaseService.getProfile(user.id);
            if (!baseProfile) {
                throw new Error('Could not load base profile');
            }

            const result = await tailorResume(
                baseProfile,
                application.jobDescription,
                application.githubProjects || [],
                application.showMatchScore ?? true,
                1,
                genOptions // Pass options
            );
            const { application: regenerated } = result;

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

    const handleJDSave = () => {
        if (!application || !tempJD.companyName || !tempJD.roleTitle || !tempJD.rawText) return;

        setApplication(prev => prev ? ({
            ...prev,
            jobDescription: {
                companyName: tempJD.companyName!,
                roleTitle: tempJD.roleTitle!,
                rawText: tempJD.rawText!
            }
        }) : null);
        setHasUnsavedChanges(true);
        setShowJDEditor(false);
    };

    // Render the selected template with optional editing support
    const renderTemplatePreview = (isEditable: boolean = false) => {
        if (!application) return null;
        const baseProps = { data: application.resume, slug: application.slug };
        const editProps = isEditable ? {
            editable: true,
            onUpdate: handleFieldUpdate,
            onExperienceUpdate: handleExperienceUpdate,
            onEducationUpdate: handleEducationUpdate,
            onAddExperience: handleAddExperience,
            onRemoveExperience: handleRemoveExperience,
            onAddEducation: handleAddEducation,
            onRemoveEducation: handleRemoveEducation,
            onAddSkill: handleAddSkill,
            onRemoveSkill: handleRemoveSkill,
            onBulletUpdate: handleBulletUpdate,
            onAddBullet: handleAddBullet,
            onRemoveBullet: handleRemoveBullet
        } : {};

        const combinedProps = { ...baseProps, ...(isEditable ? editProps : {}) };

        const templateToUse = (view === 'PORTFOLIO') ? selectedTheme : selectedTemplate;

        switch (templateToUse) {
            case 'modern-minimal': return <ModernMinimal {...combinedProps} />;
            case 'professional-classic': return <ProfessionalClassic {...combinedProps} />;
            case 'creative-bold': return <CreativeBold {...combinedProps} />;
            case 'tech-focused': return <TechFocused {...combinedProps} />;
            default: return <ModernMinimal {...combinedProps} />;
        }
    };

    // Get the PDF component for the selected template
    const getPDFDocument = () => {
        if (!application) return null;
        const props = { data: application.resume, slug: application.slug };
        switch (selectedTemplate) {
            case 'modern-minimal': return <ModernMinimalPDF {...props} />;
            case 'professional-classic': return <ProfessionalClassicPDF {...props} />;
            case 'creative-bold': return <CreativeBoldPDF {...props} />;
            case 'tech-focused': return <TechFocusedPDF {...props} />;
            default: return <ModernMinimalPDF {...props} />;
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!application) return <div className="p-8 text-center">Application not found</div>;

    return (
        <div className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors">
            {/* Sub-header for this page */}
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-16 z-10 print:hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        {/* Left side - Back & Title */}
                        <div className="flex items-center gap-4">
                            <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-400">
                                <ChevronLeft size={20} />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate max-w-[200px] lg:max-w-md">
                                        {application.jobDescription.companyName}
                                    </h2>
                                    {isSaving ? (
                                        <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full animate-pulse">
                                            <Loader2 size={12} className="animate-spin" />
                                            Saving...
                                        </span>
                                    ) : hasUnsavedChanges ? (
                                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                                            Unsaved changes
                                        </span>
                                    ) : (
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{application.jobDescription.roleTitle}</span>
                                    <select
                                        value={application.status || 'Pending'}
                                        onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                                        className={`appearance-none cursor-pointer px-2.5 py-0.5 rounded-full text-xs font-bold border-0 focus:ring-2 focus:ring-blue-500 ${STATUS_COLORS[application.status || 'Pending']} dark:bg-opacity-20`}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Sent">Sent</option>
                                        <option value="Replied">Replied</option>
                                        <option value="Interview Scheduled">Interview</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            {/* View Switcher */}
                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                {[
                                    { key: 'RESUME', icon: FileText, label: 'Resume' },
                                    { key: 'COVER_LETTER', icon: Mail, label: 'Cover' },
                                    { key: 'PORTFOLIO', icon: Globe, label: 'Web' },
                                ].map(({ key, icon: Icon, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setView(key as typeof view)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${view === key
                                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <Icon size={14} />
                                        <span className="hidden sm:inline">{label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Edit/Preview Toggle (for Resume view) */}
                            {view === 'RESUME' && (
                                <button
                                    onClick={() => setEditMode(!editMode)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${editMode
                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {editMode ? <Edit3 size={14} /> : <Eye size={14} />}
                                    {editMode ? 'Editing' : 'Preview'}
                                </button>
                            )}

                            {/* Template Picker (for Resume view) */}
                            {view === 'RESUME' && (
                                <button
                                    onClick={() => {
                                        setShowTemplatePicker(!showTemplatePicker);
                                        setShowThemePicker(false);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                                >
                                    <Palette size={14} />
                                    Resume Template
                                </button>
                            )}

                            {view === 'PORTFOLIO' && (
                                <button
                                    onClick={() => {
                                        setShowThemePicker(!showThemePicker);
                                        setShowTemplatePicker(false);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                                >
                                    <Globe size={14} />
                                    Web Theme
                                </button>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {(view === 'RESUME' || view === 'COVER_LETTER') && (
                                    <div className="relative">
                                        <div className="flex rounded-lg shadow-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white transition hover:from-amber-600 hover:to-orange-600">
                                            <button
                                                onClick={handleRegenerate}
                                                disabled={isRegenerating}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border-r border-white/20 disabled:opacity-50"
                                            >
                                                {isRegenerating ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                                                <span className="hidden sm:inline">Regenerate</span>
                                            </button>
                                            <button
                                                onClick={() => setShowRegenMenu(!showRegenMenu)}
                                                disabled={isRegenerating}
                                                className="px-1.5 py-1.5 hover:bg-black/10 rounded-r-lg transition disabled:opacity-50"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>

                                        {showRegenMenu && (
                                            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                                                <div className="p-1">
                                                    <button
                                                        onClick={() => {
                                                            setTempJD(application?.jobDescription || {});
                                                            setShowJDEditor(true);
                                                            setShowRegenMenu(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-left"
                                                    >
                                                        <Edit3 size={16} className="text-gray-500" />
                                                        Edit Job Description
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowOptionsModal(true);
                                                            setShowRegenMenu(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-left"
                                                    >
                                                        <Sliders size={16} className="text-gray-500" />
                                                        Generation Settings
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={handleSaveChanges}
                                    disabled={!hasUnsavedChanges || isSaving}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${hasUnsavedChanges
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : hasUnsavedChanges ? <Save size={14} /> : <CheckCircle2 size={14} />}
                                    <span className="hidden sm:inline">{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save' : 'Saved'}</span>
                                </button>

                                {view === 'RESUME' && application && (
                                    <PDFDownloadLink
                                        key={`${selectedTemplate}-${JSON.stringify(application.resume)}`}
                                        document={getPDFDocument()!}
                                        fileName={`${application.resume.fullName.replace(/\s+/g, '_')}_Resume.pdf`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 transition"
                                    >
                                        {({ loading: pdfLoading }) => (
                                            <>
                                                {pdfLoading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                                                <span className="hidden sm:inline">{pdfLoading ? 'Preparing...' : 'Download'}</span>
                                            </>
                                        )}
                                    </PDFDownloadLink>
                                )}

                                {view === 'COVER_LETTER' && application && (
                                    <PDFDownloadLink
                                        key={`cover-letter-${JSON.stringify(application.coverLetter)}`}
                                        document={
                                            <CoverLetterPDF
                                                resume={application.resume}
                                                jobDescription={application.jobDescription}
                                                coverLetterContent={application.coverLetter}
                                            />
                                        }
                                        fileName={`${application.resume.fullName.replace(/\s+/g, '_')}_CoverLetter.pdf`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 transition"
                                    >
                                        {({ loading: pdfLoading }) => (
                                            <>
                                                {pdfLoading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                                                <span className="hidden sm:inline">{pdfLoading ? 'Preparing...' : 'Download'}</span>
                                            </>
                                        )}
                                    </PDFDownloadLink>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {showTemplatePicker && view === 'RESUME' && (
                    <div className="absolute right-4 top-full mt-2 w-80 z-30">
                        <TemplateSwitcher
                            title="Select Resume Template"
                            currentTemplate={selectedTemplate}
                            onSelect={handleTemplateChange}
                        />
                    </div>
                )}

                {showThemePicker && view === 'PORTFOLIO' && (
                    <div className="absolute right-4 top-full mt-2 w-80 z-30">
                        <TemplateSwitcher
                            title="Select Web Theme"
                            currentTemplate={selectedTheme}
                            onSelect={handleThemeChange}
                        />
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:max-w-none print:p-0">
                {view === 'RESUME' && (
                    <div className="flex justify-center">
                        <div className="shadow-2xl rounded-lg overflow-hidden">
                            {renderTemplatePreview(editMode)}
                        </div>
                    </div>
                )}

                {view === 'COVER_LETTER' && (
                    <div className="max-w-[210mm] mx-auto">
                        <CoverLetterTemplate
                            resume={application.resume}
                            jobDescription={application.jobDescription}
                            coverLetterContent={application.coverLetter}
                            onUpdate={handleCoverLetterUpdate}
                        />
                    </div>
                )}

                {view === 'PORTFOLIO' && (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-900 transition-colors">
                        {/* Simulated Browser Bar */}
                        <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-2 print:hidden">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="flex-1 bg-white dark:bg-gray-900 ml-4 rounded px-3 py-1 text-xs text-gray-500 dark:text-gray-400 text-center font-mono border border-gray-200 dark:border-gray-700">
                                <a
                                    href={`${window.location.origin}/p/${application.slug || application.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1"
                                >
                                    {window.location.host}/p/{application.slug || '...'}
                                    <Globe size={12} />
                                </a>
                            </div>
                        </div>

                        {/* PDF Download Portal for Web Preview */}
                        <div className="hidden">
                            <PDFDownloadLink
                                key={`${selectedTemplate}-${JSON.stringify(application.resume)}`}
                                id="web-preview-resume-download"
                                document={getPDFDocument()!}
                                fileName={`${application.resume.fullName.replace(/\s+/g, '_')}_Resume.pdf`}
                            >
                                {({ loading }) => loading ? '...' : 'Download'}
                            </PDFDownloadLink>
                        </div>

                        <PortfolioPreview
                            application={application}
                            template={selectedTemplate}
                            theme={selectedTheme as any}
                            type="web"
                            onDownloadResume={() => {
                                const link = document.getElementById('web-preview-resume-download');
                                if (link) link.click();
                            }}
                        />
                    </div>
                )}
            </main>
            {/* Job Description Editor Modal */}
            {showJDEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Job Description</h3>
                            <button onClick={() => setShowJDEditor(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                                    <input
                                        type="text"
                                        value={tempJD.companyName || ''}
                                        onChange={e => setTempJD({ ...tempJD, companyName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Title</label>
                                    <input
                                        type="text"
                                        value={tempJD.roleTitle || ''}
                                        onChange={e => setTempJD({ ...tempJD, roleTitle: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Description Text</label>
                                <textarea
                                    value={tempJD.rawText || ''}
                                    onChange={e => setTempJD({ ...tempJD, rawText: e.target.value })}
                                    rows={10}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent font-mono text-sm"
                                    placeholder="Paste the job description here..."
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                            <button
                                onClick={() => setShowJDEditor(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleJDSave}
                                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generation Settings Modal */}
            {showOptionsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Regeneration Settings</h3>
                            <button onClick={() => setShowOptionsModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Writing Tone</label>
                                <select
                                    value={genOptions.tone}
                                    onChange={e => setGenOptions({ ...genOptions, tone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                                >
                                    <option value="professional">Professional (Standard)</option>
                                    <option value="enthusiastic">Enthusiastic & Energetic</option>
                                    <option value="technical">Technical & Direct</option>
                                    <option value="creative">Creative & Story-driven</option>
                                    <option value="executive">Executive & Strategic</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conciseness Level</label>
                                <select
                                    value={genOptions.conciseness}
                                    onChange={e => setGenOptions({ ...genOptions, conciseness: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                                >
                                    <option value="standard">Standard (Balanced)</option>
                                    <option value="concise">Concise (Dense & Direct)</option>
                                    <option value="detailed">Detailed (Expanded context)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Focus Skill (Optional)</label>
                                <input
                                    type="text"
                                    value={genOptions.focusSkill}
                                    onChange={e => setGenOptions({ ...genOptions, focusSkill: e.target.value })}
                                    placeholder="e.g. React, Leadership, Python"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">If set, the AI will prioritize experience related to this skill.</p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                            <button
                                onClick={() => setShowOptionsModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationDetails;
