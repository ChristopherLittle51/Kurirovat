import React from 'react';
import { UserProfile } from '../../../types';
import { Mail, Phone, MapPin, Github, Linkedin, ExternalLink, Download, Sparkles, Star } from 'lucide-react';
import { ensureAbsoluteUrl } from '../../../services/urlUtils';

import { WebThemeProps } from './index';

const CreativeWebTheme: React.FC<WebThemeProps> = ({ data, onDownloadResume, isPreview }) => {
    return (
        <div className={`min-h-screen bg-rose-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-serif selection:bg-rose-500 selection:text-white ${isPreview ? 'relative overflow-hidden' : ''}`}>
            {/* Nav / Floating buttons */}
            <div className={`${isPreview ? 'absolute' : 'fixed'} top-4 sm:top-8 right-4 sm:right-8 z-50`}>
                <button
                    onClick={onDownloadResume}
                    className="p-3 sm:p-4 min-w-[48px] min-h-[48px] bg-zinc-900 dark:bg-rose-500 text-white dark:text-zinc-900 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all group"
                    title="Download Resume"
                >
                    <Download size={20} className="sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
                </button>
            </div>

            {/* Hero Section */}
            <section className="min-h-screen flex flex-col justify-center px-6 md:px-20 py-20 relative overflow-hidden">
                <div className="max-w-6xl mx-auto relative z-10 w-full">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-rose-200 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-sm font-bold tracking-widest uppercase mb-8 animate-bounce">
                        <Sparkles size={14} />
                        Available for projects
                    </span>

                    <h1 className="text-5xl sm:text-7xl md:text-[10rem] font-black leading-[0.8] tracking-tighter mb-8 sm:mb-12 italic">
                        {data.fullName.split(' ').map((name, i) => (
                            <React.Fragment key={i}>
                                <span className={i === 0 ? "text-transparent stroke-rose-500 stroke-2" : "text-rose-600 dark:text-rose-500"}>
                                    {name}
                                </span>
                                <br />
                            </React.Fragment>
                        ))}
                    </h1>

                    <div className="flex flex-col md:flex-row items-end gap-12">
                        <p className="text-xl sm:text-2xl md:text-4xl text-zinc-600 dark:text-zinc-400 font-medium leading-tight max-w-3xl">
                            {data.summary}
                        </p>

                        {data.profilePhotoUrl && (
                            <div className="shrink-0 w-40 h-40 sm:w-64 sm:h-64 md:w-80 md:h-80 grayscale hover:grayscale-0 transition-all duration-700 rounded-full overflow-hidden border-4 sm:border-8 border-rose-200 dark:border-rose-900/20 shadow-2xl">
                                <img src={data.profilePhotoUrl} alt={data.fullName} className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Abstract Blobs */}
                <div className="absolute -top-20 -left-20 w-160 h-160 bg-rose-200/50 dark:bg-rose-900/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-1/2 -right-20 w-120 h-120 bg-orange-200/50 dark:bg-orange-900/10 rounded-full blur-[100px]" />
            </section>

            {/* Work */}
            <section className="px-4 sm:px-6 md:px-20 py-20 sm:py-40 bg-zinc-900 text-white rounded-4xl sm:rounded-4xl md:rounded-4xl mx-2 sm:mx-4 md:mx-8">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl sm:text-5xl md:text-8xl font-black mb-16 sm:mb-32 tracking-tighter">Selected<br /><span className="text-rose-500">Exp.</span></h2>

                    <div className="space-y-40">
                        {data.experience?.map((exp, idx) => (
                            <div key={idx} className="group grid grid-cols-1 md:grid-cols-12 gap-12 border-t border-zinc-800 pt-12">
                                <div className="md:col-span-4">
                                    <p className="text-rose-500 font-bold mb-4">{exp.startDate} — {exp.endDate}</p>
                                    <h3 className="text-3xl font-bold uppercase">{exp.company}</h3>
                                </div>
                                <div className="md:col-span-8">
                                    <h4 className="text-2xl sm:text-4xl md:text-6xl font-light mb-4 sm:mb-8 italic">{exp.role}</h4>
                                    <ul className="space-y-6">
                                        {exp.description?.map((bullet, bIdx) => (
                                            <li key={bIdx} className="text-xl md:text-2xl text-zinc-400 group-hover:text-white transition-colors leading-snug">
                                                — {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Creative Experiments / GitHub */}
            {data.githubProjects && data.githubProjects.length > 0 && (
                <section className="px-4 sm:px-6 md:px-20 py-20">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl sm:text-5xl md:text-8xl font-black mb-16 sm:mb-24 tracking-tighter text-right">Dev <span className="text-rose-500 italic">Labs</span></h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            {data.githubProjects.map((repo, idx) => (
                                <a
                                    key={repo.id}
                                    href={repo.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`group p-8 rounded-4xl border-4 border-zinc-900 dark:border-rose-500/20 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-900/5 transition-colors relative overflow-hidden ${idx % 2 !== 0 ? 'md:translate-y-12' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <Github size={32} className="text-zinc-900 dark:text-white" />
                                        <div className="px-4 py-1 rounded-full border border-black dark:border-white text-xs font-bold uppercase tracking-wider">
                                            {repo.language || 'Code'}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl sm:text-3xl font-black mb-4 group-hover:underline decoration-4 decoration-rose-500 underline-offset-4">{repo.name}</h3>
                                    <p className="text-lg text-zinc-600 dark:text-zinc-400 font-medium leading-tight mb-8">
                                        {repo.description || 'A creative project.'}
                                    </p>

                                    <div className="flex items-center gap-2 text-rose-500 font-bold">
                                        <Star size={18} className="fill-current" />
                                        <span>{repo.stargazers_count}</span>
                                    </div>

                                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-rose-200 dark:bg-rose-900/30 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Skills / Grid */}
            <section className="px-4 sm:px-6 md:px-20 py-16 sm:py-40">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <div className="col-span-2 md:row-span-2 bg-rose-500 p-8 sm:p-12 rounded-4xl sm:rounded-4xl flex flex-col justify-between aspect-square md:aspect-auto">
                            <h2 className="text-3xl sm:text-5xl font-black text-white">Skills<br />Matrix</h2>
                            <div className="flex flex-wrap gap-2">
                                {data.skills?.slice(0, 5).map((skill, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-white/20 text-white rounded-full text-sm backdrop-blur-md">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        {data.skills?.slice(5).map((skill, idx) => (
                            <div key={idx} className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-4xl flex items-center justify-center text-center font-bold text-xl hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors">
                                {skill}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact / Footer */}
            <footer className="px-6 md:px-20 py-40 text-center relative overflow-hidden">
                <div className="max-w-4xl mx-auto relative z-10">
                    <h2 className="text-4xl sm:text-6xl md:text-9xl font-black mb-8 sm:mb-12 tracking-tighter">Let's <span className="text-transparent stroke-zinc-900 dark:stroke-white stroke-2 italic">Talk</span></h2>
                    <a
                        href={`mailto:${data.email}`}
                        className="text-lg sm:text-2xl md:text-4xl font-bold hover:text-rose-500 transition-colors border-b-2 sm:border-b-4 border-rose-500 pb-1 sm:pb-2 break-all sm:break-normal"
                    >
                        {data.email}
                    </a>

                    <div className="flex justify-center gap-12 mt-20">
                        {data.links?.map((link, idx) => {
                            const Icon = link.platform.toLowerCase() === 'github' ? Github :
                                link.platform.toLowerCase() === 'linkedin' ? Linkedin : ExternalLink;
                            return (
                                <a
                                    key={idx}
                                    href={ensureAbsoluteUrl(link.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:scale-125 transition-transform text-zinc-400 hover:text-rose-500"
                                >
                                    <Icon size={32} />
                                </a>
                            );
                        })}
                    </div>
                </div>
            </footer>

            {/* CSS for stroked text effect */}
            <style>{`
                .stroke-rose-500 { -webkit-text-stroke: 2px #f43f5e; }
                .stroke-zinc-900 { -webkit-text-stroke: 2px #18181b; }
                .dark .stroke-white { -webkit-text-stroke: 2px #ffffff; }
            `}</style>
        </div>
    );
};

export default CreativeWebTheme;
