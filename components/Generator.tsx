import React, { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { JobDescription } from '../types';

interface Props {
  onGenerate: (jd: JobDescription) => void;
  isLoading: boolean;
}

const Generator: React.FC<Props> = ({ onGenerate, isLoading }) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company && role && description) {
      onGenerate({
        companyName: company,
        roleTitle: role,
        rawText: description
      });
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

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="grid grid-cols-2 gap-4">
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
