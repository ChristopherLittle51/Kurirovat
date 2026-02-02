import React from 'react';
import { EditableTemplateProps } from './index';
import { Plus, Trash2 } from 'lucide-react';
import InlineEdit from '../InlineEdit';

/**
 * Professional Classic Template
 * Traditional layout with serif headings and clear hierarchy.
 * Conservative colors, ATS-friendly layout.
 */
const ProfessionalClassic: React.FC<EditableTemplateProps> = ({
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

    return (
        <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-gray-950 p-8 md:p-12 shadow-2xl dark:shadow-none border border-gray-100 dark:border-gray-900 print:shadow-none print:border-none text-gray-900 dark:text-gray-100 font-serif transition-colors">
            {/* Header */}
            <header className="text-center border-b-2 border-gray-800 dark:border-gray-400 pb-6 mb-6">
                <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-widest mb-3 text-gray-900 dark:text-white">
                    {editable && onUpdate ? (
                        <InlineEdit
                            value={data.fullName || ''}
                            onSave={(v) => onUpdate('fullName', v)}
                            className="text-3xl md:text-4xl font-bold uppercase tracking-widest"
                        />
                    ) : (
                        data.fullName
                    )}
                </h1>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {(data.location || editable) && (
                        editable && onUpdate ? (
                            <InlineEdit
                                value={data.location || ''}
                                onSave={(v) => onUpdate('location', v)}
                                placeholder="Location"
                                className="text-sm text-gray-600 dark:text-gray-400"
                            />
                        ) : (
                            <span>{data.location}</span>
                        )
                    )}
                    {(data.email || editable) && (
                        <span className="flex items-center gap-1">
                            •
                            {editable && onUpdate ? (
                                <InlineEdit
                                    value={data.email || ''}
                                    onSave={(v) => onUpdate('email', v)}
                                    placeholder="Email"
                                    className="text-sm text-gray-600 dark:text-gray-400"
                                />
                            ) : (
                                data.email
                            )}
                        </span>
                    )}
                    {(data.phone || editable) && (
                        <span className="flex items-center gap-1">
                            •
                            {editable && onUpdate ? (
                                <InlineEdit
                                    value={data.phone || ''}
                                    onSave={(v) => onUpdate('phone', v)}
                                    placeholder="Phone"
                                    className="text-sm text-gray-600 dark:text-gray-400"
                                />
                            ) : (
                                data.phone
                            )}
                        </span>
                    )}
                    {portfolioUrl && (
                        <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 dark:text-blue-400 hover:underline">
                            • {portfolioUrl.replace(/^https?:\/\//, '')}
                        </a>
                    )}
                    {data.links?.map((link, idx) => (
                        <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 dark:text-blue-400 hover:underline">
                            • {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        </a>
                    ))}
                </div>
            </header>

            {/* Summary */}
            {(data.summary || editable) && (
                <section className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 dark:border-gray-700 pb-1 mb-3 text-gray-900 dark:text-gray-200">
                        Professional Summary
                    </h2>
                    {editable && onUpdate ? (
                        <InlineEdit
                            value={data.summary || ''}
                            onSave={(v) => onUpdate('summary', v)}
                            multiline
                            placeholder="Write a professional summary..."
                            className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm w-full"
                        />
                    ) : (
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                            {data.summary}
                        </p>
                    )}
                </section>
            )}

            {/* Skills */}
            {((data.skills && data.skills.length > 0) || editable) && (
                <section className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 dark:border-gray-700 pb-1 mb-3 text-gray-900 dark:text-gray-200">
                        Core Competencies
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {data.skills?.map((skill, index) => (
                            <span key={index} className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700 group relative transition-colors">
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
                                className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded border border-dashed border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center gap-1 transition-colors"
                            >
                                <Plus size={12} /> Add
                            </button>
                        )}
                    </div>
                </section>
            )}

            {/* Experience */}
            {((data.experience && data.experience.length > 0) || editable) && (
                <section className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 dark:border-gray-700 pb-1 mb-4 text-gray-900 dark:text-gray-200">
                        Professional Experience
                    </h2>
                    <div className="space-y-5">
                        {data.experience?.map((exp) => (
                            <div key={exp.id} className="group relative">
                                {editable && onRemoveExperience && (
                                    <button
                                        onClick={() => onRemoveExperience(exp.id)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                                <div className="flex flex-col md:flex-row md:justify-between md:items-baseline mb-1">
                                    {editable && onExperienceUpdate ? (
                                        <InlineEdit
                                            value={exp.role}
                                            onSave={(v) => onExperienceUpdate(exp.id, 'role', v)}
                                            className="font-bold text-base text-gray-900 dark:text-white"
                                        />
                                    ) : (
                                        <h3 className="font-bold text-base text-gray-900 dark:text-white">{exp.role}</h3>
                                    )}
                                    <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                        {editable && onExperienceUpdate ? (
                                            <>
                                                <InlineEdit
                                                    value={exp.startDate}
                                                    onSave={(v) => onExperienceUpdate(exp.id, 'startDate', v)}
                                                    className="text-xs text-gray-500 dark:text-gray-400 w-20"
                                                />
                                                <span className="dark:text-gray-500">–</span>
                                                <InlineEdit
                                                    value={exp.endDate}
                                                    onSave={(v) => onExperienceUpdate(exp.id, 'endDate', v)}
                                                    className="text-xs text-gray-500 dark:text-gray-400 w-20"
                                                />
                                            </>
                                        ) : (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{exp.startDate} – {exp.endDate}</span>
                                        )}
                                    </span>
                                </div>
                                {editable && onExperienceUpdate ? (
                                    <InlineEdit
                                        value={exp.company}
                                        onSave={(v) => onExperienceUpdate(exp.id, 'company', v)}
                                        className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-2"
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-2">{exp.company}</p>
                                )}
                                <ul className="list-disc list-outside ml-5 space-y-1">
                                    {exp.description?.map((point, idx) => (
                                        <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 pl-1 group/bullet">
                                            {editable && onBulletUpdate ? (
                                                <span className="flex items-center gap-2">
                                                    <InlineEdit
                                                        value={point}
                                                        onSave={(v) => onBulletUpdate(exp.id, idx, v)}
                                                        multiline
                                                        className="flex-1 text-sm text-gray-700 dark:text-gray-300"
                                                    />
                                                    {onRemoveBullet && (
                                                        <button
                                                            onClick={() => onRemoveBullet(exp.id, idx)}
                                                            className="opacity-0 group-hover/bullet:opacity-100 text-red-400 hover:text-red-600"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </span>
                                            ) : (
                                                point
                                            )}
                                        </li>
                                    ))}
                                    {editable && onAddBullet && (
                                        <li className="list-none -ml-5">
                                            <button
                                                onClick={() => onAddBullet(exp.id)}
                                                className="text-xs text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors"
                                            >
                                                <Plus size={10} /> Add bullet
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        ))}
                        {editable && onAddExperience && (
                            <button
                                onClick={onAddExperience}
                                className="text-sm text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors"
                            >
                                <Plus size={14} /> Add Experience
                            </button>
                        )}
                    </div>
                </section>
            )}

            {/* Other Experience */}
            {data.otherExperience && data.otherExperience.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 dark:border-gray-700 pb-1 mb-4 text-gray-900 dark:text-gray-200">
                        Additional Experience
                    </h2>
                    <div className="space-y-3">
                        {data.otherExperience.map((exp) => (
                            <div key={exp.id}>
                                <div className="flex flex-col md:flex-row md:justify-between md:items-baseline">
                                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">{exp.role}</h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{exp.startDate} – {exp.endDate}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{exp.company}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Education */}
            {((data.education && data.education.length > 0) || editable) && (
                <section>
                    <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 dark:border-gray-700 pb-1 mb-3 text-gray-900 dark:text-gray-200">
                        Education
                    </h2>
                    <div className="space-y-2">
                        {data.education?.map((edu) => (
                            <div key={edu.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline group relative">
                                {editable && onRemoveEducation && (
                                    <button
                                        onClick={() => onRemoveEducation(edu.id)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                                <div>
                                    {editable && onEducationUpdate ? (
                                        <>
                                            <InlineEdit
                                                value={edu.institution}
                                                onSave={(v) => onEducationUpdate(edu.id, 'institution', v)}
                                                className="font-bold text-sm text-gray-900 dark:text-white"
                                            />
                                            <InlineEdit
                                                value={edu.degree}
                                                onSave={(v) => onEducationUpdate(edu.id, 'degree', v)}
                                                className="text-sm text-gray-600 dark:text-gray-400"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="font-bold text-sm text-gray-900 dark:text-white">{edu.institution}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{edu.degree}</p>
                                        </>
                                    )}
                                </div>
                                {editable && onEducationUpdate ? (
                                    <InlineEdit
                                        value={edu.year}
                                        onSave={(v) => onEducationUpdate(edu.id, 'year', v)}
                                        className="text-xs text-gray-500 dark:text-gray-400 font-medium"
                                    />
                                ) : (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{edu.year}</span>
                                )}
                            </div>
                        ))}
                        {editable && onAddEducation && (
                            <button
                                onClick={onAddEducation}
                                className="text-xs text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 mt-2 transition-colors"
                            >
                                <Plus size={12} /> Add Education
                            </button>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ProfessionalClassic;
