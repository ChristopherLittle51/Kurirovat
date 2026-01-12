import React from 'react';
import { TailoredApplication } from '../types';
import { ExternalLink, CheckCircle, Target, FileText, ChevronRight, Search } from 'lucide-react';

interface Props {
  application: TailoredApplication;
}

const PortfolioPreview: React.FC<Props> = ({ application }) => {
  const { resume, jobDescription, coverLetter, matchScore, keyKeywords, searchSources } = application;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-16 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-blue-200 font-medium mb-2 tracking-wide uppercase text-sm">Application for {jobDescription.companyName}</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{resume.fullName}</h1>
          <p className="text-xl md:text-2xl font-light text-blue-100 max-w-2xl">
            {resume.summary}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="md:col-span-2 space-y-12">
          
          {/* Why Me? (Cover Letter Extract) */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="text-blue-500" />
              My Proposal
            </h2>
            <div className="prose prose-blue text-gray-600 whitespace-pre-line">
              {coverLetter}
            </div>
          </section>

          {/* Relevant Experience */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Target className="text-blue-500" />
              Relevant Experience
            </h2>
            <div className="space-y-6">
              {resume.experience.slice(0, 3).map((exp, idx) => (
                <div key={exp.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900">{exp.role}</h3>
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">{exp.startDate} - {exp.endDate}</span>
                  </div>
                  <div className="text-blue-600 font-medium mb-3">{exp.company}</div>
                  <ul className="space-y-2">
                    {(exp.description || []).slice(0, 3).map((point, i) => (
                      <li key={i} className="text-gray-600 text-sm flex items-start gap-2">
                        <ChevronRight size={16} className="text-blue-400 mt-1 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          
          {/* Match Score Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Role Fit</h3>
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200" />
                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-green-500" 
                  strokeDasharray={377} strokeDashoffset={377 - (377 * matchScore) / 100} strokeLinecap="round" />
              </svg>
              <span className="absolute text-3xl font-bold text-gray-800">{matchScore}%</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">AI-Generated Match Confidence</p>
          </div>

          {/* Key Keywords */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Key Alignments</h3>
            <div className="space-y-3">
              {keyKeywords.map((kw, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-500 shrink-0" />
                  <span className="text-gray-700 font-medium text-sm capitalize">{kw}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Research Sources */}
          {searchSources && searchSources.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Search size={14} /> AI Research
              </h3>
              <div className="space-y-3">
                <p className="text-xs text-gray-400 mb-2">
                  Content grounded in the following real-time sources:
                </p>
                {searchSources.map((source, i) => (
                  <a 
                    key={i} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 hover:underline truncate"
                    title={source.title}
                  >
                    {source.title || source.uri}
                  </a>
                ))}
              </div>
            </div>
          )}

           {/* Contact */}
           <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg text-white">
            <h3 className="font-bold text-lg mb-4">Let's Connect</h3>
            <div className="space-y-3 text-sm">
              <div className="opacity-90">{resume.email}</div>
              <div className="opacity-90">{resume.phone}</div>
              {resume.links.map((link, i) => (
                 <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-300 hover:text-blue-100 transition-colors">
                   {link.platform} <ExternalLink size={14} />
                 </a>
              ))}
            </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default PortfolioPreview;
