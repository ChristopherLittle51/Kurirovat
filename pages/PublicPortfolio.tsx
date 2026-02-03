import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TailoredApplication } from '../types';
import * as SupabaseService from '../services/supabaseService';
import PortfolioPreview from '../components/PortfolioPreview';
import Navbar from '../components/Navbar';
import { Loader2 } from 'lucide-react';
import { TemplateId, ModernMinimalPDF, ProfessionalClassicPDF, CreativeBoldPDF, TechFocusedPDF } from '../components/templates';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { WebThemeId } from '../components/portfolio/web-themes';

const PublicPortfolio: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [application, setApplication] = useState<TailoredApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (slug) {
            loadApplication();
        }
    }, [slug]);

    const loadApplication = async () => {
        if (!slug) return;
        setLoading(true);
        const app = await SupabaseService.getApplicationBySlug(slug);
        if (app) {
            setApplication(app);
        } else {
            setError(true);
        }
        setLoading(false);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
            <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
        </div>
    );

    if (error || !application) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
                <Navbar variant="public" />
                <div className="flex items-center justify-center pt-32 flex-col">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">404</h1>
                    <p className="text-gray-500 dark:text-gray-400">Portfolio not found or removed.</p>
                </div>
            </div>
        );
    }

    // Helper to get PDF component
    const getPDFDocument = () => {
        if (!application) return null;
        const templateId = (application.template as TemplateId) || 'modern-minimal';
        const props = { data: application.resume, slug: application.slug };

        switch (templateId) {
            case 'modern-minimal': return <ModernMinimalPDF {...props} />;
            case 'professional-classic': return <ProfessionalClassicPDF {...props} />;
            case 'creative-bold': return <CreativeBoldPDF {...props} />;
            case 'tech-focused': return <TechFocusedPDF {...props} />;
            default: return <ModernMinimalPDF {...props} />;
        }
    };

    // Use the application's saved template/theme, or default to modern-minimal
    const template = (application.template as TemplateId) || 'modern-minimal';
    const theme = (application.portfolioTheme as WebThemeId) || 'modern-minimal';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">

            <div className="hidden">
                <PDFDownloadLink
                    key={`${application.template || 'modern-minimal'}-${JSON.stringify(application.resume)}`}
                    id="resume-download-link"
                    document={getPDFDocument()!}
                    fileName={`${application.resume.fullName.replace(/\s+/g, '_')}_Resume.pdf`}
                >
                    {({ loading }) => loading ? '...' : 'Download'}
                </PDFDownloadLink>
            </div>

            <PortfolioPreview
                application={application}
                template={template}
                theme={theme}
                type="web"
                onDownloadResume={() => {
                    const link = document.getElementById('resume-download-link');
                    if (link) link.click();
                }}
            />
        </div>
    );
};

export default PublicPortfolio;
