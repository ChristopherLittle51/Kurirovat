import React, { useEffect, useState } from 'react';
import { UserProfile, Experience, Education } from '../types';
import { Mail, Phone, MapPin, Globe, Plus, Trash2 } from 'lucide-react';
import InlineEdit from './InlineEdit';

interface Props {
  data: UserProfile;
  slug?: string;
  companyName?: string;
  onUpdate?: (newData: UserProfile) => void;
}

const ResumeTemplate: React.FC<Props> = ({ data, slug, companyName, onUpdate }) => {
  const [localData, setLocalData] = useState<UserProfile>(data);
  const portfolioUrl = slug ? `${window.location.origin}/p/${slug}` : null;

  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const handleUpdate = (field: keyof UserProfile, value: any) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    if (onUpdate) onUpdate(newData);
  };

  const handleExperienceUpdate = (id: string, field: keyof Experience, value: any) => {
    const newExp = localData.experience.map(exp =>
      exp.id === id ? { ...exp, [field]: value } : exp
    );
    handleUpdate('experience', newExp);
  };

  const handleExperienceDescUpdate = (id: string, index: number, value: string) => {
    const newExp = localData.experience.map(exp => {
      if (exp.id === id) {
        const newDesc = [...(exp.description || [])];
        newDesc[index] = value;
        return { ...exp, description: newDesc };
      }
      return exp;
    });
    handleUpdate('experience', newExp);
  };

  const isEditable = !!onUpdate;

  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white p-8 md:p-12 shadow-2xl print:shadow-none print:p-0 text-gray-900 leading-relaxed" id="resume-preview">
      {/* Header */}
      <header className="border-b-2 border-gray-800 pb-6 mb-6">
        <h1 className="text-4xl font-serif font-bold uppercase tracking-wider mb-2">
          {isEditable ?
            <InlineEdit value={localData.fullName} onChange={(v) => handleUpdate('fullName', v)} /> :
            localData.fullName}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
          {portfolioUrl && (
            <div className="flex items-center gap-1">
              <Globe size={14} />
              <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium text-blue-600">
                Online Portfolio
              </a>
            </div>
          )}
          {localData.email && (
            <div className="flex items-center gap-1">
              <Mail size={14} />
              <span>
                {isEditable ? <InlineEdit value={localData.email} onChange={(v) => handleUpdate('email', v)} /> : localData.email}
              </span>
            </div>
          )}
          {localData.phone && (
            <div className="flex items-center gap-1">
              <Phone size={14} />
              <span>
                {isEditable ? <InlineEdit value={localData.phone} onChange={(v) => handleUpdate('phone', v)} /> : localData.phone}
              </span>
            </div>
          )}
          {localData.location && (
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>
                {isEditable ? <InlineEdit value={localData.location} onChange={(v) => handleUpdate('location', v)} /> : localData.location}
              </span>
            </div>
          )}
          {localData.links.map((link, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <Globe size={14} />
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{link.platform}</a>
            </div>
          ))}
        </div>
      </header>

      {/* Summary */}
      {localData.summary && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Professional Summary</h2>
          <div className="text-gray-700 text-sm md:text-base">
            {isEditable ?
              <InlineEdit value={localData.summary} onChange={(v) => handleUpdate('summary', v)} multiline /> :
              localData.summary}
          </div>
        </section>
      )}

      {/* Skills */}
      {localData.skills && localData.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Core Competencies</h2>
          <div className="flex flex-wrap gap-2">
            {localData.skills.map((skill, index) => (
              <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium print:border print:border-gray-200">
                {isEditable ?
                  <InlineEdit value={skill} onChange={(v) => {
                    const newSkills = [...localData.skills];
                    newSkills[index] = v;
                    handleUpdate('skills', newSkills);
                  }} /> :
                  skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {localData.experience && localData.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Professional Experience</h2>
          <div className="space-y-5">
            {localData.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-baseline mb-1">
                  <h3 className="font-bold text-lg">
                    {isEditable ? <InlineEdit value={exp.role} onChange={(v) => handleExperienceUpdate(exp.id!, 'role', v)} className="font-bold" /> : exp.role}
                  </h3>
                  <div className="text-sm text-gray-600 font-medium whitespace-nowrap flex gap-1">
                    {isEditable ? (
                      <>
                        <InlineEdit value={exp.startDate} onChange={(v) => handleExperienceUpdate(exp.id!, 'startDate', v)} />
                        <span>–</span>
                        <InlineEdit value={exp.endDate} onChange={(v) => handleExperienceUpdate(exp.id!, 'endDate', v)} />
                      </>
                    ) : (
                      <>{exp.startDate} – {exp.endDate}</>
                    )}
                  </div>
                </div>
                <div className="text-md font-semibold text-gray-700 mb-2">
                  {isEditable ? <InlineEdit value={exp.company} onChange={(v) => handleExperienceUpdate(exp.id!, 'company', v)} /> : exp.company}
                </div>
                <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-gray-700">
                  {(exp.description || []).map((point, idx) => (
                    <li key={idx} className="pl-1">
                      {isEditable ?
                        <InlineEdit value={point} onChange={(v) => handleExperienceDescUpdate(exp.id!, idx, v)} multiline /> :
                        point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {localData.education && localData.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest border-b border-gray-300 mb-3 pb-1">Education</h2>
          <div className="space-y-3">
            {localData.education.map((edu) => (
              <div key={edu.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                <div>
                  <h3 className="font-bold text-base">{edu.institution}</h3>
                  <div className="text-sm text-gray-700">{edu.degree}</div>
                </div>
                <span className="text-sm text-gray-600 font-medium">{edu.year}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ResumeTemplate;
