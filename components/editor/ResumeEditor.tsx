import React, { useState, useCallback, useMemo } from 'react';
import { UserProfile, Experience, Education } from '../../types';
import { Plus, X } from 'lucide-react';
import EditableText from './EditableText';
import EditorSection from './EditorSection';
import ExperienceCard from './ExperienceCard';
import EducationCard from './EducationCard';

interface Props {
    data: UserProfile;
    slug?: string;
    onUpdate: (newData: UserProfile) => void;
}

/**
 * Main Resume Editor component with Google Docs-style editing.
 * All content is directly editable without click-to-edit mode.
 * Experience is sorted chronologically by default (newest first).
 */
const ResumeEditor: React.FC<Props> = ({ data, slug, onUpdate }) => {
    const [tempSkill, setTempSkill] = useState('');

    // Sort experience chronologically (newest first based on endDate)
    const sortedExperience = useMemo(() => {
        return [...(data.experience || [])].sort((a, b) => {
            const dateA = a.endDate?.toLowerCase() === 'present' ? new Date() : new Date(a.endDate);
            const dateB = b.endDate?.toLowerCase() === 'present' ? new Date() : new Date(b.endDate);
            return dateB.getTime() - dateA.getTime();
        });
    }, [data.experience]);

    const sortedOtherExperience = useMemo(() => {
        return [...(data.otherExperience || [])].sort((a, b) => {
            const dateA = a.endDate?.toLowerCase() === 'present' ? new Date() : new Date(a.endDate);
            const dateB = b.endDate?.toLowerCase() === 'present' ? new Date() : new Date(b.endDate);
            return dateB.getTime() - dateA.getTime();
        });
    }, [data.otherExperience]);

    const handleUpdate = useCallback((field: keyof UserProfile, value: any) => {
        onUpdate({ ...data, [field]: value });
    }, [data, onUpdate]);

    // Experience handlers
    const handleExperienceChange = useCallback((id: string, updatedExp: Experience) => {
        const newExperience = data.experience.map(exp =>
            exp.id === id ? updatedExp : exp
        );
        handleUpdate('experience', newExperience);
    }, [data.experience, handleUpdate]);

    const handleAddExperience = useCallback(() => {
        const newExp: Experience = {
            id: crypto.randomUUID(),
            role: '',
            company: '',
            startDate: '',
            endDate: 'Present',
            description: [''],
        };
        handleUpdate('experience', [...data.experience, newExp]);
    }, [data.experience, handleUpdate]);

    const handleDeleteExperience = useCallback((id: string) => {
        handleUpdate('experience', data.experience.filter(exp => exp.id !== id));
    }, [data.experience, handleUpdate]);

    // Other Experience handlers
    const handleOtherExperienceChange = useCallback((id: string, updatedExp: Experience) => {
        const newExperience = (data.otherExperience || []).map(exp =>
            exp.id === id ? updatedExp : exp
        );
        handleUpdate('otherExperience', newExperience);
    }, [data.otherExperience, handleUpdate]);

    const handleAddOtherExperience = useCallback(() => {
        const newExp: Experience = {
            id: crypto.randomUUID(),
            role: '',
            company: '',
            startDate: '',
            endDate: 'Present',
            description: [''],
        };
        handleUpdate('otherExperience', [...(data.otherExperience || []), newExp]);
    }, [data.otherExperience, handleUpdate]);

    const handleDeleteOtherExperience = useCallback((id: string) => {
        handleUpdate('otherExperience', (data.otherExperience || []).filter(exp => exp.id !== id));
    }, [data.otherExperience, handleUpdate]);

    // Education handlers
    const handleEducationChange = useCallback((id: string, updatedEdu: Education) => {
        const newEducation = data.education.map(edu =>
            edu.id === id ? updatedEdu : edu
        );
        handleUpdate('education', newEducation);
    }, [data.education, handleUpdate]);

    const handleAddEducation = useCallback(() => {
        const newEdu: Education = {
            id: crypto.randomUUID(),
            institution: '',
            degree: '',
            year: '',
        };
        handleUpdate('education', [...data.education, newEdu]);
    }, [data.education, handleUpdate]);

    const handleDeleteEducation = useCallback((id: string) => {
        handleUpdate('education', data.education.filter(edu => edu.id !== id));
    }, [data.education, handleUpdate]);

    // Skills handlers
    const handleAddSkill = useCallback(() => {
        if (tempSkill.trim()) {
            handleUpdate('skills', [...data.skills, tempSkill.trim()]);
            setTempSkill('');
        }
    }, [tempSkill, data.skills, handleUpdate]);

    const handleRemoveSkill = useCallback((index: number) => {
        handleUpdate('skills', data.skills.filter((_, i) => i !== index));
    }, [data.skills, handleUpdate]);

    const portfolioUrl = slug ? `${window.location.origin}/p/${slug}` : null;

    return (
        <div className="w-full max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 md:p-12">
                <EditableText
                    value={data.fullName}
                    onChange={(v) => handleUpdate('fullName', v)}
                    placeholder="Your Full Name"
                    className="text-3xl md:text-4xl font-bold tracking-wide text-white"
                    as="h1"
                />

                <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-300">
                    {data.location && (
                        <EditableText
                            value={data.location}
                            onChange={(v) => handleUpdate('location', v)}
                            placeholder="Location"
                            className="text-gray-300"
                        />
                    )}
                    {data.email && (
                        <>
                            <span className="text-gray-500">•</span>
                            <EditableText
                                value={data.email}
                                onChange={(v) => handleUpdate('email', v)}
                                placeholder="Email"
                                className="text-gray-300"
                            />
                        </>
                    )}
                    {data.phone && (
                        <>
                            <span className="text-gray-500">•</span>
                            <EditableText
                                value={data.phone}
                                onChange={(v) => handleUpdate('phone', v)}
                                placeholder="Phone"
                                className="text-gray-300"
                            />
                        </>
                    )}
                    {portfolioUrl && (
                        <>
                            <span className="text-gray-500">•</span>
                            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                {portfolioUrl.replace(/^https?:\/\//, '')}
                            </a>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6 md:p-8 space-y-2">
                {/* Professional Summary */}
                <EditorSection title="Professional Summary" collapsible={false}>
                    <EditableText
                        value={data.summary}
                        onChange={(v) => handleUpdate('summary', v)}
                        placeholder="Write a compelling professional summary that highlights your key qualifications and career objectives..."
                        className="text-gray-700 leading-relaxed"
                        multiline
                    />
                </EditorSection>

                {/* Skills */}
                <EditorSection title="Core Competencies" collapsible={true}>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {data.skills.map((skill, index) => (
                            <span
                                key={index}
                                className="group flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                {skill}
                                <button
                                    onClick={() => handleRemoveSkill(index)}
                                    className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tempSkill}
                            onChange={(e) => setTempSkill(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                            placeholder="Add a skill..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleAddSkill}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </EditorSection>

                {/* Professional Experience */}
                <EditorSection
                    title="Professional Experience"
                    onAdd={handleAddExperience}
                    addLabel="Add Experience"
                    isEmpty={sortedExperience.length === 0}
                >
                    {sortedExperience.map((exp) => (
                        <ExperienceCard
                            key={exp.id}
                            experience={exp}
                            onChange={(updated) => handleExperienceChange(exp.id, updated)}
                            onDelete={() => handleDeleteExperience(exp.id)}
                        />
                    ))}
                </EditorSection>

                {/* Other Experience */}
                <EditorSection
                    title="Other Experience"
                    onAdd={handleAddOtherExperience}
                    addLabel="Add Experience"
                    isEmpty={sortedOtherExperience.length === 0}
                    defaultCollapsed={sortedOtherExperience.length === 0}
                >
                    {sortedOtherExperience.map((exp) => (
                        <ExperienceCard
                            key={exp.id}
                            experience={exp}
                            onChange={(updated) => handleOtherExperienceChange(exp.id, updated)}
                            onDelete={() => handleDeleteOtherExperience(exp.id)}
                        />
                    ))}
                </EditorSection>

                {/* Education */}
                <EditorSection
                    title="Education"
                    onAdd={handleAddEducation}
                    addLabel="Add Education"
                    isEmpty={data.education.length === 0}
                >
                    {data.education.map((edu) => (
                        <EducationCard
                            key={edu.id}
                            education={edu}
                            onChange={(updated) => handleEducationChange(edu.id, updated)}
                            onDelete={() => handleDeleteEducation(edu.id)}
                        />
                    ))}
                </EditorSection>
            </div>
        </div>
    );
};

export default ResumeEditor;
