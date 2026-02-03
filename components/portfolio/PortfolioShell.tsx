import React from 'react';
import { UserProfile, SocialLink } from '../../types';
import { Github, Linkedin, Mail, MapPin, Phone, ExternalLink } from 'lucide-react';
import { ensureAbsoluteUrl } from '../../services/urlUtils';

interface PortfolioShellProps {
    data: UserProfile;
    children: React.ReactNode;
}

const PortfolioShell: React.FC<PortfolioShellProps> = ({ data, children }) => {
    const socialIcons: Record<string, any> = {
        github: Github,
        linkedin: Linkedin,
        email: Mail,
        twitter: ExternalLink,
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-10">
                        <div className="flex-1 space-y-6">
                            <div>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                    {data.fullName}
                                </h1>
                                <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                                    {data.summary}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
                                {data.location && (
                                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                        <MapPin size={14} className="text-blue-600 dark:text-blue-400" />
                                        {data.location}
                                    </span>
                                )}
                                {data.email && (
                                    <a href={`mailto:${data.email}`} className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[200px] sm:max-w-none">
                                        <Mail size={14} className="text-blue-600 dark:text-blue-400" />
                                        {data.email}
                                    </a>
                                )}
                                {data.phone && (
                                    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                        <Phone size={14} className="text-blue-600 dark:text-blue-400" />
                                        {data.phone}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {data.links?.map((link, idx) => {
                                    const Icon = socialIcons[link.platform.toLowerCase()] || ExternalLink;
                                    return (
                                        <a
                                            key={idx}
                                            href={ensureAbsoluteUrl(link.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 min-w-[44px] min-h-[44px] bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:scale-110 active:scale-95 transition flex items-center justify-center"
                                            aria-label={link.platform}
                                        >
                                            <Icon size={20} />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Visual element / Avatar placeholder */}
                        <div className="hidden lg:block relative w-64 h-64">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl rotate-6 opacity-20 animate-pulse"></div>
                            <div className="absolute inset-0 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl flex items-center justify-center">
                                <span className="text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-indigo-600">
                                    {data.fullName.charAt(0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background micro-accents */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-100 dark:bg-blue-900/10 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-100 dark:bg-indigo-900/10 rounded-full blur-3xl -z-10"></div>
            </section>

            {/* Main Content (The Resume Template) */}
            <main className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[1000px]">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 mt-12 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} {data.fullName}. Built with professional excellence.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PortfolioShell;
