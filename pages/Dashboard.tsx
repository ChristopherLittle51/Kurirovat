import React, { useEffect, useState } from 'react';
import { TailoredApplication, ApplicationStatus } from '../types';
import * as SupabaseService from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash, Loader2, ChevronDown, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
    'Pending': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    'Sent': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    'Replied': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    'Interview Scheduled': 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
    'Rejected': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState<TailoredApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            loadApplications();
        }
    }, [user]);

    const loadApplications = async () => {
        if (!user) return;
        setLoading(true);
        const apps = await SupabaseService.getApplications(user.id);
        setApplications(apps);
        setLoading(false);
    };

    const handleStatusChange = async (id: string, newStatus: ApplicationStatus, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click

        try {
            await SupabaseService.updateApplicationStatus(id, newStatus);
            setApplications(prev => prev.map(app =>
                app.id === id ? { ...app, status: newStatus } : app
            ));
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this application?")) {
            try {
                await SupabaseService.deleteApplication(id);
                setApplications(prev => prev.filter(a => a.id !== id));
            } catch (error) {
                alert("Failed to delete application");
            }
        }
    }

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Application Dashboard</h2>
                <Link to="/admin/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 dark:shadow-none">
                    <Plus size={20} /> New Application
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Applications</div>
                    <div className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{applications.length}</div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg Match Score</div>
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                        {applications.length > 0
                            ? Math.round(applications.reduce((acc, curr) => acc + curr.matchScore, 0) / applications.length)
                            : 0}%
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">Interview Rate</div>
                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                        {applications.length > 0
                            ? Math.round((applications.filter(a => a.status === 'Interview Scheduled').length / applications.length) * 100)
                            : 0}%
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">History</h3>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors">
                {applications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">No applications yet. Start by creating a new one!</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Company</th>
                                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Role</th>
                                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Status</th>
                                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Date</th>
                                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Score</th>
                                    <th className="px-6 py-4 text-right font-medium text-gray-500 dark:text-gray-400 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {applications.map(app => (
                                    <tr key={app.id} onClick={() => navigate(`/admin/application/${app.id}`)} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white transition-colors">{app.jobDescription.companyName}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 transition-colors">{app.jobDescription.roleTitle}</td>
                                        <td className="px-6 py-4">
                                            <div className="relative group" onClick={e => e.stopPropagation()}>
                                                <select
                                                    value={app.status || 'Pending'}
                                                    onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus, e as any)}
                                                    className={`appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-xs font-bold border-0 focus:ring-2 focus:ring-blue-500 ${STATUS_COLORS[app.status || 'Pending'] || 'bg-gray-100'}`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Sent">Sent</option>
                                                    <option value="Replied">Replied</option>
                                                    <option value="Interview Scheduled">Interview</option>
                                                    <option value="Rejected">Rejected</option>
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50 dark:text-white" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm transition-colors">{new Date(app.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4"><span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-bold px-2 py-1 rounded-full">{app.matchScore}%</span></td>
                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            <a
                                                href={`/p/${app.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 transition-colors"
                                                title="View Public Portfolio"
                                            >
                                                <Globe size={16} />
                                            </a>
                                            <button onClick={(e) => handleDelete(app.id, e)} className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 p-2 transition-colors" title="Delete Application"><Trash size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
