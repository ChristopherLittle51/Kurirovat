import React from 'react';
import { EditableTemplateProps } from './index';
import { Briefcase, GraduationCap, Sparkles, User, Plus, Trash2 } from 'lucide-react';
import InlineEdit from '../InlineEdit';

/**
 * Creative Bold Template
 * Eye-catching design with gradient header and modern styling.
 * Good for creative roles while remaining professional.
 */
const CreativeBold: React.FC<EditableTemplateProps> = ({
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
        <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-gray-900 shadow-2xl dark:shadow-none print:shadow-none border border-gray-100 dark:border-gray-800 print:border-none overflow-hidden transition-colors">
            {/* Gradient Header */}
            <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-10 md:p-12">
                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                    {editable && onUpdate ? (
                        <InlineEdit
                            value={data.fullName || ''}
                            onSave={(v) => onUpdate('fullName', v)}
                            className="text-4xl md:text-5xl font-bold text-white"
                        />
                    ) : (
                        data.fullName
                    )}
                </h1>
                <div className="flex flex-wrap gap-3 text-sm text-white/90">
                    {(data.location || editable) && (
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                            {editable && onUpdate ? (
                                <InlineEdit
                                    value={data.location || ''}
                                    onSave={(v) => onUpdate('location', v)}
                                    placeholder="Location"
                                    className="text-sm text-white/90 bg-transparent"
                                />
                            ) : (
                                data.location
                            )}
                        </span>
                    )}
                    {(data.email || editable) && (
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                            {editable && onUpdate ? (
                                <InlineEdit
                                    value={data.email || ''}
                                    onSave={(v) => onUpdate('email', v)}
                                    placeholder="Email"
                                    className="text-sm text-white/90 bg-transparent"
                                />
                            ) : (
                                data.email
                            )}
                        </span>
                    )}
                    {(data.phone || editable) && (
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                            {editable && onUpdate ? (
                                <InlineEdit
                                    value={data.phone || ''}
                                    onSave={(v) => onUpdate('phone', v)}
                                    placeholder="Phone"
                                    className="text-sm text-white/90 bg-transparent"
                                />
                            ) : (
                                data.phone
                            )}
                        </span>
                    )}
                    {portfolioUrl && (
                        <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
                            {portfolioUrl.replace(/^https?:\/\//, '')}
                        </a>
                    )}
                    {data.links?.map((link, idx) => (
                        <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
                            {link.platform || link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        </a>
                    ))}
                </div>
            </header>

            <div className="p-8 md:p-10">
                {/* Summary */}
                {(data.summary || editable) && (
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <User size={18} className="text-purple-600 dark:text-purple-400" />
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">About Me</h2>
                        </div>
                        {editable && onUpdate ? (
                            <div className="pl-7">
                                <InlineEdit
                                    value={data.summary || ''}
                                    onSave={(v) => onUpdate('summary', v)}
                                    multiline
                                    placeholder="Write about yourself..."
                                    className="text-gray-600 dark:text-gray-300 leading-relaxed w-full"
                                />
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-7">
                                {data.summary}
                            </p>
                        )}
                    </section>
                )}

                {/* Skills */}
                {((data.skills && data.skills.length > 0) || editable) && (
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Skills</h2>
                        </div>
                        <div className="flex flex-wrap gap-2 pl-7">
                            {data.skills?.map((skill, index) => (
                                <span
                                    key={index}
                                    className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-purple-800 dark:text-purple-300 text-sm px-4 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 font-medium group relative transition-colors"
                                >
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
                                    className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm px-4 py-1.5 rounded-full border border-dashed border-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={12} /> Add
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {/* Experience */}
                {((data.experience && data.experience.length > 0) || editable) && (
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase size={18} className="text-purple-600 dark:text-purple-400" />
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Experience</h2>
                        </div>
                        <div className="space-y-6 pl-7">
                            {data.experience?.map((exp) => (
                                <div
                                    key={exp.id}
                                    className="relative bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 group transition-colors"
                                >
                                    <div className="absolute -left-3 top-6 w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                                    {editable && onRemoveExperience && (
                                        <button
                                            onClick={() => onRemoveExperience(exp.id)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-2">
                                        {editable && onExperienceUpdate ? (
                                            <InlineEdit
                                                value={exp.role}
                                                onSave={(v) => onExperienceUpdate(exp.id, 'role', v)}
                                                className="font-bold text-gray-900 dark:text-white text-lg"
                                            />
                                        ) : (
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{exp.role}</h3>
                                        )}
                                        <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium whitespace-nowrap flex items-center gap-1">
                                            {editable && onExperienceUpdate ? (
                                                <>
                                                    <InlineEdit
                                                        value={exp.startDate}
                                                        onSave={(v) => onExperienceUpdate(exp.id, 'startDate', v)}
                                                        className="text-xs text-purple-700 dark:text-purple-300 w-16 bg-transparent"
                                                    />
                                                    <span className="dark:text-purple-400">–</span>
                                                    <InlineEdit
                                                        value={exp.endDate}
                                                        onSave={(v) => onExperienceUpdate(exp.id, 'endDate', v)}
                                                        className="text-xs text-purple-700 dark:text-purple-300 w-16 bg-transparent"
                                                    />
                                                </>
                                            ) : (
                                                <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full font-medium whitespace-nowrap">{exp.startDate} – {exp.endDate}</span>
                                            )}
                                        </span>
                                    </div>
                                    {editable && onExperienceUpdate ? (
                                        <InlineEdit
                                            value={exp.company}
                                            onSave={(v) => onExperienceUpdate(exp.id, 'company', v)}
                                            className="text-purple-600 dark:text-purple-400 font-semibold mb-3"
                                        />
                                    ) : (
                                        <p className="text-purple-600 dark:text-purple-400 font-semibold mb-3">{exp.company}</p>
                                    )}
                                    <ul className="space-y-2">
                                        {exp.description?.map((point, pIdx) => (
                                            <li key={pIdx} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2 group/bullet">
                                                <span className="text-purple-400 dark:text-purple-500 mt-1">▸</span>
                                                {editable && onBulletUpdate ? (
                                                    <>
                                                        <InlineEdit
                                                            value={point}
                                                            onSave={(v) => onBulletUpdate(exp.id, pIdx, v)}
                                                            multiline
                                                            className="flex-1 text-sm text-gray-600 dark:text-gray-300"
                                                        />
                                                        {onRemoveBullet && (
                                                            <button
                                                                onClick={() => onRemoveBullet(exp.id, pIdx)}
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
                                            <li className="ml-4">
                                                <button
                                                    onClick={() => onAddBullet(exp.id)}
                                                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 transition-colors"
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
                                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={14} /> Add Experience
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {/* Other Experience */}
                {data.otherExperience && data.otherExperience.length > 0 && (
                    <section className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase size={18} className="text-purple-400 dark:text-purple-500" />
                            <h2 className="text-lg font-bold text-gray-600 dark:text-gray-300">Other Experience</h2>
                        </div>
                        <div className="space-y-3 pl-7">
                            {data.otherExperience.map((exp) => (
                                <div key={exp.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 py-2 border-b border-gray-100 dark:border-gray-800 transition-colors">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{exp.role}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{exp.company}</p>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">{exp.startDate} – {exp.endDate}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {((data.education && data.education.length > 0) || editable) && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <GraduationCap size={18} className="text-purple-600 dark:text-purple-400" />
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Education</h2>
                        </div>
                        <div className="space-y-3 pl-7">
                            {data.education?.map((edu) => (
                                <div key={edu.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 group relative">
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
                                                    className="font-bold text-gray-800 dark:text-white"
                                                />
                                                <InlineEdit
                                                    value={edu.degree}
                                                    onSave={(v) => onEducationUpdate(edu.id, 'degree', v)}
                                                    className="text-sm text-gray-600 dark:text-gray-400"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="font-bold text-gray-800 dark:text-white">{edu.institution}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{edu.degree}</p>
                                            </>
                                        )}
                                    </div>
                                    {editable && onEducationUpdate ? (
                                        <InlineEdit
                                            value={edu.year}
                                            onSave={(v) => onEducationUpdate(edu.id, 'year', v)}
                                            className="text-sm text-purple-600 dark:text-purple-400 font-medium"
                                        />
                                    ) : (
                                        <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">{edu.year}</span>
                                    )}
                                </div>
                            ))}
                            {editable && onAddEducation && (
                                <button
                                    onClick={onAddEducation}
                                    className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 mt-2 transition-colors"
                                >
                                    <Plus size={12} /> Add Education
                                </button>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default CreativeBold;
