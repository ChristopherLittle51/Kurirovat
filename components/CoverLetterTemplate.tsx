import React from 'react';
import { UserProfile, JobDescription } from '../types';
import InlineEdit from './InlineEdit';

interface Props {
    resume: UserProfile;
    jobDescription: JobDescription;
    coverLetterContent: string;
    onUpdate?: (newContent: string) => void;
}

const CoverLetterTemplate: React.FC<Props> = ({ resume, jobDescription, coverLetterContent, onUpdate }) => {

    const handleContentChange = (newVal: string) => {
        if (onUpdate) {
            onUpdate(newVal);
        }
    };

    return (
        <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-gray-900 p-6 md:p-12 shadow-2xl dark:shadow-none border border-gray-100 dark:border-gray-800 print:shadow-none print:border-none print:p-0 text-gray-900 dark:text-gray-100 leading-relaxed font-serif transition-colors" id="cover-letter-preview">

            {/* Header: Candidate Info */}
            <header className="border-b border-gray-300 dark:border-gray-700 pb-8 mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900 dark:text-white">{resume.fullName}</h1>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div>{resume.location}</div>
                        <div>{resume.email}</div>
                        <div>{resume.phone}</div>
                        {resume.links.length > 0 && <div>{resume.links[0].url}</div>}
                    </div>
                </div>
            </header>

            {/* Date */}
            <div className="mb-8 text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Recipient Info */}
            <div className="mb-8">
                <div className="font-bold text-gray-900 dark:text-gray-100">Hiring Manager</div>
                <div className="text-gray-800 dark:text-gray-300">{jobDescription.companyName}</div>
            </div>

            {/* Body */}
            <div className="text-base text-gray-800 dark:text-gray-300 space-y-6 whitespace-pre-wrap">
                {onUpdate ? (
                    <InlineEdit
                        value={coverLetterContent}
                        onChange={handleContentChange}
                        multiline={true}
                        className="min-h-[400px] font-serif leading-7"
                    />
                ) : (
                    <div className="min-h-[400px] leading-7">
                        {coverLetterContent}
                    </div>
                )}
            </div>

            {/* Sign-off */}
            <div className="mt-12">
                <div className="text-gray-800 dark:text-gray-300">Sincerely,</div>
                <div className="mt-8 font-bold text-gray-900 dark:text-white">{resume.fullName}</div>
            </div>

        </div>
    );
};

export default CoverLetterTemplate;
