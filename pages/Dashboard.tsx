import React, { useEffect, useState } from 'react';
import { TailoredApplication } from '../types';
import * as SupabaseService from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation if button is inside link
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
        <div className="max-w-5xl mx-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">Application Dashboard</h2>
                <Link to="/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
                    <Plus size={20} /> New Application
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-gray-500 text-sm font-medium">Total Applications</div>
                    <div className="text-4xl font-bold text-gray-900 mt-2">{applications.length}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-gray-500 text-sm font-medium">Avg Match Score</div>
                    <div className="text-4xl font-bold text-blue-600 mt-2">
                        {applications.length > 0
                            ? Math.round(applications.reduce((acc, curr) => acc + curr.matchScore, 0) / applications.length)
                            : 0}%
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-4">History</h3>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {applications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No applications yet. Start by creating a new one!</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Company</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Role</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Date</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-sm">Score</th>
                                <th className="px-6 py-4 text-right font-medium text-gray-500 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {applications.map(app => (
                                <tr key={app.id} onClick={() => navigate(`/application/${app.id}`)} className="hover:bg-gray-50 cursor-pointer transition">
                                    <td className="px-6 py-4 font-medium text-gray-900">{app.jobDescription.companyName}</td>
                                    <td className="px-6 py-4 text-gray-600">{app.jobDescription.roleTitle}</td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">{new Date(app.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4"><span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{app.matchScore}%</span></td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={(e) => handleDelete(app.id, e)} className="text-gray-400 hover:text-red-600 p-2"><Trash size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
