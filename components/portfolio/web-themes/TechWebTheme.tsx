import React from 'react';
import { Mail, Phone, MapPin, Github, Linkedin, ExternalLink, Download, Terminal, Code2, Cpu, Database, Star } from 'lucide-react';
import { ensureAbsoluteUrl } from '../../../services/urlUtils';

import { WebThemeProps } from './index';

const TechWebTheme: React.FC<WebThemeProps> = ({ data, onDownloadResume, isPreview }) => {
    return (
        <div className={`min-h-screen bg-[#0a0a0b] text-emerald-500 font-['Space_Mono',monospace] selection:bg-emerald-500 selection:text-black transition-colors ${isPreview ? 'relative overflow-hidden' : ''}`}>
            {/* Scanline Effect */}
            <div className={`${isPreview ? 'absolute' : 'fixed'} inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-size-[100%_4px,3px_100%]`} />

            {/* Mobile Header - Visible below lg */}
            <header className={`lg:hidden ${isPreview ? 'absolute' : 'fixed'} top-0 left-0 right-0 z-40 bg-[#0d0d0e] border-b border-emerald-900/30 px-4 sm:px-6 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-[#0a0a0b]">
                        <Terminal size={20} />
                    </div>
                    <span className="text-white font-bold text-sm truncate max-w-[120px] sm:max-w-[180px]">{data.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                    {data.links?.map((link, idx) => {
                        const Icon = link.platform.toLowerCase() === 'github' ? Github :
                            link.platform.toLowerCase() === 'linkedin' ? Linkedin : ExternalLink;
                        return (
                            <a key={idx} href={ensureAbsoluteUrl(link.url)} target="_blank" rel="noopener noreferrer" className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-emerald-700 hover:text-emerald-500 transition-colors">
                                <Icon size={18} />
                            </a>
                        );
                    })}
                    <button onClick={onDownloadResume} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-emerald-700 hover:text-emerald-500 transition-colors" title="Download Resume">
                        <Download size={18} />
                    </button>
                </div>
            </header>

            {/* Sidebar Navigation - Desktop only */}
            <nav className={`${isPreview ? 'absolute' : 'fixed'} left-0 top-0 h-full w-20 border-r border-emerald-900/30 bg-[#0d0d0e] hidden lg:flex flex-col items-center py-8 gap-8 z-40`}>
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center text-[#0a0a0b]">
                    <Terminal size={24} />
                </div>
                <div className="flex-1 flex flex-col gap-6">
                    {data.links?.map((link, idx) => {
                        const Icon = link.platform.toLowerCase() === 'github' ? Github :
                            link.platform.toLowerCase() === 'linkedin' ? Linkedin : ExternalLink;
                        return (
                            <a key={idx} href={ensureAbsoluteUrl(link.url)} target="_blank" rel="noopener noreferrer" className="p-3 text-emerald-900 hover:text-emerald-500 transition-colors">
                                <Icon size={20} />
                            </a>
                        );
                    })}
                </div>
                <button
                    onClick={onDownloadResume}
                    className="p-3 text-emerald-900 hover:text-emerald-500 transition-colors"
                    title="Download Data Packet"
                >
                    <Download size={20} />
                </button>
            </nav>

            <main className="lg:ml-20 pt-20 lg:pt-0 p-6 md:p-12 lg:p-24 max-w-7xl mx-auto space-y-16 sm:space-y-24 lg:space-y-32">
                {/* Hero / Terminal Prompt */}
                <section className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
                    <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs uppercase tracking-tighter">
                        User Profile Loaded: v1.0.4
                    </div>

                    <div className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto] gap-x-4 gap-y-6 md:gap-12 items-start">
                        <h1 className="col-span-1 text-2xl sm:text-4xl md:text-7xl font-bold tracking-tighter text-white break-words">
                            <span className="text-emerald-500 font-light">$ whoami</span><br />
                            {data.fullName}
                        </h1>

                        {data.profilePhotoUrl && (
                            <div className="col-span-1 row-span-1 md:row-span-2 shrink-0 relative group">
                                <div className="absolute -inset-4 bg-emerald-500/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-64 md:h-64 rounded-2xl border-2 border-emerald-500/30 overflow-hidden grayscale-0 md:grayscale contrast-125 brightness-100 md:brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500">
                                    <img src={data.profilePhotoUrl} alt={data.fullName} className="w-full h-full object-cover" />
                                    {/* Grid Overlay */}
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-size-[20px_20px]" />
                                </div>
                            </div>
                        )}

                        <div className="col-span-2 md:col-span-1 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 text-[8px] opacity-20 group-hover:opacity-40 transition-opacity">
                                [SYSTEM_RECAP]
                            </div>
                            <p className="text-lg md:text-xl leading-relaxed text-emerald-400/80">
                                {data.summary}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Core Skills - Hardware/Software metaphor */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-white">
                            <Code2 size={24} className="text-emerald-500" />
                            <h2 className="text-2xl font-bold uppercase tracking-widest">Tech Stack</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {data.skills?.map((skill, idx) => (
                                <div key={idx} className="px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded text-sm hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all cursor-default flex items-center gap-2 group">
                                    <div className="w-1.5 h-1.5 bg-emerald-900 group-hover:bg-emerald-500 rounded-full transition-colors" />
                                    {skill}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 text-white">
                            <Database size={24} className="text-emerald-500" />
                            <h2 className="text-2xl font-bold uppercase tracking-widest">Connect</h2>
                        </div>
                        <div className="space-y-3">
                            <a href={`mailto:${data.email}`} className="flex items-center gap-4 p-4 bg-[#0d0d0e] border border-emerald-900/20 rounded-lg group hover:border-emerald-500/30 transition-colors">
                                <Mail size={18} className="text-emerald-700 group-hover:text-emerald-500 transition-colors" />
                                <span className="text-xs text-emerald-900 group-hover:text-emerald-700 uppercase">Email:</span>
                                <span className="text-sm truncate text-emerald-400">{data.email}</span>
                            </a>
                            <a href={`tel:${data.phone}`} className="flex items-center gap-4 p-4 bg-[#0d0d0e] border border-emerald-900/20 rounded-lg group hover:border-emerald-500/30 transition-colors">
                                <Phone size={18} className="text-emerald-700 group-hover:text-emerald-500 transition-colors" />
                                <span className="text-xs text-emerald-900 group-hover:text-emerald-700 uppercase">Call:</span>
                                <span className="text-sm truncate text-emerald-400">{data.phone}</span>
                            </a>
                            <div className="flex items-center gap-4 p-4 bg-[#0d0d0e] border border-emerald-900/20 rounded-lg group hover:border-emerald-500/30 transition-colors">
                                <MapPin size={18} className="text-emerald-700 group-hover:text-emerald-500 transition-colors" />
                                <span className="text-xs text-emerald-900 group-hover:text-emerald-700 uppercase">Geo:</span>
                                <span className="text-sm truncate text-emerald-400">{data.location}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Open Source / Projects */}
                {data.githubProjects && data.githubProjects.length > 0 && (
                    <section className="space-y-8">
                        <div className="flex items-center gap-4 text-white">
                            <Github size={24} className="text-emerald-500" />
                            <h2 className="text-2xl font-bold uppercase tracking-widest">Open Source</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.githubProjects.map((repo) => (
                                <a
                                    key={repo.id}
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-6 bg-[#0d0d0e] border border-emerald-900/20 rounded-xl group hover:border-emerald-500/50 transition-all hover:translate-x-1"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <Github size={18} className="text-emerald-600 group-hover:text-emerald-500 transition-colors" />
                                            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{repo.name}</h3>
                                        </div>
                                        <ExternalLink size={16} className="text-emerald-800 group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                    <p className="text-emerald-500/60 text-sm mb-4 line-clamp-10 leading-relaxed">
                                        {repo.description || 'No description provided.'}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-emerald-800 font-mono">
                                        {repo.language && (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-700" />
                                                {repo.language}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Star size={12} />
                                            {repo.stargazers_count}
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>
                )}

                {/* Experience Log */}
                <section className="space-y-12">
                    <div className="flex items-center gap-4">
                        <Cpu size={24} className="text-emerald-500" />
                        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Work Log</h2>
                        <div className="h-px flex-1 bg-emerald-900/30" />
                    </div>

                    <div className="border-l border-emerald-900/30 ml-2 sm:ml-4 space-y-10 sm:space-y-16">
                        {data.experience?.map((exp, idx) => (
                            <div key={idx} className="relative pl-6 sm:pl-12 group">
                                <div className="absolute left-[-5px] top-2 w-2 h-2 bg-[#0a0a0b] border border-emerald-500 rounded-full group-hover:bg-emerald-500 transition-colors" />
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2">
                                        <h3 className="text-2xl font-bold text-white tracking-tight">{exp.role}</h3>
                                        <span className="text-sm text-emerald-900">{exp.startDate} / {exp.endDate}</span>
                                    </div>
                                    <div className="text-emerald-600 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                                        @ {exp.company}
                                        <div className="h-px w-8 bg-emerald-900/50" />
                                    </div>
                                    <div className="p-4 sm:p-6 bg-[#0d0d0e] border border-emerald-900/20 rounded-xl group-hover:border-emerald-500/20 transition-colors">
                                        <ul className="grid grid-cols-1 gap-4">
                                            {exp.description?.map((bullet, bIdx) => (
                                                <li key={bIdx} className="text-sm leading-relaxed text-emerald-500/70 before:content-['>_'] before:text-emerald-700">
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <footer className="pt-16 sm:pt-32 pb-12 border-t border-emerald-900/20 text-center opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-xs tracking-[0.3em] uppercase">SYSTEM.HALT – {new Date().getFullYear()} – {data.fullName}</p>
                    <div className="mt-4 flex justify-center gap-2">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                        <span className="text-[10px] text-emerald-700">STATUS: ONLINE</span>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default TechWebTheme;
