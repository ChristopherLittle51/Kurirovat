import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { JobDescription } from '../types';

import { GithubProject } from '../types';

interface Props {
  onGenerate: (jd: JobDescription, projects: any[], showScore: boolean) => void;
  isLoading: boolean;
  availableGithubProjects?: GithubProject[];
}

const Generator: React.FC<Props> = ({ onGenerate, isLoading, availableGithubProjects = [] }) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [showMatchScore, setShowMatchScore] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company && role && description) {
      const projects = availableGithubProjects.filter(p => selectedProjects.includes(p.id));
      onGenerate({
        companyName: company,
        roleTitle: role,
        rawText: description
      }, projects, showMatchScore);
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
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="text-blue-600" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Application</h1>
        <p className="text-gray-600 mt-2">Paste the job description below, and we'll tailor your resume for it.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="e.g. Google"
              value={company}
              onChange={e => setCompany(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Title</label>
            <input required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="e.g. Senior Frontend Engineer"
              value={role}
              onChange={e => setRole(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
          <textarea required className="w-full border border-gray-300 p-3 rounded-lg h-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono text-sm"
            placeholder="Paste the full job description here..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        {/* Configuration Section */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Portfolio Options</h3>

          {/* GitHub Projects */}
          {availableGithubProjects.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Featured GitHub Projects (Max 3)</label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {availableGithubProjects.map(repo => (
                  <div key={repo.id}
                    onClick={() => toggleProject(repo.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between
                                    ${selectedProjects.includes(repo.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                                `}
                  >
                    <div className="overflow-hidden">
                      <div className="font-bold text-gray-800 truncate">{repo.name}</div>
                      <div className="text-xs text-gray-500 truncate">{repo.description || "No description"}</div>
                    </div>
                    {selectedProjects.includes(repo.id) && <div className="text-blue-600">✓</div>}
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
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
            />
            <label htmlFor="showScore" className="text-sm text-gray-700 select-none cursor-pointer">
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
