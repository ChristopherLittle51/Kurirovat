import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TailoredApplication } from '../types';
import * as SupabaseService from '../services/supabaseService';
import PortfolioPreview from '../components/PortfolioPreview';
import Navbar from '../components/Navbar';
import { Loader2 } from 'lucide-react';
import { TemplateId } from '../components/templates';
import PortfolioShell from '../components/portfolio/PortfolioShell';

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

    // Use the application's saved template, or default to modern-minimal
    const template = (application.template as TemplateId) || 'modern-minimal';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
            <Navbar variant="public" />
            <PortfolioShell data={application.resume}>
                <PortfolioPreview
                    application={application}
                    template={template}
                />
            </PortfolioShell>
        </div>
    );
};

export default PublicPortfolio;
