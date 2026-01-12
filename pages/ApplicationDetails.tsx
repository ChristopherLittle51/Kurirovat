import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TailoredApplication } from '../types';
import * as SupabaseService from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import ResumeTemplate from '../components/ResumeTemplate';
import PortfolioPreview from '../components/PortfolioPreview';
import { FileText, Globe, Printer, ChevronLeft, Loader2 } from 'lucide-react';

const ApplicationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [application, setApplication] = useState<TailoredApplication | null>(null);
    const [view, setView] = useState<'RESUME' | 'PORTFOLIO'>('RESUME');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && id) {
            loadApplication();
        }
    }, [user, id]);

    const loadApplication = async () => {
        // Since we don't have a direct getApplicationById in service (yet, but easy to add or just filter), 
        // we can fetch all or add the method. fetching all is inefficient but works for MVP with small data.
        // Better: let's add getApplicationById or just use getApplications and find.
        // Actually, let's use getApplications for now to avoid modifying service again immediately, 
        // or just assume we modify service later or query directly.
        // Wait, getApplications returns everything. I'll just use that for now.
        if (!user) return;
        const apps = await SupabaseService.getApplications(user.id);
        const app = apps.find(a => a.id === id);
        setApplication(app || null);
        setLoading(false);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!application) return <div className="p-8 text-center">Application not found</div>;

    return (
        <div className="max-w-[210mm] mx-auto p-8 print:max-w-none print:w-full print:p-0">
            <div className="flex justify-between items-center mb-6 print:hidden">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-gray-200 rounded-full"><ChevronLeft /></Link>
                    <h2 className="text-2xl font-bold text-gray-900">{application.jobDescription.companyName} Application</h2>
                </div>
                <div className="flex bg-white rounded-lg shadow-sm border p-1">
                    <button
                        onClick={() => setView('RESUME')}
                        className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${view === 'RESUME' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <FileText size={16} /> Resume
                    </button>
                    <button
                        onClick={() => setView('PORTFOLIO')}
                        className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${view === 'PORTFOLIO' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Globe size={16} /> Web Portfolio
                    </button>
                </div>
                <button onClick={handlePrint} className="bg-gray-900 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-700">
                    <Printer size={16} /> Print / Save PDF
                </button>
            </div>

            {view === 'RESUME' ? (
                <ResumeTemplate data={application.resume} />
            ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Simulated Browser Bar */}
                    <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-2 print:hidden">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="flex-1 bg-white ml-4 rounded px-3 py-1 text-xs text-gray-500 text-center font-mono">
                            {/*  To be replaced with actual public URL link later */}
                            /{application.jobDescription.companyName.toLowerCase()}
                        </div>
                    </div>
                    <PortfolioPreview application={application} />
                </div>
            )}
        </div>
    );
};

export default ApplicationDetails;
