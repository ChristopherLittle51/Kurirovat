import React from 'react';
import Onboarding from '../components/Onboarding';
import { UserProfile } from '../types';
import * as SupabaseService from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const OnboardingPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [initialData, setInitialData] = React.useState<UserProfile | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadProfile = async () => {
            if (!user) return;
            const profile = await SupabaseService.getProfile(user.id);
            if (profile && profile.fullName) {
                setInitialData(profile);
            }
            setLoading(false);
        };
        loadProfile();
    }, [user]);

    const handleComplete = async (profile: UserProfile) => {
        if (!user) return;
        try {
            await SupabaseService.saveProfile(user.id, profile);
            navigate('/');
        } catch (error) {
            alert("Failed to save profile. Please try again.");
        }
    };

    if (loading) return <div>Loading...</div>; // Simplification, maybe improved UI later

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors">
            <div className="p-4 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 transition-colors">
                <div className="max-w-7xl mx-auto flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
                    <span className="font-bold text-xl text-gray-900 dark:text-white">Kurirovat</span>
                </div>
            </div>
            <Onboarding onComplete={handleComplete} initialData={initialData} />
        </div>
    );
};

export default OnboardingPage;
