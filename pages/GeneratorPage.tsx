import React, { useState, useEffect } from 'react';
import Generator from '../components/Generator';
import { JobDescription, TailoredApplication, GithubProject } from '../types';
import * as GeminiService from '../services/geminiService';
import * as SupabaseService from '../services/supabaseService';
import * as GithubService from '../services/githubService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const GeneratorPage: React.FC = () => {
    const { user } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [githubRepos, setGithubRepos] = useState<GithubProject[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            loadGithubRepos();
        }
    }, [user]);

    const loadGithubRepos = async () => {
        if (!user) return;
        const profile = await SupabaseService.getProfile(user.id);
        if (profile?.githubUsername) {
            const repos = await GithubService.fetchGithubRepos(profile.githubUsername);
            setGithubRepos(repos);
        }
    };

    const handleGenerate = async (jd: JobDescription, projects: any[], showScore: boolean) => {
        if (!user) return;
        setIsGenerating(true);

        try {
            // Fetch current profile to ensure we use the latest data
            const profile = await SupabaseService.getProfile(user.id);
            if (!profile) {
                alert("Profile not found. Please complete onboarding.");
                navigate('/admin/onboarding');
                return;
            }

            const result = await GeminiService.tailorResume(profile, jd, projects, showScore);
            const { application } = result;

            const newApp: TailoredApplication = {
                id: '', // Handled by DB
                createdAt: Date.now(),
                jobDescription: jd,
                resume: application.resume!,
                coverLetter: application.coverLetter || '',
                matchScore: application.matchScore || 0,
                keyKeywords: application.keyKeywords || [],
                searchSources: application.searchSources || [],
                githubProjects: application.githubProjects,
                showMatchScore: application.showMatchScore
            };

            await SupabaseService.saveApplication(user.id, newApp);

            navigate('/admin/dashboard');
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
            <Generator
                onGenerate={handleGenerate}
                isLoading={isGenerating}
                availableGithubProjects={githubRepos}
            />
        </div>
    );
};

export default GeneratorPage;
