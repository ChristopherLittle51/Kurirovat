import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { JobDescription } from '../types';

import { GithubProject } from '../types';

interface Props {
  onGenerate: (jd: JobDescription, projects: any[], showScore: boolean, options?: any) => void;
  isLoading: boolean;
  availableGithubProjects?: GithubProject[];
}

const Generator: React.FC<Props> = ({ onGenerate, isLoading, availableGithubProjects = [] }) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [showMatchScore, setShowMatchScore] = useState(true);

  // Generation Options
  const [tone, setTone] = useState('professional');
  const [conciseness, setConciseness] = useState('standard');
  const [focusSkill, setFocusSkill] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company && role && description) {
      const projects = availableGithubProjects.filter(p => selectedProjects.includes(p.id));
      onGenerate({
        companyName: company,
        roleTitle: role,
        rawText: description
      }, projects, showMatchScore, {
        tone,
        conciseness,
        focusSkill
      });
    }
  };

  const toggleProject = (id: number) => {
    if (selectedProjects.includes(id)) {
      setSelectedProjects(prev => prev.filter(p => p !== id));
    } else {
      if (selectedProjects.length >= 3) {
        alert("You can select up to 3 projects.");
        return;
      }
      setSelectedProjects(prev => [...prev, id]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="text-blue-600 dark:text-blue-400" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Application</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Paste the job description below, and we'll tailor your resume for it.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
            <input required className="w-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-900 text-gray-900 dark:text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="e.g. Google"
              value={company}
              onChange={e => setCompany(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role Title</label>
            <input required className="w-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-900 text-gray-900 dark:text-white p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="e.g. Senior Frontend Engineer"
              value={role}
              onChange={e => setRole(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Description</label>
          <textarea required className="w-full border border-gray-300 dark:border-gray-600 bg-transparent dark:bg-gray-900 text-gray-900 dark:text-white p-3 rounded-lg h-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
            placeholder="Paste the full job description here..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Configuration Section */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Application Options</h3>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
            </button>
          </div>

          {showAdvanced && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-6 space-y-4 animate-in fade-in slide-in-from-top-2 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Writing Tone</label>
                  <select
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-2 rounded-lg"
                  >
                    <option value="professional">Professional (Standard)</option>
                    <option value="enthusiastic">Enthusiastic & Energetic</option>
                    <option value="technical">Technical & Direct</option>
                    <option value="creative">Creative & Story-driven</option>
                    <option value="executive">Executive & Strategic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conciseness</label>
                  <select
                    value={conciseness}
                    onChange={e => setConciseness(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-2 rounded-lg"
                  >
                    <option value="standard">Standard (Balanced)</option>
                    <option value="concise">Concise (Dense & Direct)</option>
                    <option value="detailed">Detailed (Expanded context)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Focus Skill (Optional)</label>
                <input
                  value={focusSkill}
                  onChange={e => setFocusSkill(e.target.value)}
                  placeholder="e.g. React, Python, Project Management"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-2 rounded-lg"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">We'll prioritize achievements related to this skill.</p>
              </div>
            </div>
          )}

          {/* GitHub Projects */}
          {availableGithubProjects.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Featured GitHub Projects (Max 3)</label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                {availableGithubProjects.map(repo => (
                  <div key={repo.id}
                    onClick={() => toggleProject(repo.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between
                                    ${selectedProjects.includes(repo.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                                `}
                  >
                    <div className="overflow-hidden">
                      <div className={`font-bold truncate ${selectedProjects.includes(repo.id) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>{repo.name}</div>
                      <div className={`text-xs truncate ${selectedProjects.includes(repo.id) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>{repo.description || "No description"}</div>
                    </div>
                    {selectedProjects.includes(repo.id) && <div className="text-blue-600 dark:text-blue-400">✓</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Match Score Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showScore"
              checked={showMatchScore}
              onChange={e => setShowMatchScore(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
            <label htmlFor="showScore" className="text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer">
              Show "Role Fit Estimate" gauge on public portfolio?
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-white transition-all
            ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-xl'}
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" /> Analyzing & Generating...
            </>
          ) : (
            <>
              Generate Tailored Resume <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Generator;
