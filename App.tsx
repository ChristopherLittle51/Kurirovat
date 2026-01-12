import React, { useState, useEffect } from 'react';
import { UserProfile, TailoredApplication, ViewState, JobDescription } from './types';
import * as Storage from './services/storageService';
import * as GeminiService from './services/geminiService';
import Onboarding from './components/Onboarding';
import ResumeTemplate from './components/ResumeTemplate';
import PortfolioPreview from './components/PortfolioPreview';
import Generator from './components/Generator';
import { LayoutDashboard, FileText, Globe, Plus, LogOut, Printer, ChevronLeft, Trash } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('ONBOARDING');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<TailoredApplication[]>([]);
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const savedProfile = Storage.getProfile();
    const savedApps = Storage.getApplications();
    
    if (savedProfile) {
      setProfile(savedProfile);
      setApplications(savedApps);
      setView('DASHBOARD');
    } else {
      setView('ONBOARDING');
    }
  }, []);

  const handleProfileComplete = (newProfile: UserProfile) => {
    Storage.saveProfile(newProfile);
    setProfile(newProfile);
    setView('DASHBOARD');
  };

  const handleGenerate = async (jd: JobDescription) => {
    if (!profile) return;
    setIsGenerating(true);

    try {
      const result = await GeminiService.tailorResume(profile, jd);
      
      const newApp: TailoredApplication = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        jobDescription: jd,
        resume: result.resume!,
        coverLetter: result.coverLetter || '',
        matchScore: result.matchScore || 0,
        keyKeywords: result.keyKeywords || []
      };

      Storage.saveApplication(newApp);
      setApplications(prev => [newApp, ...prev]);
      setCurrentAppId(newApp.id);
      setView('VIEW_RESUME');
    } catch (e) {
      alert("Error generating resume. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("Are you sure you want to delete this application?")) {
        Storage.deleteApplication(id);
        setApplications(prev => prev.filter(a => a.id !== id));
        if (currentAppId === id) {
            setView('DASHBOARD');
            setCurrentAppId(null);
        }
    }
  }

  const currentApp = applications.find(a => a.id === currentAppId);

  // Print Logic
  const handlePrint = () => {
    window.print();
  };

  // Render Logic
  if (view === 'ONBOARDING') {
    return <Onboarding onComplete={handleProfileComplete} />;
  }

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
          <button onClick={() => setView('DASHBOARD')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'DASHBOARD' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setView('NEW_APPLICATION')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === 'NEW_APPLICATION' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            <Plus size={20} /> New Application
          </button>

          <div className="pt-6 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Applications</div>
          {applications.map(app => (
            <div key={app.id} 
              onClick={() => { setCurrentAppId(app.id); setView('VIEW_RESUME'); }}
              className={`group flex items-center justify-between px-4 py-2 text-sm text-gray-300 rounded hover:bg-gray-800 cursor-pointer ${currentAppId === app.id ? 'bg-gray-800 text-white' : ''}`}
            >
              <span className="truncate w-32">{app.jobDescription.companyName}</span>
              <span className="text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded">{app.matchScore}%</span>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">ME</div>
            <div className="flex-1 overflow-hidden">
                <div className="text-sm font-medium truncate">{profile?.fullName}</div>
                <div className="text-xs text-gray-500 truncate">{profile?.email}</div>
            </div>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-gray-500 hover:text-white" title="Reset Data">
                <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 print:ml-0 print:p-0">
        
        {view === 'DASHBOARD' && (
          <div className="max-w-5xl mx-auto">
             <h2 className="text-3xl font-bold text-gray-900 mb-6">Application Dashboard</h2>
             
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
                                 <tr key={app.id} onClick={() => { setCurrentAppId(app.id); setView('VIEW_RESUME'); }} className="hover:bg-gray-50 cursor-pointer transition">
                                     <td className="px-6 py-4 font-medium text-gray-900">{app.jobDescription.companyName}</td>
                                     <td className="px-6 py-4 text-gray-600">{app.jobDescription.roleTitle}</td>
                                     <td className="px-6 py-4 text-gray-500 text-sm">{new Date(app.createdAt).toLocaleDateString()}</td>
                                     <td className="px-6 py-4"><span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{app.matchScore}%</span></td>
                                     <td className="px-6 py-4 text-right">
                                         <button onClick={(e) => handleDelete(app.id, e)} className="text-gray-400 hover:text-red-600 p-2"><Trash size={16}/></button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 )}
             </div>
          </div>
        )}

        {view === 'NEW_APPLICATION' && (
          <Generator onGenerate={handleGenerate} isLoading={isGenerating} />
        )}

        {(view === 'VIEW_RESUME' || view === 'VIEW_PORTFOLIO') && currentApp && (
          <div className="max-w-[210mm] mx-auto print:max-w-none print:w-full">
            <div className="flex justify-between items-center mb-6 print:hidden">
              <div className="flex items-center gap-4">
                  <button onClick={() => setView('DASHBOARD')} className="p-2 hover:bg-gray-200 rounded-full"><ChevronLeft /></button>
                  <h2 className="text-2xl font-bold text-gray-900">{currentApp.jobDescription.companyName} Application</h2>
              </div>
              <div className="flex bg-white rounded-lg shadow-sm border p-1">
                <button 
                  onClick={() => setView('VIEW_RESUME')}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${view === 'VIEW_RESUME' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <FileText size={16} /> Resume
                </button>
                <button 
                  onClick={() => setView('VIEW_PORTFOLIO')}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition ${view === 'VIEW_PORTFOLIO' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Globe size={16} /> Web Portfolio
                </button>
              </div>
              <button onClick={handlePrint} className="bg-gray-900 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-700">
                <Printer size={16} /> Print / Save PDF
              </button>
            </div>

            {view === 'VIEW_RESUME' ? (
                <ResumeTemplate data={currentApp.resume} />
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
                           portfolio.com/{profile?.fullName.replace(' ', '').toLowerCase()}/{currentApp.jobDescription.companyName.toLowerCase()}
                        </div>
                    </div>
                    <PortfolioPreview application={currentApp} />
                </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
