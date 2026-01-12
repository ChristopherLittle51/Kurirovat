import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as SupabaseService from '../services/supabaseService';
import { LayoutDashboard, Plus, LogOut, Loader2 } from 'lucide-react';
import { UserProfile, TailoredApplication } from '../types';

const Layout: React.FC = () => {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [recentApps, setRecentApps] = useState<TailoredApplication[]>([]);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        const p = await SupabaseService.getProfile(user.id);
        setProfile(p);

        // Check if profile exists, if not redirect to onboarding
        // However, if we are already safely in Layout, we assume check happens or we handle it here.
        // Let's handle it here gently.
        if (!p) {
            navigate('/onboarding');
            return;
        }

        const apps = await SupabaseService.getApplications(user.id);
        setRecentApps(apps.slice(0, 5)); // Top 5 recent
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    }

    if (!profile && user) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar Navigation - Hidden when printing */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full print:hidden">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">R</div>
                        ResuMatch
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <Link to="/" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link to="/new" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/new' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
                        <Plus size={20} /> New Application
                    </Link>

                    <div className="pt-6 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Applications</div>
                    {recentApps.map(app => (
                        <Link key={app.id}
                            to={`/application/${app.id}`}
                            className={`group flex items-center justify-between px-4 py-2 text-sm text-gray-300 rounded hover:bg-gray-800 cursor-pointer ${location.pathname === `/application/${app.id}` ? 'bg-gray-800 text-white' : ''}`}
                        >
                            <span className="truncate w-32">{app.jobDescription.companyName}</span>
                            <span className="text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded">{app.matchScore}%</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">ME</div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-sm font-medium truncate">{profile?.fullName}</div>
                            <div className="text-xs text-gray-500 truncate">{profile?.email}</div>
                        </div>
                        <button onClick={handleSignOut} className="text-gray-500 hover:text-white" title="Sign Out">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-64 print:ml-0">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
