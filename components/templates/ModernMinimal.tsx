import React from 'react';
import { EditableTemplateProps } from './index';
import { UserProfile } from '../../types';
import { Plus, Trash2 } from 'lucide-react';
import InlineEdit from '../InlineEdit';

/**
 * Modern Minimal Template - Editable Version
 * Clean, minimal design with lots of whitespace and subtle color accents.
 * Supports inline editing when editable prop is true.
 */
const ModernMinimal: React.FC<EditableTemplateProps> = ({
    data,
    slug,
    editable = false,
    onUpdate,
    onExperienceUpdate,
    onEducationUpdate,
    onAddExperience,
    onRemoveExperience,
    onAddEducation,
    onRemoveEducation,
    onAddSkill,
    onRemoveSkill,
    onBulletUpdate,
    onAddBullet,
    onRemoveBullet
}) => {
    const portfolioUrl = slug ? `${window.location.origin}/p/${slug}` : null;

    const handleFieldUpdate = (field: keyof UserProfile, value: any) => {
        if (onUpdate) onUpdate(field, value);
    };

    return (
        <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-gray-900 p-10 md:p-14 shadow-2xl dark:shadow-none border border-gray-100 dark:border-gray-800 print:shadow-none print:border-none text-gray-800 dark:text-gray-100 font-sans transition-colors">
            {/* Header - Two Column Layout matching PDF */}
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start border-b-2 border-blue-600 dark:border-blue-500 pb-3 border-l-4 pl-4">
                {/* Left - Name */}
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {editable && onUpdate ? (
                            <InlineEdit
                                value={data.fullName || ''}
                                onSave={(v) => handleFieldUpdate('fullName', v)}
                                className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
                            />
                        ) : (
                            data.fullName
                        )}
                    </h1>
                </div>
                {/* Right - Contact Info Stacked */}
                <div className="flex flex-col items-start md:items-end gap-0.5 text-sm mt-2 md:mt-0">
                    {(data.email || editable) && (
                        editable && onUpdate ? (
                            <InlineEdit
                                value={data.email || ''}
                                onSave={(v) => handleFieldUpdate('email', v)}
                                placeholder="Email"
                                className="text-sm text-gray-600 dark:text-gray-400"
                            />
                        ) : (
                            <a href={`mailto:${data.email}`} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                                {data.email}
                            </a>
                        )
                    )}
                    {(data.phone || editable) && (
                        editable && onUpdate ? (
                            <InlineEdit
                                value={data.phone || ''}
                                onSave={(v) => handleFieldUpdate('phone', v)}
                                placeholder="Phone"
                                className="text-sm text-gray-600 dark:text-gray-400"
                            />
                        ) : (
                            <a href={`tel:${data.phone?.replace(/\D/g, '')}`} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                                {data.phone}
                            </a>
                        )
                    )}
                    {(data.location || editable) && (
                        editable && onUpdate ? (
                            <InlineEdit
                                value={data.location || ''}
                                onSave={(v) => handleFieldUpdate('location', v)}
                                placeholder="Location"
                                className="text-sm text-gray-600 dark:text-gray-400"
                            />
                        ) : (
                            <span className="text-gray-600 dark:text-gray-400">{data.location}</span>
                        )
                    )}
                    {portfolioUrl && (
                        <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                            {portfolioUrl.replace(/^https?:\/\//, '')}
                        </a>
                    )}
                    {data.links?.map((link, idx) => (
                        <a key={idx} href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                            {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        </a>
                    ))}
                </div>
            </header>

            {/* Summary */}
            {(data.summary || editable) && (
                <section className="mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 border-b-2 border-blue-600 dark:border-blue-500 pb-1">
                        About
                    </h2>
                    {editable && onUpdate ? (
                        <InlineEdit
                            value={data.summary || ''}
                            onSave={(v) => handleFieldUpdate('summary', v)}
                            multiline
                            placeholder="Write a professional summary..."
                            className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm w-full"
                        />
                    ) : (
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                            {data.summary}
                        </p>
                    )}
                </section>
            )}

            {/* Two Column Layout */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column - Skills & Education */}
                <div className="md:w-[30%] space-y-6 md:pr-5">
                    {/* Skills */}
                    {(data.skills && data.skills.length > 0) || editable ? (
                        <section className="mb-4">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 border-b-2 border-blue-600 dark:border-blue-500 pb-1">
                                Skills
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {data.skills?.map((skill, index) => (
                                    <span key={index} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded group relative transition-colors">
                                        {skill}
                                        {editable && onRemoveSkill && (
                                            <button
                                                onClick={() => onRemoveSkill(index)}
                                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        )}
                                    </span>
                                ))}
                                {editable && onAddSkill && (
                                    <button
                                        onClick={() => {
                                            const skill = prompt('Enter a new skill:');
                                            if (skill) onAddSkill(skill);
                                        }}
                                        className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded border border-dashed border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center gap-1 transition-colors"
                                    >
                                        <Plus size={12} /> Add
                                    </button>
                                )}
                            </div>
                        </section>
                    ) : null}

                    {/* Education */}
                    {(data.education && data.education.length > 0) || editable ? (
                        <section className="mb-4">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 border-b-2 border-blue-600 dark:border-blue-500 pb-1">
                                Education
                            </h2>
                            <div className="space-y-3">
                                {data.education?.map((edu) => (
                                    <div key={edu.id} className="group relative">
                                        {editable && onEducationUpdate ? (
                                            <>
                                                <InlineEdit
                                                    value={edu.institution}
                                                    onSave={(v) => onEducationUpdate(edu.id, 'institution', v)}
                                                    className="font-semibold text-sm text-gray-900 dark:text-white"
                                                />
                                                <InlineEdit
                                                    value={edu.degree}
                                                    onSave={(v) => onEducationUpdate(edu.id, 'degree', v)}
                                                    className="text-xs text-gray-600 dark:text-gray-400"
                                                />
                                                <InlineEdit
                                                    value={edu.year}
                                                    onSave={(v) => onEducationUpdate(edu.id, 'year', v)}
                                                    className="text-xs text-gray-400 dark:text-gray-500"
                                                />
                                                {onRemoveEducation && (
                                                    <button
                                                        onClick={() => onRemoveEducation(edu.id)}
                                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{edu.institution}</h3>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">{edu.degree}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{edu.year}</p>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {editable && onAddEducation && (
                                    <button
                                        onClick={onAddEducation}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors"
                                    >
                                        <Plus size={12} /> Add Education
                                    </button>
                                )}
                            </div>
                        </section>
                    ) : null}
                </div>

                {/* Right Column - Experience */}
                <div className="md:w-[70%]">
                    {/* Professional Experience */}
                    {(data.experience && data.experience.length > 0) || editable ? (
                        <section className="mb-6">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 border-b-2 border-blue-600 dark:border-blue-500 pb-1">
                                Experience
                            </h2>
                            <div className="space-y-4">
                                {data.experience?.map((exp) => (
                                    <div key={exp.id} className="relative pl-3 border-l-2 border-blue-100 dark:border-blue-900/50 group">

                                        {editable && onRemoveExperience && (
                                            <button
                                                onClick={() => onRemoveExperience(exp.id)}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 mb-1">
                                            {editable && onExperienceUpdate ? (
                                                <InlineEdit
                                                    value={exp.role}
                                                    onSave={(v) => onExperienceUpdate(exp.id, 'role', v)}
                                                    className="font-semibold text-gray-900 dark:text-white"
                                                />
                                            ) : (
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{exp.role}</h3>
                                            )}
                                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex items-center gap-1">
                                                {editable && onExperienceUpdate ? (
                                                    <>
                                                        <InlineEdit
                                                            value={exp.startDate}
                                                            onSave={(v) => onExperienceUpdate(exp.id, 'startDate', v)}
                                                            className="text-xs text-gray-400 dark:text-gray-500 w-20"
                                                        />
                                                        <span className="dark:text-gray-600">–</span>
                                                        <InlineEdit
                                                            value={exp.endDate}
                                                            onSave={(v) => onExperienceUpdate(exp.id, 'endDate', v)}
                                                            className="text-xs text-gray-400 dark:text-gray-500 w-20"
                                                        />
                                                    </>
                                                ) : (
                                                    `${exp.startDate} – ${exp.endDate}`
                                                )}
                                            </span>
                                        </div>
                                        {editable && onExperienceUpdate ? (
                                            <InlineEdit
                                                value={exp.company}
                                                onSave={(v) => onExperienceUpdate(exp.id, 'company', v)}
                                                className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{exp.company}</p>
                                        )}
                                        <ul className="space-y-1">
                                            {exp.description?.map((point, idx) => (
                                                <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2 group/bullet">
                                                    <span className="text-blue-400 dark:text-blue-500 mt-1.5 text-[6px]">●</span>
                                                    {editable && onBulletUpdate ? (
                                                        <>
                                                            <InlineEdit
                                                                value={point}
                                                                onSave={(v) => onBulletUpdate(exp.id, idx, v)}
                                                                multiline
                                                                className="flex-1 text-sm text-gray-600 dark:text-gray-300"
                                                            />
                                                            {onRemoveBullet && (
                                                                <button
                                                                    onClick={() => onRemoveBullet(exp.id, idx)}
                                                                    className="opacity-0 group-hover/bullet:opacity-100 text-red-400 hover:text-red-600"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span>{point}</span>
                                                    )}
                                                </li>
                                            ))}
                                            {editable && onAddBullet && (
                                                <li>
                                                    <button
                                                        onClick={() => onAddBullet(exp.id)}
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 ml-4 transition-colors"
                                                    >
                                                        <Plus size={10} /> Add bullet point
                                                    </button>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                ))}
                                {editable && onAddExperience && (
                                    <button
                                        onClick={onAddExperience}
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-4 transition-colors"
                                    >
                                        <Plus size={14} /> Add Experience
                                    </button>
                                )}
                            </div>
                        </section>
                    ) : null}

                    {/* Other Experience */}
                    {data.otherExperience && data.otherExperience.length > 0 && (
                        <section className="mb-6">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 border-b-2 border-blue-600 dark:border-blue-500 pb-1">
                                Other Experience
                            </h2>
                            <div className="space-y-4">
                                {data.otherExperience.map((exp) => (
                                    <div key={exp.id} className="relative pl-3 border-l-2 border-blue-100 dark:border-blue-900/50">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 mb-1">
                                            <h3 className="font-medium text-sm text-gray-800 dark:text-gray-200">{exp.role}</h3>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                                {exp.startDate} – {exp.endDate}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{exp.company}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModernMinimal;
