import React from 'react';
import { UserProfile } from '../../../types';
import { Mail, Phone, MapPin, Github, Linkedin, ExternalLink, Download } from 'lucide-react';
import { ensureAbsoluteUrl } from '../../../services/urlUtils';

import { WebThemeProps } from './index';

/**
 * ATS Web Theme — Clean, professional, content-forward portfolio.
 *
 * Design philosophy:
 * - Minimal decorative elements — content is the hero
 * - Navy & slate color palette for professionalism
 * - High readability, clear hierarchy
 * - No glassmorphism or complex animations to maintain focus on substance
 */
const ATSWebTheme: React.FC<WebThemeProps> = ({ data, onDownloadResume, isPreview }) => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Inter',system-ui,sans-serif] selection:bg-blue-600 selection:text-white">

            {/* ── Hero / Header ── */}
            <header className="bg-slate-900 dark:bg-slate-950 text-white pt-20 pb-14 px-6 border-b border-slate-800">
                <div className="max-w-3xl mx-auto text-center">
                    {/* Avatar */}
                    {data.profilePhotoUrl ? (
                        <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-2 border-slate-700 shadow-lg">
                            <img src={data.profilePhotoUrl} alt={data.fullName} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-blue-700 flex items-center justify-center mx-auto mb-6 border-2 border-blue-600 shadow-lg">
                            <span className="text-3xl font-bold text-white uppercase">{data.fullName.charAt(0)}</span>
                        </div>
                    )}

                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{data.fullName}</h1>
                    <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed mb-6">{data.summary}</p>

                    {/* Contact strip */}
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400 mb-6">
                        {data.location && (
                            <span className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-slate-500" />
                                {data.location}
                            </span>
                        )}
                        {data.email && (
                            <a href={`mailto:${data.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                                <Mail size={14} className="text-slate-500" />
                                {data.email}
                            </a>
                        )}
                        {data.phone && (
                            <a href={`tel:${data.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                                <Phone size={14} className="text-slate-500" />
                                {data.phone}
                            </a>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={onDownloadResume}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm shadow-md transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            <Download size={16} />
                            Download Resume
                        </button>
                        {data.links?.map((link, idx) => {
                            const Icon = link.platform.toLowerCase() === 'github' ? Github :
                                link.platform.toLowerCase() === 'linkedin' ? Linkedin : ExternalLink;
                            return (
                                <a
                                    key={idx}
                                    href={ensureAbsoluteUrl(link.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                                    aria-label={link.platform}
                                >
                                    <Icon size={18} />
                                </a>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* ── Main Content ── */}
            <main className="max-w-3xl mx-auto px-6 py-16 space-y-14">

                {/* Skills */}
                {data.skills && data.skills.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 border-b-2 border-slate-200 dark:border-slate-800 pb-2 mb-5">
                            Core Competencies
                        </h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {data.skills.join('  •  ')}
                        </p>
                    </section>
                )}

                {/* Experience */}
                {data.experience && data.experience.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 border-b-2 border-slate-200 dark:border-slate-800 pb-2 mb-5">
                            Professional Experience
                        </h2>
                        <div className="space-y-8">
                            {data.experience.map((exp, idx) => (
                                <div key={idx}>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{exp.role}</h3>
                                        <span className="text-sm text-slate-500">{exp.startDate} - {exp.endDate}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-3 font-medium">{exp.company}</p>
                                    <ul className="space-y-1.5">
                                        {exp.description?.map((bullet, bIdx) => (
                                            <li key={bIdx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed">
                                                <span className="text-slate-400 mt-0.5 select-none">–</span>
                                                <span>{bullet}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Featured Projects */}
                {data.githubProjects && data.githubProjects.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 border-b-2 border-slate-200 dark:border-slate-800 pb-2 mb-5">
                            Projects
                        </h2>
                        <div className="space-y-4">
                            {data.githubProjects.map((repo) => (
                                <a
                                    key={repo.id}
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-5 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 transition-colors group"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {repo.name}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{repo.description || 'No description provided.'}</p>
                                        </div>
                                        <ExternalLink size={16} className="text-slate-400 group-hover:text-blue-500 shrink-0 mt-1 transition-colors" />
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
                                        {repo.language && (
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-slate-400" />
                                                {repo.language}
                                            </span>
                                        )}
                                        <span>{repo.stargazers_count} stars</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {data.education && data.education.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 border-b-2 border-slate-200 dark:border-slate-800 pb-2 mb-5">
                            Education
                        </h2>
                        <div className="space-y-3">
                            {data.education.map((edu, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                                    <div>
                                        <span className="font-bold text-slate-900 dark:text-slate-100">{edu.institution}</span>
                                        <span className="text-slate-500 ml-2">{edu.degree}</span>
                                    </div>
                                    <span className="text-sm text-slate-500">{edu.year}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* ── Footer ── */}
            <footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-slate-500 text-sm">
                    &copy; {new Date().getFullYear()} {data.fullName}. All rights reserved.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                    {data.links?.map((link, idx) => {
                        const Icon = link.platform.toLowerCase() === 'github' ? Github :
                            link.platform.toLowerCase() === 'linkedin' ? Linkedin : ExternalLink;
                        return (
                            <a key={idx} href={ensureAbsoluteUrl(link.url)} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <Icon size={18} />
                            </a>
                        );
                    })}
                </div>
            </footer>
        </div>
    );
};

export default ATSWebTheme;
