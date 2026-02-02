import React from 'react';
import { EditableTemplateProps } from './index';
import { Code2, Terminal, Folder, GitBranch, Plus, Trash2 } from 'lucide-react';
import InlineEdit from '../InlineEdit';

/**
 * Tech Focused Template
 * Developer-friendly layout with code-inspired styling.
 * Skills as tags, GitHub integration emphasis, technical project focus.
 */
const TechFocused: React.FC<EditableTemplateProps> = ({
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
        <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 shadow-2xl dark:shadow-none border border-gray-200 dark:border-gray-800 print:shadow-none print:border-none font-mono transition-colors">
            {/* Terminal-style Header */}
            <header className="bg-gray-200 dark:bg-gray-900 p-6 md:p-8 border-b border-gray-200 dark:border-gray-800 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-gray-500 text-sm">~/resume.yml</span>
                </div>
                <div className="space-y-1 text-sm">
                    <p>
                        <span className="text-purple-600 dark:text-purple-400">name:</span>{' '}
                        {editable && onUpdate ? (
                            <InlineEdit
                                value={data.fullName || ''}
                                onSave={(v) => onUpdate('fullName', v)}
                                className="text-green-600 dark:text-green-400 bg-transparent"
                            />
                        ) : (
                            <span className="text-green-600 dark:text-green-400">"{data.fullName}"</span>
                        )}
                    </p>
                    {(data.location || editable) && (
                        <p>
                            <span className="text-purple-600 dark:text-purple-400">location:</span>{' '}
                            {editable && onUpdate ? (
                                <InlineEdit
                                    value={data.location || ''}
                                    onSave={(v) => onUpdate('location', v)}
                                    placeholder="Location"
                                    className="text-green-600 dark:text-green-400 bg-transparent"
                                />
                            ) : (
                                <span className="text-green-600 dark:text-green-400">"{data.location}"</span>
                            )}
                        </p>
                    )}
                    <p><span className="text-purple-600 dark:text-purple-400">contact:</span></p>
                    {(data.email || editable) && (
                        <p className="pl-4">
                            <span className="text-blue-600 dark:text-blue-400">email:</span>{' '}
                            {editable && onUpdate ? (
                                <InlineEdit
                                    value={data.email || ''}
                                    onSave={(v) => onUpdate('email', v)}
                                    placeholder="email@example.com"
                                    className="text-orange-600 dark:text-yellow-300 bg-transparent"
                                />
                            ) : (
                                <span className="text-orange-600 dark:text-yellow-300">"{data.email}"</span>
                            )}
                        </p>
                    )}
                    {(data.phone || editable) && (
                        <p className="pl-4">
                            <span className="text-blue-600 dark:text-blue-400">phone:</span>{' '}
                            {editable && onUpdate ? (
                                <InlineEdit
                                    value={data.phone || ''}
                                    onSave={(v) => onUpdate('phone', v)}
                                    placeholder="+1 (555) 000-0000"
                                    className="text-orange-600 dark:text-yellow-300 bg-transparent"
                                />
                            ) : (
                                <span className="text-orange-600 dark:text-yellow-300">"{data.phone}"</span>
                            )}
                        </p>
                    )}
                    {portfolioUrl && (
                        <p className="pl-4">
                            <span className="text-blue-600 dark:text-blue-400">portfolio:</span>{' '}
                            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline">
                                "{portfolioUrl.replace(/^https?:\/\//, '')}"
                            </a>
                        </p>
                    )}
                    {data.links?.map((link, idx) => (
                        <p key={idx} className="pl-4">
                            <span className="text-blue-600 dark:text-blue-400">{link.platform?.toLowerCase() || 'link'}:</span>{' '}
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline">
                                "{link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}"
                            </a>
                        </p>
                    ))}
                </div>
            </header>

            <div className="p-6 md:p-8 space-y-6">
                {/* Summary */}
                {(data.summary || editable) && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400">
                            <Terminal size={16} />
                            <span className="text-xs uppercase tracking-wider">$ cat about.md</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors">
                            {editable && onUpdate ? (
                                <InlineEdit
                                    value={data.summary || ''}
                                    onSave={(v) => onUpdate('summary', v)}
                                    multiline
                                    placeholder="Write about yourself..."
                                    className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed w-full bg-transparent"
                                />
                            ) : (
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{data.summary}</p>
                            )}
                        </div>
                    </section>
                )}

                {/* Skills as code tags */}
                {((data.skills && data.skills.length > 0) || editable) && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400">
                            <Code2 size={16} />
                            <span className="text-xs uppercase tracking-wider">$ echo $SKILLS</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {data.skills?.map((skill, index) => (
                                <span
                                    key={index}
                                    className="bg-white dark:bg-gray-800 text-cyan-700 dark:text-cyan-400 text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 font-mono hover:border-cyan-500 transition-colors group relative"
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
                                    className="bg-white dark:bg-gray-800 text-cyan-600 dark:text-cyan-400 text-xs px-3 py-1.5 rounded border border-dashed border-gray-300 dark:border-gray-600 hover:border-cyan-500 flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={12} /> add
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {/* Experience */}
                {((data.experience && data.experience.length > 0) || editable) && (
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-gray-500 dark:text-gray-400">
                            <Folder size={16} />
                            <span className="text-xs uppercase tracking-wider">$ ls -la ./experience</span>
                        </div>
                        <div className="space-y-4">
                            {data.experience?.map((exp) => (
                                <div key={exp.id} className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 hover:border-green-500/50 transition-colors group relative">
                                    {editable && onRemoveExperience && (
                                        <button
                                            onClick={() => onRemoveExperience(exp.id)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-3">
                                        <div>
                                            <h3 className="text-green-700 dark:text-green-400 font-bold text-base flex items-center gap-2">
                                                <GitBranch size={14} className="text-gray-400 dark:text-gray-500" />
                                                {editable && onExperienceUpdate ? (
                                                    <InlineEdit
                                                        value={exp.role}
                                                        onSave={(v) => onExperienceUpdate(exp.id, 'role', v)}
                                                        className="text-green-700 dark:text-green-400 font-bold bg-transparent"
                                                    />
                                                ) : (
                                                    exp.role
                                                )}
                                            </h3>
                                            {editable && onExperienceUpdate ? (
                                                <InlineEdit
                                                    value={exp.company}
                                                    onSave={(v) => onExperienceUpdate(exp.id, 'company', v)}
                                                    className="text-purple-600 dark:text-purple-400 text-sm bg-transparent"
                                                />
                                            ) : (
                                                <p className="text-purple-600 dark:text-purple-400 text-sm">{exp.company}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 transition-colors">
                                            {editable && onExperienceUpdate ? (
                                                <>
                                                    <InlineEdit
                                                        value={exp.startDate}
                                                        onSave={(v) => onExperienceUpdate(exp.id, 'startDate', v)}
                                                        className="text-xs text-gray-500 dark:text-gray-400 w-16 bg-transparent"
                                                    />
                                                    <span className="dark:text-gray-500">→</span>
                                                    <InlineEdit
                                                        value={exp.endDate}
                                                        onSave={(v) => onExperienceUpdate(exp.id, 'endDate', v)}
                                                        className="text-xs text-gray-500 dark:text-gray-400 w-16 bg-transparent"
                                                    />
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{exp.startDate} → {exp.endDate}</span>
                                            )}
                                        </span>
                                    </div>
                                    <ul className="space-y-2">
                                        {exp.description?.map((point, pIdx) => (
                                            <li key={pIdx} className="text-gray-700 dark:text-gray-300 text-sm flex items-start gap-2 group/bullet">
                                                <span className="text-gray-400 dark:text-gray-500 select-none">-</span>
                                                {editable && onBulletUpdate ? (
                                                    <>
                                                        <InlineEdit
                                                            value={point}
                                                            onSave={(v) => onBulletUpdate(exp.id, pIdx, v)}
                                                            multiline
                                                            className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-transparent"
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
                                                    className="text-xs text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
                                                >
                                                    <Plus size={10} /> add bullet
                                                </button>
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            ))}
                            {editable && onAddExperience && (
                                <button
                                    onClick={onAddExperience}
                                    className="text-sm text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 transition-colors"
                                >
                                    <Plus size={14} /> add experience
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {/* Other Experience */}
                {data.otherExperience && data.otherExperience.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-gray-500">
                            <Folder size={16} />
                            <span className="text-xs uppercase tracking-wider">$ ls ./other</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.otherExperience.map((exp) => (
                                <div key={exp.id} className="bg-white dark:bg-gray-800/50 rounded p-3 border border-gray-200 dark:border-gray-700/50 transition-colors">
                                    <h3 className="text-gray-800 dark:text-gray-200 font-medium text-sm">{exp.role}</h3>
                                    <p className="text-gray-500 text-xs">{exp.company}</p>
                                    <p className="text-gray-400 dark:text-gray-600 text-xs mt-1">{exp.startDate} → {exp.endDate}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {((data.education && data.education.length > 0) || editable) && (
                    <section>
                        <div className="flex items-center gap-2 mb-3 text-gray-500 dark:text-gray-400">
                            <Terminal size={16} />
                            <span className="text-xs uppercase tracking-wider">$ cat education.log</span>
                        </div>
                        <div className="space-y-2">
                            {data.education?.map((edu) => (
                                <div key={edu.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 py-2 border-b border-gray-200 dark:border-gray-800 group relative transition-colors">
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
                                                    className="text-gray-800 dark:text-gray-200 font-medium text-sm bg-transparent"
                                                />
                                                <InlineEdit
                                                    value={edu.degree}
                                                    onSave={(v) => onEducationUpdate(edu.id, 'degree', v)}
                                                    className="text-gray-500 text-xs bg-transparent"
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="text-gray-800 dark:text-gray-200 font-medium text-sm">{edu.institution}</h3>
                                                <p className="text-gray-500 text-xs">{edu.degree}</p>
                                            </>
                                        )}
                                    </div>
                                    {editable && onEducationUpdate ? (
                                        <InlineEdit
                                            value={edu.year}
                                            onSave={(v) => onEducationUpdate(edu.id, 'year', v)}
                                            className="text-xs text-green-700 dark:text-green-400 bg-transparent"
                                        />
                                    ) : (
                                        <span className="text-xs text-green-700 dark:text-green-400">{edu.year}</span>
                                    )}
                                </div>
                            ))}
                            {editable && onAddEducation && (
                                <button
                                    onClick={onAddEducation}
                                    className="text-xs text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 mt-2 transition-colors"
                                >
                                    <Plus size={12} /> add education
                                </button>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default TechFocused;
