import React from 'react';
import { UserProfile, Experience, Education } from '../../types';
import InlineEdit from '../InlineEdit';

interface EditableTemplateProps {
    data: UserProfile;
    slug?: string;
    editable?: boolean;
    onUpdate?: (field: keyof UserProfile, value: any) => void;
    onExperienceUpdate?: (expId: string, field: keyof Experience, value: any) => void;
    onEducationUpdate?: (eduId: string, field: keyof Education, value: any) => void;
    onAddExperience?: () => void;
    onRemoveExperience?: (expId: string) => void;
    onAddEducation?: () => void;
    onRemoveEducation?: (eduId: string) => void;
    onAddSkill?: (skill: string) => void;
    onRemoveSkill?: (index: number) => void;
    onBulletUpdate?: (expId: string, bulletIndex: number, value: string) => void;
    onAddBullet?: (expId: string) => void;
    onRemoveBullet?: (expId: string, bulletIndex: number) => void;
}

/**
 * ATS-Optimized Web Template
 *
 * Designed to mirror ATS-friendly PDF output:
 * - Single column, no sidebar
 * - Standard section headings
 * - Simple bullet points
 * - Comma-delimited skills (not tags)
 * - Pipe-separated contact info
 */
const ATSOptimized: React.FC<EditableTemplateProps> = ({
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
    onRemoveBullet,
}) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const portfolioUrl = slug ? `${origin}/p/${slug}` : null;

    return (
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white dark:bg-white text-black p-10 font-['Helvetica_Neue',Helvetica,Arial,sans-serif] text-[10pt] leading-relaxed print:shadow-none" style={{ color: '#000' }}>

            {/* ── Header ── */}
            <header className="text-center mb-3">
                <h1 className="text-[18pt] font-bold uppercase tracking-[2px] mb-1" style={{ color: '#000' }}>
                    {editable && onUpdate ? (
                        <InlineEdit value={data.fullName} onSave={(v) => onUpdate('fullName', v)} />
                    ) : data.fullName}
                </h1>

                {/* Contact line: Location | Email | Phone */}
                <div className="text-[9pt] text-gray-700 flex flex-wrap justify-center gap-0">
                    {data.location && (
                        <span>
                            {editable && onUpdate ? (
                                <InlineEdit value={data.location} onSave={(v) => onUpdate('location', v)} />
                            ) : data.location}
                        </span>
                    )}
                    {data.location && (data.email || data.phone) && <span className="mx-1.5">|</span>}
                    {data.email && (
                        <a href={`mailto:${data.email}`} className="text-gray-700 hover:text-blue-700 no-underline">
                            {editable && onUpdate ? (
                                <InlineEdit value={data.email} onSave={(v) => onUpdate('email', v)} />
                            ) : data.email}
                        </a>
                    )}
                    {data.email && data.phone && <span className="mx-1.5">|</span>}
                    {data.phone && (
                        <a href={`tel:${data.phone}`} className="text-gray-700 hover:text-blue-700 no-underline">
                            {editable && onUpdate ? (
                                <InlineEdit value={data.phone} onSave={(v) => onUpdate('phone', v)} />
                            ) : data.phone}
                        </a>
                    )}
                </div>

                {/* Links line */}
                {(data.links && data.links.length > 0 || portfolioUrl) && (
                    <div className="text-[9pt] text-gray-700 flex flex-wrap justify-center mt-0.5">
                        {portfolioUrl && (
                            <a href={portfolioUrl} className="text-gray-700 hover:text-blue-700 no-underline" target="_blank" rel="noopener noreferrer">
                                {portfolioUrl.replace(/^https?:\/\//, '')}
                            </a>
                        )}
                        {portfolioUrl && data.links && data.links.length > 0 && <span className="mx-1.5">|</span>}
                        {data.links?.map((link, i) => (
                            <span key={i}>
                                <a href={link.url.startsWith('http') ? link.url : `https://${link.url}`} className="text-gray-700 hover:text-blue-700 no-underline" target="_blank" rel="noopener noreferrer">
                                    {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                                </a>
                                {i < (data.links?.length ?? 0) - 1 && <span className="mx-1.5">|</span>}
                            </span>
                        ))}
                    </div>
                )}
            </header>

            {/* Thick divider */}
            <hr className="border-0 border-t-2 border-black mb-3" />

            {/* ── Professional Summary ── */}
            {data.summary && (
                <section className="mb-3">
                    <h2 className="text-[10pt] font-bold uppercase tracking-[1.5px] border-b border-gray-500 pb-0.5 mb-2" style={{ color: '#000' }}>
                        Professional Summary
                    </h2>
                    <div className="text-[9.5pt] text-gray-800">
                        {editable && onUpdate ? (
                            <InlineEdit value={data.summary} onSave={(v) => onUpdate('summary', v)} multiline />
                        ) : data.summary}
                    </div>
                </section>
            )}

            {/* ── Core Competencies (comma-separated) ── */}
            {data.skills && data.skills.length > 0 && (
                <section className="mb-3">
                    <h2 className="text-[10pt] font-bold uppercase tracking-[1.5px] border-b border-gray-500 pb-0.5 mb-2" style={{ color: '#000' }}>
                        Core Competencies
                    </h2>
                    <div className="text-[9.5pt] text-gray-800">
                        {data.skills.map((skill, i) => (
                            <span key={i}>
                                {editable && onRemoveSkill ? (
                                    <span className="group inline">
                                        <span>{skill}</span>
                                        <button
                                            onClick={() => onRemoveSkill(i)}
                                            className="opacity-0 group-hover:opacity-100 text-red-500 text-xs ml-0.5 transition-opacity"
                                            title="Remove skill"
                                        >×</button>
                                    </span>
                                ) : skill}
                                {i < data.skills.length - 1 && '  |  '}
                            </span>
                        ))}
                        {editable && onAddSkill && (
                            <button
                                onClick={() => {
                                    const skill = prompt('Add a skill:');
                                    if (skill) onAddSkill(skill);
                                }}
                                className="ml-2 text-blue-600 text-xs hover:underline"
                            >+ Add skill</button>
                        )}
                    </div>
                </section>
            )}

            {/* ── Professional Experience ── */}
            {data.experience && data.experience.length > 0 && (
                <section className="mb-3">
                    <h2 className="text-[10pt] font-bold uppercase tracking-[1.5px] border-b border-gray-500 pb-0.5 mb-2" style={{ color: '#000' }}>
                        Professional Experience
                    </h2>
                    {data.experience.map((exp) => (
                        <div key={exp.id} className="mb-3 group/exp">
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-[10pt]" style={{ color: '#000' }}>
                                    {editable && onExperienceUpdate ? (
                                        <InlineEdit value={exp.role} onSave={(v) => onExperienceUpdate(exp.id, 'role', v)} />
                                    ) : exp.role}
                                </span>
                                <span className="text-[9pt] text-gray-600">
                                    {editable && onExperienceUpdate ? (
                                        <span className="inline-flex gap-0.5 items-center">
                                            <InlineEdit value={exp.startDate} onSave={(v) => onExperienceUpdate(exp.id, 'startDate', v)} />
                                            <span> - </span>
                                            <InlineEdit value={exp.endDate} onSave={(v) => onExperienceUpdate(exp.id, 'endDate', v)} />
                                        </span>
                                    ) : `${exp.startDate} - ${exp.endDate}`}
                                </span>
                            </div>
                            <div className="text-[9.5pt] text-gray-600 mb-1">
                                {editable && onExperienceUpdate ? (
                                    <InlineEdit value={exp.company} onSave={(v) => onExperienceUpdate(exp.id, 'company', v)} />
                                ) : exp.company}
                            </div>
                            <ul className="ml-2">
                                {exp.description?.map((bullet, bIdx) => (
                                    <li key={bIdx} className="flex items-start gap-2 text-[9.5pt] text-gray-800 mb-0.5 group/bullet">
                                        <span className="text-gray-500 select-none">-</span>
                                        <span className="flex-1">
                                            {editable && onBulletUpdate ? (
                                                <InlineEdit value={bullet} onSave={(v) => onBulletUpdate(exp.id, bIdx, v)} multiline />
                                            ) : bullet}
                                        </span>
                                        {editable && onRemoveBullet && (
                                            <button
                                                onClick={() => onRemoveBullet(exp.id, bIdx)}
                                                className="opacity-0 group-hover/bullet:opacity-100 text-red-400 text-xs transition-opacity"
                                            >×</button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {editable && (
                                <div className="flex gap-2 mt-1 opacity-0 group-hover/exp:opacity-100 transition-opacity">
                                    {onAddBullet && (
                                        <button onClick={() => onAddBullet(exp.id)} className="text-blue-600 text-xs hover:underline">+ Bullet</button>
                                    )}
                                    {onRemoveExperience && (
                                        <button onClick={() => onRemoveExperience(exp.id)} className="text-red-500 text-xs hover:underline">Remove</button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {editable && onAddExperience && (
                        <button onClick={onAddExperience} className="text-blue-600 text-xs hover:underline">+ Add Experience</button>
                    )}
                </section>
            )}

            {/* ── Additional Experience ── */}
            {data.otherExperience && data.otherExperience.length > 0 && (
                <section className="mb-3">
                    <h2 className="text-[10pt] font-bold uppercase tracking-[1.5px] border-b border-gray-500 pb-0.5 mb-2" style={{ color: '#000' }}>
                        Additional Experience
                    </h2>
                    {data.otherExperience.map((exp) => (
                        <div key={exp.id} className="flex justify-between items-baseline mb-1">
                            <span className="font-bold text-[10pt]" style={{ color: '#000' }}>{exp.role}</span>
                            <span className="text-[9pt] text-gray-600">{exp.company} | {exp.startDate} - {exp.endDate}</span>
                        </div>
                    ))}
                </section>
            )}

            {/* ── Education ── */}
            {data.education && data.education.length > 0 && (
                <section className="mb-3">
                    <h2 className="text-[10pt] font-bold uppercase tracking-[1.5px] border-b border-gray-500 pb-0.5 mb-2" style={{ color: '#000' }}>
                        Education
                    </h2>
                    {data.education.map((edu) => (
                        <div key={edu.id} className="flex justify-between items-baseline mb-1 group/edu">
                            <div>
                                <span className="font-bold text-[10pt]" style={{ color: '#000' }}>
                                    {editable && onEducationUpdate ? (
                                        <InlineEdit value={edu.institution} onSave={(v) => onEducationUpdate(edu.id, 'institution', v)} />
                                    ) : edu.institution}
                                </span>
                                <span className="text-[9.5pt] text-gray-600 ml-2">
                                    {editable && onEducationUpdate ? (
                                        <InlineEdit value={edu.degree} onSave={(v) => onEducationUpdate(edu.id, 'degree', v)} />
                                    ) : edu.degree}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9pt] text-gray-600">
                                    {editable && onEducationUpdate ? (
                                        <InlineEdit value={edu.year} onSave={(v) => onEducationUpdate(edu.id, 'year', v)} />
                                    ) : edu.year}
                                </span>
                                {editable && onRemoveEducation && (
                                    <button
                                        onClick={() => onRemoveEducation(edu.id)}
                                        className="opacity-0 group-hover/edu:opacity-100 text-red-400 text-xs transition-opacity"
                                    >×</button>
                                )}
                            </div>
                        </div>
                    ))}
                    {editable && onAddEducation && (
                        <button onClick={onAddEducation} className="text-blue-600 text-xs hover:underline">+ Add Education</button>
                    )}
                </section>
            )}
        </div>
    );
};

export default ATSOptimized;
