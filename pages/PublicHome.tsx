import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';
import Navbar from '../components/Navbar';
import { Loader2, User } from 'lucide-react';
import { WEB_THEMES, WebThemeId } from '../components/portfolio/web-themes';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
    ModernMinimalPDF,
    ProfessionalClassicPDF,
    CreativeBoldPDF,
    TechFocusedPDF,
    TemplateId
} from '../components/templates';

/**
 * Public Home Page - Shows the user's portfolio using their selected theme.
 * This is the public-facing page at the root URL.
 */
const PublicHome: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPublicProfile();
    }, []);

    const loadPublicProfile = async () => {
        try {
            // Fetch the first (and only) profile since this is a single-user app
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .limit(1)
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    setError('No portfolio found. Please set up your profile.');
                } else {
                    console.error('Error fetching profile:', fetchError);
                    setError('Could not load portfolio.');
                }
                setLoading(false);
                return;
            }

            // Convert snake_case from DB to camelCase
            const userProfile: UserProfile = {
                fullName: data.full_name,
                email: data.email,
                location: data.location,
                phone: data.phone,
                summary: data.summary,
                skills: data.skills || [],
                experience: data.experience || [],
                education: data.education || [],
                links: data.links || [],
                githubUsername: data.github_username,
                otherExperience: data.other_experience || [],
                portfolioTemplate: data.portfolio_template,
                portfolioTheme: data.portfolio_theme || 'modern-minimal',
                profilePhotoUrl: data.profile_photo_url,
                githubProjects: data.github_projects || [],
            };

            setProfile(userProfile);
        } catch (err) {
            console.error('Error:', err);
            setError('An error occurred loading the portfolio.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get PDF component
    const getPDFDocument = () => {
        if (!profile) return null;
        const templateId = (profile.portfolioTemplate || 'modern-minimal') as TemplateId;
        const props = { data: profile };

        switch (templateId) {
            case 'modern-minimal': return <ModernMinimalPDF {...props} />;
            case 'professional-classic': return <ProfessionalClassicPDF {...props} />;
            case 'creative-bold': return <CreativeBoldPDF {...props} />;
            case 'tech-focused': return <TechFocusedPDF {...props} />;
            default: return <ModernMinimalPDF {...props} />;
        }
    };

    // Render the selected theme
    const renderTheme = () => {
        if (!profile) return null;

        const themeId = (profile.portfolioTheme || 'modern-minimal') as WebThemeId;
        const ThemeComponent = WEB_THEMES[themeId] || WEB_THEMES['modern-minimal'];

        return (
            <div className="relative">
                {/* PDF Download Portal - invisible link triggered by theme */}
                <div className="hidden">
                    <PDFDownloadLink
                        key={`${profile.portfolioTemplate || 'modern-minimal'}-${JSON.stringify(profile)}`}
                        id="resume-download-link"
                        document={getPDFDocument()!}
                        fileName={`${profile.fullName.replace(/\s+/g, '_')}_Resume.pdf`}
                    >
                        {({ loading }) => loading ? '...' : 'Download'}
                    </PDFDownloadLink>
                </div>

                <ThemeComponent
                    data={profile}
                    onDownloadResume={() => {
                        const link = document.getElementById('resume-download-link');
                        if (link) link.click();
                    }}
                />
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
                <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={40} />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <Navbar variant="public" />
                <div className="flex flex-col items-center justify-center pt-32 px-4">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 mb-6 mx-auto">
                            <User size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Portfolio Not Found</h1>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">{error || 'This portfolio hasn\'t been set up yet.'}</p>
                        <a
                            href="/login"
                            className="inline-flex items-center px-6 py-3 bg-gray-900 dark:bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                        >
                            Admin Login
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            {renderTheme()}
        </div>
    );
};

export default PublicHome;
