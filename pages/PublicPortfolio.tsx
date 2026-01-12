import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TailoredApplication } from '../types';
import * as SupabaseService from '../services/supabaseService';
import PortfolioPreview from '../components/PortfolioPreview';
import { Loader2 } from 'lucide-react';

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

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

    if (error || !application) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
                <p className="text-gray-500">Portfolio not found or removed.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <PortfolioPreview application={application} />
        </div>
    );
};

export default PublicPortfolio;
