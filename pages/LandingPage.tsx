import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, TailoredApplication, Experience, Education } from '../types';
import { useAuth } from '../contexts/AuthContext';
import * as SupabaseService from '../services/supabaseService';
import {
    FileText,
    Loader2,
    ChevronRight,
    TrendingUp,
    Briefcase,
    Calendar,
    Globe,
    Save,
    CheckCircle2,
    ExternalLink,
    Edit3,
    Eye
} from 'lucide-react';
import { TEMPLATES, TemplateId, ModernMinimal, ProfessionalClassic, CreativeBold, TechFocused } from '../components/templates';
import TemplateSwitcher from '../components/TemplateSwitcher';

/**
 * Admin Home Page - User's "home base" for their portfolio.
 * Shows a full preview of their base resume with template selection and live editing.
 */
const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [applications, setApplications] = useState<TailoredApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('modern-minimal');
    const [selectedTheme, setSelectedTheme] = useState<TemplateId>('modern-minimal');
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [showThemePicker, setShowThemePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const lastSavedProfile = useRef<string>('');

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    // Auto-save logic with robust state checking
    useEffect(() => {
        if (!hasUnsavedChanges || isSaving || !profile) return;

        const timeoutId = setTimeout(() => {
            handleSave();
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [profile, hasUnsavedChanges]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        const [profileData, appsData] = await Promise.all([
            SupabaseService.getProfile(user.id),
            SupabaseService.getApplications(user.id),
        ]);
        setProfile(profileData);
        if (profileData) {
            lastSavedProfile.current = JSON.stringify({
                ...profileData,
                portfolioTemplate: profileData.portfolioTemplate || selectedTemplate,
                portfolioTheme: profileData.portfolioTheme || selectedTheme
            });
        }
        setApplications(appsData);
        if (profileData?.portfolioTemplate) {
            setSelectedTemplate(profileData.portfolioTemplate as TemplateId);
        }
        if (profileData?.portfolioTheme) {
            setSelectedTheme(profileData.portfolioTheme as TemplateId);
        }
        setLoading(false);
    };

    const handleTemplateChange = (templateId: TemplateId) => {
        setSelectedTemplate(templateId);
        setShowTemplatePicker(false);
        setHasUnsavedChanges(true);
    };

    const handleThemeChange = (templateId: TemplateId) => {
        setSelectedTheme(templateId);
        setShowThemePicker(false);
        setHasUnsavedChanges(true);
    };

    const handleProfileUpdate = useCallback((updatedProfile: UserProfile) => {
        setProfile(updatedProfile);
        setHasUnsavedChanges(true);
    }, []);

    // Handle field-level updates for inline editing
    const handleFieldUpdate = useCallback((field: keyof UserProfile, value: any) => {
        setProfile(prev => prev ? ({ ...prev, [field]: value }) : null);
        setHasUnsavedChanges(true);
    }, []);

    // Handle experience updates
    const handleExperienceUpdate = useCallback((expId: string, field: keyof Experience, value: any) => {
        setProfile(prev => {
            if (!prev) return null;
            const updatedExp = prev.experience?.map(exp =>
                exp.id === expId ? { ...exp, [field]: value } : exp
            );
            return { ...prev, experience: updatedExp };
        });
        setHasUnsavedChanges(true);
    }, []);

    // Handle education updates
    const handleEducationUpdate = useCallback((eduId: string, field: keyof Education, value: any) => {
        setProfile(prev => {
            if (!prev) return null;
            const updatedEdu = prev.education?.map(edu =>
                edu.id === eduId ? { ...edu, [field]: value } : edu
            );
            return { ...prev, education: updatedEdu };
        });
        setHasUnsavedChanges(true);
    }, []);

    // Handle bullet point updates
    const handleBulletUpdate = useCallback((expId: string, bulletIndex: number, value: string) => {
        setProfile(prev => {
            if (!prev) return null;
            const updatedExp = prev.experience?.map(exp => {
                if (exp.id === expId && exp.description) {
                    const newDesc = [...exp.description];
                    newDesc[bulletIndex] = value;
                    return { ...exp, description: newDesc };
                }
                return exp;
            });
            return { ...prev, experience: updatedExp };
        });
        setHasUnsavedChanges(true);
    }, []);

    // Add new bullet point
    const handleAddBullet = useCallback((expId: string) => {
        setProfile(prev => {
            if (!prev) return null;
            const updatedExp = prev.experience?.map(exp => {
                if (exp.id === expId) {
                    return { ...exp, description: [...(exp.description || []), 'New achievement...'] };
                }
                return exp;
            });
            return { ...prev, experience: updatedExp };
        });
        setHasUnsavedChanges(true);
    }, []);

    // Remove bullet point
    const handleRemoveBullet = useCallback((expId: string, bulletIndex: number) => {
        setProfile(prev => {
            if (!prev) return null;
            const updatedExp = prev.experience?.map(exp => {
                if (exp.id === expId && exp.description) {
                    const newDesc = exp.description.filter((_, idx) => idx !== bulletIndex);
                    return { ...exp, description: newDesc };
                }
                return exp;
            });
            return { ...prev, experience: updatedExp };
        });
        setHasUnsavedChanges(true);
    }, []);

    // Add new experience
    const handleAddExperience = useCallback(() => {
        const newExp: Experience = {
            id: Date.now().toString(),
            company: 'Company Name',
            role: 'Job Title',
            startDate: 'Start',
            endDate: 'Present',
            description: ['Achievement or responsibility']
        };
        setProfile(prev => prev ? ({
            ...prev,
            experience: [...(prev.experience || []), newExp]
        }) : null);
        setHasUnsavedChanges(true);
    }, []);

    // Remove experience
    const handleRemoveExperience = useCallback((expId: string) => {
        setProfile(prev => {
            if (!prev) return null;
            const updatedExp = prev.experience?.filter(exp => exp.id !== expId);
            return { ...prev, experience: updatedExp };
        });
        setHasUnsavedChanges(true);
    }, []);

    // Add new education
    const handleAddEducation = useCallback(() => {
        const newEdu: Education = {
            id: Date.now().toString(),
            institution: 'Institution Name',
            degree: 'Degree',
            year: 'Year'
        };
        setProfile(prev => prev ? ({
            ...prev,
            education: [...(prev.education || []), newEdu]
        }) : null);
        setHasUnsavedChanges(true);
    }, []);

    // Remove education
    const handleRemoveEducation = useCallback((eduId: string) => {
        setProfile(prev => {
            if (!prev) return null;
            const updatedEdu = prev.education?.filter(edu => edu.id !== eduId);
            return { ...prev, education: updatedEdu };
        });
        setHasUnsavedChanges(true);
    }, []);

    // Add skill
    const handleAddSkill = useCallback((skill: string) => {
        setProfile(prev => prev ? ({
            ...prev,
            skills: [...(prev.skills || []), skill]
        }) : null);
        setHasUnsavedChanges(true);
    }, []);

    // Remove skill
    const handleRemoveSkill = useCallback((index: number) => {
        setProfile(prev => {
            if (!prev) return null;
            const updatedSkills = prev.skills?.filter((_, idx) => idx !== index);
            return { ...prev, skills: updatedSkills };
        });
        setHasUnsavedChanges(true);
    }, []);


    const handleSave = async () => {
        if (!user || !profile) return;

        // Capture a snapshot of what we're about to save
        const snapshot = JSON.stringify({
            ...profile,
            portfolioTemplate: selectedTemplate,
            portfolioTheme: selectedTheme
        });

        // Don't save if it matches the last saved data
        if (snapshot === lastSavedProfile.current) {
            setHasUnsavedChanges(false);
            return;
        }

        setIsSaving(true);
        console.log("Saving profile changes...", profile);
        try {
            const updatedProfile = {
                ...profile,
                portfolioTemplate: selectedTemplate,
                portfolioTheme: selectedTheme
            };
            await SupabaseService.saveProfile(user.id, updatedProfile);
            console.log("Profile saved successfully");
            lastSavedProfile.current = snapshot;

            // Only reset unsaved changes if the state hasn't changed since we started saving
            const currentSnapshot = JSON.stringify({
                ...profile,
                portfolioTemplate: selectedTemplate,
                portfolioTheme: selectedTheme
            });

            if (currentSnapshot === snapshot) {
                setHasUnsavedChanges(false);
            }
            setProfile(updatedProfile);
        } catch (error) {
            console.error('Error saving:', error);
            // Don't alert on auto-save errors
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center py-32">
                <p className="text-gray-500 mb-4">No profile found</p>
                <button
                    onClick={() => navigate('/admin/onboarding')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Complete Onboarding
                </button>
            </div>
        );
    }

    // Calculate stats
    const avgScore = applications.length > 0
        ? Math.round(applications.reduce((sum, app) => sum + (app.matchScore || 0), 0) / applications.length)
        : 0;
    const interviewCount = applications.filter(app =>
        app.status === 'Interview Scheduled'
    ).length;

    // Render selected template for preview/editing
    const renderTemplate = (isEditable: boolean = false) => {
        if (!profile) return null;
        const baseProps = { data: profile };
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

        const templateToUse = isEditable ? selectedTemplate : selectedTheme;

        switch (templateToUse) {
            case 'modern-minimal': return <ModernMinimal {...combinedProps} />;
            case 'professional-classic': return <ProfessionalClassic {...combinedProps} />;
            case 'creative-bold': return <CreativeBold {...combinedProps} />;
            case 'tech-focused': return <TechFocused {...combinedProps} />;
            default: return <ModernMinimal {...combinedProps} />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white transition-colors">
                            Welcome back, {profile.fullName.split(' ')[0]}!
                        </h1>
                        {isSaving ? (
                            <span className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full animate-pulse mt-1">
                                <Loader2 size={12} className="animate-spin" />
                                Saving...
                            </span>
                        ) : hasUnsavedChanges ? (
                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full mt-1">
                                Unsaved changes
                            </span>
                        ) : (
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full mt-1">
                                Saved
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your professional presence and resume designs.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Live Portfolio Link */}
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-750 transition shadow-sm"
                    >
                        <Globe size={18} />
                        View Live Site
                    </a>

                    {/* Edit/Preview Toggle */}
                    <button
                        onClick={() => setEditMode(!editMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${editMode
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        {editMode ? <Edit3 size={18} /> : <Eye size={18} />}
                        {editMode ? 'Editing' : 'Previewing'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 text-gray-500 italic text-sm mb-2">
                                <TrendingUp size={14} />
                                Quick Overview
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{applications.length}</p>
                                    <p className="text-xs text-gray-500">Applications</p>
                                </div>
                                <div className="w-1 px-4 border-l border-gray-200 dark:border-gray-800 h-8"></div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgScore}%</p>
                                    <p className="text-xs text-gray-500">Avg Match</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selectors */}
                    <div className="space-y-4">
                        {/* Web Theme Selector */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm relative transition-colors">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
                                <Globe size={16} className="text-blue-600 dark:text-blue-400" />
                                Web Portfolio Theme
                            </h3>
                            <button
                                onClick={() => {
                                    setShowThemePicker(!showThemePicker);
                                    setShowTemplatePicker(false);
                                }}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="text-left">
                                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                        {TEMPLATES.find(t => t.id === selectedTheme)?.name}
                                    </p>
                                    <p className="text-xs text-gray-500 italic">Web Presence</p>
                                </div>
                                <ChevronRight size={16} className={`text-gray-400 transition-transform ${showThemePicker ? 'rotate-90' : ''}`} />
                            </button>

                            {showThemePicker && (
                                <div className="absolute left-0 right-0 top-full mt-2 z-20">
                                    <TemplateSwitcher
                                        title="Select Web Theme"
                                        currentTemplate={selectedTheme}
                                        onSelect={handleThemeChange}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Resume Template Selector */}
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm relative transition-colors">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
                                <FileText size={16} className="text-purple-600 dark:text-purple-400" />
                                Base Resume Template
                            </h3>
                            <button
                                onClick={() => {
                                    setShowTemplatePicker(!showTemplatePicker);
                                    setShowThemePicker(false);
                                }}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="text-left">
                                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                        {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                                    </p>
                                    <p className="text-xs text-gray-500 italic">PDF & Applications</p>
                                </div>
                                <ChevronRight size={16} className={`text-gray-400 transition-transform ${showTemplatePicker ? 'rotate-90' : ''}`} />
                            </button>

                            {showTemplatePicker && (
                                <div className="absolute left-0 right-0 top-full mt-2 z-20">
                                    <TemplateSwitcher
                                        title="Select Resume Template"
                                        currentTemplate={selectedTemplate}
                                        onSelect={handleTemplateChange}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-700 dark:text-gray-200">
                                {editMode ? 'Edit Base Experience' : 'Portfolio Preview'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">
                                    Showing:
                                </span>
                                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
                                    {TEMPLATES.find(t => t.id === (editMode ? selectedTemplate : selectedTheme))?.name}
                                </span>
                            </div>
                        </div>
                        <div className="max-h-[800px] overflow-auto">
                            {renderTemplate(editMode)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
