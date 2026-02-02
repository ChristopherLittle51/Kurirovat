import React from 'react';
import { UserProfile } from '../../../types';
import { Mail, Phone, MapPin, Github, Linkedin, ExternalLink, Download } from 'lucide-react';
import { ensureAbsoluteUrl } from '../../../services/urlUtils';

import { WebThemeProps } from './index';

const ModernWebTheme: React.FC<WebThemeProps> = ({ data, onDownloadResume, isPreview }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
            {/* Header / Hero */}
            <header className="relative pt-24 pb-16 px-6 overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
                    {/* Avatar */}
                    {data.profilePhotoUrl ? (
                        <div className="w-48 h-48 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 rotate-3">
                            <img src={data.profilePhotoUrl} alt={data.fullName} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl rotate-3">
                            <span className="text-7xl font-bold text-white uppercase">{data.fullName.charAt(0)}</span>
                        </div>
                    )}

                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
                            {data.fullName}
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                            {data.summary}
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8">
                            <button
                                onClick={onDownloadResume}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95"
                            >
                                <Download size={20} />
                                Download Resume
                            </button>
                            <div className="flex items-center gap-2">
                                {data.links?.map((link, idx) => {
                                    const Icon = link.platform.toLowerCase() === 'github' ? Github :
                                        link.platform.toLowerCase() === 'linkedin' ? Linkedin : ExternalLink;
                                    return (
                                        <a
                                            key={idx}
                                            href={ensureAbsoluteUrl(link.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <Icon size={24} />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Shapes */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-20 space-y-24">
                {/* Contact Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.02]">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Mail size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Email</p>
                            <a href={`mailto:${data.email}`} className="font-medium hover:text-blue-600 transition-colors">{data.email}</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.02]">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Phone size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone</p>
                            <p className="font-medium">{data.phone}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:scale-[1.02]">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Location</p>
                            <p className="font-medium">{data.location}</p>
                        </div>
                    </div>
                </section>

                {/* Experience */}
                <section>
                    <div className="flex items-center gap-4 mb-12">
                        <h2 className="text-3xl font-black">Experience</h2>
                        <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className="space-y-12">
                        {data.experience?.map((exp, idx) => (
                            <div key={idx} className="group flex flex-col md:flex-row gap-8 relative">
                                <div className="md:w-1/4">
                                    <div className="sticky top-24">
                                        <p className="text-lg font-bold text-slate-400 group-hover:text-blue-500 transition-colors">{exp.startDate} — {exp.endDate}</p>
                                        <p className="text-sm font-bold uppercase tracking-widest text-slate-500 mt-1">{exp.company}</p>
                                    </div>
                                </div>
                                <div className="md:w-3/4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl group-hover:-translate-y-1">
                                    <h3 className="text-2xl font-bold mb-4">{exp.role}</h3>
                                    <ul className="space-y-3">
                                        {exp.description?.map((bullet, bIdx) => (
                                            <li key={bIdx} className="flex items-start gap-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Skills */}
                <section className="bg-slate-900 text-white rounded-[3rem] p-12 md:p-16 overflow-hidden relative">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black mb-12 text-center md:text-left">Skills & Expertise</h2>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            {data.skills?.map((skill, idx) => (
                                <span key={idx} className="px-6 py-3 bg-slate-800 border border-slate-700 rounded-2xl font-medium hover:bg-slate-700 transition-colors">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
                </section>

                {/* Education */}
                <section>
                    <div className="flex items-center gap-4 mb-12">
                        <h2 className="text-3xl font-black">Education</h2>
                        <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {data.education?.map((edu, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-sm font-bold text-blue-500 mb-1">{edu.year}</p>
                                <h3 className="text-xl font-bold mb-2">{edu.institution}</h3>
                                <p className="text-slate-600 dark:text-slate-400">{edu.degree}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-slate-500 font-medium">
                    &copy; {new Date().getFullYear()} {data.fullName}. All rights reserved.
                </p>
                <div className="mt-8 flex justify-center gap-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all">
                    {/* Re-use icons for footer */}
                    {data.links?.map((link, idx) => {
                        const Icon = link.platform.toLowerCase() === 'github' ? Github :
                            link.platform.toLowerCase() === 'linkedin' ? Linkedin : ExternalLink;
                        return (
                            <a key={idx} href={ensureAbsoluteUrl(link.url)} target="_blank" rel="noopener noreferrer">
                                <Icon size={20} />
                            </a>
                        );
                    })}
                </div>
            </footer>
        </div>
    );
};

export default ModernWebTheme;
