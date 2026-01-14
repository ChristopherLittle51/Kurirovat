import React, { useEffect, useState } from 'react';
import { TailoredApplication } from '../types';
import { ExternalLink, CheckCircle, Target, FileText, ChevronRight, Search } from 'lucide-react';
import InlineEdit from './InlineEdit';

interface Props {
  application: TailoredApplication;
  onUpdate?: (updates: Partial<TailoredApplication>) => void;
}

const PortfolioPreview: React.FC<Props> = ({ application, onUpdate }) => {
  const [localApp, setLocalApp] = useState(application);

  useEffect(() => {
    setLocalApp(application);
  }, [application]);

  const { resume, jobDescription, coverLetter, matchScore, keyKeywords, searchSources, githubProjects, showMatchScore } = localApp;

  const handleUpdate = (field: keyof TailoredApplication, value: any) => {
    const updatedApp = { ...localApp, [field]: value };
    setLocalApp(updatedApp);
    if (onUpdate) {
      onUpdate({ [field]: value });
    }
  };

  const isEditable = !!onUpdate;

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-12">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-12 md:py-16 px-4 md:px-8 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="text-blue-200 font-medium mb-3 tracking-wide uppercase text-xs md:text-sm">
            Application for <span className="text-white">{jobDescription.companyName}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">{resume.fullName}</h1>
          <div className="text-lg md:text-2xl font-light text-blue-100 max-w-3xl leading-relaxed">
            {/* We are only editing the "cover letter / summary" part here mostly, but let's allow direct summary edit if needed */}
            {resume.summary}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8 md:space-y-12">

          {/* Why Me? (Cover Letter Extract / Proposal) */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2">
              <FileText className="text-blue-500" />
              My Proposal
            </h2>
            <div className="prose prose-blue prose-sm md:prose-base text-gray-600 whitespace-pre-line max-w-none">
              {isEditable ?
                <InlineEdit
                  value={coverLetter}
                  onChange={(v) => handleUpdate('coverLetter', v)}
                  multiline
                  className="leading-7"
                />
                : coverLetter}
            </div>
          </section>

          {/* Featured GitHub Projects */}
          {githubProjects && githubProjects.length > 0 && (
            <section className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <CheckCircle className="text-blue-500" />
                Featured Projects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {githubProjects.map((project: any) => (
                  <a
                    key={project.id}
                    href={project.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-5 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors break-words">{project.name}</h3>
                      {project.language && (
                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full shrink-0">
                          {project.language}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3 min-h-[3rem]">
                      {project.description || "No description provided."}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 gap-1 pb-1">
                      <span className="opacity-75">⭐ {project.stargazers_count} stars</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Relevant Experience */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Target className="text-blue-500" />
              Relevant Experience
            </h2>
            <div className="space-y-6">
              {/* Show all experience provided in the tailored resume (reordered by AI) */}
              {resume.experience.map((exp: any, idx: number) => (
                <div key={exp.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-80"></div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-1 md:gap-0">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">{exp.role}</h3>
                    <span className="text-xs md:text-sm font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded self-start md:self-auto whitespace-nowrap">
                      {exp.startDate} - {exp.endDate}
                    </span>
                  </div>
                  <div className="text-blue-600 font-medium mb-4">{exp.company}</div>
                  <ul className="space-y-3">
                    {(exp.description || []).map((point: string, i: number) => (
                      <li key={i} className="text-gray-600 text-sm md:text-base flex items-start gap-3">
                        <ChevronRight size={18} className="text-blue-400 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 md:space-y-8">

          {/* Match Score Card - Conditional */}
          {showMatchScore !== false && (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 text-center transition-all hover:shadow-md">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Role Fit Estimate</h3>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                  <circle
                    cx="60" cy="60" r="54"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className={`${matchScore > 80 ? 'text-green-500' : matchScore > 60 ? 'text-yellow-500' : 'text-orange-500'} transition-all duration-1000 ease-out`}
                    strokeDasharray={339}
                    strokeDashoffset={339 - (339 * matchScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl md:text-4xl font-bold text-gray-800">{matchScore}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 px-4 leading-relaxed">
                Estimated match based on job description analysis.
              </p>
            </div>
          )}

          {/* Key Keywords */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Key Alignments</h3>
            <div className="space-y-3">
              {keyKeywords.map((kw: string, i: number) => (
                <div key={i} className="flex items-center gap-3 group">
                  <CheckCircle size={18} className="text-green-500 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-gray-700 font-medium text-sm capitalize">{kw}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Research Sources */}
          {/* {searchSources && searchSources.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Search size={14} /> Market Research
              </h3>
              <div className="space-y-3">
                <p className="text-xs text-gray-400 mb-2">
                  Content grounded in the following real-time sources:
                </p>
                {searchSources.map((source: any, i: number) => (
                  <a
                    key={i}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-xs text-blue-600 hover:underline hover:text-blue-800 truncate transition-colors"
                    title={source.title}
                  >
                    {source.title || source.uri}
                  </a>
                ))}
              </div>
            </div>
          )} */}

          {/* Contact */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg text-white">
            <h3 className="font-bold text-lg mb-4">Let's Connect</h3>
            <div className="space-y-4 text-sm">
              <div className="opacity-90 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                {resume.email}
              </div>
              <div className="opacity-90 ml-3.5">{resume.phone}</div>

              <div className="pt-4 border-t border-gray-700 flex flex-wrap gap-3">
                {resume.links.map((link: any, i: number) => (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all text-xs font-medium">
                    {link.platform} <ExternalLink size={10} />
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PortfolioPreview;
