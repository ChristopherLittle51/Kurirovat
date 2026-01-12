import React, { useState } from 'react';
import Generator from '../components/Generator';
import { JobDescription, TailoredApplication } from '../types';
import * as GeminiService from '../services/geminiService';
import * as SupabaseService from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const GeneratorPage: React.FC = () => {
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const navigate = useNavigate();

    const handleGenerate = async (jd: JobDescription) => {
        if (!user) return;
        setIsGenerating(true);

        try {
            // Fetch current profile to ensure we use the latest data
            const profile = await SupabaseService.getProfile(user.id);
            if (!profile) {
                alert("Profile not found. Please complete onboarding.");
                navigate('/onboarding');
                return;
            }

            const result = await GeminiService.tailorResume(profile, jd);

            const newApp: TailoredApplication = {
                id: '', // Will be assigned by DB or ignored by insert, but we need it for local type. 
                // Better to match the type expected by saveApplication or let DB handle ID. 
                // Type definition says id is string.
                // Supabase service doesn't need ID for insert.
                createdAt: Date.now(),
                jobDescription: jd,
                resume: result.resume!,
                coverLetter: result.coverLetter || '',
                matchScore: result.matchScore || 0,
                keyKeywords: result.keyKeywords || [],
                searchSources: result.searchSources || []
            };

            await SupabaseService.saveApplication(user.id, newApp);

            navigate('/'); // Go back to dashboard or to the view page. 
            // Ideally we navigate to the view page of the created app, but we need the ID.
            // For now, simpler to go to Dashboard.
        } catch (e) {
            console.error(e);
            alert("Error generating resume. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 max-w-5xl mx-auto">New Application</h2>
            <Generator onGenerate={handleGenerate} isLoading={isGenerating} />
        </div>
    );
};

export default GeneratorPage;
